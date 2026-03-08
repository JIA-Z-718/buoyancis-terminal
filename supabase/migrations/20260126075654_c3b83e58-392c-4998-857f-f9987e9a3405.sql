-- Add keyboard_shortcuts column to profiles table for cross-device sync
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS keyboard_shortcuts jsonb DEFAULT NULL;