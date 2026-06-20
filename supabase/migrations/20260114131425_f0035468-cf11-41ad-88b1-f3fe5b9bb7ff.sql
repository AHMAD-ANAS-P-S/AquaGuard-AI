-- Fix permissive RLS policy for sms_reports INSERT
DROP POLICY IF EXISTS "System can insert SMS reports" ON public.sms_reports;

-- SMS reports should only be inserted via service role from edge functions
-- No direct user inserts needed - edge function uses service role key