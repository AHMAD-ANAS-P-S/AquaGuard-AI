
-- Add report_type column to health_reports
ALTER TABLE public.health_reports ADD COLUMN IF NOT EXISTS report_type text NOT NULL DEFAULT 'health_report';

-- Create storage bucket for water/pathogen image uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('report-images', 'report-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for report images
CREATE POLICY "Anyone can view report images"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-images');

CREATE POLICY "Authenticated users can upload report images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'report-images');

CREATE POLICY "Users can delete their own report images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'report-images' AND auth.uid()::text = (storage.foldername(name))[1]);
