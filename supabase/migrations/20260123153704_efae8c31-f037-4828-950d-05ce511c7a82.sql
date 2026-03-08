-- Create early_access_signups table for collecting emails
CREATE TABLE public.early_access_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their email (public signup)
CREATE POLICY "Anyone can signup for early access" 
ON public.early_access_signups 
FOR INSERT 
WITH CHECK (true);

-- Only allow reading own email (or use edge function for admin access)
CREATE POLICY "No public read access" 
ON public.early_access_signups 
FOR SELECT 
USING (false);