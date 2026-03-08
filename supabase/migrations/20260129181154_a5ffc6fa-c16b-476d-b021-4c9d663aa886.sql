-- Create a storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access to audio files
CREATE POLICY "Audio files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio');

-- Create policy for authenticated users to upload audio
CREATE POLICY "Authenticated users can upload audio" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'audio' AND auth.role() = 'authenticated');