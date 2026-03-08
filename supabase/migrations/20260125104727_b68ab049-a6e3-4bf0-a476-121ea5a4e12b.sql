-- Fix SQL injection vulnerability in create_cron_job function by adding input validation and allowlist
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