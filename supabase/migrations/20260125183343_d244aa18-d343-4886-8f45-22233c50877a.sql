-- Add check-bot-detection-spikes to the allowed functions list in create_cron_job
CREATE OR REPLACE FUNCTION public.create_cron_job(p_job_name text, p_schedule text, p_function_name text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url text;
  anon_key text;
  cron_secret text;
  command_sql text;
  new_job_id bigint;
BEGIN
  -- SECURITY: Validate function name format (alphanumeric and hyphens only, max 100 chars)
  IF NOT (p_function_name ~ '^[a-zA-Z0-9-]+$') OR length(p_function_name) > 100 THEN
    RAISE EXCEPTION 'Invalid function name format: must be alphanumeric with hyphens only, max 100 characters';
  END IF;
  
  -- SECURITY: Validate function name against allowlist
  IF p_function_name NOT IN (
    'check-bot-detection-spikes',
    'check-cron-success-rate',
    'check-deliverability-alerts',
    'escalate-alerts',
    'notify-cron-failures',
    'process-scheduled-emails'
  ) THEN
    RAISE EXCEPTION 'Function "%" is not in the allowed list for cron job creation', p_function_name;
  END IF;

  -- SECURITY: Validate job name format (alphanumeric, hyphens, underscores only, max 100 chars)
  IF NOT (p_job_name ~ '^[a-zA-Z0-9_-]+$') OR length(p_job_name) > 100 THEN
    RAISE EXCEPTION 'Invalid job name format: must be alphanumeric with hyphens/underscores only, max 100 characters';
  END IF;

  -- SECURITY: Validate schedule format (basic cron expression validation)
  IF NOT (p_schedule ~ '^[0-9*,/-]+(\s+[0-9*,/-]+){4}$') THEN
    RAISE EXCEPTION 'Invalid cron schedule format';
  END IF;

  -- Get Supabase URL from vault
  SELECT decrypted_secret INTO supabase_url
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_url';
  
  -- Get anon key from vault
  SELECT decrypted_secret INTO anon_key
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_anon_key';

  -- Get cron secret from vault
  SELECT decrypted_secret INTO cron_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret';
  
  -- If not in vault, try to get from environment (fallback)
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
  
  -- Build the HTTP POST command with cron secret header for authentication
  IF cron_secret IS NOT NULL THEN
    command_sql := format(
      $cmd$
      SELECT net.http_post(
        url:='%s/functions/v1/%s',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer %s", "X-Cron-Secret": "%s"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
      ) AS request_id
      $cmd$,
      supabase_url,
      p_function_name,
      anon_key,
      cron_secret
    );
  ELSE
    -- Fallback without cron secret (backward compatibility)
    command_sql := format(
      $cmd$
      SELECT net.http_post(
        url:='%s/functions/v1/%s',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer %s"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
      ) AS request_id
      $cmd$,
      supabase_url,
      p_function_name,
      anon_key
    );
  END IF;
  
  -- Schedule the cron job
  SELECT cron.schedule(p_job_name, p_schedule, command_sql) INTO new_job_id;
  
  RETURN new_job_id;
END;
$function$;

-- Also update run_cron_job_now to include the new function
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
  extracted_matches := regexp_match(job_command, '/functions/v1/([a-zA-Z0-9_-]+)', 'i');
  
  IF extracted_matches IS NULL OR array_length(extracted_matches, 1) < 1 THEN
    RAISE EXCEPTION 'Could not extract function name from cron job command';
  END IF;
  
  function_name := extracted_matches[1];
  
  -- Validate function name against allowlist of known edge functions
  IF function_name NOT IN (
    'check-bot-detection-spikes',
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