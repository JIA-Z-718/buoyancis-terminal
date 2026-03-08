-- Create admin access audit log table for sensitive operations
CREATE TABLE public.admin_access_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_access_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read admin access audit logs"
ON public.admin_access_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- No client-side inserts - only via triggers or service role
CREATE POLICY "No client-side insert to admin access audit"
ON public.admin_access_audit_log
FOR INSERT
WITH CHECK (false);

-- Create indexes for faster queries
CREATE INDEX idx_admin_access_audit_user ON public.admin_access_audit_log(user_id);
CREATE INDEX idx_admin_access_audit_table ON public.admin_access_audit_log(table_name);
CREATE INDEX idx_admin_access_audit_created ON public.admin_access_audit_log(created_at DESC);
CREATE INDEX idx_admin_access_audit_operation ON public.admin_access_audit_log(operation);

-- Create trigger function for email_campaigns audit
CREATE OR REPLACE FUNCTION public.audit_email_campaigns_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_access_audit_log (user_id, table_name, operation, record_id, new_values)
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 'email_campaigns', 'INSERT', NEW.id::text, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.admin_access_audit_log (user_id, table_name, operation, record_id, old_values, new_values)
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 'email_campaigns', 'UPDATE', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_access_audit_log (user_id, table_name, operation, record_id, old_values)
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 'email_campaigns', 'DELETE', OLD.id::text, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger function for profiles audit
CREATE OR REPLACE FUNCTION public.audit_profiles_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_access_audit_log (user_id, table_name, operation, record_id, new_values)
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 'profiles', 'INSERT', NEW.id::text, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.admin_access_audit_log (user_id, table_name, operation, record_id, old_values, new_values)
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 'profiles', 'UPDATE', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_access_audit_log (user_id, table_name, operation, record_id, old_values)
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 'profiles', 'DELETE', OLD.id::text, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers on email_campaigns
CREATE TRIGGER email_campaigns_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.email_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.audit_email_campaigns_changes();

-- Create triggers on profiles
CREATE TRIGGER profiles_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.audit_profiles_changes();