import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

const Index = () => {
  const navigate = useNavigate();
  const { roles, loading } = useUserRole();

  useEffect(() => {
    if (loading) return;

    if (roles.length === 0) {
      navigate('/auth', { replace: true });
      return;
    }

    navigate('/dashboard', { replace: true });
  }, [roles, loading, navigate]);

  // Always show a clean loading screen while we figure out where to go.
  // Never render the legacy Dashboard here — it was causing the flicker.
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
