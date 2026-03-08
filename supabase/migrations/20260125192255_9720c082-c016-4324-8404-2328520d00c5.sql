-- Create storage bucket for exports
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read their own exports
CREATE POLICY "Users can read their own exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow service role to insert exports (edge function uses service role)
CREATE POLICY "Service role can insert exports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exports');

-- Allow service role to delete exports
CREATE POLICY "Service role can delete exports"
ON storage.objects FOR DELETE
USING (bucket_id = 'exports');