
-- Fix early_access_signups: Remove misleading ALL policy, restrict SELECT to authenticated admins only
DROP POLICY IF EXISTS "No direct client access to early_access_signups" ON public.early_access_signups;
DROP POLICY IF EXISTS "Admins can read early access signups" ON public.early_access_signups;

-- Recreate admin SELECT policy targeting authenticated role only
CREATE POLICY "Admins can read early access signups"
ON public.early_access_signups
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Explicitly block all write operations from clients
CREATE POLICY "No client writes to early_access_signups"
ON public.early_access_signups
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Add explicit anon denial for early_access_signups
CREATE POLICY "Anon cannot access early_access_signups"
ON public.early_access_signups
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
