'use client';

import { format } from 'date-fns';
import { RiMenuLine, RiSearchLine, RiNotification3Line, RiMapPinLine, RiSettings4Line, RiSunLine, RiMoonLine } from 'react-icons/ri';
import { useTheme } from '@/context/ThemeContext';
import GlobalSearch from '@/components/admin/GlobalSearch';
import Link from 'next/link';

export default function Header({ onToggleSidebar }) {
  const today = format(new Date(), 'EEE, d MMM yyyy');
  const { isDark, toggleTheme } = useTheme();

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

        <button className="relative text-xl text-admin-text-secondary p-2 rounded-md hover:text-admin-text hover:bg-admin-surface-light transition-all duration-150" aria-label="Notifications">
          <RiNotification3Line />
          <span className="absolute top-0.5 right-0.5 w-[18px] h-[18px] bg-brand text-white text-[0.65rem] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

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
