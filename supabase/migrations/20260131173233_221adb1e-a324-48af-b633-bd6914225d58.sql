-- Update create_cron_job function to allow calculate-trust-decay
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
  IF NOT (p_function_name ~ '^[a-zA-Z0-9-]+$') OR length(p_function_name) > 100 THEN
    RAISE EXCEPTION 'Invalid function name format: must be alphanumeric with hyphens only, max 100 characters';
  END IF;
  
  IF p_function_name NOT IN (
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
    RAISE EXCEPTION 'Function "%" is not in the allowed list for cron job creation', p_function_name;
  END IF;

  IF NOT (p_job_name ~ '^[a-zA-Z0-9_-]+$') OR length(p_job_name) > 100 THEN
    RAISE EXCEPTION 'Invalid job name format: must be alphanumeric with hyphens/underscores only, max 100 characters';
  END IF;

  IF NOT (p_schedule ~ '^[0-9*,/-]+(\s+[0-9*,/-]+){4}$') THEN
    RAISE EXCEPTION 'Invalid cron schedule format';
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
  
  SELECT cron.schedule(p_job_name, p_schedule, command_sql) INTO new_job_id;
  
  RETURN new_job_id;
END;
$function$;

-- Also update run_cron_job_now function
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