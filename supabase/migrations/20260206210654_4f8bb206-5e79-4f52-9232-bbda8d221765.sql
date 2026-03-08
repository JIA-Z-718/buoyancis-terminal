
-- Add admin role validation to cron management SECURITY DEFINER functions
-- These are currently protected by edge function auth, but adding database-level
-- checks provides defense in depth against direct RPC calls.

-- 1. get_cron_jobs: Add admin check
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
 RETURNS TABLE(jobid bigint, jobname text, schedule text, command text, nodename text, nodeport integer, database text, username text, active boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service_role (used by edge functions) or admin users
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Admin access required';
    END IF;
  END IF;

  RETURN QUERY
  SELECT j.jobid, j.jobname, j.schedule, j.command, j.nodename, j.nodeport, j.database, j.username, j.active
  FROM cron.job j
  ORDER BY j.jobname;
END;
$function$;

-- 2. toggle_cron_job: Add admin check
CREATE OR REPLACE FUNCTION public.toggle_cron_job(job_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_active boolean;
BEGIN
  -- Allow service_role or admin users
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Admin access required';
    END IF;
  END IF;

  SELECT j.active INTO current_active FROM cron.job j WHERE j.jobid = job_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cron job with ID % not found', job_id;
  END IF;
  UPDATE cron.job j SET active = NOT current_active WHERE j.jobid = job_id;
END;
$function$;

-- 3. delete_cron_job: Add admin check
CREATE OR REPLACE FUNCTION public.delete_cron_job(job_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service_role or admin users
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Admin access required';
    END IF;
  END IF;

  PERFORM cron.unschedule(job_id);
END;
$function$;

-- 4. run_cron_job_now: Add admin check (already has allowlist but no role check)
CREATE OR REPLACE FUNCTION public.run_cron_job_now(job_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  job_command text;
  function_name text;
  supabase_url text;
  anon_key text;
  cron_secret text;
  url_pattern text := '/functions/v1/([a-zA-Z0-9_-]+)';
  extracted_matches text[];
BEGIN
  -- Allow service_role or admin users
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Admin access required';
    END IF;
  END IF;

  SELECT command INTO job_command FROM cron.job WHERE jobid = job_id;
  
  IF job_command IS NULL THEN
    RAISE EXCEPTION 'Cron job with ID % not found', job_id;
  END IF;
  
  IF NOT (
    job_command ~* '^\s*SELECT\s+net\.http_post\s*\(' AND
    job_command ~* '/functions/v1/'
  ) THEN
    RAISE EXCEPTION 'Invalid cron job command format - only edge function calls are permitted';
  END IF;
  
  extracted_matches := regexp_match(job_command, '/functions/v1/([a-zA-Z0-9_-]+)', 'i');
  
  IF extracted_matches IS NULL OR array_length(extracted_matches, 1) < 1 THEN
    RAISE EXCEPTION 'Could not extract function name from cron job command';
  END IF;
  
  function_name := extracted_matches[1];
  
  IF function_name NOT IN (
    'check-audit-anomalies',
    'check-bot-detection-spikes',
    'check-cron-success-rate',
    'check-deliverability-alerts',
    'check-rate-limit-spikes',
    'cleanup-old-records',
    'escalate-alerts',
    'notify-cron-failures',
    'notify-mfa-enrollment-reminder',
    'process-scheduled-emails',
    'send-daily-entropy',
    'publish-scheduled-posts',
    'calculate-trust-decay'
  ) THEN
    RAISE EXCEPTION 'Function "%" is not in the allowed list for cron job execution', function_name;
  END IF;
  
  SELECT decrypted_secret INTO supabase_url
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_url';
  
  SELECT decrypted_secret INTO anon_key
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_anon_key';

  SELECT decrypted_secret INTO cron_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret';
  
  IF supabase_url IS NULL THEN
    supabase_url := current_setting('app.settings.supabase_url', true);
  END IF;
  
  IF anon_key IS NULL THEN
    anon_key := current_setting('app.settings.supabase_anon_key', true);
  END IF;
  
  IF supabase_url IS NULL OR anon_key IS NULL THEN
    RAISE EXCEPTION 'Supabase URL or anon key not configured';
  END IF;
  
  IF cron_secret IS NOT NULL THEN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/' || function_name,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key,
        'X-Cron-Secret', cron_secret
      ),
      body := jsonb_build_object('time', now()::text, 'manual_trigger', true)
    );
  ELSE
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/' || function_name,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      body := jsonb_build_object('time', now()::text, 'manual_trigger', true)
    );
  END IF;
END;
$function$;

-- 5. get_cron_job_history: Add admin check
CREATE OR REPLACE FUNCTION public.get_cron_job_history(job_id_filter bigint DEFAULT NULL::bigint, limit_count integer DEFAULT 50)
 RETURNS TABLE(runid bigint, jobid bigint, job_pid integer, database text, username text, command text, status text, return_message text, start_time timestamp with time zone, end_time timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service_role or admin users
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Admin access required';
    END IF;
  END IF;

  RETURN QUERY
  SELECT jrd.runid, jrd.jobid, jrd.job_pid, jrd.database, jrd.username, jrd.command, jrd.status, jrd.return_message, jrd.start_time, jrd.end_time
  FROM cron.job_run_details jrd
  WHERE (job_id_filter IS NULL OR jrd.jobid = job_id_filter)
  ORDER BY jrd.start_time DESC
  LIMIT limit_count;
END;
$function$;

-- 6. update_cron_job_schedule: Add admin check
CREATE OR REPLACE FUNCTION public.update_cron_job_schedule(p_job_id bigint, p_schedule text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service_role or admin users
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Admin access required';
    END IF;
  END IF;

  -- Validate schedule format
  IF NOT (p_schedule ~ '^[0-9*,/-]+(\s+[0-9*,/-]+){4}$') THEN
    RAISE EXCEPTION 'Invalid cron schedule format';
  END IF;

  UPDATE cron.job
  SET schedule = p_schedule
  WHERE jobid = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cron job with ID % not found', p_job_id;
  END IF;
END;
$function$;
