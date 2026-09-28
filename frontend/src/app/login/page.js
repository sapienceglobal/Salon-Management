'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { loginSchema, formatZodErrors } from '@/lib/validations';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  RiMailLine, 
  RiLockLine, 
  RiEyeLine, 
  RiEyeOffLine, 
  RiArrowRightLine, 
  RiArrowLeftLine,
  RiShieldCheckLine, 
  RiCustomerService2Line, 
  RiCloudLine,
  RiCalendarEventLine,
  RiUserHeartLine,
  RiBox3Line,
  RiBarChartGroupedLine,
  RiSettings3Line,
  RiLockPasswordLine,
  RiCheckLine,
  RiCheckboxCircleFill
} from 'react-icons/ri';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'staff', 'receptionist'];

const FEATURES = [
  { icon: RiCalendarEventLine, label: 'Online & In-store\nAppointments' },
  { icon: RiUserHeartLine, label: 'Customer Management\n& CRM' },
  { icon: RiBox3Line, label: 'Inventory & Products' },
  { icon: RiBarChartGroupedLine, label: 'Reports & Analytics' },
  { icon: RiSettings3Line, label: 'Multi-Branch Management' },
];

function LoginFormContent() {
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: 'login' | 'forgot'
  const [viewMode, setViewMode] = useState(() => searchParams.get('view') === 'forgot' ? 'forgot' : 'login');

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => searchParams.get('error') === 'unauthorized' ? 'Access denied. You do not have admin privileges.' : '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Forgot Password States
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(45);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const forgotEmailInputRef = useRef(null);
  const otpBox0Ref = useRef(null);
  const otpBox1Ref = useRef(null);
  const otpBox2Ref = useRef(null);
  const otpBox3Ref = useRef(null);
  const otpBox4Ref = useRef(null);
  const otpBox5Ref = useRef(null);

  const otpRefs = [otpBox0Ref, otpBox1Ref, otpBox2Ref, otpBox3Ref, otpBox4Ref, otpBox5Ref];

  // If already authenticated as admin, redirect to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && ADMIN_ROLES.includes(user.role)) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Synchronize browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setViewMode(params.get('view') === 'forgot' ? 'forgot' : 'login');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Cooldown countdown for OTP resend
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Switch between Login and Forgot Password modes smoothly
  const switchToForgot = () => {
    if (email) setForgotEmail(email);
    setForgotError('');
    setForgotStep(1);
    setViewMode('forgot');
    window.history.pushState(null, '', '/login?view=forgot');
    setTimeout(() => {
      if (forgotEmailInputRef.current) forgotEmailInputRef.current.focus();
    }, 100);
  };

  const switchToLogin = () => {
    if (forgotEmail) setEmail(forgotEmail);
    setError('');
    setFieldErrors({});
    setViewMode('login');
    setForgotStep(1);
    setOtpDigits(['', '', '', '', '', '']);
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    window.history.pushState(null, '', '/login');
    setTimeout(() => {
      if (emailInputRef.current) emailInputRef.current.focus();
    }, 100);
  };

  // Login Submit Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Zod Form Validation
    const validationResult = loginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const errors = formatZodErrors(validationResult.error);
      setFieldErrors(errors);

      if (errors.email && emailInputRef.current) {
        emailInputRef.current.focus();
      } else if (errors.password && passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const data = await login(email.trim(), password, rememberMe);

      if (!ADMIN_ROLES.includes(data.user?.role)) {
        sessionStorage.removeItem('accessToken');
        localStorage.removeItem('accessToken');
        setError('Access denied. This login is for staff and administrators only.');
        setLoading(false);
        return;
      }

      router.replace('/');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Invalid email or password';
      setError(errorMsg);
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
        passwordInputRef.current.select();
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: Step 1 - Request OTP / Reset Link
  const handleRequestResetLink = async (e) => {
    e.preventDefault();
    setForgotError('');

    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail) {
      setForgotError('Please enter your email address');
      if (forgotEmailInputRef.current) forgotEmailInputRef.current.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setForgotError('Please enter a valid email address');
      if (forgotEmailInputRef.current) forgotEmailInputRef.current.focus();
      return;
    }

    setForgotLoading(true);

    try {
      await api.post('/auth/forgot-password', { email: trimmedEmail });
      toast.success('Verification code sent to your email!');
      setForgotStep(2);
      setResendCooldown(45);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        if (otpRefs[0]?.current) otpRefs[0].current.focus();
      }, 150);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to send reset code. Please try again.';
      setForgotError(errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  // OTP Box Change Handler
  const handleOtpDigitChange = (index, value) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    if (forgotError) setForgotError('');

    // Advance to next box if digit entered
    if (digit && index < 5) {
      otpRefs[index + 1]?.current?.focus();
    }
  };

  // OTP Keydown (Backspace navigation)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        otpRefs[index - 1]?.current?.focus();
      }
    }
  };

  // OTP Paste Support
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);
    if (forgotError) setForgotError('');

    const nextIndex = Math.min(pasted.length, 5);
    otpRefs[nextIndex]?.current?.focus();
  };

  // Forgot Password: Step 2 - Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotError('');

    const fullOtp = otpDigits.join('').trim();
    if (!fullOtp || fullOtp.length < 6) {
      setForgotError('Please enter all 6 digits of the verification code');
      const emptyIdx = otpDigits.findIndex(d => !d);
      if (emptyIdx !== -1) otpRefs[emptyIdx]?.current?.focus();
      return;
    }

    setForgotLoading(true);

    try {
      await api.post('/auth/verify-otp', { 
        email: forgotEmail.trim(), 
        otp: fullOtp 
      });
      toast.success('Code verified successfully!');
      setForgotStep(3);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Invalid or expired verification code';
      setForgotError(errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Resend OTP / Code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || forgotLoading) return;
    setForgotError('');
    setForgotLoading(true);

    try {
      await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      toast.success('New verification code sent to your email!');
      setResendCooldown(45);
      setOtpDigits(['', '', '', '', '', '']);
      if (otpRefs[0]?.current) otpRefs[0].current.focus();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to resend code';
      setForgotError(errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Password Requirements (Matching Image 2 exactly)
  const reqLength = forgotNewPassword.length >= 8;
  const reqMix = (
    /[a-zA-Z]/.test(forgotNewPassword) && 
    /[0-9]/.test(forgotNewPassword) && 
    /[^a-zA-Z0-9]/.test(forgotNewPassword)
  );
  const reqMatch = forgotNewPassword.length > 0 && forgotNewPassword === forgotConfirmPassword;

  // Forgot Password: Step 3 - Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (!reqLength) {
      setForgotError('Password must be at least 8 characters');
      return;
    }

    if (!reqMix) {
      setForgotError('Password must include a mix of letters, numbers and symbols');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }

    setForgotLoading(true);

    try {
      await api.post('/auth/reset-password', { 
        email: forgotEmail.trim(), 
        token: otpDigits.join(''), 
        password: forgotNewPassword 
      });
      toast.success('Password reset successfully!');
      setForgotStep(4);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to reset password. Please try again.';
      setForgotError(errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden w-full relative bg-[#FAF7F9] flex flex-col justify-between font-sans selection:bg-[#E91E63]/20 selection:text-[#E91E63]">
      
      {/* ===== 1. BACKGROUND SALON IMAGE (EXTENDS DEEP UNDER THE FLOATING CARD) ===== */}
      <div className="absolute inset-y-0 left-0 w-full lg:w-[86%] xl:w-[90%] h-full z-0 overflow-hidden pointer-events-none">
        <Image 
          src="/salon_login_bg.jpg" 
          alt="Luxury Salon Interior" 
          fill 
          priority 
          className="object-cover object-[center_right] lg:object-[20%_center] opacity-30 lg:opacity-100" 
        />
        {/* Soft white gradient overlay ensuring 100% text contrast while letting the mirror and chair bloom through */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 via-36% via-white/70 via-48% to-transparent w-full lg:w-[56%] xl:w-[58%]" />
      </div>

      {/* ===== 2. ORGANIC SWEEPING WAVES (FLOWING BEHIND THE FLOATING CARD) ===== */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden lg:block"
        viewBox="0 0 1440 900" 
        preserveAspectRatio="none"
      >
        {/* Top-right corner accent */}
        <path d="M 1240,0 C 1300,90 1380,170 1440,210 L 1440,0 Z" fill="#FDE8F1" opacity="0.75" />
        {/* Bottom-right corner accent */}
        <path d="M 1440,680 C 1360,730 1270,810 1180,900 L 1440,900 Z" fill="#FDE8F1" opacity="0.65" />
        
        {/* Soft Outer Blush Wave (Sweeping gracefully behind the card) */}
        <path d="M 1020,0 C 1150,260 1080,580 820,900 L 1440,900 L 1440,0 Z" fill="#FDE8F1" opacity="0.4" />
        
        {/* Vibrant Pink Organic Wave (Flowing right behind the floating card) */}
        <path d="M 1060,0 C 1190,270 1120,590 860,900 L 1440,900 L 1440,0 Z" fill="#FCE7F3" opacity="0.85" />
        {/* Subtle accent hairline on wave edge for refined definition */}
        <path d="M 1060,0 C 1190,270 1120,590 860,900" fill="none" stroke="#E91E63" strokeWidth="1.5" strokeOpacity="0.2" />
        
        {/* Soft Background Fill Behind the Card */}
        <path d="M 1110,0 C 1240,280 1170,600 910,900 L 1440,900 L 1440,0 Z" fill="#FAF7F9" />
      </svg>

      {/* ===== 3. MAIN CONTENT LAYER (FULL WIDTH WITH EDGE PADDING - NO LEFT VOID) ===== */}
      <div className="relative z-20 w-full px-6 sm:px-10 lg:px-12 xl:px-16 py-4 lg:py-6 flex-1 flex flex-col justify-between">
        
        {/* Header Row */}
        <div className="flex items-center justify-between w-full">
          
          {/* Brand Logo (Authentic transparent logo matching brand identity perfectly) */}
          <div onClick={switchToLogin} className="flex items-center cursor-pointer select-none">
            <Image 
              src="/salontime-brand-logo.png" 
              alt="SalonTime - Appointments | CRM | Salon Management" 
              width={260} 
              height={66} 
              priority
              className="h-10 sm:h-11 md:h-12 w-auto object-contain drop-shadow-sm transition-transform duration-200 hover:scale-[1.02]"
            />
          </div>

          {/* Top Right Tagline */}
          <div className="hidden sm:flex items-center gap-3 text-right">
            <div>
              <div className="text-xs font-semibold text-gray-700 leading-tight">Beautiful Salons</div>
              <div className="text-xs font-semibold text-gray-700 leading-tight">Stronger Businesses</div>
            </div>
            <div className="w-[3px] h-6 bg-[#E91E63] rounded-full shrink-0" />
          </div>
        </div>

        {/* Center Row: Left Info + Right Floating Form Card (Rigid container - zero layout shift) */}
        <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-8 my-auto lg:my-0 py-4 lg:py-0">
          
          {/* ===== LEFT BRAND HERO (ROCK-SOLID POSITION - NEVER DISTURBED BY RIGHT CARD) ===== */}
          <div className="w-full lg:max-w-[420px] xl:max-w-[450px] flex flex-col lg:self-center shrink-0">
            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] xl:text-[3rem] font-extrabold text-[#111827] leading-[1.12] tracking-tight font-heading">
              Manage Your Salon<br />
              Business <span className="text-[#E91E63]">Smarter</span>
            </h1>

            <p className="text-xs sm:text-[13px] text-gray-700 font-medium leading-relaxed mt-2.5 max-w-sm sm:max-w-md">
              All-in-one salon management system to handle appointments, customers, staff, inventory, billing and more.
            </p>

            {/* Feature List (5 Icons) */}
            <div className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3">
              {FEATURES.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div key={idx} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-pink-50/90 border border-pink-200/60 flex items-center justify-center text-[#E91E63] text-base shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105">
                      <Icon />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-800 whitespace-pre-line leading-tight">
                      {feat.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Brand Accent Tagline at bottom-left (Matching original UI reference) */}
            <div className="mt-6 sm:mt-8 pt-4 border-t border-gray-200/60 max-w-[200px]">
              <div className="w-8 h-[2px] bg-[#E91E63] mb-2 rounded-full" />
              <div className="text-[10.5px] font-bold tracking-[0.18em] text-gray-400 uppercase leading-tight font-heading">
                BEAUTY BUSINESS
              </div>
              <div className="text-[10.5px] font-bold tracking-[0.18em] text-gray-400 uppercase leading-tight font-heading">
                MADE SIMPLE
              </div>
            </div>
          </div>

          {/* ===== RIGHT FLOATING CARD (NATURAL PREMIUM PROPORTIONS) ===== */}
          <div className="w-full max-w-[420px] lg:w-[410px] xl:w-[430px] bg-white rounded-3xl p-6 sm:p-7 xl:p-8 shadow-[0_20px_60px_-15px_rgba(233,30,99,0.12)] border border-pink-100/70 transition-shadow duration-200 mx-auto lg:mx-0 shrink-0">
            
            {/* ============================================================== */}
            {/* VIEW A: LOGIN FORM                                             */}
            {/* ============================================================== */}
            {viewMode === 'login' ? (
              <div key="login-card" className="animate-[fadeIn_0.25s_ease-out]">
                {/* Card Title */}
                <div className="mb-5">
                  <h2 className="text-2xl sm:text-[1.7rem] font-extrabold text-[#111827] font-heading tracking-tight leading-tight">
                    Welcome Back
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                    Login to your <span className="text-[#E91E63] font-bold">SalonTime</span> account
                  </p>
                </div>

                {/* Form with noValidate */}
                <form onSubmit={handleLoginSubmit} noValidate className="space-y-3.5">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3.5 py-2.5 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                      <span className="text-sm shrink-0">⚠</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Email Address */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Email Address
                    </label>
                    <div className={`relative flex items-center rounded-xl border bg-white transition-all ${
                      fieldErrors.email 
                        ? 'border-red-500 ring-2 ring-red-100' 
                        : 'border-gray-200 hover:border-gray-300 focus-within:border-[#E91E63] focus-within:ring-2 focus-within:ring-pink-100'
                    }`}>
                      <RiMailLine className={`text-base ml-3.5 mr-2 shrink-0 ${fieldErrors.email ? 'text-red-400' : 'text-gray-400'}`} />
                      <input
                        ref={emailInputRef}
                        type="text"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                        }}
                        placeholder="Enter your email address"
                        autoComplete="username"
                        className="w-full py-2.5 pr-4 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-red-500 text-[11px] font-medium mt-1 flex items-center gap-1 animate-[fadeIn_0.2s_ease-out]">
                        <span>⚠</span>
                        <span>{fieldErrors.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Password
                    </label>
                    <div className={`relative flex items-center rounded-xl border bg-white transition-all ${
                      fieldErrors.password 
                        ? 'border-red-500 ring-2 ring-red-100' 
                        : 'border-gray-200 hover:border-gray-300 focus-within:border-[#E91E63] focus-within:ring-2 focus-within:ring-pink-100'
                    }`}>
                      <RiLockLine className={`text-base ml-3.5 mr-2 shrink-0 ${fieldErrors.password ? 'text-red-400' : 'text-gray-400'}`} />
                      <input
                        ref={passwordInputRef}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                        }}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="w-full py-2.5 pr-10 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <RiEyeOffLine size={17} /> : <RiEyeLine size={17} />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-red-500 text-[11px] font-medium mt-1 flex items-center gap-1 animate-[fadeIn_0.2s_ease-out]">
                        <span>⚠</span>
                        <span>{fieldErrors.password}</span>
                      </p>
                    )}
                  </div>

                  {/* Keep me signed in & Forgot Password Button */}
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#E91E63] focus:ring-[#E91E63] accent-[#E91E63] cursor-pointer"
                      />
                      <span className="text-xs font-medium text-gray-700">Keep me signed in</span>
                    </label>
                    <button
                      type="button"
                      onClick={switchToForgot}
                      className="text-xs font-semibold text-[#E91E63] hover:text-[#c2185b] transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 sm:py-3.5 px-6 rounded-xl bg-[#E91E63] hover:bg-[#d81557] text-white font-bold text-sm shadow-md shadow-pink-500/25 hover:shadow-lg hover:shadow-pink-500/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Login</span>
                        <RiArrowRightLine className="text-base" />
                      </>
                    )}
                  </button>

                  {/* Don't have an account - Compact, directly below button */}
                  <p className="text-center text-xs text-gray-500 pt-2 font-medium">
                    Don&apos;t have an account?{' '}
                    <span 
                      onClick={() => alert('Please contact your salon administrator for system access credentials.')}
                      className="text-[#E91E63] font-semibold cursor-pointer hover:underline"
                    >
                      Contact your administrator.
                    </span>
                  </p>
                </form>
              </div>
            ) : (
              /* ============================================================== */
              /* VIEW B: FORGOT PASSWORD FLOW (MATCHING REFERENCE DESIGNS)      */
              /* ============================================================== */
              <div key="forgot-card" className="animate-[fadeIn_0.25s_ease-out]">
                
                {/* ------------------------------------------------------------ */}
                {/* STEP 1: Enter Email (Reference Image: Forgot Password?)      */}
                {/* ------------------------------------------------------------ */}
                {forgotStep === 1 && (
                  <div>
                    <div>
                      {/* Pink Padlock Badge with Radiance & Sparkles */}
                      <div className="text-center mb-4">
                        <div className="relative inline-flex items-center justify-center mb-2.5">
                          <div className="w-16 h-16 rounded-full bg-[#FFF0F5] border border-pink-100 flex items-center justify-center shadow-sm">
                            <svg className="w-8 h-8 text-[#E91E63]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              <circle cx="12" cy="16" r="1.5" fill="#E91E63" />
                            </svg>
                          </div>
                          {/* Decorative Pink Sparkles */}
                          <div className="absolute -top-1 -right-1.5 flex flex-col gap-0.5">
                            <span className="w-2.5 h-[2px] bg-pink-400 rotate-45 rounded-full" />
                            <span className="w-2.5 h-[2px] bg-pink-400 -rotate-12 rounded-full" />
                          </div>
                          <div className="absolute top-2 -left-1">
                            <span className="w-2 h-[2px] bg-pink-300 -rotate-45 rounded-full block" />
                          </div>
                        </div>

                        <h2 className="text-2xl sm:text-[1.65rem] font-bold text-[#111827] font-heading tracking-tight">
                          Forgot Password?
                        </h2>
                        <p className="text-xs sm:text-[13px] text-gray-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                          Enter your email address and we&apos;ll send you a link to reset your password.
                        </p>
                      </div>

                      {/* Email Form */}
                      <form onSubmit={handleRequestResetLink} noValidate className="space-y-4">
                        {forgotError && (
                          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3.5 py-2.5 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                            <span className="text-sm shrink-0">⚠</span>
                            <span>{forgotError}</span>
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-semibold text-gray-800 block mb-1.5">
                            Email Address <span className="text-[#E91E63]">*</span>
                          </label>
                          <div className="relative flex items-center rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-[#E91E63] focus-within:ring-2 focus-within:ring-pink-100 bg-white transition-all">
                            <RiMailLine className="text-base text-gray-400 ml-3.5 mr-2.5 shrink-0" />
                            <input
                              ref={forgotEmailInputRef}
                              type="email"
                              value={forgotEmail}
                              onChange={(e) => {
                                setForgotEmail(e.target.value);
                                if (forgotError) setForgotError('');
                              }}
                              placeholder="Enter your email address"
                              className="w-full py-2.5 pr-4 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
                            />
                          </div>
                        </div>

                        {/* Send Reset Link Button */}
                        <button
                          type="submit"
                          disabled={forgotLoading}
                          className="w-full py-3 px-6 rounded-xl bg-[#E91E63] hover:bg-[#d81557] text-white font-bold text-sm shadow-md shadow-pink-500/25 hover:shadow-lg hover:shadow-pink-500/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {forgotLoading ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Sending Reset Link...</span>
                            </>
                          ) : (
                            <>
                              <span>Send Reset Link</span>
                              <RiArrowRightLine className="text-base" />
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Back to Login Link */}
                    <button
                      type="button"
                      onClick={switchToLogin}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#E91E63] hover:text-[#c2185b] my-4 transition-colors cursor-pointer"
                    >
                      <RiArrowLeftLine className="text-sm" />
                      <span>Back to Login</span>
                    </button>
                  </div>
                )}

                {/* ------------------------------------------------------------ */}
                {/* STEP 2: Verify Your Email (Exact Match to Reference Image 1)  */}
                {/* ------------------------------------------------------------ */}
                {forgotStep === 2 && (
                  <div>
                    <div>
                      {/* Pink Envelope Badge with 3 Radiating Dashes */}
                      <div className="text-center mb-3">
                        <div className="relative inline-flex items-center justify-center mb-2">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FFF0F5] border border-pink-100 flex items-center justify-center shadow-sm">
                            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#E91E63]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="4" width="20" height="16" rx="3" />
                              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                          </div>
                          {/* 3 Radiating Pink Dashes on Top Right */}
                          <div className="absolute -top-0.5 -right-2 flex flex-col gap-1">
                            <span className="w-2.5 h-[2.5px] bg-[#E91E63] rotate-45 rounded-full" />
                            <span className="w-3 h-[2.5px] bg-[#E91E63] rotate-12 rounded-full" />
                            <span className="w-2.5 h-[2.5px] bg-[#E91E63] -rotate-25 rounded-full" />
                          </div>
                        </div>

                        <h2 className="text-2xl sm:text-[1.65rem] font-bold text-[#111827] font-heading tracking-tight leading-tight">
                          Verify Your Email
                        </h2>
                        <p className="text-xs sm:text-[13px] text-gray-500 mt-1 max-w-[300px] mx-auto leading-relaxed">
                          We&apos;ve sent a 6-digit verification code to
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-[#E91E63] mt-0.5 break-all">
                          {forgotEmail}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Enter the code below to verify your email address.
                        </p>
                      </div>

                      <form onSubmit={handleVerifyOtp} noValidate className="space-y-3">
                        {/* 6 Individual OTP Boxes */}
                        <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-1" onPaste={handleOtpPaste}>
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={otpRefs[idx]}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-xl font-bold text-gray-800 rounded-xl border bg-white focus:ring-2 outline-none transition-colors shadow-sm ${
                                forgotError 
                                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                                  : 'border-gray-200 focus:border-[#E91E63] focus:ring-pink-100'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Resend Code (00:45) */}
                        <div className="text-center text-xs text-gray-500 pt-0.5">
                          Didn&apos;t receive the code?{' '}
                          {resendCooldown > 0 ? (
                            <span className="text-[#E91E63] font-semibold">
                              Resend Code ({formatTime(resendCooldown)})
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleResendOtp}
                              disabled={forgotLoading}
                              className="text-[#E91E63] font-bold hover:underline cursor-pointer"
                            >
                              Resend Code
                            </button>
                          )}
                        </div>

                        {/* Error Message inside Card - Stationed above the action button so the OTP input boxes never move */}
                        {forgotError && (
                          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3.5 py-2 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                            <span className="text-sm shrink-0">⚠</span>
                            <span className="leading-tight">{forgotError}</span>
                          </div>
                        )}

                        {/* Verify & Continue Button */}
                        <button
                          type="submit"
                          disabled={forgotLoading || otpDigits.join('').length < 6}
                          className="w-full py-3 px-6 rounded-xl bg-[#E91E63] hover:bg-[#d81557] text-white font-bold text-sm shadow-md shadow-pink-500/25 hover:shadow-lg hover:shadow-pink-500/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {forgotLoading ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <span>Verify &amp; Continue</span>
                              <RiArrowRightLine className="text-base" />
                            </>
                          )}
                        </button>

                        {/* OR Divider */}
                        <div className="relative my-1">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                          </div>
                          <div className="relative flex justify-center text-[10.5px] uppercase">
                            <span className="bg-white px-3 text-gray-400 font-semibold">OR</span>
                          </div>
                        </div>

                        {/* Resend via Email Button */}
                        <button
                          type="button"
                          disabled={resendCooldown > 0 || forgotLoading}
                          onClick={handleResendOtp}
                          className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 text-gray-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RiMailLine className="text-base text-gray-500" />
                          <span>Resend via Email</span>
                        </button>
                      </form>
                    </div>

                    {/* Back to Login */}
                    <button
                      type="button"
                      onClick={switchToLogin}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#E91E63] hover:text-[#c2185b] my-3 transition-colors cursor-pointer py-1"
                    >
                      <RiArrowLeftLine className="text-sm" />
                      <span>Back to Login</span>
                    </button>
                  </div>
                )}

                {/* ------------------------------------------------------------ */}
                {/* STEP 3: Reset Password (Exact Match to Reference Image 2)    */}
                {/* ------------------------------------------------------------ */}
                {forgotStep === 3 && (
                  <div>
                    <div>
                      {/* Pink Padlock Badge with Concentric Radiance Circles */}
                      <div className="text-center mb-3">
                        <div className="relative inline-flex items-center justify-center mb-2">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FFF0F5] border border-pink-100 flex items-center justify-center shadow-sm relative">
                            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#E91E63]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              <circle cx="12" cy="16" r="1.5" fill="#E91E63" />
                            </svg>
                          </div>
                          {/* Concentric Signal Arc on Top Right */}
                          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#E91E63]/70 rounded-tr-full pointer-events-none" />
                          <div className="absolute -top-2.5 -right-2.5 w-9 h-9 border-t-2 border-r-2 border-[#E91E63]/40 rounded-tr-full pointer-events-none" />
                        </div>

                        <h2 className="text-2xl sm:text-[1.65rem] font-bold text-[#111827] font-heading tracking-tight leading-tight">
                          Reset Password
                        </h2>
                        <p className="text-xs sm:text-[13px] text-gray-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                          Enter your new password below.
                        </p>
                      </div>

                      <form onSubmit={handleResetPassword} noValidate className="space-y-3">
                        {forgotError && (
                          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3.5 py-2 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                            <span className="text-sm shrink-0">⚠</span>
                            <span className="leading-tight">{forgotError}</span>
                          </div>
                        )}

                        {/* New Password */}
                        <div>
                          <label className="text-xs font-semibold text-gray-800 block mb-1">
                            New Password <span className="text-[#E91E63]">*</span>
                          </label>
                          <div className="relative flex items-center rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-[#E91E63] focus-within:ring-2 focus-within:ring-pink-100 bg-white transition-all">
                            <RiLockLine className="text-base text-gray-400 ml-3.5 mr-2 shrink-0" />
                            <input
                              type={showForgotNewPassword ? 'text' : 'password'}
                              value={forgotNewPassword}
                              onChange={(e) => {
                                setForgotNewPassword(e.target.value);
                                if (forgotError) setForgotError('');
                              }}
                              placeholder="Enter new password"
                              className="w-full py-2.5 pr-10 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                              className="absolute right-3 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                            >
                              {showForgotNewPassword ? <RiEyeOffLine size={17} /> : <RiEyeLine size={17} />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm New Password */}
                        <div>
                          <label className="text-xs font-semibold text-gray-800 block mb-1">
                            Confirm New Password <span className="text-[#E91E63]">*</span>
                          </label>
                          <div className="relative flex items-center rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-[#E91E63] focus-within:ring-2 focus-within:ring-pink-100 bg-white transition-all">
                            <RiLockLine className="text-base text-gray-400 ml-3.5 mr-2 shrink-0" />
                            <input
                              type={showForgotConfirmPassword ? 'text' : 'password'}
                              value={forgotConfirmPassword}
                              onChange={(e) => {
                                setForgotConfirmPassword(e.target.value);
                                if (forgotError) setForgotError('');
                              }}
                              placeholder="Confirm new password"
                              className="w-full py-2.5 pr-10 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                              className="absolute right-3 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                            >
                              {showForgotConfirmPassword ? <RiEyeOffLine size={17} /> : <RiEyeLine size={17} />}
                            </button>
                          </div>
                        </div>

                        {/* Password Requirements Checklist (Exact Match to Image 2) */}
                        <div className="bg-[#FFF5F8] rounded-2xl p-3 sm:p-3.5 space-y-1.5 border border-pink-100/60">
                          {/* Requirement 1: At least 8 characters */}
                          <div className="flex items-center gap-2 sm:gap-2.5">
                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                              reqLength ? 'bg-[#E91E63] text-white' : 'border border-gray-300 bg-white text-transparent'
                            }`}>
                              <RiCheckLine className="text-xs" />
                            </div>
                            <span className={`text-[11px] sm:text-xs font-medium transition-colors ${reqLength ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
                              At least 8 characters
                            </span>
                          </div>

                          {/* Requirement 2: Include a mix of letters, numbers and symbols */}
                          <div className="flex items-center gap-2 sm:gap-2.5">
                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                              reqMix ? 'bg-[#E91E63] text-white' : 'border border-gray-300 bg-white text-transparent'
                            }`}>
                              <RiCheckLine className="text-xs" />
                            </div>
                            <span className={`text-[11px] sm:text-xs font-medium transition-colors ${reqMix ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
                              Include a mix of letters, numbers and symbols
                            </span>
                          </div>

                          {/* Requirement 3: Use a unique password */}
                          <div className="flex items-center gap-2 sm:gap-2.5">
                            <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                              reqMatch ? 'bg-[#E91E63] text-white' : 'border border-gray-300 bg-white text-transparent'
                            }`}>
                              <RiCheckLine className="text-xs" />
                            </div>
                            <span className={`text-[11px] sm:text-xs font-medium transition-colors ${reqMatch ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
                              Use a unique password
                            </span>
                          </div>
                        </div>

                        {/* Reset Password Button */}
                        <button
                          type="submit"
                          disabled={forgotLoading}
                          className="w-full py-3 px-6 rounded-xl bg-[#E91E63] hover:bg-[#d81557] text-white font-bold text-sm shadow-md shadow-pink-500/25 hover:shadow-lg hover:shadow-pink-500/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {forgotLoading ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Resetting Password...</span>
                            </>
                          ) : (
                            <>
                              <span>Reset Password</span>
                              <RiArrowRightLine className="text-base" />
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Back to Login */}
                    <button
                      type="button"
                      onClick={switchToLogin}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#E91E63] hover:text-[#c2185b] my-3 transition-colors cursor-pointer py-1"
                    >
                      <RiArrowLeftLine className="text-sm" />
                      <span>Back to Login</span>
                    </button>
                  </div>
                )}

                {/* ------------------------------------------------------------ */}
                {/* STEP 4: Success Screen                                       */}
                {/* ------------------------------------------------------------ */}
                {forgotStep === 4 && (
                  <div className="text-center py-3 animate-[fadeIn_0.3s_ease-out]">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm mx-auto mb-3 text-emerald-500">
                      <RiCheckboxCircleFill className="text-3xl" />
                    </div>

                    <h2 className="text-2xl sm:text-[1.65rem] font-bold text-[#111827] font-heading tracking-tight">
                      Password Reset!
                    </h2>
                    <p className="text-xs sm:text-[13px] text-gray-500 mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                      Your password has been reset successfully. You can now login with your new credentials.
                    </p>

                    <button
                      type="button"
                      onClick={switchToLogin}
                      className="w-full py-3 px-6 rounded-xl bg-[#E91E63] hover:bg-[#d81557] text-white font-bold text-sm shadow-md shadow-pink-500/25 hover:shadow-lg hover:shadow-pink-500/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
                    >
                      <span>Proceed to Login</span>
                      <RiArrowRightLine className="text-base" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ===== COMMON TRUST BADGES ===== */}
            <div className="grid grid-cols-3 gap-2 pt-4 mt-6 border-t border-gray-100">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <RiShieldCheckLine className="text-lg sm:text-xl text-[#E91E63] shrink-0" />
                <div className="text-[10px] sm:text-[10.5px] font-semibold text-gray-700 leading-tight">
                  Secure<br />Access
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <RiLockPasswordLine className="text-lg sm:text-xl text-[#E91E63] shrink-0" />
                <div className="text-[10px] sm:text-[10.5px] font-semibold text-gray-700 leading-tight">
                  Your Data<br />is Safe
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <RiCloudLine className="text-lg sm:text-xl text-[#E91E63] shrink-0" />
                <div className="text-[10px] sm:text-[10.5px] font-semibold text-gray-700 leading-tight">
                  Cloud Based<br />Anywhere Access
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Row */}
        <div className="text-center text-[11px] text-gray-400 py-1">
          &copy; {new Date().getFullYear()} SalonTime. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F9] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#E91E63]/30 border-t-[#E91E63] rounded-full animate-spin" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
