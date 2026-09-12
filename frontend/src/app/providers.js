'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { Toaster } from 'react-hot-toast';

/**
 * Client-side providers wrapper.
 * Keeps the root layout a Server Component while
 * providing client-only context (theme, auth, etc.)
 */
export function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConfirmProvider>
          {children}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                color: '#f1f5f9',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#1a1a2e',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#1a1a2e',
                },
              },
            }}
          />
        </ConfirmProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
