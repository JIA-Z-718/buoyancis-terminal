-- Drop the overly permissive INSERT policy on notification_history
DROP POLICY IF EXISTS "Service role can insert notification history" ON public.notification_history;

-- Create a new INSERT policy that denies all client-side access
-- Service role bypasses RLS anyway, so we set this to false for security
CREATE POLICY "No client-side insert to notification history"
  ON public.notification_history FOR INSERT
  WITH CHECK (false);