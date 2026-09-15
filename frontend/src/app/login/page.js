'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine, RiShieldCheckLine, RiArrowRightLine, RiStarFill } from 'react-icons/ri';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'staff', 'receptionist'];

function AdminLoginForm() {
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated as admin, redirect to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && ADMIN_ROLES.includes(user.role)) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Show error from redirect
  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setError('Access denied. You do not have admin privileges.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);

      // Verify the logged in user has admin role
      if (!ADMIN_ROLES.includes(data.user.role)) {
        sessionStorage.removeItem('accessToken');
        setError('Access denied. This login is for staff and administrators only.');
        setLoading(false);
        return;
      }

      router.replace('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-admin-bg selection:bg-brand/30 selection:text-white">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-[45%] relative bg-admin-card border-r border-admin-border overflow-hidden items-center justify-center">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand/10 blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent-purple/10 blur-[100px]"></div>
          <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-accent-blue/5 blur-[80px]"></div>
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg px-12">
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
        {/* Mobile Logo (visible only on small screens) */}
        <div className="lg:hidden flex justify-center mb-10 w-full animate-[fadeInDown_0.5s_ease-out]">
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
          <div className="mb-10">
            <h2 className="text-3xl font-heading font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-admin-text-secondary">Please enter your credentials to access the admin dashboard.</p>
          </div>

          {error && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-xl px-4 py-3 mb-6 text-sm text-accent-red flex items-start gap-2 animate-[fadeIn_0.3s_ease-out]">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="group">
              <label htmlFor="admin-email" className="block text-sm font-medium text-admin-text-secondary mb-2 group-focus-within:text-white transition-colors">
                Email Address
              </label>
              <div className="relative">
                <RiMailLine className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-lg group-focus-within:text-brand transition-colors" />
                <input 
                  id="admin-email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="admin@salon.com" 
                  required 
                  autoComplete="email"
                  className="w-full bg-admin-surface/50 border border-admin-border hover:border-admin-border-light rounded-xl pl-11 pr-4 py-3.5 text-base text-white placeholder:text-admin-text-muted focus:bg-admin-surface focus:border-brand focus:ring-1 focus:ring-brand/30 outline-none transition-all duration-200" 
                />
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <label htmlFor="admin-password" className="block text-sm font-medium text-admin-text-secondary mb-2 group-focus-within:text-white transition-colors">
                Password
              </label>
              <div className="relative">
                <RiLockLine className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-lg group-focus-within:text-brand transition-colors" />
                <input 
                  id="admin-password" 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter your password" 
                  required 
                  autoComplete="current-password"
                  className="w-full bg-admin-surface/50 border border-admin-border hover:border-admin-border-light rounded-xl pl-11 pr-12 py-3.5 text-base text-white placeholder:text-admin-text-muted focus:bg-admin-surface focus:border-brand focus:ring-1 focus:ring-brand/30 outline-none transition-all duration-200" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-admin-text-muted hover:text-white transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2.5 text-sm text-admin-text-secondary cursor-pointer hover:text-white transition-colors group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" className="peer appearance-none w-4.5 h-4.5 rounded-[4px] border-2 border-admin-border bg-admin-surface-light checked:bg-brand checked:border-brand transition-all cursor-pointer" />
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 14 10" fill="none">
                    <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                Remember me
              </label>
              <a href="/forgot-password" className="text-sm font-medium text-brand hover:text-brand-light transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading}
              className="group relative w-full bg-white text-admin-bg py-3.5 rounded-xl font-bold text-base hover:bg-gray-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden mt-4"
            >
              {/* Subtle hover effect overlay */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
              
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-admin-bg/30 border-t-admin-bg rounded-full animate-spin"></span>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In to Dashboard
                  <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-12 text-center">
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

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
