-- Drop the permissive public INSERT policy on signup_error_logs
DROP POLICY IF EXISTS "Anyone can log signup errors" ON public.signup_error_logs;

-- Add a restrictive policy that blocks all client-side inserts
-- Service role bypasses RLS, so edge functions can still write
CREATE POLICY "No client-side insert to signup error logs"
ON public.signup_error_logs
FOR INSERT
TO authenticated, anon
WITH CHECK (false);