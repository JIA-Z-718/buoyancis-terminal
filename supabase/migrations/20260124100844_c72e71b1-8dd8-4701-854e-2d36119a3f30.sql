-- Add notifications_enabled column to cron_job_thresholds table
ALTER TABLE public.cron_job_thresholds 
ADD COLUMN notifications_enabled boolean NOT NULL DEFAULT true;