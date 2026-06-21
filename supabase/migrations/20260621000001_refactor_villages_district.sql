-- 1. Create districts table if not exists (safeguard)
CREATE TABLE IF NOT EXISTS public.districts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL DEFAULT 'Assam',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add district_id to villages if not exists
ALTER TABLE public.villages 
ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL;

-- 3. Seed districts from existing villages.district values
INSERT INTO public.districts (name, state)
SELECT DISTINCT district, COALESCE(state, 'Assam')
FROM public.villages
WHERE district IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- 4. Sync district_id for existing villages
UPDATE public.villages v
SET district_id = d.id
FROM public.districts d
WHERE v.district = d.name AND v.district_id IS NULL;

-- 5. Create missing tables if not exists

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

-- 6. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.water_sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_analysis ENABLE ROW LEVEL SECURITY;

-- 7. Configure RLS policies for new tables

-- water_sensor_data policies
CREATE POLICY "Water sensor data is viewable by everyone" 
ON public.water_sensor_data FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert water sensor data" 
ON public.water_sensor_data FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- quiz_questions policies
CREATE POLICY "Quiz questions are viewable by everyone" 
ON public.quiz_questions FOR SELECT USING (true);

CREATE POLICY "Admins can manage quiz questions" 
ON public.quiz_questions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.id = auth.uid() AND user_roles.role = 'admin'
    )
);

-- certificates policies
CREATE POLICY "Users can view their own certificates" 
ON public.certificates FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can earn certificates" 
ON public.certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

-- image_analysis policies
CREATE POLICY "Users can view their own image analysis" 
ON public.image_analysis FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.id = auth.uid() AND (user_roles.role = 'admin' OR user_roles.role = 'official' OR user_roles.role = 'health_official')
    )
);

CREATE POLICY "Users can insert image analysis" 
ON public.image_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Add performance indexes conditionally (CREATE INDEX IF NOT EXISTS)

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
