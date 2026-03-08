-- Secure early_access_signups table - deny all direct client access
-- Signups are handled by edge function, reads should also go through edge functions

DROP POLICY IF EXISTS "Admins can delete early access signups" ON public.early_access_signups;
DROP POLICY IF EXISTS "Admins can insert early access signups" ON public.early_access_signups;
DROP POLICY IF EXISTS "Admins can read early access signups" ON public.early_access_signups;

-- Deny all direct client access - only service role (edge functions) can access
CREATE POLICY "No direct client access to early_access_signups"
ON public.early_access_signups
FOR ALL
USING (false)
WITH CHECK (false);

-- Secure event_checkins table - deny all direct client access
-- Check-ins are handled by edge function, reads should also go through edge functions

DROP POLICY IF EXISTS "Admins can delete check-ins" ON public.event_checkins;
DROP POLICY IF EXISTS "Admins can insert check-ins" ON public.event_checkins;
DROP POLICY IF EXISTS "Admins can update check-ins" ON public.event_checkins;
DROP POLICY IF EXISTS "Admins can view all check-ins" ON public.event_checkins;

-- Deny all direct client access - only service role (edge functions) can access
CREATE POLICY "No direct client access to event_checkins"
ON public.event_checkins
FOR ALL
USING (false)
WITH CHECK (false);