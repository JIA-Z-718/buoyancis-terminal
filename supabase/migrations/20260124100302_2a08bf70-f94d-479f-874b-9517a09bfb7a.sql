-- Create table for per-job success rate thresholds
CREATE TABLE public.cron_job_thresholds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jobid bigint NOT NULL UNIQUE,
  threshold_value numeric NOT NULL DEFAULT 80,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.cron_job_thresholds ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can read cron job thresholds"
  ON public.cron_job_thresholds FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert cron job thresholds"
  ON public.cron_job_thresholds FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update cron job thresholds"
  ON public.cron_job_thresholds FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete cron job thresholds"
  ON public.cron_job_thresholds FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_cron_job_thresholds_updated_at
  BEFORE UPDATE ON public.cron_job_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();