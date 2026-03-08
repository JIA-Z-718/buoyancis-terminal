-- ==========================================
-- MANAGED SOVEREIGNTY: Trust Decay System
-- ==========================================
-- Implements the Matthew Effect with Taoist balance:
-- 1. Trust Half-Life (decay without contribution)
-- 2. Incubator Protection (new signal amplification)
-- 3. Entropy Cleaning (periodic recalibration)

-- Trust profiles for users (extends auth.users)
CREATE TABLE public.trust_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  -- Core metrics
  resonance_frequency DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
  base_frequency DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
  accumulated_observations INTEGER NOT NULL DEFAULT 0,
  -- Half-life tracking
  last_observation_at TIMESTAMP WITH TIME ZONE,
  decay_rate DECIMAL(6,4) NOT NULL DEFAULT 0.0100, -- 1% daily decay
  -- Incubator status
  is_incubated BOOLEAN NOT NULL DEFAULT TRUE,
  incubation_boost DECIMAL(4,2) NOT NULL DEFAULT 2.00, -- 2x boost for new users
  incubation_expires_at TIMESTAMP WITH TIME ZONE,
  -- Tier progression
  current_tier INTEGER NOT NULL DEFAULT 1 CHECK (current_tier BETWEEN 1 AND 5),
  tier_locked_until TIMESTAMP WITH TIME ZONE,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Observation events (each contribution)
CREATE TABLE public.observation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  -- Event type
  event_type TEXT NOT NULL CHECK (event_type IN ('review', 'challenge', 'verification', 'moderation')),
  -- Frequency impact
  frequency_delta DECIMAL(8,4) NOT NULL,
  frequency_before DECIMAL(10,4) NOT NULL,
  frequency_after DECIMAL(10,4) NOT NULL,
  -- Context
  target_entity_id UUID,
  target_entity_type TEXT,
  quality_score DECIMAL(4,2),
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Decay events (automatic frequency reduction)
CREATE TABLE public.decay_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  -- Decay calculation
  frequency_before DECIMAL(10,4) NOT NULL,
  frequency_after DECIMAL(10,4) NOT NULL,
  decay_amount DECIMAL(8,4) NOT NULL,
  days_since_observation INTEGER NOT NULL,
  -- Decay formula used
  decay_formula TEXT NOT NULL DEFAULT 'exponential',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Entropy cleaning cycles (periodic recalibration)
CREATE TABLE public.entropy_cleaning_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_number INTEGER NOT NULL UNIQUE,
  -- Cycle parameters
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  -- Impact metrics
  users_affected INTEGER DEFAULT 0,
  total_frequency_redistributed DECIMAL(14,4) DEFAULT 0,
  top_tier_reduction_percent DECIMAL(5,2) DEFAULT 0,
  bottom_tier_boost_percent DECIMAL(5,2) DEFAULT 0,
  -- Taoist balance: 損有餘而補不足
  excess_harvested DECIMAL(14,4) DEFAULT 0,
  deficiency_supplemented DECIMAL(14,4) DEFAULT 0,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System settings for decay/cleaning parameters
CREATE TABLE public.sovereignty_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Insert default settings
INSERT INTO public.sovereignty_settings (setting_key, setting_value, description) VALUES
  ('decay_half_life_days', '30', 'Number of days for trust to decay by 50% without activity'),
  ('incubation_duration_days', '90', 'Duration of incubator protection for new users'),
  ('incubation_boost_multiplier', '2.0', 'Frequency amplification for incubated users'),
  ('entropy_cleaning_interval_days', '365', 'Days between entropy cleaning cycles'),
  ('excess_threshold_percentile', '95', 'Top percentile considered "excess" for cleaning'),
  ('deficiency_threshold_percentile', '20', 'Bottom percentile considered "deficiency" for boost'),
  ('max_redistribution_percent', '15', 'Maximum % of frequency that can be redistributed per cycle'),
  ('tier_thresholds', '[1, 3, 7, 15, 30]', 'Frequency thresholds for tier progression');

-- Enable RLS
ALTER TABLE public.trust_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entropy_cleaning_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sovereignty_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: trust_profiles
CREATE POLICY "Users can view their own trust profile"
  ON public.trust_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public trust data"
  ON public.trust_profiles FOR SELECT
  USING (true); -- Public leaderboard visibility

CREATE POLICY "Admins can manage all trust profiles"
  ON public.trust_profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: observation_events
CREATE POLICY "Users can view their own observations"
  ON public.observation_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all observations"
  ON public.observation_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: decay_events
CREATE POLICY "Users can view their own decay events"
  ON public.decay_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all decay events"
  ON public.decay_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: entropy_cleaning_cycles (admin only)
