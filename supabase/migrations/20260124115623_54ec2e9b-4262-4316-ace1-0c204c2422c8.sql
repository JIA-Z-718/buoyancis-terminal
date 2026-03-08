-- Create notification history table
CREATE TABLE public.notification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL,
  recipients TEXT[] NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  triggered_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX idx_notification_history_created_at ON public.notification_history(created_at DESC);
CREATE INDEX idx_notification_history_type ON public.notification_history(notification_type);

-- Enable RLS
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admins can read notification history"
ON public.notification_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete notification history"
ON public.notification_history
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role to insert (for edge functions)
CREATE POLICY "Service role can insert notification history"
ON public.notification_history
FOR INSERT
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.notification_history IS 'Tracks all sent admin notifications for audit purposes';