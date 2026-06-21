import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Shield, Users, UserCheck, User, LogOut, HelpCircle, Activity, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Role = 'admin' | 'official' | 'asha_worker' | 'volunteer' | 'clinic_staff';

const RoleSelector = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  ];

  const roles: { value: Role; label: string; description: string; icon: any }[] = [
    {
      value: 'volunteer',
      label: t('roles.volunteer'),
      description: t('rolesDesc.volunteer'),
      icon: User,
    },
    {
      value: 'asha_worker',
      label: t('roles.ashaWorker'),
      description: t('rolesDesc.ashaWorker'),
      icon: UserCheck,
    },
    {
      value: 'official',
      label: t('roles.healthOfficial'),
      description: t('rolesDesc.healthOfficial'),
      icon: Users,
    },
    {
      value: 'clinic_staff',
      label: t('roles.clinicalStaff'),
      description: t('rolesDesc.clinicalStaff'),
      icon: Activity,
    },
    {
      value: 'admin',
      label: t('roles.administrator'),
      description: t('rolesDesc.administrator'),
      icon: Shield,
    },
  ];

  const selectRole = async (role: Role) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in first');
        navigate('/auth');
        return;
      }

      // Check if user already has a role - ROLE LOCKING
      const { data: existingRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id);

      if (existingRoles && existingRoles.length > 0) {
        const userRole = existingRoles[0].role;
        toast.info(`You are already registered as ${userRole.replace('_', ' ')}`);
        navigate('/dashboard');
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({ id: user.id, email: user.email, role });

      if (error) {
        console.error('Role selection error:', error);
        if (error.message.includes('row-level security')) {
          toast.error('Unable to assign role. Please contact support.');
        } else {
          toast.error(error.message || 'Failed to select role');
        }
        return;
      }

      toast.success(`Welcome as ${role.replace('_', ' ')}!`);

      // Small delay for better UX
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error: any) {
      console.error('Error selecting role:', error);
      toast.error(error.message || 'Failed to select role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="flex justify-end gap-2 mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Globe className="h-4 w-4" />
                <span>{languages.find(l => l.code === i18n.language)?.nativeName || "English"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className="cursor-pointer"
                >
                  <span>{lang.nativeName}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                {t('common.howToUse', 'How to Use')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>{t('branding.title')} - {t('roleGuideTitle', 'Complete Guide')}</DialogTitle>
                <DialogDescription>
                  Learn how to use all features based on your role
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">🎯 Selecting Your Role</h3>
                    <p className="text-sm text-muted-foreground mb-2">Choose the role that best describes you:</p>
                    <ul className="space-y-2 text-sm">
                      <li><strong>Administrator:</strong> Full system access for managing officials and system settings</li>
                      <li><strong>Health Official:</strong> Monitor data, manage alerts, view analytics and heatmaps</li>
                      <li><strong>ASHA Worker:</strong> Report issues, receive alerts, educate community</li>
                      <li><strong>Volunteer:</strong> Report local health issues, view safety maps, and earn certs</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">🌍 Community Dashboard Features</h3>
                    <ul className="space-y-2 text-sm">
                      <li><strong>📋 Report Health Issue:</strong> Submit symptoms like fever, diarrhea, or vomiting</li>
                      <li><strong>💧 Report Water Issue:</strong> Report contaminated or unsafe water sources</li>
                      <li><strong>🎤 Voice Report (Hey Aqua):</strong> Use voice assistant to report in local languages</li>
                      <li><strong>📷 Upload Photo:</strong> Attach water test strip images or evidence</li>
                      <li><strong>🗺️ View Risk Map:</strong> Check your area's water safety status</li>
                      <li><strong>🔔 Active Alerts:</strong> See warnings for your region</li>
                      <li><strong>📖 Learn & Earn:</strong> Complete quizzes, earn certificates, learn hygiene tips</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">🏢 Official Dashboard Features</h3>
                    <ul className="space-y-2 text-sm">
                      <li><strong>🗺️ Live Risk Heatmap:</strong> Real-time visualization of risk zones</li>
                      <li><strong>📊 Analytics:</strong> Water quality trends (pH, TDS, temperature)</li>
                      <li><strong>🚨 Alert Management:</strong> Review and respond to active alerts</li>
                      <li><strong>🔄 Auto-Escalation:</strong> ASHA → District → State escalation system</li>
                      <li><strong>🤖 {t('branding.aiPrediction')}:</strong> View outbreak probability predictions</li>
                      <li><strong>📥 Export Reports:</strong> Download CSV/PDF reports</li>
                      <li><strong>📡 IoT Monitoring:</strong> Track ESP32 sensors in real-time</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">📡 IoT Monitoring System</h3>
                    <p className="text-sm text-muted-foreground mb-2">Real-time sensor data from ESP32 devices:</p>
                    <ul className="space-y-2 text-sm">
                      <li><strong>Sensors:</strong> pH, TDS (Total Dissolved Solids), Temperature</li>
                      <li><strong>Communication:</strong> Wi-Fi (primary), GSM/SMS (fallback for remote areas)</li>
                      <li><strong>Battery Backup:</strong> 6-8 hours of operation</li>
                      <li><strong>Auto-Alerts:</strong> Triggered when water quality exceeds safe thresholds</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">🚨 Alert Escalation Flow</h3>
                    <ol className="space-y-2 text-sm list-decimal list-inside">
                      <li>Alert sent to ASHA Worker via SMS</li>
                      <li>5-minute response timer starts</li>
                      <li>If no response → escalates to District Officer</li>
                      <li>Another 5 minutes → escalates to State Health Department</li>
                      <li>All actions logged with timestamps</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">🎤 Voice Assistant (Hey Aqua)</h3>
                    <p className="text-sm text-muted-foreground mb-2">For illiterate or elderly users:</p>
                    <ul className="space-y-2 text-sm">
                      <li>Supports multiple local languages</li>
                      <li>Speech-to-text for reporting issues</li>
                      <li>Text-to-speech for reading alerts and information</li>
                      <li>Works offline with GSM fallback</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">📱 SMS Reporting (No Internet)</h3>
                    <p className="text-sm text-muted-foreground mb-2">When Wi-Fi is unavailable:</p>
                    <ul className="space-y-2 text-sm">
                      <li>ESP32 uses SIM800L GSM module to send SMS</li>
                      <li>Field workers can send SMS reports to gateway number</li>
                      <li>System automatically processes and logs SMS data</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">🧭 Navigation Tips</h3>
                    <ul className="space-y-2 text-sm">
                      <li><strong>Mobile:</strong> Use hamburger menu (☰) to access navigation</li>
                      <li><strong>Desktop:</strong> Sidebar on the left with all menu items</li>
                      <li><strong>Switch Dashboard:</strong> If you have multiple roles, switch via user menu</li>
                      <li><strong>Logout:</strong> Click on your profile picture/email at bottom of sidebar</li>
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
          <Button variant="destructive" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            {t('logout')}
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t('welcomeRoleSelector')}</h1>
          <p className="text-muted-foreground">{t('selectRoleToStart', 'Select your role to get started')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.value}
                className="p-6 hover:shadow-lg hover:scale-105 transition-all cursor-pointer border-2 hover:border-primary group"
                onClick={() => !loading && selectRole(role.value)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-primary/10 group-hover:bg-primary/20 rounded-full mb-4 transition-colors">
                    <Icon className="h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{role.label}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                  <Button
                    disabled={loading}
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectRole(role.value);
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        {t('selecting', 'Selecting...')}
                      </span>
                    ) : (
                      t('selectRole', 'Select Role')
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          {t('dontSeeRole', "Don't see your role? Contact your administrator for assistance.")}
        </p>
      </div>
    </div>
  );
};

export default RoleSelector;
