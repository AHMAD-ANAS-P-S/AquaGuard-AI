-- ==========================================
-- AQUAGUARD AI DATABASE BOOTSTRAP SCRIPT
-- Idempotent & Dependency-Ordered
-- Suitable for a completely clean Supabase project
-- ==========================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Helper Functions and Triggers Definition (Created first)

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE id = _user_id
      AND role = _role
  )
$$;

-- Function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE id = _user_id
$$;

-- 2. Core Tables Definition (Ordered by dependencies)

-- districts
CREATE TABLE IF NOT EXISTS public.districts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL DEFAULT 'Assam',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- villages
CREATE TABLE IF NOT EXISTS public.villages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT, -- Legacy/backward compatibility
  district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  state TEXT DEFAULT 'Assam',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  population INTEGER,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'health_worker',
  phone TEXT,
  village_id UUID REFERENCES public.villages(id),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- iot_devices
CREATE TABLE IF NOT EXISTS public.iot_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id TEXT UNIQUE NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'water_quality_sensor',
  village_id UUID REFERENCES public.villages(id),
  location_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  last_communication TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'offline')),
  communication_mode TEXT DEFAULT 'wifi' CHECK (communication_mode IN ('wifi', 'gsm', 'offline')),
  firmware_version TEXT,
  installation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- water_quality_readings
