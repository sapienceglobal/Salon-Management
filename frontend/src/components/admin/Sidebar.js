'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import {
  RiDashboardLine, RiCalendarCheckLine, RiUserLine, RiScissorsLine,
  RiGiftLine, RiTeamLine, RiShoppingCartLine, RiArchiveLine,
  RiMegaphoneLine, RiBarChartLine, RiSettings3Line, RiContactsLine, RiWallet3Line
} from 'react-icons/ri';
import { GiLotus } from 'react-icons/gi';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: RiDashboardLine },
  { label: 'Appointments', href: '/admin/appointments', icon: RiCalendarCheckLine },
  { label: 'Customers', href: '/admin/customers', icon: RiUserLine },
  { label: 'Services', href: '/admin/services', icon: RiScissorsLine },
  { label: 'Packages', href: '/admin/packages', icon: RiGiftLine },
  { label: 'Staff', href: '/admin/staff', icon: RiTeamLine },
  { label: 'POS & Billing', href: '/admin/billing', icon: RiShoppingCartLine },
  { label: 'Expenses', href: '/admin/expenses', icon: RiWallet3Line },
  { label: 'Inventory', href: '/admin/inventory', icon: RiArchiveLine },
  { label: 'Marketing', href: '/admin/marketing', icon: RiMegaphoneLine },
  { label: 'Reports', href: '/admin/reports', icon: RiBarChartLine },
  { label: 'Enquiry', href: '/admin/enquiry', icon: RiContactsLine },
  { label: 'Settings', href: '/admin/settings', icon: RiSettings3Line },
];

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-admin-sidebar border-r border-admin-border flex flex-col z-50 transition-all duration-250 overflow-hidden ${
        collapsed ? 'w-[80px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-admin-border min-h-[72px]">
        <div className="w-10 h-10 bg-gradient-to-br from-brand to-brand-dark rounded-[10px] flex items-center justify-center text-xl shrink-0 text-white">
          <GiLotus />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="font-heading text-base font-bold text-admin-text whitespace-nowrap">SALON PRO</span>
            <span className="text-[0.65rem] text-admin-text-muted uppercase tracking-widest whitespace-nowrap">Management System</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto no-scrollbar flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-[11px] rounded-[10px] text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-brand text-white shadow-[0_4px_15px_rgba(231,74,138,0.35)] hover:bg-brand-dark'
                  : 'text-admin-text-secondary hover:bg-admin-surface-hover hover:text-admin-text'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0 text-lg">
                <Icon />
              </span>
              {!collapsed && <span className="overflow-hidden whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-admin-border">
          {/* Upgrade Card */}
          <div className="bg-gradient-to-br from-brand/15 to-accent-purple/15 border border-brand/25 rounded-2xl p-4 mb-3 text-center">
            <h4 className="text-sm font-semibold text-brand-light mb-1">💎 Grow Your Salon</h4>
            <p className="text-xs text-admin-text-muted mb-3">More clients. More bookings. More success.</p>
            <button className="bg-admin-surface-light text-admin-text px-5 py-2 rounded-full text-[0.8rem] font-semibold border border-admin-border-light hover:bg-admin-surface-hover hover:border-brand transition-all duration-150">
              Upgrade Plan
            </button>
          </div>

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-admin-surface-hover transition-colors duration-150">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-[0.8rem] font-bold text-white shrink-0">
              {user ? getInitials(user.first_name, user.last_name) : 'A'}
            </div>
            <div className="overflow-hidden">
              <div className="text-[0.85rem] font-semibold text-admin-text whitespace-nowrap">{user?.first_name || 'Admin'}</div>
              <div className="text-[0.7rem] text-admin-text-muted whitespace-nowrap">{user?.role?.replace('_', ' ') || 'Super Admin'}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
