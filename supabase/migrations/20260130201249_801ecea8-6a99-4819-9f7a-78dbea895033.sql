-- Add missing RLS policy to block public/anonymous read access to event_checkins
-- This prevents unauthenticated users from querying attendee PII while preserving:
-- - Public INSERT capability (for guest registration)
-- - Admin SELECT access (for event management)

CREATE POLICY "No public read access to check-ins"
ON public.event_checkins
FOR SELECT
TO public
USING (false);