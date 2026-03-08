-- Tighten access for early_access_signups: remove public INSERT and allow only admins (service role bypasses RLS for backend functions)

BEGIN;

-- Drop the overly-permissive public INSERT policy
DROP POLICY IF EXISTS "Anyone can signup for early access" ON public.early_access_signups;

-- Allow admins to insert (optional, for admin tooling). Everyone else must go through backend functions.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'early_access_signups'
      AND policyname = 'Admins can insert early access signups'
  ) THEN
    CREATE POLICY "Admins can insert early access signups"
    ON public.early_access_signups
    AS RESTRICTIVE
    FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

COMMIT;