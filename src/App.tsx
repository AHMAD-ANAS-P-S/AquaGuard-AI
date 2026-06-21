import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "@/components/layout/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
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
import CommunityDashboard from "./pages/CommunityDashboard";
import OfficialDashboard from "./pages/OfficialDashboard";
import Dashboard from "./pages/Dashboard";

import ImageAnalysis from "./pages/ImageAnalysis";
import ExportReports from "./pages/ExportReports";

const queryClient = new QueryClient();

const RoleRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { roles, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  const hasAccess = roles.some((role) => allowedRoles.includes(role));
  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const { user, loading, validating } = useAuth();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Load saved language preference only after successful authentication
        const savedLang = localStorage.getItem(`aquaguard_lang_${user.id}`) || "en";
        i18n.changeLanguage(savedLang);
      } else {
        // On every fresh logout or when auth is empty, always reset to English
        i18n.changeLanguage("en");
      }
    }
  }, [user, loading, i18n]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  if (loading) {
    return (
      <GamificationProvider>
        <Toaster />
        <Sonner />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">{t('loading')} {t('branding.title')}...</p>
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
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={user ? <Index /> : <Navigate to="/auth" replace />} />
        <Route path="/reports" element={user ? <Reports /> : <Navigate to="/auth" replace />} />
        <Route path="/alerts" element={user ? <Alerts /> : <Navigate to="/auth" replace />} />
        
        <Route 
          path="/map" 
          element={
            user ? (
              <RoleRoute allowedRoles={['admin', 'official', 'health_official', 'volunteer', 'clinic_staff', 'clinic_staffs']}>
                <MapView />
              </RoleRoute>
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
        
        <Route 
          path="/awareness" 
          element={
            user ? (
              <RoleRoute allowedRoles={['admin', 'volunteer', 'clinic_staff', 'clinic_staffs']}>
                <Awareness />
              </RoleRoute>
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
        
        <Route 
          path="/iot-monitoring" 
          element={
            user ? (
              <RoleRoute allowedRoles={['admin']}>
                <IoTMonitoring />
              </RoleRoute>
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
        

        
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" replace />} />
        <Route path="/community-dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" replace />} />
        <Route path="/official-dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" replace />} />
        <Route path="/admin-dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" replace />} />
        <Route path="/clinic-dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" replace />} />
        
        <Route 
          path="/image-analysis" 
          element={
            user ? (
              <RoleRoute allowedRoles={['admin', 'official', 'health_official', 'clinic_staff', 'clinic_staffs']}>
                <ImageAnalysis />
              </RoleRoute>
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
        
        <Route 
          path="/export-reports" 
          element={
            user ? (
              <RoleRoute allowedRoles={['admin']}>
                <ExportReports />
              </RoleRoute>
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
        
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
