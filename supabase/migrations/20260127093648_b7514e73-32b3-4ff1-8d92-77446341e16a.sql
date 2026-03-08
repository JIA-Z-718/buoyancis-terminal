-- Create table for security summary schedules
CREATE TABLE public.security_summary_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  day_of_week INTEGER DEFAULT 1,
  time_of_day TEXT NOT NULL DEFAULT '09:00:00',
  recipient_emails TEXT[] NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_summary_schedules ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view all security summary schedules"
  ON public.security_summary_schedules
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert security summary schedules"
  ON public.security_summary_schedules
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update security summary schedules"
  ON public.security_summary_schedules
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete security summary schedules"
  ON public.security_summary_schedules
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_security_summary_schedules_updated_at
  BEFORE UPDATE ON public.security_summary_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();