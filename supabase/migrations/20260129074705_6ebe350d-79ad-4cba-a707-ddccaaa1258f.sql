-- Create table for daily entropy reduction word analyses
CREATE TABLE public.daily_entropy_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  decoded_string TEXT NOT NULL,
  interpretation TEXT NOT NULL,
  deep_analysis TEXT NOT NULL,
  scheduled_date DATE NOT NULL UNIQUE,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_entropy_words ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view all daily entropy words"
  ON public.daily_entropy_words
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create daily entropy words"
  ON public.daily_entropy_words
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update daily entropy words"
  ON public.daily_entropy_words
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete daily entropy words"
  ON public.daily_entropy_words
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add subscription preference to early_access_signups
ALTER TABLE public.early_access_signups 
ADD COLUMN IF NOT EXISTS daily_entropy_subscribed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX idx_daily_entropy_words_scheduled_date ON public.daily_entropy_words(scheduled_date);
CREATE INDEX idx_early_access_daily_entropy ON public.early_access_signups(daily_entropy_subscribed) WHERE daily_entropy_subscribed = true;

-- Trigger for updated_at
CREATE TRIGGER update_daily_entropy_words_updated_at
  BEFORE UPDATE ON public.daily_entropy_words
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();