'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { GiLotus } from 'react-icons/gi';
import { RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine, RiShieldCheckLine } from 'react-icons/ri';

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
    <div className="min-h-screen flex items-center justify-center bg-admin-bg p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand to-brand-dark rounded-2xl text-3xl text-white mb-4 shadow-[0_4px_20px_rgba(231,74,138,0.3)]">
            <GiLotus />
          </div>
          <h1 className="font-heading text-2xl font-bold text-admin-text">SalonTime</h1>
          <p className="text-sm text-admin-text-muted mt-1">Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-admin-card border border-admin-border rounded-2xl p-8 shadow-2xl backdrop-blur-lg">
          <div className="flex items-center gap-2 mb-6">
            <RiShieldCheckLine className="text-brand text-lg" />
            <h2 className="font-heading text-lg font-semibold">Admin Login</h2>
          </div>

          {error && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-xl px-4 py-3 mb-5 text-sm text-accent-red flex items-start gap-2">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-admin-text-secondary mb-2">Email Address</label>
              <div className="relative">
                <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-muted" />
                <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@salon.com" required autoComplete="email"
                  className="w-full bg-admin-surface-light border border-admin-border rounded-xl pl-10 pr-4 py-3 text-sm text-admin-text placeholder:text-admin-text-muted focus:border-brand focus:ring-1 focus:ring-brand/30 outline-none transition-all duration-150" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-admin-text-secondary mb-2">Password</label>
              <div className="relative">
                <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-muted" />
                <input id="admin-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password"
                  className="w-full bg-admin-surface-light border border-admin-border rounded-xl pl-10 pr-12 py-3 text-sm text-admin-text placeholder:text-admin-text-muted focus:border-brand focus:ring-1 focus:ring-brand/30 outline-none transition-all duration-150" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-admin-text-muted hover:text-admin-text transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-admin-text-secondary cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-admin-border bg-admin-surface-light accent-brand" />
                Remember me
              </label>
              <a href="/forgot-password" className="text-sm text-brand hover:text-brand-light transition-colors">Forgot password?</a>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-brand to-brand-dark text-white py-3 rounded-xl font-semibold text-sm hover:shadow-[0_4px_20px_rgba(231,74,138,0.35)] hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-admin-border">
            <p className="text-xs text-admin-text-muted text-center flex items-center justify-center gap-1.5">
              <RiShieldCheckLine className="text-accent-green" />
              Protected area — authorized staff only
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-admin-text-muted mt-6">© {new Date().getFullYear()} SalonTime. All rights reserved.</p>
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
