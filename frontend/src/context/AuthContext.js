'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(null);

const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'staff', 'receptionist'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (!token) { 
        setUser(null);
        setLoading(false); 
        return; 
      }
      const res = await api.get('/auth/me');
      const userData = res?.data?.user || res?.user || res?.data;
      if (userData) {
        setUser(userData);
        try {
          if (localStorage.getItem('accessToken')) {
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            sessionStorage.setItem('user', JSON.stringify(userData));
          }
        } catch { /* ignore storage errors */ }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (email, password, rememberMe = false) => {
    const res = await api.post('/auth/login', { email, password, rememberMe });
    const payload = res?.data || res;
    const token = payload?.accessToken || res?.accessToken;
    const userData = payload?.user || res?.user;
    if (rememberMe) {
      localStorage.setItem('accessToken', token);
      if (userData) {
        try { localStorage.setItem('user', JSON.stringify(userData)); } catch { /* ignore */ }
      }
    } else {
      sessionStorage.setItem('accessToken', token);
      if (userData) {
        try { sessionStorage.setItem('user', JSON.stringify(userData)); } catch { /* ignore */ }
      }
    }
    setUser(userData || null);
    return { ...payload, user: userData, accessToken: token };
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    // Registration defaults to localStorage for simplicity
    localStorage.setItem('accessToken', res.data.accessToken);
    if (res.data?.user) {
      try { localStorage.setItem('user', JSON.stringify(res.data.user)); } catch { /* ignore */ }
    }
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  const role = (user?.role || '').toLowerCase().trim();
  const isAdmin = user && ADMIN_ROLES.includes(role);
  const isSuperAdmin = role === 'super_admin';
  const isSystemAdmin = role === 'admin' || isSuperAdmin;
  const isManager = role === 'manager';
  const isCustomer = user && role === 'customer';
  // Financial privacy: Only root admin/super_admin can view revenue/billing
  const canViewFinancials = Boolean(user && isSystemAdmin && !isManager);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    fetchUser,
    isAuthenticated: !!user,
    isAdmin,
    isSuperAdmin,
    isSystemAdmin,
    isManager,
    isCustomer,
    canViewFinancials,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
