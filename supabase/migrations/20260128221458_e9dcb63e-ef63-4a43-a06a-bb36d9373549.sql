-- Create table to store user phone numbers for SMS MFA
CREATE TABLE public.user_phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    country_code TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_phone_numbers ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own phone number
CREATE POLICY "Users can view own phone number"
ON public.user_phone_numbers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own phone number"
ON public.user_phone_numbers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phone number"
ON public.user_phone_numbers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own phone number"
ON public.user_phone_numbers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all phone numbers
CREATE POLICY "Admins can view all phone numbers"
ON public.user_phone_numbers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create table for SMS verification codes
CREATE TABLE public.sms_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    phone_number TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('phone_verification', 'mfa_login')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_verification_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can access verification codes (accessed via edge functions)
-- No policies needed as edge functions use service role

-- Create index for faster lookups
CREATE INDEX idx_user_phone_numbers_user_id ON public.user_phone_numbers(user_id);
CREATE INDEX idx_sms_verification_codes_user_id ON public.sms_verification_codes(user_id);
CREATE INDEX idx_sms_verification_codes_expires_at ON public.sms_verification_codes(expires_at);

-- Add trigger for updated_at
CREATE TRIGGER update_user_phone_numbers_updated_at
BEFORE UPDATE ON public.user_phone_numbers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to clean up expired SMS codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_sms_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.sms_verification_codes
  WHERE expires_at < now();
END;
$$;