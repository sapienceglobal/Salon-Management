'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from 'react-hot-toast';

/**
 * Client-side providers wrapper.
 * Keeps the root layout a Server Component while
 * providing client-only context (theme, auth, etc.)
 */
export function Providers({ children }) {
  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      {children}
    </ThemeProvider>
  );
}
