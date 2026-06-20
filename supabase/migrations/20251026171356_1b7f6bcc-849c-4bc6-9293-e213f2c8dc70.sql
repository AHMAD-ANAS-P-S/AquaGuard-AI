-- Create IoT devices table for sensor management
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

-- Create alert escalation logs table
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

-- Create alert acknowledgments table
CREATE TABLE IF NOT EXISTS public.alert_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  acknowledgment_method TEXT CHECK (acknowledgment_method IN ('sms', 'app', 'web')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create AI predictions table for risk forecasting
CREATE TABLE IF NOT EXISTS public.ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID REFERENCES public.villages(id),
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('outbreak', 'water_quality', 'risk_escalation')),
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  predicted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  prediction_data JSONB,
  actual_outcome TEXT,
  accuracy_score NUMERIC,
  model_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_escalation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for iot_devices
CREATE POLICY "IoT devices are viewable by everyone"
  ON public.iot_devices FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert IoT devices"
  ON public.iot_devices FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update IoT devices"
  ON public.iot_devices FOR UPDATE
  USING (auth.role() = 'authenticated');

-- RLS Policies for alert_escalation_logs
CREATE POLICY "Escalation logs are viewable by everyone"
  ON public.alert_escalation_logs FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert escalation logs"
  ON public.alert_escalation_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update escalation logs"
  ON public.alert_escalation_logs FOR UPDATE
  USING (auth.role() = 'authenticated');

-- RLS Policies for alert_acknowledgments
CREATE POLICY "Acknowledgments are viewable by everyone"
  ON public.alert_acknowledgments FOR SELECT
  USING (true);

CREATE POLICY "Users can acknowledge alerts"
  ON public.alert_acknowledgments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for ai_predictions
CREATE POLICY "AI predictions are viewable by everyone"
  ON public.ai_predictions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert predictions"
  ON public.ai_predictions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create trigger for updated_at on iot_devices
CREATE TRIGGER update_iot_devices_updated_at
  BEFORE UPDATE ON public.iot_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_iot_devices_sensor_id ON public.iot_devices(sensor_id);
CREATE INDEX idx_iot_devices_village_id ON public.iot_devices(village_id);
CREATE INDEX idx_iot_devices_status ON public.iot_devices(status);
CREATE INDEX idx_alert_escalation_alert_id ON public.alert_escalation_logs(alert_id);
CREATE INDEX idx_alert_acknowledgments_alert_id ON public.alert_acknowledgments(alert_id);
CREATE INDEX idx_ai_predictions_village_id ON public.ai_predictions(village_id);

-- Add sensor_id to water_quality_readings if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'water_quality_readings' 
    AND column_name = 'device_id'
  ) THEN
    ALTER TABLE public.water_quality_readings 
    ADD COLUMN device_id UUID REFERENCES public.iot_devices(id);
    
    CREATE INDEX idx_water_quality_device_id ON public.water_quality_readings(device_id);
  END IF;
END $$;