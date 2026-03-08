-- Drop the overly permissive authentication-only policy on profiles table
-- This policy allows any authenticated user to access all profiles which is a security risk
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;

-- Verify the remaining policies are proper owner-scoped policies
-- The table should already have "Users can view own profile" and "Users can update own profile" policies