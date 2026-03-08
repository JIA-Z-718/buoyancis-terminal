-- Harden admin_access_audit_log: deny direct client access (admins must use server-side admin endpoints)
ALTER TABLE public.admin_access_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_access_audit_log'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_access_audit_log', pol.policyname);
  END LOOP;
END $$;
