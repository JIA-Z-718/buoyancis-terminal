-- Add tags column to blog_posts as a text array
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';