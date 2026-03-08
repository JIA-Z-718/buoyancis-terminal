-- Fix email_rate_limits table: Remove overly permissive policy and ensure only service role can access
-- Note: Service role bypasses RLS by design, so we don't need a specific policy for it
-- We just need to ensure no other roles can access this table

-- Drop the existing overly permissive policy if it exists
DROP POLICY IF EXISTS "Service role full access to email_rate_limits" ON public.email_rate_limits;

-- Create a restrictive policy that denies all client access
-- Service role will bypass RLS automatically
CREATE POLICY "No client access to email_rate_limits"
  ON public.email_rate_limits
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- Fix email_opens table: The WITH CHECK (false) policy was incorrectly blocking service role
-- Service role bypasses RLS, so we just need to ensure clients can't insert
-- Drop and recreate the insert policy to be clearer

DROP POLICY IF EXISTS "Only service role can insert opens" ON public.email_opens;

-- Create a policy that explicitly blocks client-side inserts
-- Service role automatically bypasses RLS, so it can still insert
CREATE POLICY "Block client-side inserts on email_opens"
  ON public.email_opens
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

-- Also fix email_clicks table if it has the same issue
DROP POLICY IF EXISTS "Only service role can insert clicks" ON public.email_clicks;

CREATE POLICY "Block client-side inserts on email_clicks"
  ON public.email_clicks
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

-- Fix email_bounces table
DROP POLICY IF EXISTS "Only service role can insert bounces" ON public.email_bounces;

CREATE POLICY "Block client-side inserts on email_bounces"
  ON public.email_bounces
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

-- Fix email_complaints table
DROP POLICY IF EXISTS "Only service role can insert complaints" ON public.email_complaints;

CREATE POLICY "Block client-side inserts on email_complaints"
  ON public.email_complaints
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);