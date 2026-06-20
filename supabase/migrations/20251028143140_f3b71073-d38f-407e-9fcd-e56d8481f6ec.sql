-- Fix RLS policies for user_roles to allow initial role selection
-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- Allow users to insert their FIRST role (when they have no existing roles)
CREATE POLICY "Users can insert their first role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);

-- Allow admins to insert any role
CREATE POLICY "Admins can insert any role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);