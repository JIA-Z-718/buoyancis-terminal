
-- 1. Add admin SELECT policy on mfa_recovery_codes for security monitoring
CREATE POLICY "Admins can view recovery codes for monitoring"
ON public.mfa_recovery_codes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Tighten audio storage upload policy with file type validation
-- First drop the existing permissive upload policy
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;

-- Create a new upload policy that validates file extensions
CREATE POLICY "Authenticated users can upload audio files only"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (
    lower(storage.extension(name)) IN ('mp3', 'wav', 'ogg', 'mpeg')
  )
);
