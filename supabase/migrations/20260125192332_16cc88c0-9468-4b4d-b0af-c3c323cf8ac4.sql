-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Service role can insert exports" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete exports" ON storage.objects;

-- The service role bypasses RLS by default, so we don't need explicit policies for it
-- We only need the authenticated user read policy which is already properly scoped