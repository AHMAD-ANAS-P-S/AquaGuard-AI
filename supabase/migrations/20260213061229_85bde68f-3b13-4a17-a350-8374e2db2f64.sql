-- Security: Restrict profiles to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" ON public.profiles
FOR SELECT TO authenticated USING (true);

-- Security: Restrict health_reports to authenticated users only
DROP POLICY IF EXISTS "Anyone can view health reports" ON public.health_reports;
DROP POLICY IF EXISTS "Health reports are viewable by everyone" ON public.health_reports;
DROP POLICY IF EXISTS "Public can view health reports" ON public.health_reports;
DROP POLICY IF EXISTS "Authenticated users can view health reports" ON public.health_reports;

CREATE POLICY "Authenticated users can view health reports" ON public.health_reports
FOR SELECT TO authenticated USING (true);

-- Security: Restrict alerts to authenticated users only
DROP POLICY IF EXISTS "Anyone can view alerts" ON public.alerts;
DROP POLICY IF EXISTS "Alerts are viewable by everyone" ON public.alerts;
DROP POLICY IF EXISTS "Public can view alerts" ON public.alerts;
DROP POLICY IF EXISTS "Authenticated users can view alerts" ON public.alerts;

CREATE POLICY "Authenticated users can view alerts" ON public.alerts
FOR SELECT TO authenticated USING (true);