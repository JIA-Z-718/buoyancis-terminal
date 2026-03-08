
-- Remove the duplicate/redundant SELECT policy on mfa_recovery_codes
-- Keep "Users can view their own recovery code metadata" (clearer name)
-- Drop "Users can view their own recovery codes" (duplicate)
DROP POLICY IF EXISTS "Users can view their own recovery codes" ON public.mfa_recovery_codes;
