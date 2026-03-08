-- Create table for storing passkey/WebAuthn credentials
CREATE TABLE public.passkey_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key BYTEA NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  device_type TEXT,
  friendly_name TEXT,
  transports TEXT[],
  aaguid TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create index for efficient lookups
CREATE INDEX idx_passkey_credentials_user_id ON public.passkey_credentials(user_id);
CREATE INDEX idx_passkey_credentials_credential_id ON public.passkey_credentials(credential_id);

-- Create table for WebAuthn challenges (temporary, with auto-cleanup)
CREATE TABLE public.passkey_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for challenge lookup
CREATE INDEX idx_passkey_challenges_challenge ON public.passkey_challenges(challenge);
CREATE INDEX idx_passkey_challenges_expires_at ON public.passkey_challenges(expires_at);

-- Enable RLS
ALTER TABLE public.passkey_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passkey_challenges ENABLE ROW LEVEL SECURITY;

-- RLS policies for passkey_credentials
-- Users can view their own passkeys
CREATE POLICY "Users can view their own passkeys"
  ON public.passkey_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own passkeys
CREATE POLICY "Users can insert their own passkeys"
  ON public.passkey_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own passkeys (for counter updates)
CREATE POLICY "Users can update their own passkeys"
  ON public.passkey_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own passkeys
CREATE POLICY "Users can delete their own passkeys"
  ON public.passkey_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all passkeys
CREATE POLICY "Admins can view all passkeys"
  ON public.passkey_credentials
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for passkey_challenges (service role only for most operations)
-- Allow authenticated users to read their own challenges
CREATE POLICY "Users can view their own challenges"
  ON public.passkey_challenges
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow service role to manage challenges (handled by edge functions)
CREATE POLICY "Service role can manage challenges"
  ON public.passkey_challenges
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add cleanup function for expired challenges
CREATE OR REPLACE FUNCTION public.cleanup_expired_passkey_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.passkey_challenges
  WHERE expires_at < now();
END;
$$;