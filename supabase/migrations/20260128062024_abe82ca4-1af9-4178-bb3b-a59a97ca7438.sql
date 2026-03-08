-- Create MFA recovery codes table
CREATE TABLE public.mfa_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_mfa_recovery_codes_user_id ON public.mfa_recovery_codes(user_id);
CREATE INDEX idx_mfa_recovery_codes_unused ON public.mfa_recovery_codes(user_id) WHERE used_at IS NULL;

-- Enable RLS
ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Users can only view their own recovery codes (but not the hashes - handled in app)
CREATE POLICY "Users can view their own recovery codes"
  ON public.mfa_recovery_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own recovery codes
CREATE POLICY "Users can insert their own recovery codes"
  ON public.mfa_recovery_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own recovery codes (to mark as used)
CREATE POLICY "Users can update their own recovery codes"
  ON public.mfa_recovery_codes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own recovery codes (for regeneration)
CREATE POLICY "Users can delete their own recovery codes"
  ON public.mfa_recovery_codes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);