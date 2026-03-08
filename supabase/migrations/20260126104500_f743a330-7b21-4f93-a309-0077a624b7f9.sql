-- Add scheduled publishing column to blog_posts
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMP WITH TIME ZONE;