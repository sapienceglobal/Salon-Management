'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

/**
 * ThemeProvider — manages dark/light mode across the app.
 *
 * Persistence: localStorage('salon-pro-theme')
 * DOM: sets `data-theme-mode="dark|light"` on <html> element
 *
 * This ensures CSS custom properties switch instantly and
 * the preference survives page refreshes.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark'); // default dark
  const [mounted, setMounted] = useState(false);

  // On mount, read persisted preference
  useEffect(() => {
    const stored = localStorage.getItem('salon-pro-theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    }
    setMounted(true);
  }, []);

  // Apply theme to <html> whenever it changes
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme-mode', theme);
    localStorage.setItem('salon-pro-theme', theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const isDark = theme === 'dark';

  const value = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };

  // Prevent flash of wrong theme on SSR
  // Before mounted, render children but with default (dark) applied via CSS
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
