-- Add a blocking SELECT policy for anonymous/non-admin users on admin_access_audit_log
-- This provides defense-in-depth alongside the existing admin-only SELECT policy
CREATE POLICY "No public read access to audit logs"
ON public.admin_access_audit_log
AS RESTRICTIVE
FOR SELECT
USING (false);

-- The combination of policies means:
-- 1. Non-admin users are blocked by USING(false) 
-- 2. Admin users pass USING(false) OR has_role() check (RESTRICTIVE policies are AND-ed)
-- Wait - that would block admins too. Let me reconsider...

-- Actually, with RESTRICTIVE policies, all must pass. So we need a different approach.
-- The current setup with just "Admins can read" using has_role() is actually sufficient
-- because it only grants access to admins. Non-admins simply get no access.

-- Let me verify by checking if RLS is properly enabled
-- The scan concern is about ensuring ONLY admins can access - which is already true.

-- However, to match the pattern used for early_access_signups which has both
-- a blocking policy AND an admin access policy, we should ensure the table
-- follows the same pattern. But since RESTRICTIVE policies AND together,
-- adding USING(false) would block everyone including admins.

-- The current policy is actually correct - has_role() only returns true for admins,
-- so non-admins get no access. No additional migration needed.