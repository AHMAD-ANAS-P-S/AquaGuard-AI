// Trigger rebuild for logo update
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Shield, Eye, EyeOff, ArrowLeft, Droplets, Wifi, Activity, Globe } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useTranslation } from "react-i18next";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type AuthStep = 'credentials' | 'otp-verify';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
];

const Auth = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, validating, setValidating } = useAuth();
  const { roles, loading: roleLoading } = useUserRole();
  const { toast, dismiss } = useToast();
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Sync html[lang] attribute so CSS selectors like html[lang="ta"] work
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Handle already logged-in users landing on /auth
  useEffect(() => {
    if (user && !loading && !roleLoading && !validating && roles.length > 0) {
      if (roles.includes('admin')) navigate('/admin-dashboard', { replace: true });
      else if (roles.includes('official') || roles.includes('health_official')) navigate('/official-dashboard', { replace: true });
      else if (roles.includes('clinic_staff')) navigate('/clinic-dashboard', { replace: true });
      else navigate('/community-dashboard', { replace: true });
    }
  }, [user, loading, roleLoading, validating, roles, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  const sendOtpEmail = async (email: string, otp: string): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('send-otp-email', {
        body: { email, otp },
      });
      if (error) {
        console.error('[Auth] OTP email edge-function error:', error);
        toast({
          variant: "destructive",
          title: "OTP Delivery Issue",
          description: `Could not send verification email: ${error.message ?? 'Unknown error'}. Check your edge function logs.`,
        });
        return false;
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error('[Auth] Failed to invoke send-otp-email:', msg);
      toast({
        variant: "destructive",
        title: "OTP Delivery Failed",
        description: `Could not reach the email service: ${msg}`,
      });
      return false;
    }
  };

  const checkExistingRole = async (userId: string): Promise<string | null> => {
    const { data, error } = await supabase.from('user_roles').select('role').eq('id', userId);
    if (error) {
      console.error('[Auth] Role lookup error:', error);
      throw new Error(error.message);
    }
    if (data && data.length > 0) return data[0].role;
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Tell App.tsx we are validating — suppress the /auth → / redirect
    setValidating(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        // Wrong credentials — Supabase never created a session, no redirect risk
        setValidating(false);
        toast({ variant: "destructive", title: "Access Denied", description: error.message });
        setLoading(false);
        return;
      }

      if (data.user) {
        let existingRole: string | null = null;
        try {
          existingRole = await checkExistingRole(data.user.id);
        } catch (err: any) {
          await supabase.auth.signOut();
          setValidating(false);
          toast({
            variant: "destructive",
            title: "Security Check Failed",
            description: `Could not verify user roles: ${err.message || 'Unknown database error'}.`
          });
          setLoading(false);
          return;
        }

        if (!existingRole) {
          await supabase.auth.signOut();
          setValidating(false);
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "No role assigned to this account. Please contact an administrator."
          });
          setLoading(false);
          return;
        }

        // Role verified — allow navigation
        setValidating(false);
        if (existingRole === 'admin') navigate('/admin-dashboard', { replace: true });
        else if (existingRole === 'official' || existingRole === 'health_official') navigate('/official-dashboard', { replace: true });
        else if (existingRole === 'clinic_staff') navigate('/clinic-dashboard', { replace: true });
        else navigate('/community-dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      console.error('[Auth] handleLogin error:', msg);
      setValidating(false);
      toast({ variant: "destructive", title: "Login Error", description: msg });
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    if (otpCode !== generatedOtp) {
      toast({ variant: "destructive", title: "Invalid OTP", description: "The code you entered is incorrect." });
      setLoading(false);
      return;
    }
    dismiss();
    setLoading(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const existingRole = await checkExistingRole(user.id);
        if (existingRole) {
          if (existingRole === 'admin') navigate('/admin-dashboard', { replace: true });
          else if (existingRole === 'official' || existingRole === 'health_official') navigate('/official-dashboard', { replace: true });
          else if (existingRole === 'clinic_staff') navigate('/clinic-dashboard', { replace: true });
          else navigate('/community-dashboard', { replace: true });
          return;
        } else {
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "No role assigned to this account."
          });
          navigate('/auth', { replace: true });
          return;
        }
      } catch (err: any) {
        await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: "Session Error",
          description: `Failed to confirm roles: ${err.message || 'Unknown error'}`
        });
        navigate('/auth', { replace: true });
        return;
      }
    }
    navigate('/auth', { replace: true });
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    const otp = generateOTP();
    setGeneratedOtp(otp);
    setResendTimer(60);
    await sendOtpEmail(pendingEmail, otp);
    toast({ title: "🔐 New Code Sent", description: "Check your email for the new OTP.", duration: 10000 });
  };

  const handleBackToLogin = async () => {
    await supabase.auth.signOut();
    setAuthStep('credentials');
    setOtpCode('');
  };

  // ── OTP Verification Screen ──
  if (authStep === 'otp-verify') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[hsl(210,30%,8%)]">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(200,85%,45%)] opacity-10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[hsl(155,65%,50%)] opacity-10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(hsl(200,85%,55%) 1px, transparent 1px), linear-gradient(90deg, hsl(200,85%,55%) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative z-10 w-full max-w-md px-4">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 relative"
                style={{ background: 'linear-gradient(135deg, hsl(200,85%,45%), hsl(155,65%,50%))' }}>
                <Shield className="w-10 h-10 text-white" />
                <div className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                  style={{ background: 'linear-gradient(135deg, hsl(200,85%,45%), hsl(155,65%,50%))' }} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{t('auth.verifyIdentity')}</h2>
              <p className="text-white/60 text-sm">{t('auth.mfaSent')}</p>
              <p className="text-[hsl(200,85%,65%)] font-medium">{pendingEmail}</p>
            </div>

            <div className="flex justify-center mb-6">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup className="gap-3">
                  {[0,1,2,3,4,5].map(i => (
                    <InputOTPSlot key={i} index={i}
                      className="w-12 h-14 text-xl rounded-xl border-2 border-white/20 bg-white/10 text-white backdrop-blur-sm focus:border-[hsl(200,85%,55%)]" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerifyOTP}
              className="w-full h-12 text-base font-semibold rounded-xl mb-3"
              disabled={loading || otpCode.length !== 6}
              style={{ background: 'linear-gradient(135deg, hsl(200,85%,45%), hsl(155,65%,50%))' }}
            >
              {loading ? t('auth.verifying') : `🔐 ${t('auth.verifyAccess')}`}
            </Button>

            <div className="text-center mb-3">
              <button onClick={handleResendOTP} disabled={resendTimer > 0}
                className="text-sm text-white/60 hover:text-white transition-colors disabled:opacity-40">
                {resendTimer > 0 ? t('auth.resendIn', { seconds: resendTimer }) : t('auth.resendCode')}
              </button>
            </div>

            <Button variant="ghost" onClick={handleBackToLogin} className="w-full text-white/60 hover:text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" /> {t('auth.backToLogin')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Login Screen ──
  return (
    <div className="auth-page min-h-screen flex relative overflow-hidden bg-[hsl(210,30%,8%)]">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-30"
          style={{ background: 'radial-gradient(ellipse at 20% 50%, hsl(200,85%,30%) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, hsl(155,65%,25%) 0%, transparent 50%)' }} />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(hsl(200,85%,55%) 1px, transparent 1px), linear-gradient(90deg, hsl(200,85%,55%) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-20 animate-pulse"
            style={{
              width: `${[40, 60, 30, 50, 35, 45][i]}px`,
              height: `${[40, 60, 30, 50, 35, 45][i]}px`,
              left: `${[10, 25, 50, 70, 85, 60][i]}%`,
              top: `${[20, 70, 40, 15, 60, 80][i]}%`,
              background: i % 2 === 0 ? 'hsl(200,85%,55%)' : 'hsl(155,65%,50%)',
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i}s`,
            }} />
        ))}
      </div>

      {/* LEFT PANEL — Branding */}
      <div className="auth-left-panel hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative z-10">
        <div className="auth-brand-content max-w-lg text-center w-full">
          {/* Logo */}
          <div className="relative inline-block mb-8">
            <img
              src="/logo.png"
              alt="AquaGuard AI Logo"
              className="w-36 h-36 object-contain drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 0 24px hsl(200,85%,55% / 0.5))' }}
            />
          </div>

          {/* Hero Title */}
          <h1 className="auth-hero-title font-black text-white mb-3 tracking-tight">
            {i18n.language === 'ta' ? t('auth.appTitle') : (<>Aqua<span style={{ color: 'hsl(200,85%,60%)' }}>Guard</span> AI</>)}
          </h1>
          <p className="auth-subtitle text-white/70 mb-8 leading-relaxed">
            {t('auth.subtitle')}
          </p>

          {/* Feature Badges */}
          <div className="auth-feature-badges flex flex-wrap gap-3 justify-center mb-8">
            {[
              { icon: <Activity className="w-4 h-4 flex-shrink-0" />, text: t('auth.realTimeIot') },
              { icon: <Shield className="w-4 h-4 flex-shrink-0" />, text: t('auth.aiPrediction') },
              { icon: <Wifi className="w-4 h-4 flex-shrink-0" />, text: t('auth.forecast714') },
            ].map((f, i) => (
              <div key={i} className="auth-feature-badge flex items-center justify-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm"
                style={{ background: 'hsl(200,85%,55% / 0.15)', border: '1px solid hsl(200,85%,55% / 0.3)' }}>
                <span style={{ color: 'hsl(200,85%,65%)' }}>{f.icon}</span>
                <span className="text-white/80 text-sm font-medium leading-tight">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-2 gap-4 text-center">
            {[
              { emoji: "🌱", role: t('auth.volunteerAsha'), desc: t('auth.reportStayInformed') },
              { emoji: "🏥", role: t('auth.healthOfficial'), desc: t('auth.fullDashboardAccess') },
            ].map((r, i) => (
              <div key={i} className="auth-role-card p-4 rounded-2xl backdrop-blur-sm flex flex-col items-center justify-start"
                style={{ background: 'hsl(200,85%,55% / 0.08)', border: '1px solid hsl(200,85%,55% / 0.2)' }}>
                <div className="text-3xl mb-2 flex-shrink-0">{r.emoji}</div>
                <p className="text-white text-sm font-semibold leading-tight mb-1">{r.role}</p>
                <p className="text-white/40 text-xs leading-tight">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="auth-login-panel w-full">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center mb-3">
              <img src="/logo.png" alt="AquaGuard AI Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-3xl font-black text-white">{i18n.language === 'ta' ? t('auth.appTitle') : 'AquaGuard AI'}</h1>
          </div>

          <div className="auth-login-card backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
            style={{ background: 'hsl(210,25%,12% / 0.8)', border: '1px solid hsl(200,85%,55% / 0.2)' }}>

            {/* Language switcher */}
            <div className="flex justify-end mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10 gap-1.5">
                    <Globe className="h-4 w-4" />
                    <span>{languages.find(l => l.code === i18n.language)?.nativeName || "English"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => i18n.changeLanguage(lang.code)}
                      className={`hover:bg-white/10 focus:bg-white/10 cursor-pointer ${i18n.language === lang.code ? 'bg-white/15' : ''}`}
                    >
                      <span>{lang.nativeName}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Login heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">{t('auth.welcomeBack')}</h2>
              <p className="text-white/50 text-sm">{t('auth.signInToAccount')}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label className="text-white/70 text-sm mb-2 block">{t('auth.emailAddress')}</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  className="h-12 rounded-xl text-white border-0 focus-visible:ring-2"
                  style={{ background: 'hsl(210,30%,8%)', color: 'white' }}
                />
              </div>

              <div>
                <Label className="text-white/70 text-sm mb-2 block">{t('auth.password')}</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('auth.passwordPlaceholder')}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    className="h-12 rounded-xl pr-12 text-white border-0"
                    style={{ background: 'hsl(210,30%,8%)', color: 'white' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                id="login-submit"
                type="submit"
                className="auth-login-btn w-full h-12 rounded-xl font-bold border-0"
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, hsl(200,85%,45%), hsl(155,65%,50%))' }}
              >
                {loading ? t('auth.authenticating') : `🔐 ${t('auth.secureLogin')}`}
              </Button>
            </form>

            <p className="text-center text-xs text-white/30 mt-6">
              {t('auth.securedByMfa')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