CREATE TABLE IF NOT EXISTS public.water_quality_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID REFERENCES public.villages(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.iot_devices(id) ON DELETE SET NULL,
  ph DECIMAL(4, 2),
  turbidity DECIMAL(6, 2),
  tds DECIMAL(8, 2),
  temperature DECIMAL(5, 2),
  bacterial_count INTEGER,
  reading_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sensor_id TEXT,
  status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- alerts
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID REFERENCES public.villages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved')),
  actions_taken TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- alert_escalation_logs
CREATE TABLE IF NOT EXISTS public.alert_escalation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  escalation_level INTEGER NOT NULL CHECK (escalation_level >= 1 AND escalation_level <= 3),
  recipient_role TEXT NOT NULL,
  recipient_name TEXT,
  recipient_phone TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  response_time_seconds INTEGER,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- alert_acknowledgments
CREATE TABLE IF NOT EXISTS public.alert_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  acknowledgment_method TEXT CHECK (acknowledgment_method IN ('sms', 'app', 'web')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- health_reports
CREATE TABLE IF NOT EXISTS public.health_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID REFERENCES public.villages(id) ON DELETE CASCADE,
  reporter_name TEXT NOT NULL,
  reporter_role TEXT DEFAULT 'ASHA Worker',
  symptoms JSONB NOT NULL,
  cases_count INTEGER DEFAULT 1,
  notes TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'confirmed', 'resolved')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL DEFAULT 'health_report',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ai_predictions
CREATE TABLE IF NOT EXISTS public.ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID REFERENCES public.villages(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('outbreak', 'water_quality', 'risk_escalation')),
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  predicted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  prediction_data JSONB,
  actual_outcome TEXT,
  accuracy_score NUMERIC,
  model_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- action_logs
CREATE TABLE IF NOT EXISTS public.action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  severity_threshold TEXT DEFAULT 'medium' CHECK (severity_threshold IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- user_gamification
CREATE TABLE IF NOT EXISTS public.user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    total_points INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    reports_submitted INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_activity_date DATE,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- badges
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    points_required INTEGER DEFAULT 0,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- user_badges
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- quiz_completions
CREATE TABLE IF NOT EXISTS public.quiz_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quiz_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    points_earned INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- offline_sync_queue
CREATE TABLE IF NOT EXISTS public.offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data_type TEXT NOT NULL,
    data JSONB NOT NULL,
    synced BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- sms_reports
CREATE TABLE IF NOT EXISTS public.sms_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    parsed_data JSONB,
    village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- disease_cases
CREATE TABLE IF NOT EXISTS public.disease_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_name TEXT,
    symptoms JSONB DEFAULT '[]'::jsonb NOT NULL,
    disease TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active', -- Active, Recovered, Critical, Deceased
    village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
    clinic_name TEXT,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- water_quality_reports
CREATE TABLE IF NOT EXISTS public.water_quality_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_name TEXT NOT NULL,
    village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
    test_method TEXT NOT NULL, -- Kit, Image AI, Sensor
    ph NUMERIC,
    turbidity NUMERIC,
    temperature NUMERIC,
    contamination_score NUMERIC,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- outbreak_predictions
CREATE TABLE IF NOT EXISTS public.outbreak_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    village_id UUID REFERENCES public.villages(id) ON DELETE CASCADE,
    predicted_disease TEXT NOT NULL,
    current_cases INTEGER NOT NULL DEFAULT 0,
    water_quality TEXT NOT NULL DEFAULT 'Good',
    rainfall TEXT NOT NULL DEFAULT 'Medium',
    seasonal_data TEXT,
    risk_score NUMERIC NOT NULL,
    confidence_score NUMERIC NOT NULL,
    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- interventions
CREATE TABLE IF NOT EXISTS public.interventions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Alert Generated',
    team_assigned TEXT,
    investigation_started BOOLEAN DEFAULT false NOT NULL,
    water_tested BOOLEAN DEFAULT false NOT NULL,
    medicine_distributed BOOLEAN DEFAULT false NOT NULL,
    campaign_conducted BOOLEAN DEFAULT false NOT NULL,
    resolved BOOLEAN DEFAULT false NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- resources
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
    allocated_count INTEGER NOT NULL DEFAULT 0,
    required_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Adequate',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- awareness_content
CREATE TABLE IF NOT EXISTS public.awareness_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    publisher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- campaign_logs
CREATE TABLE IF NOT EXISTS public.campaign_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
    health_official_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    volunteers_count INTEGER NOT NULL DEFAULT 0,
    audience_reach INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- notification_logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient TEXT NOT NULL,
    type TEXT NOT NULL,
    channel TEXT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- water_sensor_data
CREATE TABLE IF NOT EXISTS public.water_sensor_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES public.iot_devices(id) ON DELETE CASCADE,
    village_id UUID REFERENCES public.villages(id) ON DELETE CASCADE,
    ph NUMERIC,
    tds NUMERIC,
    turbidity NUMERIC,
    temperature NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- quiz_questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_option INTEGER NOT NULL,
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- certificates
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- image_analysis
CREATE TABLE IF NOT EXISTS public.image_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    image_type TEXT NOT NULL,
    notes TEXT,
    risk_level TEXT NOT NULL,
    confidence NUMERIC,
    summary TEXT,
    contaminants JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Trigger Functions and Triggers Configuration

-- Recalculate village risk trigger function
CREATE OR REPLACE FUNCTION public.calculate_village_risk()
RETURNS TRIGGER AS $$
DECLARE
  v_risk_score INTEGER;
  v_risk_level TEXT;
  v_village_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'alerts' THEN
    v_village_id := NEW.village_id;
  ELSIF TG_TABLE_NAME = 'water_quality_readings' THEN
    v_village_id := NEW.village_id;
  END IF;

  SELECT 
    LEAST(100, 
      (COUNT(CASE WHEN severity IN ('high', 'critical') AND status = 'active' THEN 1 END) * 30) +
      (COUNT(CASE WHEN severity = 'medium' AND status = 'active' THEN 1 END) * 15)
    )
  INTO v_risk_score
  FROM public.alerts
  WHERE village_id = v_village_id;

  IF v_risk_score >= 70 THEN
    v_risk_level := 'high';
  ELSIF v_risk_score >= 40 THEN
    v_risk_level := 'medium';
  ELSE
    v_risk_level := 'low';
  END IF;

  UPDATE public.villages
  SET 
    risk_score = v_risk_score,
    risk_level = v_risk_level,
    last_updated = now()
  WHERE id = v_village_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Auto-create profile trigger function on signup
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

-- Triggers Binding
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_iot_devices_updated_at ON public.iot_devices;
CREATE TRIGGER update_iot_devices_updated_at
  BEFORE UPDATE ON public.iot_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_user_gamification_updated_at ON public.user_gamification;
CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS recalculate_risk_on_alert ON public.alerts;
CREATE TRIGGER recalculate_risk_on_alert
  AFTER INSERT OR UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_village_risk();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Enable Row Level Security (RLS) on all tables

ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_quality_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_escalation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_quality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbreak_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awareness_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_analysis ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies Configuration (Idempotent using DROP first)

-- districts policies
DROP POLICY IF EXISTS "Districts are viewable by everyone" ON public.districts;
CREATE POLICY "Districts are viewable by everyone" ON public.districts FOR SELECT USING (true);

-- villages policies
DROP POLICY IF EXISTS "Villages are viewable by everyone" ON public.villages;
CREATE POLICY "Villages are viewable by everyone" ON public.villages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can update villages" ON public.villages;
CREATE POLICY "Authenticated users can update villages" ON public.villages FOR UPDATE USING (auth.role() = 'authenticated');

-- profiles policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- iot_devices policies
DROP POLICY IF EXISTS "IoT devices are viewable by everyone" ON public.iot_devices;
CREATE POLICY "IoT devices are viewable by everyone" ON public.iot_devices FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert IoT devices" ON public.iot_devices;
CREATE POLICY "Authenticated users can insert IoT devices" ON public.iot_devices FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can update IoT devices" ON public.iot_devices;
CREATE POLICY "Authenticated users can update IoT devices" ON public.iot_devices FOR UPDATE USING (auth.role() = 'authenticated');

-- water_quality_readings policies
DROP POLICY IF EXISTS "Water readings are viewable by everyone" ON public.water_quality_readings;
CREATE POLICY "Water readings are viewable by everyone" ON public.water_quality_readings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert water readings" ON public.water_quality_readings;
CREATE POLICY "Authenticated users can insert water readings" ON public.water_quality_readings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- alerts policies
DROP POLICY IF EXISTS "Alerts are viewable by everyone" ON public.alerts;
CREATE POLICY "Alerts are viewable by everyone" ON public.alerts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.alerts;
CREATE POLICY "Authenticated users can insert alerts" ON public.alerts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can update alerts" ON public.alerts;
CREATE POLICY "Authenticated users can update alerts" ON public.alerts FOR UPDATE USING (auth.role() = 'authenticated');

-- alert_escalation_logs policies
DROP POLICY IF EXISTS "Escalation logs are viewable by everyone" ON public.alert_escalation_logs;
CREATE POLICY "Escalation logs are viewable by everyone" ON public.alert_escalation_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert escalation logs" ON public.alert_escalation_logs;
CREATE POLICY "Authenticated users can insert escalation logs" ON public.alert_escalation_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can update escalation logs" ON public.alert_escalation_logs;
CREATE POLICY "Authenticated users can update escalation logs" ON public.alert_escalation_logs FOR UPDATE USING (auth.role() = 'authenticated');

-- alert_acknowledgments policies
DROP POLICY IF EXISTS "Acknowledgments are viewable by everyone" ON public.alert_acknowledgments;
CREATE POLICY "Acknowledgments are viewable by everyone" ON public.alert_acknowledgments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can acknowledge alerts" ON public.alert_acknowledgments;
CREATE POLICY "Users can acknowledge alerts" ON public.alert_acknowledgments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- health_reports policies
DROP POLICY IF EXISTS "Health reports are viewable by everyone" ON public.health_reports;
CREATE POLICY "Health reports are viewable by everyone" ON public.health_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can view health reports" ON public.health_reports;
CREATE POLICY "Authenticated users can view health reports" ON public.health_reports FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can insert health reports" ON public.health_reports;
CREATE POLICY "Authenticated users can insert health reports" ON public.health_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update their own health reports" ON public.health_reports;
CREATE POLICY "Users can update their own health reports" ON public.health_reports FOR UPDATE USING (auth.uid() = user_id);

-- ai_predictions policies
DROP POLICY IF EXISTS "AI predictions are viewable by everyone" ON public.ai_predictions;
CREATE POLICY "AI predictions are viewable by everyone" ON public.ai_predictions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert predictions" ON public.ai_predictions;
CREATE POLICY "Authenticated users can insert predictions" ON public.ai_predictions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- action_logs policies
DROP POLICY IF EXISTS "Action logs are viewable by officials" ON public.action_logs;
CREATE POLICY "Action logs are viewable by officials" ON public.action_logs FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'official') OR
  public.has_role(auth.uid(), 'health_official')
);
DROP POLICY IF EXISTS "Officials can insert action logs" ON public.action_logs;
CREATE POLICY "Officials can insert action logs" ON public.action_logs FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'official') OR
  public.has_role(auth.uid(), 'health_official') OR
  public.has_role(auth.uid(), 'asha_worker')
);

