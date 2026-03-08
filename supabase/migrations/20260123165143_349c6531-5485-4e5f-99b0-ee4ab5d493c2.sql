-- Create scheduled_emails table
CREATE TABLE public.scheduled_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emails TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can read scheduled emails"
  ON public.scheduled_emails FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert scheduled emails"
  ON public.scheduled_emails FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update scheduled emails"
  ON public.scheduled_emails FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete scheduled emails"
  ON public.scheduled_emails FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for efficient querying of pending emails
CREATE INDEX idx_scheduled_emails_pending ON public.scheduled_emails (scheduled_for) 
  WHERE status = 'pending';