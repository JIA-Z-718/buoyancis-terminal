-- Create table to track recovery code verification attempts
CREATE TABLE public.recovery_code_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.recovery_code_attempts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own attempts
CREATE POLICY "Users can view their own recovery code attempts"
  ON public.recovery_code_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can insert their own recovery code attempts"
  ON public.recovery_code_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for efficient querying
CREATE INDEX idx_recovery_code_attempts_user_time 
  ON public.recovery_code_attempts(user_id, attempted_at DESC);

-- Function to check rate limit for recovery code attempts
-- Limits: 5 attempts per 15 minutes, with lockout after 10 failed attempts in 1 hour
CREATE OR REPLACE FUNCTION public.check_recovery_code_rate_limit(p_user_id UUID)
RETURNS TABLE(
  allowed BOOLEAN,
  attempts_in_window INTEGER,
  lockout_until TIMESTAMP WITH TIME ZONE,
  retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_attempts_15min INTEGER;
  v_failed_attempts_1hr INTEGER;
  v_oldest_in_window TIMESTAMP WITH TIME ZONE;
  v_lockout_until TIMESTAMP WITH TIME ZONE;
  v_retry_after INTEGER;
  v_allowed BOOLEAN;
BEGIN
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
$$;

-- Function to record a recovery code attempt
CREATE OR REPLACE FUNCTION public.record_recovery_code_attempt(p_user_id UUID, p_success BOOLEAN)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.recovery_code_attempts (user_id, success)
  VALUES (p_user_id, p_success)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;