-- notification_preferences policies
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_gamification policies
DROP POLICY IF EXISTS "Users can view their own gamification data" ON public.user_gamification;
CREATE POLICY "Users can view their own gamification data" ON public.user_gamification FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own gamification data" ON public.user_gamification;
CREATE POLICY "Users can update their own gamification data" ON public.user_gamification FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own gamification data" ON public.user_gamification;
CREATE POLICY "Users can insert their own gamification data" ON public.user_gamification FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.user_gamification;
CREATE POLICY "Anyone can view leaderboard" ON public.user_gamification FOR SELECT USING (true);

-- badges policies
DROP POLICY IF EXISTS "Anyone can view badges" ON public.badges;
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage badges" ON public.badges;
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- user_badges policies
DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;
CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can earn badges" ON public.user_badges;
CREATE POLICY "Users can earn badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- quiz_completions policies
DROP POLICY IF EXISTS "Users can view their own quiz completions" ON public.quiz_completions;
CREATE POLICY "Users can view their own quiz completions" ON public.quiz_completions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can log quiz completions" ON public.quiz_completions;
CREATE POLICY "Users can log quiz completions" ON public.quiz_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- offline_sync_queue policies
DROP POLICY IF EXISTS "Users can manage their own sync queue" ON public.offline_sync_queue;
CREATE POLICY "Users can manage their own sync queue" ON public.offline_sync_queue FOR ALL USING (auth.uid() = user_id);

