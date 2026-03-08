-- Add resolution notes column to deliverability_alerts
ALTER TABLE public.deliverability_alerts 
ADD COLUMN resolution_notes text,
ADD COLUMN resolved_by uuid REFERENCES auth.users(id);