
-- ============================================================
-- Restaurants table
-- ============================================================
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_cn TEXT, -- Chinese name
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'restaurant',
  cuisine TEXT,
  address TEXT,
  city TEXT NOT NULL DEFAULT 'Stockholm',
  region TEXT NOT NULL DEFAULT 'Stockholm',
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  phone TEXT,
  website TEXT,
  image_url TEXT,
  buoyancis_score DECIMAL(3, 2) DEFAULT 0.00,
  traditional_score DECIMAL(3, 2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  verified_review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants FORCE ROW LEVEL SECURITY;

-- Anyone can read restaurants
CREATE POLICY "Restaurants are publicly readable"
ON public.restaurants FOR SELECT TO public USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage restaurants"
ON public.restaurants FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_restaurants_city ON public.restaurants(city);
CREATE INDEX idx_restaurants_cuisine ON public.restaurants(cuisine);
CREATE INDEX idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX idx_restaurants_featured ON public.restaurants(is_featured) WHERE is_featured = true;

CREATE TRIGGER update_restaurants_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Reviews table
-- ============================================================
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT,
  rating DECIMAL(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  content TEXT NOT NULL,
  content_cn TEXT,
  trust_tier INTEGER NOT NULL DEFAULT 1,
  trust_weight DECIMAL(4, 2) DEFAULT 1.00,
  is_local_expert BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews FORCE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Reviews are publicly readable"
ON public.reviews FOR SELECT TO public USING (true);

-- Authenticated users can create their own reviews
CREATE POLICY "Users can create their own reviews"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own reviews, admins can delete any
CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_reviews_restaurant ON public.reviews(restaurant_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_trust_tier ON public.reviews(trust_tier);

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Seed mock restaurant data for Stockholm
-- ============================================================
INSERT INTO public.restaurants (name, name_cn, slug, cuisine, address, city, region, buoyancis_score, traditional_score, review_count, verified_review_count, is_featured) VALUES
('Fotografiska Restaurant', '攝影博物館餐廳', 'fotografiska', 'Nordic', 'Stadsgårdshamnen 22', 'Stockholm', 'Södermalm', 4.30, 4.50, 142, 38, true),
('Meatballs for the People', '人民肉丸', 'meatballs-for-the-people', 'Swedish', 'Nytorgsgatan 30', 'Stockholm', 'Södermalm', 4.10, 4.20, 231, 67, true),
('Omnipollos Hatt', 'Omnipollos Hatt', 'omnipollos-hatt', 'Pizza & Craft Beer', 'Folkungagatan 86', 'Stockholm', 'Södermalm', 4.25, 4.40, 189, 52, true),
('Ekstedt', '柴火餐廳', 'ekstedt', 'Nordic Fine Dining', 'Humlegårdsgatan 17', 'Stockholm', 'Östermalm', 4.60, 4.70, 96, 41, true),
('Pelikan', '鵜鶘酒館', 'pelikan', 'Traditional Swedish', 'Blekingegatan 40', 'Stockholm', 'Södermalm', 4.05, 4.30, 312, 89, true),
('Bröd & Salt', '麵包與鹽', 'brod-salt', 'Bakery & Café', 'Folkungagatan 67', 'Stockholm', 'Södermalm', 4.40, 4.30, 178, 61, false),
('Hermans', '赫爾曼素食', 'hermans', 'Vegetarian Buffet', 'Fjällgatan 23B', 'Stockholm', 'Södermalm', 3.90, 4.10, 267, 44, false),
('Stim', 'Stim 餐廳', 'stim', 'Modern European', 'Kocksgatan 38', 'Stockholm', 'Södermalm', 4.15, 4.00, 84, 29, false);

-- Seed mock reviews
INSERT INTO public.reviews (restaurant_id, user_id, display_name, rating, content, content_cn, trust_tier, trust_weight, is_local_expert, is_verified, helpful_count) VALUES
-- Fotografiska
((SELECT id FROM public.restaurants WHERE slug = 'fotografiska'), '00000000-0000-0000-0000-000000000001', 'Anna L.', 4.5, 'Stunning views and creative seasonal menu. The wild mushroom dish was extraordinary.', '絕美景觀搭配創意時令菜單。野生蘑菇料理令人驚嘆。', 4, 5.20, true, true, 23),
((SELECT id FROM public.restaurants WHERE slug = 'fotografiska'), '00000000-0000-0000-0000-000000000002', 'Marcus B.', 4.0, 'Great atmosphere, slightly overpriced but worth it for a special occasion.', '氛圍很好，價格稍高，但特殊場合值得一去。', 2, 1.50, false, true, 8),

-- Meatballs
((SELECT id FROM public.restaurants WHERE slug = 'meatballs-for-the-people'), '00000000-0000-0000-0000-000000000003', 'Erik S.', 4.5, 'Best meatballs in Stockholm, hands down. The moose meatballs are a must-try.', '斯德哥爾摩最好的肉丸，毫無疑問。駝鹿肉丸必試。', 5, 8.10, true, true, 41),
((SELECT id FROM public.restaurants WHERE slug = 'meatballs-for-the-people'), '00000000-0000-0000-0000-000000000004', 'Tourist_123', 2.5, 'Okay food but very crowded and touristy. Nothing special.', '食物尚可，但非常擁擠且商業化。沒什麼特別。', 1, 0.30, false, false, 2),

-- Ekstedt
((SELECT id FROM public.restaurants WHERE slug = 'ekstedt'), '00000000-0000-0000-0000-000000000005', 'Sofia K.', 5.0, 'A Michelin experience at its finest. Everything cooked over open fire is perfection.', '頂級米其林體驗。所有明火烹飪的菜品都堪稱完美。', 5, 9.00, true, true, 56),

-- Pelikan
((SELECT id FROM public.restaurants WHERE slug = 'pelikan'), '00000000-0000-0000-0000-000000000001', 'Anna L.', 4.0, 'Classic Swedish husmanskost in a beautiful old beer hall. The herring platter is authentic.', '在美麗的老啤酒廳享用經典瑞典家常菜。鯡魚拼盤非常正宗。', 4, 5.20, true, true, 19);
