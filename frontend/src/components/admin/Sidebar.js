'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { getInitials } from '@/lib/utils';
import api from '@/lib/api';
import {
  RiApps2Line,
  RiCalendarEventLine,
  RiGroupLine,
  RiUserStarLine,
  RiCalendarCheckLine,
  RiScissorsCutLine,
  RiBox3Line,
  RiShoppingBag3Line,
  RiFileTextLine,
  RiPieChartLine,
  RiBarChartBoxLine,
  RiUserSharedLine,
  RiMegaphoneLine,
  RiStarLine,
  RiSettings4Line,
  RiStore2Line,
  RiLogoutBoxRLine,
  RiCheckboxCircleFill,
  RiArrowRightSLine,
  RiCloseLine,
  RiVipCrownLine,
  RiCheckLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
} from 'react-icons/ri';

const NAV_GROUPS = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', href: '/', icon: RiApps2Line },
      {
        label: 'Appointments',
        href: '/appointments',
        icon: RiCalendarEventLine,
        badgeKey: 'appointments',
      },
      { label: 'Customers', href: '/customers', icon: RiGroupLine },
    ],
  },
  {
    title: 'SALON OPERATIONS',
    items: [
      {
        label: 'Staff',
        href: '/staff',
        icon: RiUserStarLine,
      },
      {
        label: 'Attendance',
        href: '/attendance',
        icon: RiCalendarCheckLine,
      },
      { label: 'Services', href: '/services', icon: RiScissorsCutLine },
      {
        label: 'Packages & Memberships',
        href: '/packages',
        icon: RiBox3Line,
      },
      { label: 'Inventory', href: '/inventory', icon: RiShoppingBag3Line },
    ],
  },
  {
    title: 'FINANCE & REPORTS',
    items: [
      { label: 'Invoices & Billing', href: '/billing', icon: RiFileTextLine },
      { label: 'Expenses', href: '/expenses', icon: RiPieChartLine },
      { label: 'Reports', href: '/reports', icon: RiBarChartBoxLine },
    ],
  },
  {
    title: 'CRM & MARKETING',
    items: [
      {
        label: 'Leads / CRM',
        href: '/leads',
        altHrefs: ['/enquiry'],
        icon: RiUserSharedLine,
        badgeKey: 'leads',
        subItems: [
          { label: 'Leads Dashboard', href: '/leads?tab=dashboard', tabKey: 'dashboard' },
          { label: 'Lead List', href: '/leads', tabKey: 'list' },
          { label: 'Add Lead', href: '/leads?action=add', tabKey: 'add' },
          { label: 'Import Leads', href: '/leads?tab=import', tabKey: 'import' },
          { label: 'Follow-ups', href: '/leads?tab=follow_ups', tabKey: 'follow_ups' },
          { label: 'Lead Sources', href: '/leads?tab=sources', tabKey: 'sources' },
          { label: 'Lead Status / Pipeline', href: '/leads?tab=pipeline', tabKey: 'pipeline' },
          { label: 'Reports', href: '/leads?tab=reports', tabKey: 'reports' },
        ],
      },
      { label: 'Campaigns', href: '/marketing', icon: RiMegaphoneLine },
      {
        label: 'Feedback & Reviews',
        href: '/settings?tab=feedback',
        altHrefs: ['/feedback'],
        icon: RiStarLine,
      },
    ],
  },
];

