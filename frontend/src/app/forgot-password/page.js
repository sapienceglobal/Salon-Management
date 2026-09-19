'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import { 
  RiUserLine, RiLockLine, RiEyeLine, RiEyeOffLine, 
  RiShieldCheckLine, RiArrowRightLine, RiStarFill, 
  RiKey2Line, RiArrowLeftLine, RiCheckLine 
} from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  
  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Strength State
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });

  // Check password strength dynamically
  useEffect(() => {
    setPasswordCriteria({
      length: newPassword.length >= 8 && newPassword.length <= 128,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword)
    });
  }, [newPassword]);

  const isPasswordStrong = Object.values(passwordCriteria).every(Boolean);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/verify-otp', { email, otp });
      toast.success('OTP verified successfully');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordStrong) {
      setError('Please meet all password requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { 
        email, 
        token: otp, 
        password: newPassword 
      });
      toast.success('Password reset successful! Please login.');
      router.push('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-admin-bg selection:bg-brand/30 selection:text-white force-dark">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden md:flex w-[40%] lg:w-[45%] relative bg-admin-card border-r border-admin-border overflow-hidden items-center justify-center">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand/10 blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent-purple/10 blur-[100px]"></div>
          <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-accent-blue/5 blur-[80px]"></div>
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg px-8 lg:px-12">
          <div className="mb-8 animate-[fadeInDown_0.6s_ease-out]">
            <Image 
              src="/logo-dark.png" 
              alt="SalonTime Logo" 
              width={280} 
              height={80} 
              className="object-contain -ml-4"
              priority
            />
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-heading font-bold text-white mb-6 leading-tight animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
            Elevate Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-accent-purple">Salon Experience</span>
          </h1>
          
          <p className="text-lg text-admin-text-secondary mb-12 max-w-md animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
            The all-in-one platform for modern salons. Manage appointments, staff, inventory, and analytics with unparalleled elegance.
          </p>

          {/* Testimonial / Social Proof Glass Card */}
          <div className="bg-admin-surface/40 backdrop-blur-md border border-admin-border-light rounded-2xl p-6 shadow-2xl animate-[fadeInUp_0.6s_ease-out_0.4s_both]">
            <div className="flex gap-1 text-accent-yellow mb-4 text-sm">
              <RiStarFill /> <RiStarFill /> <RiStarFill /> <RiStarFill /> <RiStarFill />
            </div>
            <p className="text-admin-text-secondary italic mb-4">
              "SalonTime transformed how we operate. It's incredibly intuitive and the analytics help us grow our revenue every single month."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accent-purple to-brand flex items-center justify-center text-white font-bold text-sm">
                SJ
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Sarah Jenkins</div>
                <div className="text-xs text-admin-text-muted">Owner, Luxe Studio</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-6 sm:p-12">
        {/* Mobile Logo */}
        <div className="md:hidden flex justify-center mb-10 w-full animate-[fadeInDown_0.5s_ease-out]">
            <Image 
              src="/logo-dark.png" 
              alt="SalonTime Logo" 
              width={240} 
              height={65} 
              className="object-contain"
              priority
            />
        </div>

        <div className="w-full max-w-md animate-[fadeInUp_0.5s_ease-out]">
          <div className="mb-10 relative">
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="absolute -top-12 -left-2 text-admin-text-secondary hover:text-white flex items-center gap-1 text-sm font-medium transition-colors p-2"
              >
                <RiArrowLeftLine /> Back
              </button>
            )}
            <h2 className="text-3xl font-heading font-bold text-white mb-2">
              {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'Reset Password'}
            </h2>
            <p className="text-admin-text-secondary">
              {step === 1 ? 'Enter your email or username to receive a reset code.' 
               : step === 2 ? `We sent a 6-digit code to ${email}` 
               : 'Enter a strong new password for your account.'}
            </p>
          </div>

          {error && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-xl px-4 py-3 mb-6 text-sm text-accent-red flex items-start gap-2 animate-[fadeIn_0.3s_ease-out]">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Request OTP */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              <div className="group">
                <label htmlFor="reset-email" className="block text-sm font-medium text-admin-text-secondary mb-2 group-focus-within:text-white transition-colors">
                  Username / Email
                </label>
                <div className="relative">
                  <RiUserLine className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-lg group-focus-within:text-brand transition-colors" />
                  <input 
                    id="reset-email" 
                    type="text" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Enter your username or email" 
                    required 
                    autoComplete="username"
                    className="w-full bg-admin-surface/50 border border-admin-border hover:border-admin-border-light rounded-xl pl-11 pr-4 py-3.5 text-base text-white placeholder:text-admin-text-muted focus:bg-admin-surface focus:border-brand focus:ring-1 focus:ring-brand/30 outline-none transition-all duration-200" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !email}
                className="group relative w-full bg-white text-admin-bg py-3.5 rounded-xl font-bold text-base hover:bg-gray-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden mt-4"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-admin-bg/30 border-t-admin-bg rounded-full animate-spin"></span>
                    Sending OTP...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Send Reset Code
                    <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
              <div className="group">
                <label htmlFor="reset-otp" className="block text-sm font-medium text-admin-text-secondary mb-2 group-focus-within:text-white transition-colors">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <RiKey2Line className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-lg group-focus-within:text-brand transition-colors" />
                  <input 
                    id="reset-otp" 
                    type="text" 
                    maxLength={6}
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} 
                    placeholder="Enter 6-digit code" 
                    required 
                    autoComplete="one-time-code"
                    className="w-full bg-admin-surface/50 border border-admin-border hover:border-admin-border-light rounded-xl pl-11 pr-4 py-3.5 text-base text-white placeholder:text-admin-text-muted focus:bg-admin-surface focus:border-brand focus:ring-1 focus:ring-brand/30 outline-none transition-all duration-200 tracking-widest font-semibold" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || otp.length !== 6}
                className="group relative w-full bg-white text-admin-bg py-3.5 rounded-xl font-bold text-base hover:bg-gray-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden mt-4"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-admin-bg/30 border-t-admin-bg rounded-full animate-spin"></span>
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Verify Code
                    <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
              <div className="group">
                <label htmlFor="new-password" className="block text-sm font-medium text-admin-text-secondary mb-2 group-focus-within:text-white transition-colors">
                  New Password
                </label>
                <div className="relative">
                  <RiLockLine className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-lg group-focus-within:text-brand transition-colors" />
                  <input 
                    id="new-password" 
                    type={showPassword ? 'text' : 'password'} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Create new password" 
                    required 
                    autoComplete="new-password"
                    className="w-full bg-admin-surface/50 border border-admin-border hover:border-admin-border-light rounded-xl pl-11 pr-12 py-3.5 text-base text-white placeholder:text-admin-text-muted focus:bg-admin-surface focus:border-brand focus:ring-1 focus:ring-brand/30 outline-none transition-all duration-200" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-admin-text-muted hover:text-white transition-colors p-1"
                  >
                    {showPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                <div className="mt-3 bg-admin-surface-light border border-admin-border rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.length ? 'text-accent-green' : 'text-admin-text-muted'}`}>
                    {passwordCriteria.length ? <RiCheckLine /> : <div className="w-3 h-3 rounded-full border border-current opacity-40"></div>}
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.upper ? 'text-accent-green' : 'text-admin-text-muted'}`}>
                    {passwordCriteria.upper ? <RiCheckLine /> : <div className="w-3 h-3 rounded-full border border-current opacity-40"></div>}
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.lower ? 'text-accent-green' : 'text-admin-text-muted'}`}>
                    {passwordCriteria.lower ? <RiCheckLine /> : <div className="w-3 h-3 rounded-full border border-current opacity-40"></div>}
                    <span>Lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.number ? 'text-accent-green' : 'text-admin-text-muted'}`}>
                    {passwordCriteria.number ? <RiCheckLine /> : <div className="w-3 h-3 rounded-full border border-current opacity-40"></div>}
                    <span>Number</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.special ? 'text-accent-green' : 'text-admin-text-muted'}`}>
                    {passwordCriteria.special ? <RiCheckLine /> : <div className="w-3 h-3 rounded-full border border-current opacity-40"></div>}
                    <span>Special character</span>
                  </div>
                </div>
              </div>

              <div className="group">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-admin-text-secondary mb-2 group-focus-within:text-white transition-colors">
                  Confirm Password
                </label>
                <div className="relative">
                  <RiLockLine className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-lg group-focus-within:text-brand transition-colors" />
                  <input 
                    id="confirm-password" 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm new password" 
                    required 
                    autoComplete="new-password"
                    className="w-full bg-admin-surface/50 border border-admin-border hover:border-admin-border-light rounded-xl pl-11 pr-12 py-3.5 text-base text-white placeholder:text-admin-text-muted focus:bg-admin-surface focus:border-brand focus:ring-1 focus:ring-brand/30 outline-none transition-all duration-200" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-admin-text-muted hover:text-white transition-colors p-1"
                  >
                    {showConfirmPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !isPasswordStrong || !confirmPassword}
                className="group relative w-full bg-white text-admin-bg py-3.5 rounded-xl font-bold text-base hover:bg-gray-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden mt-4"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-admin-bg/30 border-t-admin-bg rounded-full animate-spin"></span>
                    Resetting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Reset Password
                    <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <a href="/login" className="text-sm font-medium text-admin-text-secondary hover:text-white transition-colors">
              Return to Login
            </a>
          </div>

          {/* Security Notice */}
          <div className="mt-8 text-center">
            <p className="text-xs text-admin-text-muted flex items-center justify-center gap-1.5">
              <RiShieldCheckLine className="text-brand" size={14} />
              Secure, encrypted portal for authorized personnel
            </p>
          </div>
        </div>
        
        {/* Footer Text */}
        <div className="absolute bottom-6 w-full text-center lg:text-left lg:left-12 lg:w-auto">
          <p className="text-xs text-admin-text-muted">© {new Date().getFullYear()} SalonTime Management. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
