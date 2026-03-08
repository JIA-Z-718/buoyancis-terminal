-- Add audit trigger for email_campaigns table to log all access and modifications
-- This addresses the security finding about logging and monitoring access to sensitive business data

-- Create the audit trigger function for email_campaigns if it doesn't exist
CREATE OR REPLACE FUNCTION public.audit_email_campaigns_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_access_audit_log (
    user_id,
    table_name,
    operation,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    'email_campaigns',
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id::text
      ELSE NEW.id::text
    END,
    CASE 
      WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD)
      ELSE NULL
    END,
    CASE 
      WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW)
      ELSE NULL
    END,
    NULL, -- IP address would need to be passed from edge function context
    NULL  -- User agent would need to be passed from edge function context
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS email_campaigns_audit_trigger ON public.email_campaigns;

-- Create the audit trigger
CREATE TRIGGER email_campaigns_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.email_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.audit_email_campaigns_changes();