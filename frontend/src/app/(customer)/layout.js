'use client';

import { AuthProvider } from '@/context/AuthContext';

/**
 * Customer Panel Layout — public-facing website.
 * All pages under /(customer)/* use this layout.
 * AuthProvider wraps for login/register functionality.
 */
export default function CustomerLayout({ children }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white text-gray-900">
        {/* Navbar will go here */}
        <div>
          {children}
        </div>
        {/* Footer will go here */}
      </div>
    </AuthProvider>
  );
}
