-- Create custom_music table with is_public column
CREATE TABLE public.custom_music (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_custom_music_user ON public.custom_music (user_id);
CREATE INDEX idx_custom_music_public ON public.custom_music (is_public) WHERE is_public = true;

-- Enable RLS
ALTER TABLE public.custom_music ENABLE ROW LEVEL SECURITY;

-- Users can view their own music or any public music
CREATE POLICY "Users can view their own or public music"
ON public.custom_music
FOR SELECT
USING (
  user_id = auth.uid() 
  OR is_public = true
);

-- Users can insert their own music
CREATE POLICY "Users can insert their own custom music"
ON public.custom_music
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own music
CREATE POLICY "Users can update their own custom music"
ON public.custom_music
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own music
CREATE POLICY "Users can delete their own custom music"
ON public.custom_music
FOR DELETE
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_custom_music_updated_at
BEFORE UPDATE ON public.custom_music
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();