-- Lock down public inserts to user_feedback; require server-side submission via backend function

BEGIN;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Remove unrestricted public insert policy
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.user_feedback;

-- Explicitly deny all client-side inserts (defense in depth)
CREATE POLICY "No client-side insert to user_feedback"
ON public.user_feedback
FOR INSERT
TO public
WITH CHECK (false);

COMMIT;