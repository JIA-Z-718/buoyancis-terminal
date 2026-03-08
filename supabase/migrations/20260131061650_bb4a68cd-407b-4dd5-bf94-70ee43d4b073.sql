-- Fix profiles table anonymous access policy
-- The current policy "No anonymous access to profiles" uses RESTRICTIVE with false, 
-- which is incorrect. Replace with a policy that requires authentication.

-- Drop the incorrect restrictive policy
DROP POLICY IF EXISTS "No anonymous access to profiles" ON public.profiles;

-- Add a new restrictive policy that requires authentication for all operations
-- This ensures auth.uid() IS NOT NULL before any permissive policies are checked
CREATE POLICY "Require authentication for profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Also add explicit user_phone_numbers and sms_verification_codes protection
-- These were flagged as error-level but let's ensure they're protected

-- For user_phone_numbers: ensure no anonymous access
DROP POLICY IF EXISTS "No anonymous access to phone numbers" ON public.user_phone_numbers;
CREATE POLICY "Require authentication for phone numbers"
ON public.user_phone_numbers
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL);

-- For sms_verification_codes: block all client access (service role only)
DROP POLICY IF EXISTS "No client access to sms codes" ON public.sms_verification_codes;
CREATE POLICY "No client access to sms codes"
ON public.sms_verification_codes
AS RESTRICTIVE
FOR ALL
USING (false)
WITH CHECK (false);