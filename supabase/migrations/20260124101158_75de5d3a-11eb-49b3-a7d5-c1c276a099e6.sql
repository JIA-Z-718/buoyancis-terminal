-- Create table for logging early access signup errors
CREATE TABLE public.signup_error_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text,
  first_name text,
  last_name text,
  error_code text,
  error_message text,
  error_details text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signup_error_logs ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (errors can happen before auth)
CREATE POLICY "Anyone can log signup errors"
  ON public.signup_error_logs FOR INSERT
  WITH CHECK (true);

-- Only admins can read error logs
CREATE POLICY "Admins can read signup error logs"
  ON public.signup_error_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete error logs
CREATE POLICY "Admins can delete signup error logs"
  ON public.signup_error_logs FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));