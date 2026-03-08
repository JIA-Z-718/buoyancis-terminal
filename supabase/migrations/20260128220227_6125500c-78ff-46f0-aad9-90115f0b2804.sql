-- Fix the overly permissive RLS policy on passkey_challenges
-- Drop the permissive policy
DROP POLICY IF EXISTS "Service role can manage challenges" ON public.passkey_challenges;

-- Challenges should only be managed by edge functions using service role
-- For user operations, they can only interact with their own challenges
CREATE POLICY "Users can insert their own challenges"
  ON public.passkey_challenges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own challenges"
  ON public.passkey_challenges
  FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);