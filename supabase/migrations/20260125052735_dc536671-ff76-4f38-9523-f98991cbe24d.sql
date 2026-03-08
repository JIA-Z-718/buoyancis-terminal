-- Add restrictive INSERT policies for email tracking tables
-- These tables should only allow INSERT from service role (edge functions)

-- email_bounces: Only service role can insert (via webhook handlers)
CREATE POLICY "Only service role can insert bounces"
ON public.email_bounces
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Also block anon inserts
CREATE POLICY "Anon cannot insert bounces"
ON public.email_bounces
FOR INSERT
TO anon
WITH CHECK (false);

-- email_complaints: Only service role can insert
CREATE POLICY "Only service role can insert complaints"
ON public.email_complaints
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Anon cannot insert complaints"
ON public.email_complaints
FOR INSERT
TO anon
WITH CHECK (false);

-- email_opens: Only service role can insert (via tracking pixel)
CREATE POLICY "Only service role can insert opens"
ON public.email_opens
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Anon cannot insert opens"
ON public.email_opens
FOR INSERT
TO anon
WITH CHECK (false);

-- email_clicks: Only service role can insert (via tracking redirect)
CREATE POLICY "Only service role can insert clicks"
ON public.email_clicks
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Anon cannot insert clicks"
ON public.email_clicks
FOR INSERT
TO anon
WITH CHECK (false);

-- email_unsubscribes: Only service role can insert (via unsubscribe function)
CREATE POLICY "Only service role can insert unsubscribes"
ON public.email_unsubscribes
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Anon cannot insert unsubscribes"
ON public.email_unsubscribes
FOR INSERT
TO anon
WITH CHECK (false);