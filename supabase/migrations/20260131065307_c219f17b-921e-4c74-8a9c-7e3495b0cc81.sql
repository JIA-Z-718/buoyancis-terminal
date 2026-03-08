-- Fix user_phone_numbers RLS policy to explicitly restrict access to own records
-- The current RESTRICTIVE policy only checks auth.uid() IS NOT NULL
-- This should explicitly check for own records OR admin access

-- Drop the current overly broad restrictive policy
DROP POLICY IF EXISTS "Require authentication for phone numbers" ON public.user_phone_numbers;

-- Create a proper restrictive policy that explicitly restricts to own records or admin
CREATE POLICY "Users can only access own phone numbers"
ON public.user_phone_numbers
AS RESTRICTIVE
FOR ALL
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin')
);