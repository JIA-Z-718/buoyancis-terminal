-- Create retention policy audit log table
CREATE TABLE public.retention_policy_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.retention_policy_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read audit logs
CREATE POLICY "Admins can read retention audit logs"
ON public.retention_policy_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- No client-side inserts (only via trigger)
CREATE POLICY "No client-side insert to retention audit"
ON public.retention_policy_audit_log
FOR INSERT
WITH CHECK (false);

-- Create trigger function to log changes
CREATE OR REPLACE FUNCTION public.log_retention_policy_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log retention_days change
  IF OLD.retention_days IS DISTINCT FROM NEW.retention_days THEN
    INSERT INTO public.retention_policy_audit_log (table_name, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.table_name, 'retention_days', OLD.retention_days::text, NEW.retention_days::text, NEW.updated_by);
  END IF;
  
  -- Log is_enabled change
  IF OLD.is_enabled IS DISTINCT FROM NEW.is_enabled THEN
    INSERT INTO public.retention_policy_audit_log (table_name, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.table_name, 'is_enabled', OLD.is_enabled::text, NEW.is_enabled::text, NEW.updated_by);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on data_retention_settings
CREATE TRIGGER retention_policy_audit_trigger
AFTER UPDATE ON public.data_retention_settings
FOR EACH ROW
EXECUTE FUNCTION public.log_retention_policy_changes();