-- Add escalation tracking to deliverability_alerts
ALTER TABLE public.deliverability_alerts 
ADD COLUMN escalated_at timestamp with time zone,
ADD COLUMN escalation_level integer DEFAULT 0;

-- Create escalation settings table
CREATE TABLE public.escalation_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.escalation_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for escalation_settings
CREATE POLICY "Admins can read escalation settings"
ON public.escalation_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert escalation settings"
ON public.escalation_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update escalation settings"
ON public.escalation_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default escalation settings
INSERT INTO public.escalation_settings (setting_key, setting_value, description) VALUES
  ('escalation_enabled', 'true', 'Enable automatic escalation of unresolved alerts'),
  ('escalation_delay_minutes', '60', 'Minutes before first escalation'),
  ('escalation_emails', '', 'Comma-separated list of additional admin emails for escalation'),
  ('second_escalation_delay_minutes', '120', 'Minutes before second escalation'),
  ('second_escalation_emails', '', 'Comma-separated list of emails for second escalation level');