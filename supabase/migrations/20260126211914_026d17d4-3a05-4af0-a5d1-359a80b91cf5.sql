-- Enable realtime for early_access_signups table
ALTER PUBLICATION supabase_realtime ADD TABLE public.early_access_signups;

-- Enable realtime for user_feedback table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_feedback;