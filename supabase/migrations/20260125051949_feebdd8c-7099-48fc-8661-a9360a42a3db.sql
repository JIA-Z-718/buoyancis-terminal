-- Refactor run_cron_job_now to avoid EXECUTE with dynamic SQL
-- Instead, extract parameters and call net.http_post directly

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
  url_pattern text := '/functions/v1/([a-zA-Z0-9_-]+)';
  extracted_matches text[];
BEGIN
  -- Get the command for this job
  SELECT command INTO job_command FROM cron.job WHERE jobid = job_id;
  
  -- Validate job exists
  IF job_command IS NULL THEN
    RAISE EXCEPTION 'Cron job with ID % not found', job_id;
  END IF;
  
  -- Security: Validate the command matches expected edge function pattern
  IF NOT (
    job_command ~* '^\s*SELECT\s+net\.http_post\s*\(' AND
    job_command ~* '/functions/v1/'
  ) THEN
    RAISE EXCEPTION 'Invalid cron job command format - only edge function calls are permitted';
  END IF;
  
  -- Extract the function name from the command using regex
  -- Pattern matches /functions/v1/function-name
  extracted_matches := regexp_match(job_command, '/functions/v1/([a-zA-Z0-9_-]+)', 'i');
  
  IF extracted_matches IS NULL OR array_length(extracted_matches, 1) < 1 THEN
    RAISE EXCEPTION 'Could not extract function name from cron job command';
  END IF;
  
  function_name := extracted_matches[1];
  
  -- Validate function name against allowlist of known edge functions
  IF function_name NOT IN (
    'check-cron-success-rate',
    'check-deliverability-alerts',
    'escalate-alerts',
    'notify-cron-failures',
    'process-scheduled-emails'
  ) THEN
    RAISE EXCEPTION 'Function "%" is not in the allowed list for cron job execution', function_name;
  END IF;
  
  -- Get Supabase URL from vault
  SELECT decrypted_secret INTO supabase_url
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_url';
  
  -- Get anon key from vault
  SELECT decrypted_secret INTO anon_key
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_anon_key';
  
  -- Fallback to environment settings
  IF supabase_url IS NULL THEN
    supabase_url := current_setting('app.settings.supabase_url', true);
  END IF;
  
  IF anon_key IS NULL THEN
    anon_key := current_setting('app.settings.supabase_anon_key', true);
  END IF;
  
  -- Validate we have the required values
  IF supabase_url IS NULL OR anon_key IS NULL THEN
    RAISE EXCEPTION 'Supabase URL or anon key not configured';
  END IF;
  
  -- Call net.http_post directly with validated parameters (no EXECUTE!)
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object('time', now()::text, 'manual_trigger', true)
  );
END;
$function$;