-- Create email campaigns table
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create email opens tracking table  
CREATE TABLE public.email_opens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  -- Prevent duplicate opens from same recipient
  UNIQUE(campaign_id, recipient_email)
);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_opens ENABLE ROW LEVEL SECURITY;

-- Only admins can read campaigns
CREATE POLICY "Admins can read email campaigns" 
ON public.email_campaigns 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can create campaigns (done via service role in edge function)
CREATE POLICY "Admins can insert email campaigns" 
ON public.email_campaigns 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete campaigns
CREATE POLICY "Admins can delete email campaigns" 
ON public.email_campaigns 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can read opens
CREATE POLICY "Admins can read email opens" 
ON public.email_opens 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_email_opens_campaign_id ON public.email_opens(campaign_id);