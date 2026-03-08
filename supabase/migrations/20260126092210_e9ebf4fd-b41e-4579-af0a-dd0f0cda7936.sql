-- Create table for validation summary schedule settings
CREATE TABLE public.validation_summary_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_of_day TIME NOT NULL DEFAULT '09:00:00',
  recipient_emails TEXT[] NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_schedule UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.validation_summary_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own schedules" 
ON public.validation_summary_schedules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedules" 
ON public.validation_summary_schedules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" 
ON public.validation_summary_schedules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules" 
ON public.validation_summary_schedules 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_validation_summary_schedules_updated_at
BEFORE UPDATE ON public.validation_summary_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();