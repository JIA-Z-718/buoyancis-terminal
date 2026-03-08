-- Create a separate table for text-based alert email template settings
CREATE TABLE public.alert_email_template (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.alert_email_template ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can read alert email template"
ON public.alert_email_template
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update alert email template"
ON public.alert_email_template
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert alert email template"
ON public.alert_email_template
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default template values
INSERT INTO public.alert_email_template (setting_key, setting_value, description) VALUES
  ('subject_critical', '🚨 Critical Email Deliverability Alert', 'Subject line for critical alert emails'),
  ('subject_warning', '⚠️ Email Deliverability Warning', 'Subject line for warning alert emails'),
  ('from_name', 'Alerts', 'From name for alert emails'),
  ('heading', 'Email Deliverability Alert', 'Main heading in alert emails'),
  ('intro', 'The following deliverability issues have been detected:', 'Intro text before alert list'),
  ('footer', 'Please review your email list hygiene and sending practices to maintain good deliverability.', 'Footer text after alert list'),
  ('signature', 'This is an automated alert from your email system.', 'Signature text at the bottom');