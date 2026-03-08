-- Create table for tracking email spam complaints
CREATE TABLE public.email_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  complaint_type TEXT NOT NULL DEFAULT 'spam',
  feedback_id TEXT,
  complained_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_campaign_id UUID REFERENCES public.email_campaigns(id),
  CONSTRAINT email_complaints_email_unique UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.email_complaints ENABLE ROW LEVEL SECURITY;

-- Admin read policy
CREATE POLICY "Admins can read email complaints"
ON public.email_complaints
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin delete policy
CREATE POLICY "Admins can delete email complaints"
ON public.email_complaints
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_email_complaints_email ON public.email_complaints(email);