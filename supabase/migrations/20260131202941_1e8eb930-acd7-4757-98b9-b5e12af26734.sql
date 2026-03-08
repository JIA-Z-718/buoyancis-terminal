-- Harden RLS policies for early_access_signups and event_checkins tables
-- Remove redundant/conflicting policies and tighten INSERT access

BEGIN;

-- ============================================
-- 1. EARLY_ACCESS_SIGNUPS - Clean up redundant policies
-- ============================================

-- Drop the redundant "No public read access" policy since "Admins can read" already restricts access
DROP POLICY IF EXISTS "No public read access" ON public.early_access_signups;

-- ============================================
-- 2. EVENT_CHECKINS - Harden INSERT access
-- ============================================

-- Drop the overly permissive public INSERT policy (WITH CHECK (true))
DROP POLICY IF EXISTS "Anyone can register for events" ON public.event_checkins;

-- Drop the redundant "No public read access" policy
DROP POLICY IF EXISTS "No public read access to check-ins" ON public.event_checkins;

-- Create a new admin-only INSERT policy for event_checkins
-- Public check-ins should go through an Edge Function with proper validation
CREATE POLICY "Admins can insert check-ins"
ON public.event_checkins
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));

COMMIT;