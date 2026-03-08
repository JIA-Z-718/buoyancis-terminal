-- Create MFA settings table
CREATE TABLE public.mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read settings
CREATE POLICY "Admins can read MFA settings"
  ON public.mfa_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update settings
CREATE POLICY "Admins can update MFA settings"
  ON public.mfa_settings
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default setting (MFA required by default)
INSERT INTO public.mfa_settings (setting_key, setting_value, description)
VALUES ('mfa_required_for_admin', true, 'When enabled, all admin users must have MFA set up to access the admin dashboard');

-- Create trigger for updated_at
CREATE TRIGGER update_mfa_settings_updated_at
  BEFORE UPDATE ON public.mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();