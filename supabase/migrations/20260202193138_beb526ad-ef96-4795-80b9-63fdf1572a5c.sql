-- 1) Enforce retention defaults for signup_error_logs (PII) via configurable settings
INSERT INTO public.data_retention_settings (table_name, retention_days, is_enabled)
VALUES ('signup_error_logs', 30, true)
ON CONFLICT (table_name)
DO UPDATE SET
  retention_days = EXCLUDED.retention_days,
  is_enabled = EXCLUDED.is_enabled,
  updated_at = now();

-- 2) Remove all client-side access to signup_error_logs (force backend-only access)
DROP POLICY IF EXISTS "Admins can delete signup error logs" ON public.signup_error_logs;
DROP POLICY IF EXISTS "Admins can read signup error logs" ON public.signup_error_logs;
DROP POLICY IF EXISTS "No client-side insert to signup error logs" ON public.signup_error_logs;

CREATE POLICY "No direct client access to signup error logs"
ON public.signup_error_logs
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- 3) Prevent admins from bulk-exporting phone numbers from the client
DROP POLICY IF EXISTS "Admins can manage all phone numbers" ON public.user_phone_numbers;