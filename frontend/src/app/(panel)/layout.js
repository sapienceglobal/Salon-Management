'use client';

import { useState } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import AdminGuard from '@/components/admin/AdminGuard';
import { useTheme } from '@/context/ThemeContext';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Admin Panel Layout — sidebar + header.
 * Only used inside (panel) route group.
 * Wrapped in AdminGuard for security.
 *
 * `color-scheme` is set dynamically based on the active theme
 * so native browser controls (date pickers, scrollbars, etc.)
 * match the current mode.
 *
 * `min-w-0` on flex items prevents content wider than the viewport
 * from blowing out the layout when the sidebar toggles.
 */
export default function AdminPanelLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isDark } = useTheme();
  const pathname = usePathname();
  const mainRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AdminGuard>
      <div className={`flex min-h-screen bg-admin-bg text-admin-text ${isDark ? '[color-scheme:dark]' : '[color-scheme:light]'}`}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div
          className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-250 ${
            sidebarCollapsed ? 'ml-[80px]' : 'ml-[260px]'
          }`}
        >
          <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
          <main ref={mainRef} id="main-scroll-container" className="flex-1 min-w-0 min-h-0 p-6 overflow-x-hidden overflow-y-scroll custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}