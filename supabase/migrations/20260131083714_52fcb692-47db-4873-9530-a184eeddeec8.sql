-- URGENT FIX: Remove the incorrectly added blocking policy that would block admins too
-- RESTRICTIVE policies AND together, so USING(false) would block everyone including admins
DROP POLICY IF EXISTS "No public read access to audit logs" ON public.admin_access_audit_log;