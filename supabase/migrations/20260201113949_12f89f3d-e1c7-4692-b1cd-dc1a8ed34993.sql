
-- Fix overly permissive RLS policies for audit_anomaly_alerts
-- This table should only allow admins to insert alerts (or service role via edge functions)
DROP POLICY IF EXISTS "Service role can insert audit anomaly alerts" ON public.audit_anomaly_alerts;

CREATE POLICY "Admins can insert audit anomaly alerts"
ON public.audit_anomaly_alerts
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix overly permissive RLS policies for audit_anomaly_settings
-- This table should only allow admins to insert settings
DROP POLICY IF EXISTS "Service role can insert audit anomaly settings" ON public.audit_anomaly_settings;

CREATE POLICY "Admins can insert audit anomaly settings"
ON public.audit_anomaly_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
