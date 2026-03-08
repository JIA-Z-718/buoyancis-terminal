-- Create email clicks tracking table
CREATE TABLE public.email_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  original_url TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.email_clicks ENABLE ROW LEVEL SECURITY;

-- Only admins can read clicks
CREATE POLICY "Admins can read email clicks" 
ON public.email_clicks 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for faster lookups
CREATE INDEX idx_email_clicks_campaign_id ON public.email_clicks(campaign_id);
CREATE INDEX idx_email_clicks_recipient ON public.email_clicks(campaign_id, recipient_email);