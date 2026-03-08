-- Add explicit deny policies to satisfy linter while keeping admin_access_audit_log inaccessible to client roles
DROP POLICY IF EXISTS "No client access (select)" ON public.admin_access_audit_log;
DROP POLICY IF EXISTS "No client access (insert)" ON public.admin_access_audit_log;
DROP POLICY IF EXISTS "No client access (update)" ON public.admin_access_audit_log;
DROP POLICY IF EXISTS "No client access (delete)" ON public.admin_access_audit_log;

CREATE POLICY "No client access (select)"
ON public.admin_access_audit_log
FOR SELECT
TO anon, authenticated
USING (false);

CREATE POLICY "No client access (insert)"
ON public.admin_access_audit_log
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "No client access (update)"
ON public.admin_access_audit_log
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "No client access (delete)"
ON public.admin_access_audit_log
FOR DELETE
TO anon, authenticated
USING (false);
