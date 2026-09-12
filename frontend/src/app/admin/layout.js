'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { Toaster } from 'react-hot-toast';

/**
 * Root admin layout — minimal wrapper.
 * Only sets dark theme. Does NOT include sidebar/header.
 * The (panel) route group adds sidebar/header for authenticated pages.
 * /admin/login gets this clean layout without sidebar.
 */
export default function AdminRootLayout({ children }) {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <div data-theme="admin" className="min-h-screen bg-admin-bg text-admin-text">
          {children}
        </div>
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
  );
}
