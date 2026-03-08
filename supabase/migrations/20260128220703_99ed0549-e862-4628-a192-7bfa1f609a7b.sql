-- Create table to track MFA verification events for pattern analysis
CREATE TABLE public.mfa_verification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('totp', 'passkey', 'recovery_code')),
    success BOOLEAN NOT NULL DEFAULT true,
    verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.mfa_verification_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification events
CREATE POLICY "Users can view own verification events"
ON public.mfa_verification_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all verification events
CREATE POLICY "Admins can view all verification events"
ON public.mfa_verification_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert verification events (via edge function)
CREATE POLICY "Service role can insert verification events"
ON public.mfa_verification_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_mfa_verification_events_user_id ON public.mfa_verification_events(user_id);
CREATE INDEX idx_mfa_verification_events_verified_at ON public.mfa_verification_events(verified_at DESC);
CREATE INDEX idx_mfa_verification_events_method ON public.mfa_verification_events(method);