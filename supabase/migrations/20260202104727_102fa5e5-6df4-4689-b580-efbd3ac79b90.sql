-- Add an explicit deny policy so the linter doesn't report "RLS enabled, no policy"
DO $$
BEGIN
  CREATE POLICY "No client access to recovery code secrets"
  ON public.mfa_recovery_code_secrets
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
