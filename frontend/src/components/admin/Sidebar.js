'use client';

import Image from 'next/image';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { getInitials } from '@/lib/utils';
import {
  RiDashboardLine, RiCalendarCheckLine, RiUserLine, RiScissorsLine,
  RiGiftLine, RiTeamLine, RiShoppingCartLine, RiArchiveLine,
  RiMegaphoneLine, RiBarChartLine, RiSettings3Line, RiContactsLine, RiWallet3Line, RiCalendarTodoLine,
  RiLogoutBoxRLine
} from 'react-icons/ri';
import { GiLotus } from 'react-icons/gi';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: RiDashboardLine },
  { label: 'Appointments', href: '/appointments', icon: RiCalendarCheckLine },
  { label: 'Customers', href: '/customers', icon: RiUserLine },
  { label: 'Services', href: '/services', icon: RiScissorsLine },
  { label: 'Packages', href: '/packages', icon: RiGiftLine },
  { label: 'Staff', href: '/staff', icon: RiTeamLine },
  { label: 'Attendance', href: '/attendance', icon: RiCalendarTodoLine },
  { label: 'POS & Billing', href: '/billing', icon: RiShoppingCartLine },
  { label: 'Expenses', href: '/expenses', icon: RiWallet3Line },
  { label: 'Inventory', href: '/inventory', icon: RiArchiveLine },
  // { label: 'Marketing', href: '/marketing', icon: RiMegaphoneLine },
  { label: 'Reports', href: '/reports', icon: RiBarChartLine },
  { label: 'Leads', href: '/enquiry', icon: RiContactsLine },
  { label: 'Settings', href: '/settings', icon: RiSettings3Line },
];

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#12122a] border-r border-white/5 flex flex-col z-50 transition-all duration-250 overflow-hidden ${
        collapsed ? 'w-[80px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5 min-h-[72px]">
        {collapsed ? (
          <div className="w-10 h-10 overflow-hidden relative shrink-0">
            <Image 
              src="/icon-dark.png" 
              alt="SalonTime Icon" 
              fill 
              className="object-contain"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="w-[200px] h-[55px] relative shrink-0 -ml-2 block">
            <Image 
              src="/logo-dark.png" 
              alt="SalonTime Logo" 
              fill 
              className="object-contain object-left"
              sizes="200px"
              priority
            />
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
                  ? 'bg-gradient-to-r from-[#e74a8a] to-[#731940] text-white shadow-[0_4px_15px_rgba(231,74,138,0.35)]'
                  : 'text-[#94a3b8] hover:bg-white/5 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0 text-lg">
                <Icon />
              </span>
              {!collapsed && <span className="overflow-hidden whitespace-nowrap block">{item.label}</span>}
              {item.label === 'Leads' && unreadCount > 0 && (
                <span className={`ml-auto shrink-0 flex items-center justify-center h-5 px-1.5 min-w-[20px] rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white text-brand' : 'bg-brand text-white'
                }`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`p-3 border-t border-white/5 transition-all duration-300 ${collapsed ? 'flex flex-col items-center justify-center gap-3' : 'block'}`}>
        {!collapsed && (
          <div className="bg-gradient-to-br from-[#e74a8a]/15 to-[#a855f7]/15 border border-[#e74a8a]/25 rounded-2xl p-4 mb-3 text-center">
            <h4 className="text-sm font-semibold text-[#f472b6] mb-1">💎 Grow Your Salon</h4>
            <p className="text-xs text-[#64748b] mb-3">More clients. More bookings. More success.</p>
            <button className="bg-white/5 text-[#f1f5f9] px-5 py-2 rounded-full text-[0.8rem] font-semibold border border-white/10 hover:bg-white/10 hover:border-[#e74a8a] transition-all duration-150">
              Upgrade Plan
            </button>
          </div>
        )}

        {collapsed ? (
          <>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e74a8a] to-[#c2185b] flex items-center justify-center text-[0.8rem] font-bold text-white mb-2 cursor-help" title={user?.first_name || 'Admin'}>
              {user ? getInitials(user.first_name, user.last_name) : 'A'}
            </div>
            <button 
              onClick={handleLogout} 
              className="w-10 h-10 flex items-center justify-center rounded-[10px] text-[#94a3b8] hover:bg-white/5 hover:text-[#e74a8a] transition-colors"
              title="Logout"
            >
              <RiLogoutBoxRLine className="text-xl" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e74a8a] to-[#c2185b] flex items-center justify-center text-[0.8rem] font-bold text-white shrink-0">
              {user ? getInitials(user.first_name, user.last_name) : 'A'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-[0.85rem] font-semibold text-[#f1f5f9] whitespace-nowrap">{user?.first_name || 'Admin'}</div>
              <div className="text-[0.7rem] text-[#64748b] whitespace-nowrap">{user?.role?.replace('_', ' ') || 'Super Admin'}</div>
            </div>
            <button 
              onClick={handleLogout} 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:bg-[#e74a8a]/20 hover:text-[#e74a8a] transition-all opacity-0 group-hover:opacity-100" 
              title="Logout"
            >
              <RiLogoutBoxRLine className="text-lg" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
