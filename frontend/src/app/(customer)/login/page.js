'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine, RiGoogleFill } from 'react-icons/ri';
import { GiLotus } from 'react-icons/gi';

export const dynamic = 'force-dynamic';

const CUSTOMER_ROLE = 'customer';

export default function CustomerLoginPage() {
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role !== CUSTOMER_ROLE) {
        router.replace('/admin/dashboard');
        return;
      }
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        setError('Registration coming soon!');
        setLoading(false);
        return;
      }

      const data = await login(email, password);

      if (data.user.role !== CUSTOMER_ROLE) {
        sessionStorage.removeItem('accessToken');
        setError('This login is for customers only. Please use the staff login portal.');
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

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google?role=customer`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl text-2xl text-white mb-3 shadow-lg shadow-pink-200">
            <GiLotus />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Salon Pro</h1>
          <p className="text-sm text-gray-500 mt-1">Premium Salon & Spa</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {isRegister ? 'Sign up to book appointments & earn rewards' : 'Sign in to manage your bookings'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 text-sm text-red-600">{error}</div>
          )}

          {/* Google Login */}
          <button onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 mb-5">
            <RiGoogleFill className="text-lg text-red-500" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label htmlFor="cust-name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input id="cust-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none transition-all" />
                </div>
                <div>
                  <label htmlFor="cust-phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input id="cust-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none transition-all" />
                </div>
              </>
            )}

            <div>
              <label htmlFor="cust-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="cust-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none transition-all" />
              </div>
            </div>

            <div>
              <label htmlFor="cust-password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="cust-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-12 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>

            {!isRegister && (
              <div className="flex items-center justify-end">
                <a href="/forgot-password" className="text-sm text-pink-600 hover:text-pink-700 font-medium">Forgot password?</a>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white py-3 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-pink-200 hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {isRegister ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="text-pink-600 hover:text-pink-700 font-semibold">
                {isRegister ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© {new Date().getFullYear()} Salon Pro. All rights reserved.</p>
      </div>
    </div>
  );
}
