-- Create role_audit_log table for tracking role changes
CREATE TABLE public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('assigned', 'revoked')),
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read role audit logs"
ON public.role_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert role audit logs"
ON public.role_audit_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_role_audit_log_target_user ON public.role_audit_log(target_user_id);
CREATE INDEX idx_role_audit_log_created_at ON public.role_audit_log(created_at DESC);