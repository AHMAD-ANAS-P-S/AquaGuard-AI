-- Fix RLS policy for alert_escalation_logs - restrict SELECT access to admin/official only  
-- Remove asha_worker from the policy to prevent phone number exposure
DROP POLICY IF EXISTS "Escalation logs viewable by officials only" ON public.alert_escalation_logs;

-- Create restricted SELECT policy for admin and official roles only
CREATE POLICY "Escalation logs viewable by officials only" 
ON public.alert_escalation_logs 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'official'::app_role)
);