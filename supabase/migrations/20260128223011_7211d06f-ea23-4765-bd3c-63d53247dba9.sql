-- Add MFA enrollment reminder settings
INSERT INTO public.mfa_settings (setting_key, setting_value, description)
VALUES 
  ('mfa_enrollment_reminder_enabled', true, 'Enable email reminders for admins who haven''t enrolled in MFA'),
  ('mfa_enrollment_reminder_days', true, 'Days after admin role assignment before sending reminder (stored as boolean, actual value in alert_settings)')
ON CONFLICT (setting_key) DO NOTHING;

-- Add numeric setting for reminder days
INSERT INTO public.alert_settings (setting_key, setting_value, description)
VALUES 
  ('mfa_enrollment_reminder_days', 3, 'Number of days after admin role assignment before sending MFA enrollment reminder'),
  ('mfa_enrollment_reminder_frequency_days', 1, 'Days between repeated reminders for unenrolled admins')
ON CONFLICT (setting_key) DO NOTHING;

-- Create table to track MFA enrollment reminders sent
CREATE TABLE IF NOT EXISTS public.mfa_enrollment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reminder_type TEXT NOT NULL DEFAULT 'enrollment_reminder',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mfa_enrollment_reminders ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admins can view MFA enrollment reminders"
ON public.mfa_enrollment_reminders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert reminders"
ON public.mfa_enrollment_reminders
FOR INSERT
TO service_role
WITH CHECK (true);

-- Index for efficient lookups
CREATE INDEX idx_mfa_enrollment_reminders_user_sent 
ON public.mfa_enrollment_reminders (user_id, sent_at DESC);