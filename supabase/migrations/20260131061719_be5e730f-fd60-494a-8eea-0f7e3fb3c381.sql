-- Fix audio storage bucket policy to require ownership validation
-- Current policy allows any authenticated user to upload, which is a security risk

-- Drop the overly permissive upload policy
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;

-- Create a proper policy that validates user ownership via folder structure
-- Users can only upload to their own folder (their user ID)
CREATE POLICY "Users can upload audio to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'audio' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure users can only update/delete their own files
DROP POLICY IF EXISTS "Users can update own audio files" ON storage.objects;
CREATE POLICY "Users can update own audio files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own audio files" ON storage.objects;
CREATE POLICY "Users can delete own audio files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);