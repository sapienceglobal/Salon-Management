'use client';

import { AuthProvider } from '@/context/AuthContext';

/**
 * Root admin layout — minimal wrapper.
 * Only sets dark theme. Does NOT include sidebar/header.
 * The (panel) route group adds sidebar/header for authenticated pages.
 * /admin/login gets this clean layout without sidebar.
 */
export default function AdminRootLayout({ children }) {
  return (
    <AuthProvider>
      <div data-theme="admin" className="min-h-screen bg-admin-bg text-admin-text">
        {children}
      </div>
    </AuthProvider>
  );
}
