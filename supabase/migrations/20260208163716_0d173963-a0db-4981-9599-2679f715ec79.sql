
-- ============================================================
-- Fix 1: Clean up conflicting RLS policies on early_access_signups
-- Remove the redundant admin SELECT policy (admin access is via 
-- service role edge function, not client-side RLS).
-- Consolidate block policies into a single clean policy.
-- ============================================================

-- Drop all existing policies on early_access_signups
DROP POLICY IF EXISTS "Admins can read early access signups" ON public.early_access_signups;
DROP POLICY IF EXISTS "Anon cannot access early_access_signups" ON public.early_access_signups;
DROP POLICY IF EXISTS "No client writes to early_access_signups" ON public.early_access_signups;

-- Create a single, clear deny-all policy for client access
-- Admin access goes through edge functions with service role key
CREATE POLICY "No client access to early_access_signups"
ON public.early_access_signups
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Force RLS even for table owners to prevent bypass
ALTER TABLE public.early_access_signups FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Fix 2: Harden event_checkins RLS with FORCE ROW LEVEL SECURITY
-- The existing ALL-block policy is correct, just add FORCE RLS.
-- ============================================================

ALTER TABLE public.event_checkins FORCE ROW LEVEL SECURITY;
