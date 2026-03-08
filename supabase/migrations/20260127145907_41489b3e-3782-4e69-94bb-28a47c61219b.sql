-- Allow service role to insert audit anomaly alerts (edge function creates these)
CREATE POLICY "Service role can insert audit anomaly alerts"
  ON public.audit_anomaly_alerts
  FOR INSERT
  WITH CHECK (true);

-- Allow service role to insert audit anomaly settings (edge function creates these)  
CREATE POLICY "Service role can insert audit anomaly settings"
  ON public.audit_anomaly_settings
  FOR INSERT
  WITH CHECK (true);