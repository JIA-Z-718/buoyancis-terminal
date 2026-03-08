-- Add RLS policy for admins to view all recovery code attempts for monitoring
CREATE POLICY "Admins can view all recovery code attempts"
ON public.recovery_code_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for recovery_code_attempts
ALTER PUBLICATION supabase_realtime ADD TABLE public.recovery_code_attempts;