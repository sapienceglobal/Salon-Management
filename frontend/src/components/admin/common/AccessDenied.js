'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RiLockPasswordLine, RiArrowLeftLine, RiApps2Line, RiCalendarEventLine, RiShieldKeyholeLine } from 'react-icons/ri';
import { useAuth } from '@/context/AuthContext';

export default function AccessDenied({ 
  title = 'Access Restricted', 
  message = 'Financial, billing and invoice data is strictly restricted to Administrator accounts.' 
}) {
  const router = useRouter();
  const { user } = useAuth();
  const roleName = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Staff';

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6 animate-[fadeIn_0.3s_ease_forwards]">
      <div className="max-w-md w-full bg-white dark:bg-[#1a1a2e] rounded-3xl border border-slate-100 dark:border-white/10 shadow-2xl p-7 text-center relative overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-rose-500/15 dark:bg-rose-500/20 blur-2xl pointer-events-none rounded-full" />

        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-pink-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center text-3xl mx-auto mb-4 border border-rose-500/25 shadow-lg shadow-rose-500/10">
          <RiShieldKeyholeLine />
        </div>

        {/* Account Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>Logged in as: {roleName} Account</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {title}
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
          {message}
        </p>

        {/* Security Notice */}
        <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-[11px] text-slate-400 dark:text-slate-500">
          🔒 Role-based access control (RBAC) enforced by security policy.
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RiArrowLeftLine className="text-base" />
            <span>Go Back</span>
          </button>

          <Link
            href="/"
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-[#E91E63]/25 transition-all cursor-pointer"
          >
            <RiApps2Line className="text-base" />
            <span>Dashboard</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
