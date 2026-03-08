-- Create a table for user feedback
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_type TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (public feedback form)
CREATE POLICY "Anyone can submit feedback" 
ON public.user_feedback 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view feedback
CREATE POLICY "Admins can view all feedback" 
ON public.user_feedback 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete feedback
CREATE POLICY "Admins can delete feedback" 
ON public.user_feedback 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'::app_role));