-- sms_reports policies
DROP POLICY IF EXISTS "Officials can view SMS reports" ON public.sms_reports;
CREATE POLICY "Officials can view SMS reports" ON public.sms_reports FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'official') OR
  public.has_role(auth.uid(), 'health_official')
);
DROP POLICY IF EXISTS "System can insert SMS reports" ON public.sms_reports;
CREATE POLICY "System can insert SMS reports" ON public.sms_reports FOR INSERT WITH CHECK (true);

-- water_sensor_data policies
DROP POLICY IF EXISTS "Water sensor data is viewable by everyone" ON public.water_sensor_data;
CREATE POLICY "Water sensor data is viewable by everyone" ON public.water_sensor_data FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert water sensor data" ON public.water_sensor_data;
CREATE POLICY "Authenticated users can insert water sensor data" ON public.water_sensor_data FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- quiz_questions policies
DROP POLICY IF EXISTS "Quiz questions are viewable by everyone" ON public.quiz_questions;
CREATE POLICY "Quiz questions are viewable by everyone" ON public.quiz_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Admins can manage quiz questions" ON public.quiz_questions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- certificates policies
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.certificates;
CREATE POLICY "Users can view their own certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can earn certificates" ON public.certificates;
CREATE POLICY "Users can earn certificates" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

-- image_analysis policies
DROP POLICY IF EXISTS "Users can view their own image analysis" ON public.image_analysis;
CREATE POLICY "Users can view their own image analysis" ON public.image_analysis FOR SELECT USING (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'official') OR
    public.has_role(auth.uid(), 'health_official')
);
DROP POLICY IF EXISTS "Users can insert image analysis" ON public.image_analysis;
CREATE POLICY "Users can insert image analysis" ON public.image_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Performance Index Optimization (Idempotent)

