-- Add A/B test variant tracking to email_opens
ALTER TABLE public.email_opens 
ADD COLUMN variant TEXT DEFAULT 'A';

-- Add A/B test variant tracking to email_clicks
ALTER TABLE public.email_clicks 
ADD COLUMN variant TEXT DEFAULT 'A';

-- Create a table to store A/B test variant definitions for campaigns
CREATE TABLE public.ab_test_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;

-- Admin policies for ab_test_variants
CREATE POLICY "Admins can read ab test variants"
  ON public.ab_test_variants FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ab test variants"
  ON public.ab_test_variants FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ab test variants"
  ON public.ab_test_variants FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for efficient lookups
CREATE INDEX idx_ab_test_variants_campaign ON public.ab_test_variants(campaign_id);