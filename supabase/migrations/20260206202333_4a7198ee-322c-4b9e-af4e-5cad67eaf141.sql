-- Add admin-only SELECT policy to early_access_signups for defense in depth
CREATE POLICY "Admins can read early access signups"
ON public.early_access_signups
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