CREATE POLICY "Admins can manage entropy cleaning"
  ON public.entropy_cleaning_cycles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view completed cycles"
  ON public.entropy_cleaning_cycles FOR SELECT
  USING (status = 'completed');

-- RLS Policies: sovereignty_settings (admin only)
CREATE POLICY "Admins can manage sovereignty settings"
  ON public.sovereignty_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view settings"
  ON public.sovereignty_settings FOR SELECT
  TO authenticated
  USING (true);

-- Function: Calculate decay for a user
CREATE OR REPLACE FUNCTION public.calculate_trust_decay(p_user_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile trust_profiles%ROWTYPE;
  v_half_life_days INTEGER;
  v_days_since_observation INTEGER;
  v_decay_factor DECIMAL;
  v_new_frequency DECIMAL;
BEGIN
  -- Get user's trust profile
  SELECT * INTO v_profile FROM trust_profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN 1.0;
  END IF;
  
  -- Get half-life setting
  SELECT (setting_value::TEXT)::INTEGER INTO v_half_life_days 
  FROM sovereignty_settings WHERE setting_key = 'decay_half_life_days';
  
  -- Calculate days since last observation
  v_days_since_observation := EXTRACT(DAY FROM (now() - COALESCE(v_profile.last_observation_at, v_profile.created_at)));
  
  -- Exponential decay formula: f(t) = f₀ × (0.5)^(t/half_life)
  v_decay_factor := POWER(0.5, v_days_since_observation::DECIMAL / v_half_life_days);
  v_new_frequency := GREATEST(v_profile.base_frequency, v_profile.resonance_frequency * v_decay_factor);
  
  RETURN v_new_frequency;
END;
$$;

-- Function: Apply observation and update frequency
CREATE OR REPLACE FUNCTION public.record_observation(
  p_user_id UUID,
  p_event_type TEXT,
  p_quality_score DECIMAL DEFAULT 1.0,
  p_target_entity_id UUID DEFAULT NULL,
  p_target_entity_type TEXT DEFAULT NULL
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile trust_profiles%ROWTYPE;
  v_frequency_delta DECIMAL;
  v_new_frequency DECIMAL;
  v_incubation_boost DECIMAL;
BEGIN
  -- Get or create trust profile
  SELECT * INTO v_profile FROM trust_profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO trust_profiles (user_id, incubation_expires_at)
    VALUES (p_user_id, now() + INTERVAL '90 days')
    RETURNING * INTO v_profile;
  END IF;
  
  -- Calculate frequency delta based on event type and quality
  v_frequency_delta := CASE p_event_type
    WHEN 'review' THEN 0.05 * p_quality_score
    WHEN 'challenge' THEN 0.10 * p_quality_score
    WHEN 'verification' THEN 0.15 * p_quality_score
    WHEN 'moderation' THEN 0.20 * p_quality_score
    ELSE 0.01
  END;
  
  -- Apply incubation boost if applicable
  IF v_profile.is_incubated AND v_profile.incubation_expires_at > now() THEN
    v_incubation_boost := v_profile.incubation_boost;
    v_frequency_delta := v_frequency_delta * v_incubation_boost;
  END IF;
  
  -- Calculate new frequency (Matthew Effect: compound growth)
  v_new_frequency := v_profile.resonance_frequency + (v_frequency_delta * (1 + v_profile.resonance_frequency / 10));
  
  -- Update profile
  UPDATE trust_profiles SET
    resonance_frequency = v_new_frequency,
    accumulated_observations = accumulated_observations + 1,
    last_observation_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record observation event
  INSERT INTO observation_events (user_id, event_type, frequency_delta, frequency_before, frequency_after, target_entity_id, target_entity_type, quality_score)
  VALUES (p_user_id, p_event_type, v_frequency_delta, v_profile.resonance_frequency, v_new_frequency, p_target_entity_id, p_target_entity_type, p_quality_score);
  
  RETURN v_new_frequency;
END;
$$;

-- Indexes for performance
CREATE INDEX idx_trust_profiles_user_id ON public.trust_profiles(user_id);
CREATE INDEX idx_trust_profiles_frequency ON public.trust_profiles(resonance_frequency DESC);
CREATE INDEX idx_trust_profiles_tier ON public.trust_profiles(current_tier);
CREATE INDEX idx_observation_events_user_id ON public.observation_events(user_id);
CREATE INDEX idx_observation_events_created_at ON public.observation_events(created_at);
CREATE INDEX idx_decay_events_user_id ON public.decay_events(user_id);
CREATE INDEX idx_decay_events_created_at ON public.decay_events(created_at);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_trust_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trust_profiles_updated_at
  BEFORE UPDATE ON public.trust_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trust_profile_updated_at();