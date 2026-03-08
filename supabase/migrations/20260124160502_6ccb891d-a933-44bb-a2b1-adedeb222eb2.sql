-- Add UPDATE policy for ab_test_variants
CREATE POLICY "Admins can update ab test variants"
  ON public.ab_test_variants FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add UPDATE policy for email_campaigns
CREATE POLICY "Admins can update email campaigns"
  ON public.email_campaigns FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));