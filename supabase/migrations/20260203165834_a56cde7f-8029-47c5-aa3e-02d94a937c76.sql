-- Enforce strict RLS on PII tables
ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.early_access_signups FORCE ROW LEVEL SECURITY;

ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checkins FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_phone_numbers FORCE ROW LEVEL SECURITY;

-- Fix MFA bypass: prevent client-side INSERT/UPDATE to user_phone_numbers
DROP POLICY IF EXISTS "Users can insert own phone number" ON public.user_phone_numbers;
DROP POLICY IF EXISTS "Users can update own phone number" ON public.user_phone_numbers;

DROP POLICY IF EXISTS "No direct client inserts to user_phone_numbers" ON public.user_phone_numbers;
CREATE POLICY "No direct client inserts to user_phone_numbers"
ON public.user_phone_numbers
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "No direct client updates to user_phone_numbers" ON public.user_phone_numbers;
CREATE POLICY "No direct client updates to user_phone_numbers"
ON public.user_phone_numbers
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- Defense-in-depth: revoke write privileges from client roles
REVOKE INSERT, UPDATE ON TABLE public.user_phone_numbers FROM authenticated;
REVOKE INSERT, UPDATE ON TABLE public.user_phone_numbers FROM anon;