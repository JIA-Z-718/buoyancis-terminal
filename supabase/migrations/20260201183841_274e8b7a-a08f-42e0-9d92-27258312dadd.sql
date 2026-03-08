-- Harden passkey challenge tracking
ALTER TABLE public.passkey_challenges
ADD COLUMN IF NOT EXISTS session_id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.passkey_challenges
ALTER COLUMN session_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS passkey_challenges_session_type_uidx
ON public.passkey_challenges (session_id, type);

CREATE INDEX IF NOT EXISTS passkey_challenges_expires_at_idx
ON public.passkey_challenges (expires_at);

-- Lock down SECURITY DEFINER functions that accept user-controlled parameters

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Service role may check any user's role (used by server-side operations)
    WHEN COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
      EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
      )
    -- Regular callers may only check their own roles
    WHEN auth.uid() IS NOT NULL AND _user_id = auth.uid() THEN
      EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
      )
    ELSE
      FALSE
  END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_trust_decay(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile trust_profiles%ROWTYPE;
  v_half_life_days INTEGER;
  v_days_since_observation INTEGER;
  v_decay_factor DECIMAL;
  v_new_frequency DECIMAL;
BEGIN
  -- Authorization: service role can evaluate any user; others limited to self or admin
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  -- Get user's trust profile
  SELECT * INTO v_profile FROM trust_profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN 1.0;
  END IF;

  -- Get half-life setting
  SELECT (setting_value::TEXT)::INTEGER INTO v_half_life_days
  FROM sovereignty_settings WHERE setting_key = 'decay_half_life_days';

  -- Calculate days since last observation
  v_days_since_observation := EXTRACT(DAY FROM (now() - COALESCE(v_profile.last_observation_at, v_profile.created_at)));

  -- Exponential decay formula: f(t) = f₀ × (0.5)^(t/half_life)
  v_decay_factor := POWER(0.5, v_days_since_observation::DECIMAL / v_half_life_days);
  v_new_frequency := GREATEST(v_profile.base_frequency, v_profile.resonance_frequency * v_decay_factor);

  RETURN v_new_frequency;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_observation(
  p_user_id uuid,
  p_event_type text,
  p_quality_score numeric DEFAULT 1.0,
  p_target_entity_id uuid DEFAULT NULL::uuid,
  p_target_entity_type text DEFAULT NULL::text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile trust_profiles%ROWTYPE;
  v_frequency_delta DECIMAL;
  v_new_frequency DECIMAL;
  v_incubation_boost DECIMAL;
BEGIN
  -- Authorization: service role can record for any user; others limited to self or admin
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  -- Get or create trust profile
  SELECT * INTO v_profile FROM trust_profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO trust_profiles (user_id, incubation_expires_at)
    VALUES (p_user_id, now() + INTERVAL '90 days')
    RETURNING * INTO v_profile;
  END IF;

  -- Calculate frequency delta based on event type and quality
  v_frequency_delta := CASE p_event_type
    WHEN 'review' THEN 0.05 * p_quality_score
    WHEN 'challenge' THEN 0.10 * p_quality_score
    WHEN 'verification' THEN 0.15 * p_quality_score
    WHEN 'moderation' THEN 0.20 * p_quality_score
    ELSE 0.01
  END;

  -- Apply incubation boost if applicable
  IF v_profile.is_incubated AND v_profile.incubation_expires_at > now() THEN
    v_incubation_boost := v_profile.incubation_boost;
    v_frequency_delta := v_frequency_delta * v_incubation_boost;
  END IF;

  -- Calculate new frequency (Matthew Effect: compound growth)
  v_new_frequency := v_profile.resonance_frequency + (v_frequency_delta * (1 + v_profile.resonance_frequency / 10));

  -- Update profile
  UPDATE trust_profiles SET
    resonance_frequency = v_new_frequency,
    accumulated_observations = accumulated_observations + 1,
    last_observation_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Record observation event
  INSERT INTO observation_events (user_id, event_type, frequency_delta, frequency_before, frequency_after, target_entity_id, target_entity_type, quality_score)
  VALUES (p_user_id, p_event_type, v_frequency_delta, v_profile.resonance_frequency, v_new_frequency, p_target_entity_id, p_target_entity_type, p_quality_score);

  RETURN v_new_frequency;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_recovery_code_rate_limit(p_user_id uuid)
RETURNS TABLE(allowed boolean, attempts_in_window integer, lockout_until timestamp with time zone, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_attempts_15min INTEGER;
  v_failed_attempts_1hr INTEGER;
  v_oldest_in_window TIMESTAMP WITH TIME ZONE;
  v_lockout_until TIMESTAMP WITH TIME ZONE;
  v_retry_after INTEGER;
  v_allowed BOOLEAN;
BEGIN
  -- Authorization: allow self; admins can query others
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Count attempts in last 15 minutes
  SELECT COUNT(*), MIN(attempted_at)
  INTO v_attempts_15min, v_oldest_in_window
  FROM public.recovery_code_attempts
  WHERE user_id = p_user_id
    AND attempted_at > now() - interval '15 minutes';

  -- Count failed attempts in last hour (for lockout check)
  SELECT COUNT(*)
  INTO v_failed_attempts_1hr
  FROM public.recovery_code_attempts
  WHERE user_id = p_user_id
    AND success = false
    AND attempted_at > now() - interval '1 hour';

  -- Determine if locked out (10+ failed attempts in 1 hour)
  IF v_failed_attempts_1hr >= 10 THEN
    -- Find when the lockout expires (1 hour from the 10th failed attempt)
    SELECT attempted_at + interval '1 hour'
    INTO v_lockout_until
    FROM public.recovery_code_attempts
    WHERE user_id = p_user_id
      AND success = false
      AND attempted_at > now() - interval '1 hour'
    ORDER BY attempted_at ASC
    OFFSET 9
    LIMIT 1;

    v_allowed := false;
    v_retry_after := GREATEST(0, EXTRACT(EPOCH FROM (v_lockout_until - now()))::INTEGER);
  -- Check 15-minute window limit (5 attempts)
  ELSIF v_attempts_15min >= 5 THEN
    v_allowed := false;
    v_lockout_until := v_oldest_in_window + interval '15 minutes';
    v_retry_after := GREATEST(0, EXTRACT(EPOCH FROM (v_lockout_until - now()))::INTEGER);
  ELSE
    v_allowed := true;
    v_lockout_until := NULL;
    v_retry_after := 0;
  END IF;

  RETURN QUERY SELECT
    v_allowed AS allowed,
    v_attempts_15min AS attempts_in_window,
    v_lockout_until AS lockout_until,
    v_retry_after AS retry_after_seconds;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_recovery_code_attempt(p_user_id uuid, p_success boolean)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id UUID;
BEGIN
  -- Authorization: allow self; admins can record for others
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.recovery_code_attempts (user_id, success)
  VALUES (p_user_id, p_success)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_email_rate_limit(
  p_email_type text,
  p_recipient_email text,
  p_sender_context text DEFAULT NULL::text,
  p_max_per_hour integer DEFAULT 5,
  p_max_per_day integer DEFAULT 20
)
RETURNS TABLE(allowed boolean, hourly_count integer, daily_count integer, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_hourly_count INTEGER;
  v_daily_count INTEGER;
  v_oldest_in_hour TIMESTAMP WITH TIME ZONE;
  v_retry_after INTEGER;
BEGIN
  -- Restrict to service role only (used by server-side email sending)
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Count emails in last hour
  SELECT COUNT(*), MIN(sent_at)
  INTO v_hourly_count, v_oldest_in_hour
  FROM public.email_rate_limits
  WHERE email_type = p_email_type
    AND recipient_email = p_recipient_email
    AND (p_sender_context IS NULL OR sender_context = p_sender_context)
    AND sent_at > now() - interval '1 hour';

  -- Count emails in last 24 hours
  SELECT COUNT(*)
  INTO v_daily_count
  FROM public.email_rate_limits
  WHERE email_type = p_email_type
    AND recipient_email = p_recipient_email
    AND (p_sender_context IS NULL OR sender_context = p_sender_context)
    AND sent_at > now() - interval '24 hours';

  -- Calculate retry_after if rate limited
  IF v_hourly_count >= p_max_per_hour THEN
    v_retry_after := EXTRACT(EPOCH FROM (v_oldest_in_hour + interval '1 hour' - now()))::INTEGER;
    IF v_retry_after < 0 THEN v_retry_after := 0; END IF;
  ELSE
    v_retry_after := 0;
  END IF;

  RETURN QUERY SELECT
    (v_hourly_count < p_max_per_hour AND v_daily_count < p_max_per_day) AS allowed,
    v_hourly_count AS hourly_count,
    v_daily_count AS daily_count,
    v_retry_after AS retry_after_seconds;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_email_send(
  p_email_type text,
  p_recipient_email text,
  p_sender_context text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id UUID;
BEGIN
  -- Restrict to service role only (used by server-side email sending)
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.email_rate_limits (email_type, recipient_email, sender_context)
  VALUES (p_email_type, p_recipient_email, p_sender_context)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;