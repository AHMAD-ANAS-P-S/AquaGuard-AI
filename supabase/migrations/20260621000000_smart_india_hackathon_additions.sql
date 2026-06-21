-- 1. Create villages table if not exists
CREATE TABLE IF NOT EXISTS public.villages (
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

-- 2. Create alerts table if not exists
CREATE TABLE IF NOT EXISTS public.alerts (
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

-- 3. Create districts table if not exists
CREATE TABLE IF NOT EXISTS public.districts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    state text NOT NULL DEFAULT 'Assam',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create disease_cases table if not exists
CREATE TABLE IF NOT EXISTS public.disease_cases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_name text,
    symptoms jsonb DEFAULT '[]'::jsonb NOT NULL,
    disease text NOT NULL,
    status text NOT NULL DEFAULT 'Active', -- Active, Recovered, Critical, Deceased
    village_id uuid REFERENCES public.villages(id) ON DELETE SET NULL,
    clinic_name text,
    reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create water_quality_reports table if not exists (manual tests)
CREATE TABLE IF NOT EXISTS public.water_quality_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_name text NOT NULL,
    village_id uuid REFERENCES public.villages(id) ON DELETE SET NULL,
    test_method text NOT NULL, -- Kit, Image AI, Sensor
    ph numeric,
    turbidity numeric,
    temperature numeric,
    contamination_score numeric,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create outbreak_predictions table if not exists
CREATE TABLE IF NOT EXISTS public.outbreak_predictions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    village_id uuid REFERENCES public.villages(id) ON DELETE CASCADE,
    predicted_disease text NOT NULL,
    current_cases integer NOT NULL DEFAULT 0,
    water_quality text NOT NULL DEFAULT 'Good', -- Good, Fair, Poor
    rainfall text NOT NULL DEFAULT 'Medium', -- Low, Medium, High
    seasonal_data text,
    risk_score numeric NOT NULL,
    confidence_score numeric NOT NULL,
    predicted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create interventions table if not exists
CREATE TABLE IF NOT EXISTS public.interventions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id uuid REFERENCES public.alerts(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'Alert Generated', -- Alert Generated, Team Assigned, Investigation Started, Water Tested, Medicine Distributed, Campaign Conducted, Resolved
    team_assigned text,
    investigation_started boolean DEFAULT false NOT NULL,
    water_tested boolean DEFAULT false NOT NULL,
    medicine_distributed boolean DEFAULT false NOT NULL,
    campaign_conducted boolean DEFAULT false NOT NULL,
    resolved boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create resources table if not exists
CREATE TABLE IF NOT EXISTS public.resources (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL, -- Doctor, Nurse, Health Worker, ORS Kit, Medicine, Water Tanker
    village_id uuid REFERENCES public.villages(id) ON DELETE SET NULL,
    allocated_count integer NOT NULL DEFAULT 0,
    required_count integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'Adequate', -- Adequate, Shortage, Critical
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create awareness_content table if not exists
CREATE TABLE IF NOT EXISTS public.awareness_content (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL, -- Advisory, Campaign, Safety Tip, Notice
    publisher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Create campaign_logs table if not exists
CREATE TABLE IF NOT EXISTS public.campaign_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    village_id uuid REFERENCES public.villages(id) ON DELETE SET NULL,
    health_official_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    volunteers_count integer NOT NULL DEFAULT 0,
    audience_reach integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Create notification_logs table if not exists
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient text NOT NULL,
    type text NOT NULL, -- Outbreak, Water Contamination, Emergency
    channel text NOT NULL, -- SMS, Email, Push
    content text NOT NULL,
    sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
