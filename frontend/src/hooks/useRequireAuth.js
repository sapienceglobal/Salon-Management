'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook to protect admin routes — redirects to login if not authenticated.
 */
export function useRequireAuth(allowedRoles = []) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
    if (!loading && isAuthenticated && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user?.role)) {
        router.replace('/admin/dashboard');
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, router]);

  return { user, loading, isAuthenticated };
}
