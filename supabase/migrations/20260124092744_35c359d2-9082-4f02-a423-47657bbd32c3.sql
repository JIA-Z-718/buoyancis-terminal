-- Create helper functions to manage cron jobs from edge functions
-- These need SECURITY DEFINER to access the cron schema

-- Function to list all cron jobs
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  jobname text,
  schedule text,
  command text,
  nodename text,
  nodeport integer,
  database text,
  username text,
  active boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jobid, jobname, schedule, command, nodename, nodeport, database, username, active
  FROM cron.job
  ORDER BY jobname;
$$;

-- Function to toggle a cron job's active state
CREATE OR REPLACE FUNCTION public.toggle_cron_job(job_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_active boolean;
BEGIN
  SELECT active INTO current_active FROM cron.job WHERE jobid = job_id;
  UPDATE cron.job SET active = NOT current_active WHERE jobid = job_id;
END;
$$;

-- Function to delete a cron job
CREATE OR REPLACE FUNCTION public.delete_cron_job(job_id bigint)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cron.unschedule(job_id);
$$;

-- Function to run a cron job immediately
CREATE OR REPLACE FUNCTION public.run_cron_job_now(job_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job_command text;
BEGIN
  SELECT command INTO job_command FROM cron.job WHERE jobid = job_id;
  EXECUTE job_command;
END;
$$;