-- Function to get cron job run history
CREATE OR REPLACE FUNCTION public.get_cron_job_history(job_id_filter bigint DEFAULT NULL, limit_count integer DEFAULT 50)
RETURNS TABLE (
  runid bigint,
  jobid bigint,
  job_pid integer,
  database text,
  username text,
  command text,
  status text,
  return_message text,
  start_time timestamp with time zone,
  end_time timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT runid, jobid, job_pid, database, username, command, status, return_message, start_time, end_time
  FROM cron.job_run_details
  WHERE (job_id_filter IS NULL OR jobid = job_id_filter)
  ORDER BY start_time DESC
  LIMIT limit_count;
$$;