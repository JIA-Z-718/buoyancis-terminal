
-- Fix passkey_challenges RLS policies: remove user_id IS NULL condition
-- All challenges are always created with a user_id by the edge functions,
-- so allowing NULL user_id access is an unnecessary security risk.

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own challenges" ON public.passkey_challenges;
DROP POLICY IF EXISTS "Users can insert their own challenges" ON public.passkey_challenges;
DROP POLICY IF EXISTS "Users can delete their own challenges" ON public.passkey_challenges;

-- Recreate with strict owner-only access (no NULL user_id condition)
CREATE POLICY "Users can view their own challenges"
ON public.passkey_challenges
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges"
ON public.passkey_challenges
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own challenges"
ON public.passkey_challenges
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
