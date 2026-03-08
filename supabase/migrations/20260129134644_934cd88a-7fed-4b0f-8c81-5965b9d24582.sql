-- Add is_favorite column to decode_history table
ALTER TABLE public.decode_history 
ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster favorite queries
CREATE INDEX idx_decode_history_favorite ON public.decode_history(user_id, is_favorite) WHERE is_favorite = true;