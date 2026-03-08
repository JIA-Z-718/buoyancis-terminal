-- Create bot_detection_events table for tracking bot detection statistics
CREATE TABLE public.bot_detection_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('honeypot', 'timing', 'captcha_failure', 'suspicious_ua', 'challenge_failure', 'rate_limit')),
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bot_detection_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view bot detection events
CREATE POLICY "Admins can view bot detection events"
ON public.bot_detection_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Block client-side inserts (only edge functions via service role can insert)
CREATE POLICY "No client-side insert to bot detection events"
ON public.bot_detection_events FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "Anon cannot view bot detection events"
ON public.bot_detection_events FOR SELECT TO anon
USING (false);

CREATE POLICY "Anon cannot insert bot detection events"
ON public.bot_detection_events FOR INSERT TO anon
WITH CHECK (false);

-- Create index for efficient queries
CREATE INDEX idx_bot_detection_events_type_created ON public.bot_detection_events (event_type, created_at DESC);
CREATE INDEX idx_bot_detection_events_created ON public.bot_detection_events (created_at DESC);