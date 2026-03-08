-- Create decode_history table for cloud sync
CREATE TABLE public.decode_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  decoded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, word)
);

-- Create index for efficient queries
CREATE INDEX idx_decode_history_user_id ON public.decode_history(user_id);
CREATE INDEX idx_decode_history_decoded_at ON public.decode_history(decoded_at DESC);

-- Enable RLS
ALTER TABLE public.decode_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view their own decode history"
ON public.decode_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert their own decode history"
ON public.decode_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own history (for tags)
CREATE POLICY "Users can update their own decode history"
ON public.decode_history
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete their own decode history"
ON public.decode_history
FOR DELETE
USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_decode_history_updated_at
BEFORE UPDATE ON public.decode_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();