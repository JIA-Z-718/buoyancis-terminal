-- Create function to schedule a new cron job that calls an edge function
CREATE OR REPLACE FUNCTION public.create_cron_job(
  p_job_name text,
  p_schedule text,
  p_function_name text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url text;
  anon_key text;
  command_sql text;
  new_job_id bigint;
BEGIN
  -- Get Supabase URL from vault
  SELECT decrypted_secret INTO supabase_url
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_url';
  
  -- Get anon key from vault
  SELECT decrypted_secret INTO anon_key
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_anon_key';
  
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
  
  -- Build the HTTP POST command
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
  
  -- Schedule the cron job
  SELECT cron.schedule(p_job_name, p_schedule, command_sql) INTO new_job_id;
  
  RETURN new_job_id;
END;
$$;