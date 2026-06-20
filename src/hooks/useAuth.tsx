import { useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Track whether the initial session has already been set via getSession()
  // to avoid a double-set race condition with onAuthStateChange firing on mount.
  const initialised = useRef(false);

  useEffect(() => {
    // 1. Get the current session first (avoids flash of unauthenticated state)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[useAuth] getSession error:', error.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      initialised.current = true;
    });

    // 2. Listen for subsequent auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Skip the first INITIAL_SESSION event — already handled by getSession()
        if (!initialised.current) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[useAuth] signOut error:', error.message);
    }
    navigate("/auth");
  };

  return { user, session, loading, signOut };
};