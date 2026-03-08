-- Create IP blocklist table for permanently blocking IPs from signup
CREATE TABLE public.ip_blocklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ip_blocklist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin-only access
CREATE POLICY "Admins can read ip blocklist"
  ON public.ip_blocklist
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ip blocklist"
  ON public.ip_blocklist
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ip blocklist"
  ON public.ip_blocklist
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for fast IP lookups
CREATE INDEX idx_ip_blocklist_ip_address ON public.ip_blocklist(ip_address);