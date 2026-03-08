-- Create table to store unsubscribed emails
CREATE TABLE public.email_unsubscribes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT
);

-- Enable RLS
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Admins can read unsubscribes
CREATE POLICY "Admins can read email unsubscribes"
ON public.email_unsubscribes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete unsubscribes (to re-enable users)
CREATE POLICY "Admins can delete email unsubscribes"
ON public.email_unsubscribes
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));