-- Create table to track notified cron failures
CREATE TABLE IF NOT EXISTS public.cron_failure_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  runid bigint NOT NULL UNIQUE,
  notified_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cron_failure_notifications ENABLE ROW LEVEL SECURITY;

-- Only allow service role access (edge functions)
CREATE POLICY "Service role can manage notifications"
ON public.cron_failure_notifications
FOR ALL
USING (false)
WITH CHECK (false);

-- Function to get recent failures that haven't been notified
CREATE OR REPLACE FUNCTION public.get_recent_cron_failures()
RETURNS TABLE (
  runid bigint,
  jobid bigint,
  jobname text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  return_message text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    jrd.runid,
    jrd.jobid,
    j.jobname,
    jrd.start_time,
    jrd.end_time,
    jrd.return_message
  FROM cron.job_run_details jrd
  LEFT JOIN cron.job j ON jrd.jobid = j.jobid
  LEFT JOIN public.cron_failure_notifications cfn ON jrd.runid = cfn.runid
  WHERE jrd.status = 'failed'
    AND jrd.start_time > now() - interval '10 minutes'
    AND cfn.runid IS NULL
  ORDER BY jrd.start_time DESC;
$$;

-- Function to mark failures as notified
CREATE OR REPLACE FUNCTION public.mark_cron_failures_notified(run_ids bigint[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.cron_failure_notifications (runid)
  SELECT unnest(run_ids)
  ON CONFLICT (runid) DO NOTHING;
END;
$$;