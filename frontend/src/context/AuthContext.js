'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(null);

const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'staff', 'receptionist'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (!token) { setLoading(false); return; }
      const res = await api.get('/auth/me');
      const userData = res?.data?.user || res?.user || res?.data;
      setUser(userData || null);
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (email, password, rememberMe = false) => {
    const res = await api.post('/auth/login', { email, password, rememberMe });
    const payload = res?.data || res;
    const token = payload?.accessToken || res?.accessToken;
    if (rememberMe) {
      localStorage.setItem('accessToken', token);
    } else {
      sessionStorage.setItem('accessToken', token);
    }
    const userData = payload?.user || res?.user;
    setUser(userData || null);
    return res;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    // Registration defaults to localStorage for simplicity
    localStorage.setItem('accessToken', res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
    setUser(null);
  };

  const isAdmin = user && ADMIN_ROLES.includes(user.role);
  const isCustomer = user && user.role === 'customer';

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    fetchUser,
    isAuthenticated: !!user,
    isAdmin,
    isCustomer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
