-- Create data retention settings table
CREATE TABLE public.data_retention_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text NOT NULL UNIQUE,
  retention_days integer NOT NULL DEFAULT 30,
  description text,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.data_retention_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can read data retention settings"
  ON public.data_retention_settings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update data retention settings"
  ON public.data_retention_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert data retention settings"
  ON public.data_retention_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default retention settings
INSERT INTO public.data_retention_settings (table_name, retention_days, description, is_enabled) VALUES
  ('bot_detection_events', 90, 'Security events from bot detection systems', true),
  ('rate_limit_violations', 30, 'Rate limiting violation logs', true),
  ('signup_error_logs', 30, 'Early access signup error logs', true),
  ('cron_failure_notifications', 30, 'Cron job failure notification tracking', true);

-- Create trigger for updated_at
CREATE TRIGGER update_data_retention_settings_updated_at
  BEFORE UPDATE ON public.data_retention_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();