import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, ArrowLeft, Droplets, Wifi, Activity, Users, UserCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthStep = 'credentials' | 'otp-verify' | 'role-select';
type AuthMode = 'login' | 'signup';
type SelectedRole = 'citizen' | 'official';

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const PasswordStrengthBar = ({ password }: { password: string }) => {
  const strength = getPasswordStrength(password);
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i <= strength ? colors[strength] : 'hsl(var(--muted))',
            }}
          />
        ))}
      </div>
      <p className="text-xs font-medium transition-colors" style={{ color: colors[strength] }}>
        {labels[strength]}
      </p>
    </div>
  );
};

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SelectedRole | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", confirmPassword: "", fullName: "", phone: "" });

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
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    if (data && data.length > 0) return data[0].role;
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });
      if (error) {
        toast({ variant: "destructive", title: "Login Failed", description: error.message });
        setLoading(false);
        return;
      }
      if (data.user) {
        setIsNewUser(false);
        const otp = generateOTP();
        setGeneratedOtp(otp);
        setPendingEmail(loginData.email);
        setAuthStep('otp-verify');
        setResendTimer(60);
        await sendOtpEmail(loginData.email, otp);
        toast({ title: "🔐 Verification Code Sent", description: "Check your email for the OTP code.", duration: 10000 });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      console.error('[Auth] handleLogin error:', msg);
      toast({ variant: "destructive", title: "Login Error", description: msg });
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password !== signupData.confirmPassword) {
      toast({ variant: "destructive", title: "Password Mismatch", description: "Passwords do not match." });
      return;
    }
    if (getPasswordStrength(signupData.password) < 3) {
      toast({ variant: "destructive", title: "Weak Password", description: "Please use a stronger password." });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: signupData.fullName, phone: signupData.phone },
        },
      });
      if (error) {
        toast({ variant: "destructive", title: "Signup Failed", description: error.message });
        setLoading(false);
        return;
      }
      if (data.user) {
        setIsNewUser(true);
        const otp = generateOTP();
        setGeneratedOtp(otp);
        setPendingEmail(signupData.email);
        setAuthStep('otp-verify');
        setResendTimer(60);
        await sendOtpEmail(signupData.email, otp);
        toast({ title: "✅ Account Created!", description: "Check your email for the verification code.", duration: 10000 });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      console.error('[Auth] handleSignup error:', msg);
      toast({ variant: "destructive", title: "Signup Error", description: msg });
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
    toast({ title: "✓ Verified!", description: "Identity confirmed." });
    setLoading(false);

    // Check if user already has a role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const existingRole = await checkExistingRole(user.id);
      if (existingRole) {
        // Already has a role — go directly to dashboard
        if (existingRole === 'admin' || existingRole === 'official') {
          navigate('/official-dashboard', { replace: true });
        } else {
          navigate('/community-dashboard', { replace: true });
        }
        return;
      }
    }
    // No role yet — go to community dashboard
    navigate('/community-dashboard', { replace: true });
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
    setSelectedRole(null);
  };

  // ── OTP Screen ──
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
              <h2 className="text-3xl font-bold text-white mb-2">Verify Identity</h2>
              <p className="text-white/60 text-sm">MFA code sent to</p>
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
              {loading ? "Verifying..." : "🔐 Verify & Access"}
            </Button>

            <div className="text-center mb-3">
              <button onClick={handleResendOTP} disabled={resendTimer > 0}
                className="text-sm text-white/60 hover:text-white transition-colors disabled:opacity-40">
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
              </button>
            </div>

            <Button variant="ghost" onClick={handleBackToLogin} className="w-full text-white/60 hover:text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Login / Signup Screen ──
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[hsl(210,30%,8%)]">
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
              width: `${Math.random() * 60 + 20}px`,
              height: `${Math.random() * 60 + 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 2 === 0 ? 'hsl(200,85%,55%)' : 'hsl(155,65%,50%)',
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i}s`,
            }} />
        ))}
      </div>

      {/* LEFT PANEL - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative z-10">
        <div className="max-w-lg text-center">
          <div className="relative inline-block mb-8">
            <div className="w-32 h-32 rounded-3xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, hsl(200,85%,45%), hsl(155,65%,50%))',
                boxShadow: '0 20px 60px hsl(200,85%,45% / 0.4), 0 0 0 1px hsl(200,85%,55% / 0.2)',
                transform: 'perspective(500px) rotateX(5deg) rotateY(-5deg)',
              }}>
              <Droplets className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -inset-4 rounded-3xl opacity-20 blur-xl"
              style={{ background: 'linear-gradient(135deg, hsl(200,85%,45%), hsl(155,65%,50%))' }} />
          </div>

          <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
            Aqua<span style={{ color: 'hsl(200,85%,60%)' }}>Guard</span> AI
          </h1>
          <p className="text-xl text-white/70 mb-8 leading-relaxed">
            Smart Community Health Monitoring &<br />Early Warning System for Water-Borne Diseases
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {[
              { icon: <Activity className="w-4 h-4" />, text: "Real-Time IoT" },
              { icon: <Shield className="w-4 h-4" />, text: "AI Prediction" },
              { icon: <Wifi className="w-4 h-4" />, text: "7-14 Day Forecast" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm"
                style={{ background: 'hsl(200,85%,55% / 0.15)', border: '1px solid hsl(200,85%,55% / 0.3)' }}>
                <span style={{ color: 'hsl(200,85%,65%)' }}>{f.icon}</span>
                <span className="text-white/80 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Two role cards */}
          <div className="grid grid-cols-2 gap-4 text-center">
            {[
              { emoji: "🌱", role: "Community / Citizen", desc: "Report & stay informed" },
              { emoji: "🏥", role: "Health Official", desc: "Full dashboard access" },
            ].map((r, i) => (
              <div key={i} className="p-4 rounded-2xl backdrop-blur-sm"
                style={{ background: 'hsl(200,85%,55% / 0.08)', border: '1px solid hsl(200,85%,55% / 0.2)' }}>
                <div className="text-3xl mb-2">{r.emoji}</div>
                <p className="text-white text-sm font-semibold">{r.role}</p>
                <p className="text-white/40 text-xs">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
              style={{ background: 'linear-gradient(135deg, hsl(200,85%,45%), hsl(155,65%,50%))' }}>
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white">AquaGuard AI</h1>
          </div>

          <div className="backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
            style={{ background: 'hsl(210,25%,12% / 0.8)', border: '1px solid hsl(200,85%,55% / 0.2)' }}>

            <div className="flex rounded-2xl p-1 mb-8" style={{ background: 'hsl(210,30%,8%)' }}>
              {(['login', 'signup'] as AuthMode[]).map(mode => (
                <button key={mode} onClick={() => setAuthMode(mode)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={authMode === mode ? {
                    background: 'linear-gradient(135deg, hsl(200,85%,45%), hsl(155,65%,50%))',
                    color: 'white',
                    boxShadow: '0 4px 12px hsl(200,85%,45% / 0.4)'
                  } : { color: 'hsl(210,15%,65%)' }}>
                  {mode === 'login' ? '🔑 Login' : '✨ Sign Up'}
                </button>
              ))}
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <Label className="text-white/70 text-sm mb-2 block">Email Address</Label>
                  <Input type="email" placeholder="official@aquaguard.gov"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    className="h-12 rounded-xl text-white border-0 focus-visible:ring-2"
                    style={{ background: 'hsl(210,30%,8%)', color: 'white' }} />
                </div>
                <div>
                  <Label className="text-white/70 text-sm mb-2 block">Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="h-12 rounded-xl pr-12 text-white border-0"
                      style={{ background: 'hsl(210,30%,8%)', color: 'white' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: 'hsl(200,85%,45% / 0.1)', border: '1px solid hsl(200,85%,55% / 0.2)' }}>
                  <Shield className="h-5 w-5 flex-shrink-0" style={{ color: 'hsl(200,85%,65%)' }} />
                  <span className="text-white/60 text-sm">OTP verification required after login</span>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold border-0" disabled={loading}
                  style={{ background: 'linear-gradient(135deg, hsl(200,85%,45%), hsl(155,65%,50%))' }}>
                  {loading ? "Authenticating..." : "🔐 Secure Login"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/70 text-sm mb-2 block">Full Name</Label>
                    <Input type="text" placeholder="Dr. Rajesh Kumar"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      required className="h-11 rounded-xl text-white border-0"
                      style={{ background: 'hsl(210,30%,8%)', color: 'white' }} />
                  </div>
                  <div>
                    <Label className="text-white/70 text-sm mb-2 block">Phone (+91)</Label>
                    <Input type="tel" placeholder="+91 9876543210"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                      className="h-11 rounded-xl text-white border-0"
                      style={{ background: 'hsl(210,30%,8%)', color: 'white' }} />
                  </div>
                </div>
                <div>
                  <Label className="text-white/70 text-sm mb-2 block">Email Address</Label>
                  <Input type="email" placeholder="your@email.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required className="h-11 rounded-xl text-white border-0"
                    style={{ background: 'hsl(210,30%,8%)', color: 'white' }} />
                </div>
                <div>
                  <Label className="text-white/70 text-sm mb-2 block">Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="Create strong password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required minLength={6} className="h-11 rounded-xl pr-12 text-white border-0"
                      style={{ background: 'hsl(210,30%,8%)', color: 'white' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthBar password={signupData.password} />
                </div>
                <div>
                  <Label className="text-white/70 text-sm mb-2 block">Confirm Password</Label>
                  <div className="relative">
                    <Input type={showConfirmPassword ? "text" : "password"} placeholder="Repeat password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      required className="h-11 rounded-xl pr-12 text-white border-0"
                      style={{ background: 'hsl(210,30%,8%)', color: 'white' }} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signupData.confirmPassword && signupData.password !== signupData.confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11 rounded-xl text-base font-bold border-0 mt-2" disabled={loading}
                  style={{ background: 'linear-gradient(135deg, hsl(155,65%,45%), hsl(200,85%,45%))' }}>
                  {loading ? "Creating Account..." : "🚀 Create Account + OTP"}
                </Button>
              </form>
            )}

            <p className="text-center text-xs text-white/30 mt-6">
              Secured by Government-Grade MFA • AquaGuard AI v2.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
