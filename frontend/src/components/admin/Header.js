'use client';

import { format } from 'date-fns';
import { RiMenuLine, RiSearchLine, RiNotification3Line, RiMapPinLine, RiSettings4Line, RiSunLine, RiMoonLine, RiCheckDoubleLine } from 'react-icons/ri';
import { useTheme } from '@/context/ThemeContext';
import { useNotification } from '@/context/NotificationContext';
import GlobalSearch from '@/components/admin/GlobalSearch';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Header({ onToggleSidebar }) {
  const today = format(new Date(), 'EEE, d MMM yyyy');
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between px-7 h-[var(--spacing-header)] bg-admin-surface border-b border-admin-border sticky top-0 z-40">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-xl text-admin-text-secondary p-1.5 rounded-md hover:text-admin-text hover:bg-admin-surface-light transition-all duration-150"
          aria-label="Toggle sidebar"
        >
          <RiMenuLine />
        </button>

        <GlobalSearch />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative text-xl p-2.5 rounded-full hover:bg-admin-surface-light transition-all duration-200 group"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
        >
          <div className="relative w-5 h-5">
            {/* Sun icon — visible in dark mode (click to go light) */}
            <RiSunLine
              className={`absolute inset-0 text-amber-400 transition-all duration-300 ${
                isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
              }`}
            />
            {/* Moon icon — visible in light mode (click to go dark) */}
            <RiMoonLine
              className={`absolute inset-0 text-indigo-400 transition-all duration-300 ${
                isDark ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
              }`}
            />
          </div>
        </button>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative text-xl text-admin-text-secondary p-2 rounded-md hover:text-admin-text hover:bg-admin-surface-light transition-all duration-150" 
            aria-label="Notifications"
          >
            <RiNotification3Line />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-[18px] h-[18px] bg-brand text-white text-[0.65rem] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Popover */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-admin-surface border border-admin-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-admin-border">
                <h3 className="font-semibold text-admin-text">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-brand hover:text-brand-light flex items-center gap-1">
                    <RiCheckDoubleLine /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-admin-text-tertiary">
                    <RiNotification3Line className="text-4xl mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 border-b border-admin-border last:border-0 cursor-pointer transition-colors ${
                          notification.isRead ? 'opacity-70 hover:bg-admin-surface-light' : 'bg-brand/5 hover:bg-brand/10'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className={`text-sm ${notification.isRead ? 'font-medium text-admin-text' : 'font-semibold text-brand'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-[10px] text-admin-text-tertiary whitespace-nowrap">
                            {format(new Date(notification.timestamp), 'hh:mm a')}
                          </span>
                        </div>
                        <p className="text-xs text-admin-text-secondary leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Link href="/enquiry" onClick={() => setShowDropdown(false)} className="block p-3 text-center text-sm font-medium text-admin-text hover:text-brand bg-admin-surface-light border-t border-admin-border transition-colors">
                View all leads
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-admin-text-secondary px-3.5 py-1.5 bg-admin-surface-light rounded-full border border-admin-border">
          📅 {today}
        </div>

        <button className="flex items-center gap-2 text-sm text-admin-text-secondary px-3.5 py-1.5 bg-admin-surface-light rounded-full border border-admin-border hover:border-brand transition-colors duration-150 cursor-pointer">
          <RiMapPinLine />
          Downtown Branch
        </button>

        <Link href="/settings" className="text-xl text-admin-text-secondary p-2 rounded-full hover:text-admin-text hover:bg-admin-surface-light hover:rotate-45 transition-all duration-150" aria-label="Settings">
          <RiSettings4Line />
        </Link>
      </div>
    </header>
  );
}
