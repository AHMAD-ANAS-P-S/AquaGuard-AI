import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type UserRole = 'admin' | 'official' | 'health_official' | 'asha_worker' | 'volunteer' | 'clinic_staff';

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    // Reset to loading whenever the user changes so consumers
    // don't briefly see (loading=false, roles=[]) and redirect away.
    setLoading(true);
    loadRoles();
  }, [user?.id]);

  const loadRoles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        setRoles(data.map(r => r.role as UserRole));
      } else {
        // Default role for new users
        await assignDefaultRole();
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const assignDefaultRole = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ id: user.id, email: user.email, role: 'volunteer' });

      if (error) throw error;
      
      setRoles(['volunteer']);
    } catch (error) {
      console.error('Error assigning default role:', error);
      setRoles([]);
    }
  };

  const hasRole = (role: UserRole) => roles.includes(role);

  const isOfficial = () => hasRole('admin') || hasRole('official') || hasRole('health_official') || hasRole('clinic_staff');

  const isCommunity = () => hasRole('asha_worker') || hasRole('volunteer');

  return {
    roles,
    loading,
    hasRole,
    isOfficial,
    isCommunity,
  };
};
