import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Bell, Map, Book, Menu, User, UserCheck, LogOut, Settings, Activity, AlertCircle, Shield, Users, Globe, Microscope, Download } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
];

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { roles, loading: roleLoading, isOfficial } = useUserRole();
  const { t, i18n } = useTranslation();

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    if (user) {
      localStorage.setItem(`aquaguard_lang_${user.id}`, langCode);
    }
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const getDashboardPath = () => {
    return '/dashboard';
  };

  const getNavItems = () => {
    if (roles.includes('admin')) {
      return [
        { path: "/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
        { path: "/alerts", label: t('nav.manageAlerts'), icon: Bell },
        { path: "/alert-escalation", label: t('nav.escalation'), icon: AlertCircle },
        { path: "/iot-monitoring", label: t('nav.iotMonitoring'), icon: Activity },
        { path: "/reports", label: t('nav.reports'), icon: FileText },
        { path: "/map", label: t('nav.heatmap'), icon: Map },
        { path: "/image-analysis", label: t('nav.imageAnalysis'), icon: Microscope },
        { path: "/export-reports", label: t('nav.exportReports'), icon: Download },
      ];
    }
    if (roles.includes('official') || roles.includes('health_official')) {
      return [
        { path: "/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
        { path: "/alerts", label: t('nav.manageAlerts'), icon: Bell },
        { path: "/alert-escalation", label: t('nav.escalation'), icon: AlertCircle },
        { path: "/reports", label: t('nav.reports'), icon: FileText },
        { path: "/map", label: t('nav.heatmap'), icon: Map },
        { path: "/image-analysis", label: t('nav.imageAnalysis'), icon: Microscope },
      ];
    }
    if (roles.includes('clinic_staff')) {
      return [
        { path: "/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
        { path: "/reports", label: t('nav.reportIssue'), icon: FileText },
        { path: "/map", label: t('nav.mapView'), icon: Map },
        { path: "/image-analysis", label: t('nav.imageAnalysis'), icon: Microscope },
      ];
    }
    if (roles.includes('asha_worker')) {
      return [
        { path: "/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
        { path: "/reports", label: t('nav.reportIssue'), icon: FileText },
        { path: "/alerts", label: t('nav.alerts'), icon: Bell },
      ];
    }
    // Default to Volunteer
    return [
      { path: "/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
      { path: "/reports", label: t('nav.reportIssue'), icon: FileText },
      { path: "/map", label: t('nav.mapView'), icon: Map },
      { path: "/awareness", label: t('nav.learnEarn'), icon: Book },
    ];
  };

  const navItems = getNavItems();

  if (authLoading || roleLoading) {
    return (
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b border-border p-4 z-50">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">AquaGuard AI</h1>
          <div className="h-9 w-9 rounded-md border border-border animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className="w-full justify-start gap-2"
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </>
  );

  const LanguageSelector = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 w-full justify-start">
          <Globe className="h-4 w-4" />
          <span className="truncate">{currentLanguage.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t('common.selectLanguage')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={i18n.language === lang.code ? 'bg-accent' : ''}
          >
            <span className="font-medium">{lang.nativeName}</span>
            <span className="ml-auto text-muted-foreground text-xs">({lang.name})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const getRoleLabel = () => {
    if (roles.includes('admin')) return t('roles.administrator');
    if (roles.includes('official') || roles.includes('health_official')) return t('roles.healthOfficial');
    if (roles.includes('clinic_staff')) return t('roles.clinicalStaff');
    if (roles.includes('asha_worker')) return t('roles.ashaWorker');
    return t('roles.volunteer');
  };

  const getRoleIcon = () => {
    if (roles.includes('admin')) return <Shield className="h-3 w-3" />;
    if (roles.includes('official') || roles.includes('health_official')) return <Users className="h-3 w-3" />;
    if (roles.includes('clinic_staff')) return <Activity className="h-3 w-3" />;
    if (roles.includes('asha_worker')) return <UserCheck className="h-3 w-3" />;
    return <User className="h-3 w-3" />;
  };

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left overflow-hidden">
            <span className="text-sm font-medium truncate w-full">{user?.email}</span>
            <Badge variant="outline" className="text-xs flex items-center gap-1 mt-1">
              {getRoleIcon()}
              {getRoleLabel()}
            </Badge>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('common.myAccount')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="mr-2 h-4 w-4" />
          {t('common.profile')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <Settings className="mr-2 h-4 w-4" />
          {t('common.settings')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {t('common.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b border-border p-4 z-50">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">AquaGuard AI</h1>
          <div className="flex items-center gap-2">
            <OfflineIndicator />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="mt-8 space-y-4">
                  <LanguageSelector />
                  <div className="space-y-2">
                    <NavLinks />
                  </div>
                  <div className="pt-4 border-t">
                    <UserMenu />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col p-6 z-40">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">AquaGuard AI</h1>
          <p className="text-sm text-muted-foreground mt-1">Outbreak Early Warning System</p>
        </div>
        
        <div className="mb-4 space-y-2">
          <LanguageSelector />
          <OfflineIndicator />
        </div>

        <nav className="space-y-2 flex-1">
          <NavLinks />
        </nav>
        <div className="mt-auto pt-4 border-t border-border">
          <UserMenu />
        </div>
      </div>
    </>
  );
};
