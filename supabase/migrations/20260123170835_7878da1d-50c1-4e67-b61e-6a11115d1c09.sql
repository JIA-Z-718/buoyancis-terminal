-- Add first_name and last_name columns to early_access_signups
ALTER TABLE public.early_access_signups
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;