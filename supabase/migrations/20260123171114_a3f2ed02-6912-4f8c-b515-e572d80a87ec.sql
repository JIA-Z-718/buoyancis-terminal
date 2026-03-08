-- Create table for tracking email bounces
CREATE TABLE public.email_bounces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  bounce_type TEXT NOT NULL DEFAULT 'hard',
  reason TEXT,
  bounced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_campaign_id UUID REFERENCES public.email_campaigns(id),
  CONSTRAINT email_bounces_email_unique UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.email_bounces ENABLE ROW LEVEL SECURITY;

-- Admin read policy
CREATE POLICY "Admins can read email bounces"
ON public.email_bounces
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin delete policy (to allow unbouncing)
CREATE POLICY "Admins can delete email bounces"
ON public.email_bounces
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_email_bounces_email ON public.email_bounces(email);