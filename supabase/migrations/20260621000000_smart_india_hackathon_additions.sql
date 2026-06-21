-- Create districts table if not exists
CREATE TABLE IF NOT EXISTS public.districts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    state text NOT NULL DEFAULT 'Assam',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create disease_cases table if not exists
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

-- Create water_quality_reports table if not exists (manual tests)
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

-- Create outbreak_predictions table if not exists
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

-- Create interventions table if not exists
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

-- Create resources table if not exists
CREATE TABLE IF NOT EXISTS public.resources (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL, -- Doctor, Nurse, Health Worker, ORS Kit, Medicine, Water Tanker
    village_id uuid REFERENCES public.villages(id) ON DELETE SET NULL,
    allocated_count integer NOT NULL DEFAULT 0,
    required_count integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'Adequate', -- Adequate, Shortage, Critical
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create awareness_content table if not exists
CREATE TABLE IF NOT EXISTS public.awareness_content (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL, -- Advisory, Campaign, Safety Tip, Notice
    publisher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create campaign_logs table if not exists
CREATE TABLE IF NOT EXISTS public.campaign_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    village_id uuid REFERENCES public.villages(id) ON DELETE SET NULL,
    health_official_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    volunteers_count integer NOT NULL DEFAULT 0,
    audience_reach integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notification_logs table if not exists
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient text NOT NULL,
    type text NOT NULL, -- Outbreak, Water Contamination, Emergency
    channel text NOT NULL, -- SMS, Email, Push
    content text NOT NULL,
    sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
