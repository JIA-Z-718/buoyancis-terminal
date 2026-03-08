-- Add explicit restrictive policy to deny anonymous SELECT access to profiles table
-- This makes the security intent explicit and prevents accidental exposure
CREATE POLICY "No anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);