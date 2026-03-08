-- Add explicit INSERT blocking policies to deliverability_alerts for defense-in-depth
-- These prevent any client-side insert attempts (service role bypasses RLS as intended)

CREATE POLICY "No client-side insert to deliverability alerts"
ON deliverability_alerts FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "Anon cannot insert alerts"  
ON deliverability_alerts FOR INSERT TO anon
WITH CHECK (false);