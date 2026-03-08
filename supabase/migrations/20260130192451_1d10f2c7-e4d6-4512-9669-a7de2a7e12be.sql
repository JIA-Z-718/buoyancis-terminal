-- Create event check-ins table for guest registration
CREATE TABLE public.event_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for guest self-registration)
CREATE POLICY "Anyone can register for events"
ON public.event_checkins
FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can view, update, delete check-ins
CREATE POLICY "Admins can view all check-ins"
ON public.event_checkins
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update check-ins"
ON public.event_checkins
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete check-ins"
ON public.event_checkins
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_checkins;

-- Add index for faster searches
CREATE INDEX idx_event_checkins_name ON public.event_checkins USING gin(to_tsvector('simple', full_name));
CREATE INDEX idx_event_checkins_time ON public.event_checkins(checked_in_at DESC);