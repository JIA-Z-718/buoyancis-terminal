-- Create function to update a cron job's schedule
CREATE OR REPLACE FUNCTION public.update_cron_job_schedule(
  p_job_id bigint,
  p_schedule text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE cron.job
  SET schedule = p_schedule
  WHERE jobid = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cron job with ID % not found', p_job_id;
  END IF;
END;
$$;