import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "@/components/layout/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { GamificationProvider } from "@/hooks/useGamification";
import { AchievementDisplay } from "@/components/AchievementDisplay";
import { GuidanceBot } from "@/components/GuidanceBot";
import { PushNotificationService } from "@/components/PushNotificationService";
import Index from "./pages/Index";
import Reports from "./pages/Reports";
import Alerts from "./pages/Alerts";
import MapView from "./pages/MapView";
import Awareness from "./pages/Awareness";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import IoTMonitoring from "./pages/IoTMonitoring";
import AlertEscalation from "./pages/AlertEscalation";
import CommunityDashboard from "./pages/CommunityDashboard";
import OfficialDashboard from "./pages/OfficialDashboard";

import ImageAnalysis from "./pages/ImageAnalysis";
import ExportReports from "./pages/ExportReports";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <GamificationProvider>
        <Toaster />
        <Sonner />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading AquaGuard AI...</p>
          </div>
        </div>
      </GamificationProvider>
    );
  }

  return (
    <GamificationProvider>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      <AchievementDisplay />
      <PushNotificationService />
      {user && <GuidanceBot />}
      {user && <Navigation />}
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/" element={user ? <Index /> : <Navigate to="/auth" replace />} />
        <Route path="/reports" element={user ? <Reports /> : <Navigate to="/auth" replace />} />
        <Route path="/alerts" element={user ? <Alerts /> : <Navigate to="/auth" replace />} />
        <Route path="/map" element={user ? <MapView /> : <Navigate to="/auth" replace />} />
        <Route path="/awareness" element={user ? <Awareness /> : <Navigate to="/auth" replace />} />
        <Route path="/iot-monitoring" element={user ? <IoTMonitoring /> : <Navigate to="/auth" replace />} />
        <Route path="/alert-escalation" element={user ? <AlertEscalation /> : <Navigate to="/auth" replace />} />
        <Route path="/community-dashboard" element={user ? <CommunityDashboard /> : <Navigate to="/auth" replace />} />
        <Route path="/official-dashboard" element={user ? <OfficialDashboard /> : <Navigate to="/auth" replace />} />
        <Route path="/admin-dashboard" element={user ? <OfficialDashboard /> : <Navigate to="/auth" replace />} />
        <Route path="/clinic-dashboard" element={user ? <OfficialDashboard /> : <Navigate to="/auth" replace />} />
        
        <Route path="/image-analysis" element={user ? <ImageAnalysis /> : <Navigate to="/auth" replace />} />
        <Route path="/export-reports" element={user ? <ExportReports /> : <Navigate to="/auth" replace />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </GamificationProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