function SidebarInner({ collapsed, onToggle }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get('tab') : '';
  const currentAction = searchParams ? searchParams.get('action') : '';

  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();

  const [leadsExpanded, setLeadsExpanded] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(true);

  const [realCounts, setRealCounts] = useState({
    appointments: 0,
    leads: 0,
  });

  // Fetch real counts from backend APIs (consistent with APK sidepanel)
  useEffect(() => {
    let isSubscribed = true;

    async function loadCounts() {
      if (!user) return;
      try {
        const [apptsResult, leadsResult] = await Promise.allSettled([
          api.get('/appointments?limit=100'),
          api.get('/leads'),
        ]);

        let apptTotal = 0;
        if (apptsResult.status === 'fulfilled' && apptsResult.value?.data) {
          const resData = apptsResult.value.data.data ?? apptsResult.value.data;
          if (Array.isArray(resData)) {
            apptTotal = resData.length;
          } else if (Array.isArray(resData?.appointments)) {
            apptTotal = resData.appointments.length;
          } else if (typeof resData?.total === 'number') {
            apptTotal = resData.total;
          }
        }

        let leadTotal = 0;
        if (leadsResult.status === 'fulfilled' && leadsResult.value?.data) {
          const resData = leadsResult.value.data.data ?? leadsResult.value.data;
          if (Array.isArray(resData)) {
            leadTotal = resData.length;
          } else if (Array.isArray(resData?.leads)) {
            leadTotal = resData.leads.length;
          } else if (typeof resData?.total === 'number') {
            leadTotal = resData.total;
          }
        }

        if (isSubscribed) {
          setRealCounts({
            appointments: apptTotal,
            leads: Math.max(leadTotal, unreadCount || 0),
          });
        }
      } catch (err) {
        console.error('Failed to fetch sidebar counts:', err);
      }
    }

    loadCounts();

    // Re-fetch periodically or when user/unread changes
    const interval = setInterval(loadCounts, 60000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [user, unreadCount]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const [profile, setProfile] = useState(user);

  useEffect(() => {
    // Always fetch fresh profile from /auth/me to reflect database updates immediately
    api
      .get('/auth/me')
      .then((res) => {
        const u = res?.data?.user || res?.user || res?.data;
        if (u) setProfile(u);
      })
      .catch(() => {
        if (user) setProfile(user);
      });
  }, [user]);

  const isItemActive = (item) => {
    if (item.href === '/') {
      return pathname === '/';
    }
    const baseHref = item.href.split('?')[0];
    if (pathname === baseHref || pathname.startsWith(baseHref + '/')) {
      return true;
    }
    if (item.altHrefs && item.altHrefs.some((alt) => pathname === alt || pathname.startsWith(alt + '/'))) {
      return true;
    }
    return false;
  };

  const isSubItemActive = (sub) => {
    if (pathname === '/leads') {
      if (sub.tabKey === 'list') {
        return !currentTab && !currentAction;
      }
      if (sub.tabKey === 'add') {
        return currentAction === 'add';
      }
      return currentTab === sub.tabKey;
    }
    return false;
  };

  const activeUser = profile || user;
  const userName = activeUser?.first_name
    ? `${activeUser.first_name} ${activeUser.last_name || ''}`.trim()
    : 'Super Admin';
  const userEmail = activeUser?.email || 'admin@kairamakeover.salontime.co.in';
  const userInitials = activeUser ? getInitials(activeUser.first_name, activeUser.last_name) : 'SA';
  const branchName = activeUser?.branch_name || activeUser?.business_name || 'Kaira Makeover';

  return (
    <aside
      className={`sticky top-0 left-0 h-screen shrink-0 bg-[#090D16] border-r border-white/[0.08] flex flex-col z-30 transition-all duration-200 select-none overflow-hidden ${
        collapsed ? 'w-[80px]' : 'w-[260px]'
      }`}
      style={{
        width: collapsed ? '80px' : '260px',
        minWidth: collapsed ? '80px' : '260px',
        maxWidth: collapsed ? '80px' : '260px',
      }}
    >
      {/* --- Top Brand Header (Matching Login Page Logo) --- */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2.5 min-h-[64px] shrink-0">
        {collapsed ? (
          <div
            onClick={onToggle}
            className="w-10 h-10 overflow-hidden relative shrink-0 mx-auto cursor-pointer hover:scale-105 transition-transform"
            title="Expand Sidebar"
          >
            <Image
              src="/icon-dark.png"
              alt="SalonTime Icon"
              fill
              className="object-contain"
              sizes="40px"
              priority
            />
          </div>
        ) : (
          <>
            <Link href="/" className="flex items-center group min-w-0">
              <Image
                src="/salontime-brand-logo-dark.png"
                alt="SalonTime - Appointments | CRM | Salon Management"
                width={190}
                height={48}
                priority
                className="h-9 w-auto object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </Link>

            {onToggle && (
              <button
                onClick={onToggle}
                className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <RiCloseLine className="text-base" />
              </button>
            )}
          </>
        )}
      </div>

      {/* --- Admin Profile Card --- */}
      {!collapsed ? (
        <div className="px-3 py-1.5 shrink-0">
          <div className="relative overflow-hidden rounded-2xl p-3 bg-gradient-to-br from-[#231026] via-[#161224] to-[#0D101C] border border-[#E91E63]/25 hover:border-[#E91E63]/40 shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-all group">
            <Link href="/settings" className="flex items-center gap-2.5">
              {/* Circular Pink Gradient Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E91E63] via-[#F43F5E] to-[#FB7185] flex items-center justify-center text-white font-bold text-sm shadow-[0_4px_12px_rgba(233,30,99,0.35)] shrink-0 ring-2 ring-white/10">
                {userInitials}
              </div>

              {/* User Name & Verified Icon & Email */}
              <div className="overflow-hidden flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-[13.5px] truncate group-hover:text-pink-100 transition-colors">
                    {userName}
                  </span>
                  <RiCheckboxCircleFill className="text-[#E91E63] text-xs shrink-0" />
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {userEmail}
                </div>
              </div>

              {/* Right Chevron on Profile Card */}
              <RiArrowRightSLine className="text-pink-400/80 text-lg shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Branch Pill */}
            <div className="mt-2 flex justify-center">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0A0D17]/85 border border-[#E91E63]/30 text-slate-300 text-[10.5px] font-semibold shadow-inner"
              >
                <RiStore2Line className="text-[#E91E63] text-xs shrink-0" />
                <span className="truncate max-w-[140px]">{branchName}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2 flex flex-col items-center shrink-0">
          <Link
            href="/settings"
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E91E63] via-[#F43F5E] to-[#FB7185] flex items-center justify-center text-white font-bold text-xs shadow-[0_4px_12px_rgba(233,30,99,0.35)] ring-2 ring-white/10 hover:scale-105 transition-transform"
            title={`${userName} (${userEmail})`}
          >
            {userInitials}
          </Link>
        </div>
      )}

      {/* --- Grouped Navigation Items (Scrollable) --- */}
      <nav className="flex-1 px-2.5 py-1 overflow-y-auto no-scrollbar flex flex-col">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-1.5">
            {/* Category Header with Divider */}
            {!collapsed ? (
              <div className="flex items-center gap-2.5 px-2.5 pt-3 pb-1.5 text-[9.5px] font-extrabold tracking-[0.14em] text-slate-400/90 uppercase">
                <span className="shrink-0">{group.title}</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
              </div>
            ) : (
              <div className="w-8 h-[1px] bg-slate-800/80 mx-auto my-1.5" />
            )}

            {/* Category Items */}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isItemActive(item);
                const Icon = item.icon;

                // Real count from backend API
                const count = item.badgeKey === 'appointments'
                  ? realCounts.appointments
                  : item.badgeKey === 'leads'
                  ? realCounts.leads
                  : 0;

                const hasBadge = count > 0;
                const badgeText = count > 99 ? '99+' : count.toString();

                if (collapsed) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`relative flex items-center justify-center p-2 rounded-xl transition-all duration-150 group ${
                        active
                          ? 'bg-gradient-to-r from-[#E91E63]/25 to-transparent'
                          : 'hover:bg-white/[0.04]'
                      }`}
                      title={item.label}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#E91E63] rounded-r-md shadow-[0_0_10px_#E91E63]" />
                      )}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                          active
                            ? 'bg-[#E91E63]/20 border border-[#E91E63]/50 text-[#E91E63] shadow-[0_0_12px_rgba(233,30,99,0.3)]'
                            : 'bg-[#131926]/90 border border-slate-800/80 text-slate-400 group-hover:text-white group-hover:border-slate-700'
                        }`}
                      >
                        <Icon />
                      </div>
                      {hasBadge && (
                        <span className="absolute top-1.5 right-2.5 w-2 h-2 rounded-full bg-[#E91E63] ring-2 ring-[#090D16]" />
                      )}
                    </Link>
                  );
                }

                const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
                const isExpanded = hasSubItems && (active || leadsExpanded);

                return (
                  <div key={item.label} className="flex flex-col">
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        className={`flex-1 relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] transition-all duration-150 group ${
                          active
                            ? 'bg-gradient-to-r from-[#E91E63] to-[#F43F5E] text-white font-bold shadow-[0_4px_14px_rgba(233,30,99,0.35)]'
                            : 'text-slate-300 hover:text-white hover:bg-white/[0.04] font-medium'
                        }`}
                        onClick={() => {
                          if (hasSubItems) setLeadsExpanded(true);
                        }}
                      >
                        {/* Left glowing bar only when not full magenta button */}
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/80 rounded-r-md" />
                        )}

                        {/* Icon Box */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-[18px] shrink-0 transition-all ${
                            active
                              ? 'bg-white/20 text-white shadow-inner'
                              : 'bg-[#141A28]/80 border border-slate-800/80 text-slate-400 group-hover:text-white group-hover:border-slate-700'
                          }`}
                        >
                          <Icon />
                        </div>

                        {/* Label */}
                        <span className="flex-1 truncate tracking-[-0.01em]">
                          {item.label}
                        </span>

                        {/* Badge */}
                        {hasBadge && (
                          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-bold leading-tight ${
                            active ? 'bg-white text-[#E91E63]' : 'bg-[#E91E63] text-white shadow-[0_2px_8px_rgba(233,30,99,0.45)]'
                          }`}>
                            {badgeText}
                          </span>
                        )}
                      </Link>

                      {hasSubItems && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setLeadsExpanded(!leadsExpanded);
                          }}
                          className="px-1.5 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          aria-label="Toggle subtabs"
                        >
                          {isExpanded ? (
                            <RiArrowUpSLine className="text-sm" />
                          ) : (
                            <RiArrowDownSLine className="text-sm" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Subtabs Accordion matching Image 1 */}
                    {hasSubItems && isExpanded && (
                      <div className="flex flex-col gap-0.5 ml-4 pl-3.5 border-l border-white/10 my-1 py-0.5">
                        {item.subItems.map((sub) => {
                          const isSubActive = isSubItemActive(sub);
                          return (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              className={`flex items-center gap-2.5 py-1 px-2 rounded-lg text-[12px] transition-all group ${
                                isSubActive
                                  ? 'text-[#E91E63] font-bold bg-[#E91E63]/10'
                                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] font-medium'
                              }`}
                            >
                              {/* Bullet dot matching Image 1: pink dot if active, gray if inactive */}
                              <span
                                className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${
                                  isSubActive
                                    ? 'bg-[#E91E63] shadow-[0_0_8px_#E91E63] scale-125'
                                    : 'bg-slate-600 group-hover:bg-slate-400'
                                }`}
                              />
                              <span className="truncate">{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* --- Upgrade to Pro Plan Banner Card (Matching Image 1) --- */}
      {!collapsed && showUpgrade && (
        <div className="mx-2.5 mb-2.5 p-3 rounded-2xl bg-gradient-to-b from-[#1C1220] via-[#140F1D] to-[#0A0D17] border border-[#E91E63]/30 shadow-[0_8px_20px_rgba(0,0,0,0.5)] relative overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setShowUpgrade(false)}
            className="absolute top-2.5 right-2.5 text-slate-500 hover:text-white transition-colors cursor-pointer p-0.5"
            aria-label="Dismiss Pro Plan"
            title="Dismiss"
          >
            <RiCloseLine className="text-sm" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-amber-400/15 flex items-center justify-center text-amber-400 shrink-0">
              <RiVipCrownLine className="text-sm" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 leading-tight">Upgrade to</div>
              <div className="text-[13px] font-bold text-white leading-tight">Pro Plan</div>
            </div>
          </div>
          <ul className="space-y-1 mb-2.5 text-[11px]">
            <li className="flex items-center gap-1.5">
              <RiCheckLine className="text-[#E91E63] text-xs shrink-0 font-bold" />
              <span className="text-slate-300">More branches</span>
            </li>
            <li className="flex items-center gap-1.5">
              <RiCheckLine className="text-[#E91E63] text-xs shrink-0 font-bold" />
              <span className="text-slate-300">Advanced reports</span>
            </li>
            <li className="flex items-center gap-1.5">
              <RiCheckLine className="text-[#E91E63] text-xs shrink-0 font-bold" />
              <span className="text-slate-300">Priority support</span>
            </li>
          </ul>
          <button
            type="button"
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#F43F5E] hover:from-[#D81B60] hover:to-[#E11D48] text-white text-[12px] font-bold shadow-[0_4px_12px_rgba(233,30,99,0.35)] transition-all cursor-pointer text-center"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* --- Bottom Footer (Settings & Logout Only) --- */}
      <div className="border-t border-white/[0.08] p-2.5 shrink-0 bg-[#090D16]/95 backdrop-blur-sm">
        {!collapsed ? (
          <div className="grid grid-cols-2 gap-2">
            {/* Settings */}
            <Link
              href="/settings"
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all text-xs font-semibold group"
            >
              <RiSettings4Line className="text-base text-slate-400 group-hover:text-white shrink-0" />
              <span className="truncate">Settings</span>
            </Link>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#E91E63]/10 border border-[#E91E63]/25 text-[#E91E63] hover:bg-[#E91E63]/20 hover:border-[#E91E63]/40 transition-all text-xs font-semibold group cursor-pointer"
            >
              <RiLogoutBoxRLine className="text-base text-[#E91E63] group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/settings"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              title="Settings"
            >
              <RiSettings4Line className="text-xl" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#E91E63] hover:bg-[#E91E63]/10 transition-all cursor-pointer"
              title="Logout"
            >
              <RiLogoutBoxRLine className="text-xl" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default function Sidebar(props) {
  return (
    <Suspense
      fallback={
        <aside
          className={`sticky top-0 left-0 h-screen shrink-0 bg-[#090D16] border-r border-white/[0.08] ${
            props.collapsed ? 'w-[80px]' : 'w-[260px]'
          }`}
        />
      }
    >
      <SidebarInner {...props} />
    </Suspense>
  );
}
