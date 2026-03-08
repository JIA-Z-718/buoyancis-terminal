-- Create table to track deliverability alerts
CREATE TABLE public.deliverability_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type text NOT NULL,
  metric_value numeric NOT NULL,
  threshold_value numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  notified_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.deliverability_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can read deliverability alerts"
ON public.deliverability_alerts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update deliverability alerts"
ON public.deliverability_alerts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete deliverability alerts"
ON public.deliverability_alerts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_deliverability_alerts_type_resolved ON public.deliverability_alerts(alert_type, resolved_at);