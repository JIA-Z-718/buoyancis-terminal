
-- Create a public view excluding user_id from reviews
CREATE VIEW public.reviews_public
WITH (security_invoker = on) AS
SELECT
  id,
  restaurant_id,
  display_name,
  rating,
  content,
  content_cn,
  trust_tier,
  trust_weight,
  is_local_expert,
  is_verified,
  helpful_count,
  created_at,
  updated_at
FROM public.reviews;

-- Drop the old permissive public SELECT policy
DROP POLICY "Reviews are publicly readable" ON public.reviews;

-- Create a restrictive SELECT policy: users can only read their own reviews directly
CREATE POLICY "Users can read their own reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to read all reviews directly
CREATE POLICY "Admins can read all reviews"
ON public.reviews
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
