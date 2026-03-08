-- Update run_cron_job_now to validate command format before execution
CREATE OR REPLACE FUNCTION public.run_cron_job_now(job_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  job_command text;
BEGIN
  -- Get the command for this job
  SELECT command INTO job_command FROM cron.job WHERE jobid = job_id;
  
  -- Validate job exists
  IF job_command IS NULL THEN
    RAISE EXCEPTION 'Cron job with ID % not found', job_id;
  END IF;
  
  -- Security: Validate the command matches expected edge function pattern
  -- Only allow commands that call net.http_post to Supabase functions
  IF NOT (
    job_command ~* '^\s*SELECT\s+net\.http_post\s*\(' AND
    job_command ~* '/functions/v1/'
  ) THEN
    RAISE EXCEPTION 'Invalid cron job command format - only edge function calls are permitted';
  END IF;
  
  -- Execute the validated command
  EXECUTE job_command;
END;
$function$;