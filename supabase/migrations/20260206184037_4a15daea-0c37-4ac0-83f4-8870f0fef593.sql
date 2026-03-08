-- Remove the overly permissive admin SELECT policy on profiles
-- Admin access to profile data should go through audited Edge Functions, not direct table access
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;