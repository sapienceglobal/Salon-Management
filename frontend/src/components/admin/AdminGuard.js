'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'staff', 'receptionist'];

/**
 * AdminGuard — Protects all admin panel routes.
 * 
 * Security checks:
 * 1. User must be authenticated (valid JWT)
 * 2. User must have an admin role (not a customer)
 * 3. Redirects to /admin/login if any check fails
 * 4. Shows loading spinner while verifying
 */
export default function AdminGuard({ children, allowedRoles = ADMIN_ROLES }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return; // Still checking auth

    // Not logged in → admin login
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    // Logged in but not admin role → admin login with error
    if (!allowedRoles.includes(user.role)) {
      localStorage.removeItem('accessToken');
      router.replace('/login?error=unauthorized');
      return;
    }

    // All checks passed
    setAuthorized(true);
  }, [loading, isAuthenticated, user, allowedRoles, router]);

  // Loading state
  if (loading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-admin-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-admin-text-muted">Verifying access...</p>
        </div>
      </div>
    );
  }

  return children;
}
