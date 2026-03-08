
-- Fix trust_profiles: Remove overly permissive public SELECT policy
-- Users should only view their own trust profile, admins can view all
DROP POLICY IF EXISTS "Users can view public trust data" ON public.trust_profiles;

-- Fix sovereignty_settings: Restrict to admin-only viewing
-- These system settings should not be visible to regular users
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.sovereignty_settings;

CREATE POLICY "Admins can view sovereignty settings"
ON public.sovereignty_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix entropy_cleaning_cycles: System maintenance data should be admin-only
DROP POLICY IF EXISTS "Public can view completed cycles" ON public.entropy_cleaning_cycles;

CREATE POLICY "Admins can view entropy cleaning cycles"
ON public.entropy_cleaning_cycles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
