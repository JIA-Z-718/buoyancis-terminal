-- Create table to store rate limit violations
CREATE TABLE public.rate_limit_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  request_count INTEGER NOT NULL,
  max_requests INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- Only admins can view violations
CREATE POLICY "Admins can view rate limit violations"
ON public.rate_limit_violations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_rate_limit_violations_created_at ON public.rate_limit_violations(created_at DESC);
CREATE INDEX idx_rate_limit_violations_function ON public.rate_limit_violations(function_name);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.rate_limit_violations;