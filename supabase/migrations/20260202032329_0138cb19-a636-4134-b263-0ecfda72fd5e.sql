-- Create enum for claim status
CREATE TYPE node_claim_status AS ENUM ('VIEWED', 'CLAIMED', 'REJECTED');

-- Create the node_claims table
CREATE TABLE public.node_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id TEXT NOT NULL,
  claimant_name TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  status node_claim_status NOT NULL DEFAULT 'VIEWED',
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.node_claims ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read all claims
CREATE POLICY "Admins can read all node claims"
  ON public.node_claims
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: No direct client inserts (must go through edge function)
CREATE POLICY "No direct client inserts to node_claims"
  ON public.node_claims
  FOR INSERT
  WITH CHECK (false);

-- Policy: No direct client updates
CREATE POLICY "No direct client updates to node_claims"
  ON public.node_claims
  FOR UPDATE
  USING (false);

-- Policy: No deletes
CREATE POLICY "No deletes on node_claims"
  ON public.node_claims
  FOR DELETE
  USING (false);

-- Create index for faster lookups
CREATE INDEX idx_node_claims_node_id ON public.node_claims(node_id);
CREATE INDEX idx_node_claims_status ON public.node_claims(status);
CREATE INDEX idx_node_claims_claimed_at ON public.node_claims(claimed_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_node_claims_updated_at
  BEFORE UPDATE ON public.node_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();