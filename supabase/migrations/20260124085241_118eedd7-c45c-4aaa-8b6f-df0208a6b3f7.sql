-- Create table to store deliverability alert thresholds
CREATE TABLE public.alert_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value numeric NOT NULL,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can read alert settings"
ON public.alert_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update alert settings"
ON public.alert_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert alert settings"
ON public.alert_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default threshold values
INSERT INTO public.alert_settings (setting_key, setting_value, description) VALUES
  ('bounce_rate_warning', 2, 'Bounce rate warning threshold (%)'),
  ('bounce_rate_critical', 5, 'Bounce rate critical threshold (%)'),
  ('complaint_rate_warning', 0.1, 'Complaint rate warning threshold (%)'),
  ('complaint_rate_critical', 0.5, 'Complaint rate critical threshold (%)'),
  ('unsubscribe_rate_warning', 1, 'Unsubscribe rate warning threshold (%)');