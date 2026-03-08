-- Create table to track email sending for rate limiting
CREATE TABLE public.email_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sender_context TEXT, -- e.g., user_id or IP address
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient rate limit queries
CREATE INDEX idx_email_rate_limits_lookup ON public.email_rate_limits (email_type, recipient_email, sent_at DESC);
CREATE INDEX idx_email_rate_limits_sender ON public.email_rate_limits (email_type, sender_context, sent_at DESC);
CREATE INDEX idx_email_rate_limits_cleanup ON public.email_rate_limits (sent_at);

-- Enable RLS
ALTER TABLE public.email_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (edge functions use service role)
CREATE POLICY "Service role full access to email_rate_limits"
ON public.email_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Add to data retention settings for automatic cleanup
INSERT INTO public.data_retention_settings (table_name, retention_days, is_enabled, description)
VALUES ('email_rate_limits', 1, true, 'Email rate limiting records - only need short-term data')
ON CONFLICT (table_name) DO NOTHING;

-- Create function to check email rate limit
CREATE OR REPLACE FUNCTION public.check_email_rate_limit(
  p_email_type TEXT,
  p_recipient_email TEXT,
  p_sender_context TEXT DEFAULT NULL,
  p_max_per_hour INTEGER DEFAULT 5,
  p_max_per_day INTEGER DEFAULT 20
)
RETURNS TABLE(
  allowed BOOLEAN,
  hourly_count INTEGER,
  daily_count INTEGER,
  retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_hourly_count INTEGER;
  v_daily_count INTEGER;
  v_oldest_in_hour TIMESTAMP WITH TIME ZONE;
  v_retry_after INTEGER;
BEGIN
  -- Count emails in last hour
  SELECT COUNT(*), MIN(sent_at)
  INTO v_hourly_count, v_oldest_in_hour
  FROM public.email_rate_limits
  WHERE email_type = p_email_type
    AND recipient_email = p_recipient_email
    AND (p_sender_context IS NULL OR sender_context = p_sender_context)
    AND sent_at > now() - interval '1 hour';

  -- Count emails in last 24 hours
  SELECT COUNT(*)
  INTO v_daily_count
  FROM public.email_rate_limits
  WHERE email_type = p_email_type
    AND recipient_email = p_recipient_email
    AND (p_sender_context IS NULL OR sender_context = p_sender_context)
    AND sent_at > now() - interval '24 hours';

  -- Calculate retry_after if rate limited
  IF v_hourly_count >= p_max_per_hour THEN
    v_retry_after := EXTRACT(EPOCH FROM (v_oldest_in_hour + interval '1 hour' - now()))::INTEGER;
    IF v_retry_after < 0 THEN v_retry_after := 0; END IF;
  ELSE
    v_retry_after := 0;
  END IF;

  RETURN QUERY SELECT
    (v_hourly_count < p_max_per_hour AND v_daily_count < p_max_per_day) AS allowed,
    v_hourly_count AS hourly_count,
    v_daily_count AS daily_count,
    v_retry_after AS retry_after_seconds;
END;
$$;

-- Create function to record email send
CREATE OR REPLACE FUNCTION public.record_email_send(
  p_email_type TEXT,
  p_recipient_email TEXT,
  p_sender_context TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.email_rate_limits (email_type, recipient_email, sender_context)
  VALUES (p_email_type, p_recipient_email, p_sender_context)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;