-- Indexes on village_id
CREATE INDEX IF NOT EXISTS idx_alerts_village_id ON public.alerts(village_id);
CREATE INDEX IF NOT EXISTS idx_water_quality_readings_village_id ON public.water_quality_readings(village_id);
CREATE INDEX IF NOT EXISTS idx_health_reports_village_id ON public.health_reports(village_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_village_id ON public.iot_devices(village_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_village_id ON public.ai_predictions(village_id);
CREATE INDEX IF NOT EXISTS idx_sms_reports_village_id ON public.sms_reports(village_id);
CREATE INDEX IF NOT EXISTS idx_disease_cases_village_id ON public.disease_cases(village_id);
CREATE INDEX IF NOT EXISTS idx_water_quality_reports_village_id ON public.water_quality_reports(village_id);
CREATE INDEX IF NOT EXISTS idx_outbreak_predictions_village_id ON public.outbreak_predictions(village_id);
CREATE INDEX IF NOT EXISTS idx_resources_village_id ON public.resources(village_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_village_id ON public.campaign_logs(village_id);
CREATE INDEX IF NOT EXISTS idx_water_sensor_data_village_id ON public.water_sensor_data(village_id);

-- Indexes on district_id
CREATE INDEX IF NOT EXISTS idx_villages_district_id ON public.villages(district_id);

-- Indexes on reporter_id
CREATE INDEX IF NOT EXISTS idx_disease_cases_reporter_id ON public.disease_cases(reporter_id);

-- Indexes on alert_id
CREATE INDEX IF NOT EXISTS idx_alert_acknowledgments_alert_id ON public.alert_acknowledgments(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_escalation_logs_alert_id ON public.alert_escalation_logs(alert_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_alert_id ON public.action_logs(alert_id);
CREATE INDEX IF NOT EXISTS idx_interventions_alert_id ON public.interventions(alert_id);

-- Indexes on created_at / completed_at / sent_at
CREATE INDEX IF NOT EXISTS idx_villages_created_at ON public.villages(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_water_quality_readings_created_at ON public.water_quality_readings(created_at);
CREATE INDEX IF NOT EXISTS idx_health_reports_created_at ON public.health_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_created_at ON public.user_roles(created_at);
CREATE INDEX IF NOT EXISTS idx_iot_devices_created_at ON public.iot_devices(created_at);
CREATE INDEX IF NOT EXISTS idx_alert_escalation_logs_created_at ON public.alert_escalation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_alert_acknowledgments_created_at ON public.alert_acknowledgments(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON public.ai_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON public.action_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_created_at ON public.notification_preferences(created_at);
CREATE INDEX IF NOT EXISTS idx_user_gamification_created_at ON public.user_gamification(created_at);
CREATE INDEX IF NOT EXISTS idx_badges_created_at ON public.badges(created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_completions_created_at ON public.quiz_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_created_at ON public.offline_sync_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_reports_created_at ON public.sms_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_disease_cases_created_at ON public.disease_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_water_quality_reports_created_at ON public.water_quality_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_created_at ON public.campaign_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_water_sensor_data_created_at ON public.water_sensor_data(created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_created_at ON public.quiz_questions(created_at);
CREATE INDEX IF NOT EXISTS idx_image_analysis_created_at ON public.image_analysis(created_at);

-- 7. Seed Relational Data (Idempotent)

-- Seed districts
INSERT INTO public.districts (name, state) VALUES
  ('Dibrugarh', 'Assam'),
  ('Jorhat', 'Assam'),
  ('Majuli', 'Assam'),
  ('Cachar', 'Assam'),
  ('Sonitpur', 'Assam')
ON CONFLICT (name) DO NOTHING;

-- Seed villages (idempotently without UNIQUE constraints)
INSERT INTO public.villages (name, district, district_id, latitude, longitude, population, risk_level, risk_score)
SELECT name, district, district_id, latitude, longitude, population, risk_level, risk_score
FROM (VALUES
  ('Dibrugarh Town', 'Dibrugarh', (SELECT id FROM public.districts WHERE name = 'Dibrugarh' LIMIT 1), 27.4728, 94.9120, 15000, 'high', 85),
  ('Barbaruah', 'Dibrugarh', (SELECT id FROM public.districts WHERE name = 'Dibrugarh' LIMIT 1), 27.3800, 94.8800, 8200, 'medium', 48),
  ('Khowang', 'Dibrugarh', (SELECT id FROM public.districts WHERE name = 'Dibrugarh' LIMIT 1), 27.2800, 94.9200, 6400, 'low', 28),
  ('Jorhat Center', 'Jorhat', (SELECT id FROM public.districts WHERE name = 'Jorhat' LIMIT 1), 26.7509, 94.2037, 21000, 'medium', 52),
  ('Mariani', 'Jorhat', (SELECT id FROM public.districts WHERE name = 'Jorhat' LIMIT 1), 26.6600, 94.3200, 11500, 'high', 72),
  ('Teok', 'Jorhat', (SELECT id FROM public.districts WHERE name = 'Jorhat' LIMIT 1), 26.8400, 94.4300, 7800, 'low', 19),
  ('Kamalabari', 'Majuli', (SELECT id FROM public.districts WHERE name = 'Majuli' LIMIT 1), 26.9300, 94.1600, 5200, 'low', 35),
  ('Garamur', 'Majuli', (SELECT id FROM public.districts WHERE name = 'Majuli' LIMIT 1), 26.9600, 94.2200, 4900, 'low', 22),
  ('Silchar Ward 5', 'Cachar', (SELECT id FROM public.districts WHERE name = 'Cachar' LIMIT 1), 24.8333, 92.7789, 18500, 'high', 89),
  ('Tezpur Bazar', 'Sonitpur', (SELECT id FROM public.districts WHERE name = 'Sonitpur' LIMIT 1), 26.6338, 92.8000, 14000, 'medium', 40),
  -- Legacy short names
  ('Dibrugarh', 'Dibrugarh', (SELECT id FROM public.districts WHERE name = 'Dibrugarh' LIMIT 1), 27.4728, 94.9120, 15000, 'high', 85),
  ('Majuli', 'Majuli', (SELECT id FROM public.districts WHERE name = 'Majuli' LIMIT 1), 26.9540, 94.2150, 12000, 'medium', 55),
  ('Tezpur', 'Sonitpur', (SELECT id FROM public.districts WHERE name = 'Sonitpur' LIMIT 1), 26.6338, 92.8000, 18000, 'low', 25),
  ('Jorhat', 'Jorhat', (SELECT id FROM public.districts WHERE name = 'Jorhat' LIMIT 1), 26.7509, 94.2037, 20000, 'medium', 45),
  ('Silchar', 'Cachar', (SELECT id FROM public.districts WHERE name = 'Cachar' LIMIT 1), 24.8333, 92.7789, 22000, 'low', 30)
) AS new_villages(name, district, district_id, latitude, longitude, population, risk_level, risk_score)
WHERE NOT EXISTS (
  SELECT 1 FROM public.villages WHERE villages.name = new_villages.name
);

-- Seed default badges
INSERT INTO public.badges (name, description, icon, points_required, category) VALUES
  ('First Steps', 'Complete your first quiz', 'trophy', 0, 'quiz'),
  ('Knowledge Seeker', 'Complete 5 quizzes', 'book', 50, 'quiz'),
  ('Quiz Master', 'Complete 10 quizzes with 80%+ score', 'award', 200, 'quiz'),
  ('Community Helper', 'Submit your first health report', 'heart', 0, 'reports'),
  ('Health Guardian', 'Submit 10 health reports', 'shield', 100, 'reports'),
  ('Streak Starter', 'Maintain a 3-day activity streak', 'flame', 30, 'streak'),
  ('Streak Champion', 'Maintain a 7-day activity streak', 'flame', 70, 'streak'),
  ('Rising Star', 'Earn 100 total points', 'star', 100, 'points'),
  ('Water Warrior', 'Complete all water safety quizzes', 'droplet', 150, 'special'),
  ('Health Ambassador', 'Reach level 5', 'medal', 500, 'level')
ON CONFLICT (name) DO NOTHING;

-- Enable realtime for critical tables idempotently
DO $$
DECLARE
  pub_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') INTO pub_exists;
  
  IF pub_exists THEN
    -- villages
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'villages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.villages;
    END IF;

    -- water_quality_readings
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'water_quality_readings'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.water_quality_readings;
    END IF;

    -- health_reports
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'health_reports'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.health_reports;
    END IF;

    -- alerts
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'alerts'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
    END IF;

    -- user_gamification
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_gamification'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_gamification;
    END IF;

    -- quiz_completions
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'quiz_completions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_completions;
    END IF;
  END IF;
END $$;
