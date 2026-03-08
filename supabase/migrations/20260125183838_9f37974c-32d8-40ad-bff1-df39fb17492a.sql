-- Create geo_restrictions table for blocking signups from specific countries/regions
CREATE TABLE public.geo_restrictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  region TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(country_code, region)
);

-- Enable RLS
ALTER TABLE public.geo_restrictions ENABLE ROW LEVEL SECURITY;

-- Only admins can view geo restrictions
CREATE POLICY "Admins can view geo restrictions"
ON public.geo_restrictions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert geo restrictions
CREATE POLICY "Admins can insert geo restrictions"
ON public.geo_restrictions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update geo restrictions
CREATE POLICY "Admins can update geo restrictions"
ON public.geo_restrictions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete geo restrictions
CREATE POLICY "Admins can delete geo restrictions"
ON public.geo_restrictions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Block anon access
CREATE POLICY "Anon cannot view geo restrictions"
ON public.geo_restrictions FOR SELECT TO anon
USING (false);

-- Create index for efficient lookups
CREATE INDEX idx_geo_restrictions_country ON public.geo_restrictions (country_code, is_blocked);
CREATE INDEX idx_geo_restrictions_blocked ON public.geo_restrictions (is_blocked) WHERE is_blocked = true;