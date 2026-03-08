-- Fix 1: Prevent client-side harvesting of marketing signup PII
ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;

-- Ensure no direct client privileges (edge/backend functions use service role)
REVOKE ALL ON TABLE public.early_access_signups FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.early_access_signups TO service_role;


-- Fix 2: Remove recovery code hashes from client-readable table
-- Store code hashes in a separate table with no client policies (service role only)
CREATE TABLE IF NOT EXISTS public.mfa_recovery_code_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_code_id UUID NOT NULL REFERENCES public.mfa_recovery_codes(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (recovery_code_id)
);

ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_recovery_code_secrets ENABLE ROW LEVEL SECURITY;

-- Allow users to read ONLY metadata about their own recovery codes
DO $$
BEGIN
  CREATE POLICY "Users can view their own recovery code metadata"
  ON public.mfa_recovery_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Migrate existing hashes into the secrets table (if the column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mfa_recovery_codes'
      AND column_name = 'code_hash'
  ) THEN
    INSERT INTO public.mfa_recovery_code_secrets (recovery_code_id, code_hash, created_at)
    SELECT id, code_hash, created_at
    FROM public.mfa_recovery_codes
    WHERE code_hash IS NOT NULL
    ON CONFLICT (recovery_code_id) DO NOTHING;

    ALTER TABLE public.mfa_recovery_codes
      DROP COLUMN IF EXISTS code_hash;
  END IF;
END $$;

-- Ensure clients cannot write/modify codes directly
REVOKE ALL ON TABLE public.mfa_recovery_codes FROM anon, authenticated;
GRANT SELECT ON TABLE public.mfa_recovery_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mfa_recovery_codes TO service_role;

REVOKE ALL ON TABLE public.mfa_recovery_code_secrets FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mfa_recovery_code_secrets TO service_role;
