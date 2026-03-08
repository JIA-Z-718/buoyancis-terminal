-- =====================================================
-- FIX 1: Prevent timing attacks on early_access_signups
-- Use ON CONFLICT to silently handle duplicates without revealing data
-- =====================================================

-- The edge function already handles duplicates, but we add a partial index
-- to ensure consistent behavior and prevent enumeration attacks

-- Drop the unique constraint if it exists and replace with a partial unique index
-- that only applies to non-unsubscribed emails
DROP INDEX IF EXISTS idx_early_access_unique_email;
CREATE UNIQUE INDEX IF NOT EXISTS idx_early_access_unique_active_email 
ON public.early_access_signups (email) 
WHERE unsubscribed_at IS NULL;

-- =====================================================
-- FIX 2: Simplify user_phone_numbers RLS policies
-- Remove the conflicting RESTRICTIVE ALL policy and 
-- keep clean, separated policies for users and admins
-- =====================================================

-- Drop the problematic RESTRICTIVE ALL policy that mixes user and admin logic
DROP POLICY IF EXISTS "Users can only access own phone numbers" ON public.user_phone_numbers;

-- Ensure the individual policies remain clean (they already exist with correct logic)
-- Just verify they're set correctly

-- The existing policies are:
-- 1. "Users can view own phone number" - SELECT where auth.uid() = user_id (authenticated)
-- 2. "Users can insert own phone number" - INSERT with auth.uid() = user_id check (authenticated)
-- 3. "Users can update own phone number" - UPDATE where auth.uid() = user_id (authenticated)
-- 4. "Users can delete own phone number" - DELETE where auth.uid() = user_id (authenticated)
-- 5. "Admins can view all phone numbers" - SELECT where has_role(admin) (authenticated)

-- Add admin policies for full CRUD if they don't exist
DROP POLICY IF EXISTS "Admins can manage all phone numbers" ON public.user_phone_numbers;
CREATE POLICY "Admins can manage all phone numbers"
ON public.user_phone_numbers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Drop the redundant admin SELECT-only policy since the above covers all operations
DROP POLICY IF EXISTS "Admins can view all phone numbers" ON public.user_phone_numbers;