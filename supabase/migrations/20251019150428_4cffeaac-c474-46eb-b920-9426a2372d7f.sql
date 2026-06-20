-- Create villages table
CREATE TABLE public.villages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT,
  state TEXT DEFAULT 'Assam',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  population INTEGER,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create water quality readings table
CREATE TABLE public.water_quality_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID REFERENCES public.villages(id) ON DELETE CASCADE,
  ph DECIMAL(4, 2),
  turbidity DECIMAL(6, 2),
  tds DECIMAL(8, 2),
  temperature DECIMAL(5, 2),
  bacterial_count INTEGER,
  reading_timestamp TIMESTAMPTZ DEFAULT now(),
  sensor_id TEXT,
  status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create health reports table
CREATE TABLE public.health_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID REFERENCES public.villages(id) ON DELETE CASCADE,
  reporter_name TEXT NOT NULL,
  reporter_role TEXT DEFAULT 'ASHA Worker',
  symptoms JSONB NOT NULL,
  cases_count INTEGER DEFAULT 1,
  notes TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'confirmed', 'resolved')),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID REFERENCES public.villages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved')),
  actions_taken TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'health_worker' CHECK (role IN ('health_worker', 'admin', 'district_officer', 'asha_worker')),
  phone TEXT,
  village_id UUID REFERENCES public.villages(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_quality_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for villages (public read)
CREATE POLICY "Villages are viewable by everyone"
  ON public.villages FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update villages"
  ON public.villages FOR UPDATE
  USING (auth.role() = 'authenticated');

-- RLS Policies for water_quality_readings (public read, authenticated write)
CREATE POLICY "Water readings are viewable by everyone"
  ON public.water_quality_readings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert water readings"
  ON public.water_quality_readings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for health_reports (public read, authenticated write)
CREATE POLICY "Health reports are viewable by everyone"
  ON public.health_reports FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert health reports"
  ON public.health_reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own health reports"
  ON public.health_reports FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for alerts (public read, authenticated write)
CREATE POLICY "Alerts are viewable by everyone"
  ON public.alerts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update alerts"
  ON public.alerts FOR UPDATE
  USING (auth.role() = 'authenticated');

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update village risk based on alerts and water quality
CREATE OR REPLACE FUNCTION public.calculate_village_risk()
RETURNS TRIGGER AS $$
DECLARE
  v_risk_score INTEGER;
  v_risk_level TEXT;
  v_village_id UUID;
BEGIN
  -- Get village_id from the trigger
  IF TG_TABLE_NAME = 'alerts' THEN
    v_village_id := NEW.village_id;
  ELSIF TG_TABLE_NAME = 'water_quality_readings' THEN
    v_village_id := NEW.village_id;
  END IF;

  -- Calculate risk score (simplified algorithm)
  SELECT 
    LEAST(100, 
      (COUNT(CASE WHEN severity IN ('high', 'critical') AND status = 'active' THEN 1 END) * 30) +
      (COUNT(CASE WHEN severity = 'medium' AND status = 'active' THEN 1 END) * 15)
    )
  INTO v_risk_score
  FROM public.alerts
  WHERE village_id = v_village_id;

  -- Determine risk level
  IF v_risk_score >= 70 THEN
    v_risk_level := 'high';
  ELSIF v_risk_score >= 40 THEN
    v_risk_level := 'medium';
  ELSE
    v_risk_level := 'low';
  END IF;

  -- Update village
  UPDATE public.villages
  SET 
    risk_score = v_risk_score,
    risk_level = v_risk_level,
    last_updated = now()
  WHERE id = v_village_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to recalculate village risk on new alerts
CREATE TRIGGER recalculate_risk_on_alert
  AFTER INSERT OR UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_village_risk();

-- Insert sample villages
INSERT INTO public.villages (name, district, latitude, longitude, population, risk_level, risk_score) VALUES
  ('Dibrugarh', 'Dibrugarh', 27.4728, 94.9120, 15000, 'high', 85),
  ('Majuli', 'Majuli', 26.9540, 94.2150, 12000, 'medium', 55),
  ('Tezpur', 'Sonitpur', 26.6338, 92.8000, 18000, 'low', 25),
  ('Jorhat', 'Jorhat', 26.7509, 94.2037, 20000, 'medium', 45),
  ('Silchar', 'Cachar', 24.8333, 92.7789, 22000, 'low', 30);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.villages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.water_quality_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;