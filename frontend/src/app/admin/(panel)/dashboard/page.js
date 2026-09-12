'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getGreeting, formatCurrency, formatTime, getInitials, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import {
  RiCalendarCheckLine, RiUserLine, RiMoneyDollarCircleLine, RiTeamLine,
  RiArrowRightSLine, RiArrowUpLine, RiArrowDownLine,
  RiAddLine, RiWalkLine, RiUserAddLine, RiFileList3Line,
  RiScissorsLine, RiGiftLine, RiMailLine, RiVipCrownLine,
  RiMoreFill, RiLoader4Line, RiAlertLine,
} from 'react-icons/ri';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import StatCard from '@/components/admin/StatCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* =============================================
   STATUS BADGE STYLES
   ============================================= */
const STATUS_STYLES = {
  confirmed: 'bg-accent-green/15 text-accent-green',
  planned: 'bg-accent-green/15 text-accent-green',
  pending: 'bg-accent-yellow/15 text-accent-yellow',
  'in-progress': 'bg-accent-blue/15 text-accent-blue',
  ongoing: 'bg-accent-blue/15 text-accent-blue',
  completed: 'bg-accent-green/15 text-accent-green',
  cancelled: 'bg-accent-red/15 text-accent-red',
  no_show: 'bg-accent-red/15 text-accent-red',
};

const QUICK_ACTIONS = [
  { icon: RiAddLine, text: 'New Appointment', color: 'bg-brand/15 text-brand', href: '/admin/appointments' },
  { icon: RiWalkLine, text: 'Walk-in', color: 'bg-accent-blue/15 text-accent-blue', href: '/admin/appointments' },
  { icon: RiUserAddLine, text: 'New Customer', color: 'bg-accent-green/15 text-accent-green', href: '/admin/customers' },
  { icon: RiFileList3Line, text: 'New Invoice', color: 'bg-accent-purple/15 text-accent-purple', href: '/admin/billing' },
  { icon: RiScissorsLine, text: 'Add Service', color: 'bg-accent-cyan/15 text-accent-cyan', href: '/admin/services' },
  { icon: RiGiftLine, text: 'Add Package', color: 'bg-accent-yellow/15 text-accent-yellow', href: '/admin/packages' },
  { icon: RiMailLine, text: 'Send Offer', color: 'bg-accent-red/15 text-accent-red', href: '/admin/marketing' },
  { icon: RiVipCrownLine, text: 'Loyalty', color: 'bg-brand/15 text-brand', href: '/admin/settings' },
];

/* =============================================
   LOADING SKELETON COMPONENT
   ============================================= */
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-admin-surface-light rounded-lg ${className}`}></div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-admin-card border border-admin-border rounded-2xl p-5 flex items-center gap-4">
      <Skeleton className="w-[52px] h-[52px] rounded-[10px]" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message = 'No data yet' }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-admin-text-muted">
      <RiAlertLine className="text-2xl mb-2 opacity-50" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

/* =============================================
   CUSTOM RECHARTS TOOLTIP
   ============================================= */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-admin-card border border-admin-border rounded-[10px] px-3.5 py-2.5 text-sm">
      <p className="text-admin-text-secondary mb-1">{label}</p>
      <p className="text-brand font-bold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

/* =============================================
   DASHBOARD PAGE
   ============================================= */
export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const greeting = getGreeting();

  // State for all dashboard data
  const [summary, setSummary] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [staffPerformance, setStaffPerformance] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        summaryRes,
        revenueRes,
        todayAptsRes,
        upcomingAptsRes,
        topSvcRes,
        recentCustRes,
        inventoryRes,
        staffPerfRes,
      ] = await Promise.allSettled([
        api.get('/dashboard/summary'),
        api.get('/dashboard/revenue-chart'),
        api.get('/dashboard/today-appointments'),
        api.get('/dashboard/upcoming-appointments'),
        api.get('/dashboard/top-services'),
        api.get('/dashboard/recent-customers'),
        api.get('/dashboard/inventory-alerts'),
        api.get('/dashboard/staff-performance'),
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data);
      if (revenueRes.status === 'fulfilled') setRevenueChart(revenueRes.value.data || []);
      if (todayAptsRes.status === 'fulfilled') setTodayAppointments(todayAptsRes.value.data || []);
      if (upcomingAptsRes.status === 'fulfilled') setUpcomingAppointments(upcomingAptsRes.value.data || []);
      if (topSvcRes.status === 'fulfilled') setTopServices(topSvcRes.value.data || []);
      if (recentCustRes.status === 'fulfilled') setRecentCustomers(recentCustRes.value.data || []);
      if (inventoryRes.status === 'fulfilled') setInventoryAlerts(inventoryRes.value.data || []);
      if (staffPerfRes.status === 'fulfilled') setStaffPerformance(staffPerfRes.value.data || []);
    } catch (err) {
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived stat cards from real data
  const statCards = [
    {
      icon: RiCalendarCheckLine,
      label: "Today's Appointments",
      value: summary?.today?.appointments?.total ?? 0,
      trend: `${summary?.today?.appointments?.completed ?? 0} completed`,
      up: true,
      color: 'bg-brand/15 text-brand',
    },
    {
      icon: RiUserLine,
      label: 'Total Customers',
      value: (summary?.customers?.total ?? 0).toLocaleString(),
      trend: `+${summary?.customers?.new_this_month ?? 0} this month`,
      up: (summary?.customers?.new_this_month ?? 0) > 0,
      color: 'bg-accent-blue/15 text-accent-blue',
    },
    {
      icon: RiMoneyDollarCircleLine,
      label: "Today's Revenue",
      value: formatCurrency(summary?.today?.revenue ?? 0),
      trend: `Monthly: ${formatCurrency(summary?.monthly?.revenue ?? 0)}`,
      up: (summary?.today?.revenue ?? 0) > 0,
      color: 'bg-accent-green/15 text-accent-green',
    },
    {
      icon: RiTeamLine,
      label: 'Active Staff',
      value: summary?.staff?.active ?? 0,
      trend: `${summary?.today?.appointments?.ongoing ?? 0} currently busy`,
      up: true,
      color: 'bg-accent-purple/15 text-accent-purple',
    },
  ];

  return (
    <div className="animate-[fadeIn_0.5s_ease_forwards]">

      {/* ====== Greeting Row ====== */}
      <div className="flex items-center justify-between gap-5 mb-6">
        <div>
          <h1 className="font-heading text-[1.75rem] font-bold">{greeting}, {user?.first_name || 'Admin'}!</h1>
          <p className="text-sm text-admin-text-secondary mt-1">Here&apos;s your salon business overview for today.</p>
        </div>
        <div className="bg-gradient-to-br from-[#2d1b4e] to-[#1a1040] rounded-2xl px-7 py-5 flex items-center gap-4 border border-accent-purple/20 overflow-hidden">
          <div>
            <h3 className="text-[1.1rem] font-bold text-white mb-1">Manage Beauty Business Smarter</h3>
            <p className="text-sm text-white/60">Track, optimize, and grow your salon</p>
          </div>
        </div>
      </div>

      {/* ====== Stat Cards ====== */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          statCards.map((card, i) => (
            <StatCard
              key={i}
              icon={card.icon}
              label={card.label}
              value={card.value}
              color={card.color}
              trend={card.trend}
              up={card.up}
              loading={loading}
              delay={`${(i + 1) * 0.1}s`}
            />
          ))
        )}
      </div>

      {/* ====== Row 2: Appointments Table + Revenue Chart ====== */}
      <div className="grid grid-cols-2 gap-5 mb-6">

        {/* Today's Appointments */}
        <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden animate-[fadeIn_0.5s_ease_forwards]">
          <div className="flex items-center justify-between px-5 py-[18px] border-b border-admin-border">
            <span className="text-[0.95rem] font-semibold">Today&apos;s Appointments</span>
            <Link href="/admin/appointments" className="text-sm text-brand font-medium flex items-center gap-1 cursor-pointer hover:text-brand-light transition-colors">View All <RiArrowRightSLine /></Link>
          </div>
          <div className="p-0 max-h-[360px] overflow-y-auto custom-scrollbar relative">
            {loading ? (
              <TableSkeleton rows={5} />
            ) : todayAppointments.length === 0 ? (
              <EmptyState message="No appointments scheduled for today" />
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-admin-card z-10 shadow-sm">
                  <tr>
                    {['Time', 'Customer', 'Service', 'Staff', 'Status'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-admin-text-muted uppercase tracking-wider px-3 py-2.5 border-b border-admin-border bg-admin-card">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {todayAppointments.map((apt) => (
                    <tr key={apt.id} onClick={() => router.push(`/admin/appointments?appointment_id=${apt.id}`)} className="hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <td className="px-3 py-3 text-sm font-medium border-b border-admin-border last:border-0">{formatTime(apt.start_time)}</td>
                      <td className="px-3 py-3 text-sm border-b border-admin-border">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-[0.65rem] font-bold text-white shrink-0">
                            {getInitials(apt.customer_name?.split(' ')[0], apt.customer_name?.split(' ')[1])}
                          </div>
                          {apt.customer_name}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm border-b border-admin-border">{apt.service_name}</td>
                      <td className="px-3 py-3 text-sm border-b border-admin-border">{apt.staff_name}</td>
                      <td className="px-3 py-3 text-sm border-b border-admin-border">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${STATUS_STYLES[apt.status] || STATUS_STYLES.pending}`}>
                          {apt.status === 'in-progress' || apt.status === 'ongoing' ? 'In Progress' : apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden animate-[fadeIn_0.5s_ease_forwards]">
          <div className="flex items-center justify-between px-5 py-[18px] border-b border-admin-border">
            <span className="text-[0.95rem] font-semibold">Revenue Overview</span>
            <span className="text-sm text-admin-text-muted">Monthly</span>
          </div>
          <div className="px-5 py-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-[220px] w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2.5 mb-2">
                  <span className="font-heading text-2xl font-bold">{formatCurrency(summary?.monthly?.revenue ?? 0)}</span>
                  <span className="text-sm text-accent-green flex items-center gap-1">
                    <RiArrowUpLine /> This Month
                  </span>
                </div>
                <div className="w-full h-[220px]">
                  {revenueChart.length > 0 ? (
                    <ResponsiveContainer>
                      <AreaChart data={revenueChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#e74a8a" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#e74a8a" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickFormatter={(v) => `${v / 1000}K`} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="revenue" stroke="#e74a8a" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: '#e74a8a', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#e74a8a', stroke: '#fff', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No revenue data yet. Start billing to see charts." />
                  )}
                </div>
                {/* Revenue Breakdown */}
                <div className="flex gap-4 mt-3">
                  {[
                    { color: 'bg-accent-green', label: 'Collected', pct: formatCurrency(summary?.monthly?.collected ?? 0) },
                    { color: 'bg-accent-red', label: 'Expenses', pct: formatCurrency(summary?.monthly?.expenses ?? 0) },
                    { color: 'bg-accent-purple', label: 'Net Profit', pct: formatCurrency(summary?.monthly?.net_profit ?? 0) },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                      <span className="text-xs text-admin-text-secondary">{item.label} <strong>{item.pct}</strong></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ====== Row 3: Quick Actions + Upcoming ====== */}
      <div className="grid grid-cols-[2fr_1fr] gap-5 mb-6">

        {/* Quick Actions */}
        <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-[18px] border-b border-admin-border">
            <span className="text-[0.95rem] font-semibold">Quick Actions</span>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-4 gap-3">
              {QUICK_ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                  <Link key={i} href={action.href} className="flex flex-col items-center gap-2 py-3.5 px-2 rounded-[10px] cursor-pointer hover:bg-admin-surface-hover hover:-translate-y-0.5 transition-all duration-150">
                    <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center text-xl ${action.color}`}>
                      <Icon />
                    </div>
                    <span className="text-[0.7rem] text-admin-text-secondary text-center font-medium whitespace-nowrap">{action.text}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-[18px] border-b border-admin-border">
            <span className="text-[0.95rem] font-semibold">Upcoming Appointments</span>
            <Link href="/admin/appointments" className="text-sm text-brand font-medium flex items-center gap-1 cursor-pointer hover:text-brand-light transition-colors">View All <RiArrowRightSLine /></Link>
          </div>
          <div className="px-5 py-3 max-h-[360px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <TableSkeleton rows={3} />
            ) : upcomingAppointments.length === 0 ? (
              <EmptyState message="No upcoming appointments" />
            ) : (
              upcomingAppointments.map((apt) => (
                <div key={apt.id} onClick={() => router.push(`/admin/appointments?appointment_id=${apt.id}`)} className="flex items-center gap-3.5 py-3 border-b border-admin-border last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer px-2 rounded-lg -mx-2">
                  <span className="text-sm font-semibold text-admin-text-secondary min-w-[65px]">{formatTime(apt.start_time)}</span>
                  <span className="w-2 h-2 rounded-full bg-brand shrink-0"></span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{apt.customer_name}</div>
                    <div className="text-xs text-admin-text-muted">{apt.service_name}</div>
                  </div>
                  <span className="text-[0.7rem] px-2.5 py-1 rounded-full font-semibold bg-accent-blue/15 text-accent-blue">
                    {formatDate(apt.appointment_date)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ====== Row 4: Top Services + Customers + Inventory + Staff ====== */}
      <div className="grid grid-cols-4 gap-5">

        {/* Top Services */}
        <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-[18px] border-b border-admin-border">
            <span className="text-[0.95rem] font-semibold">Top Services</span>
            <Link href="/admin/services" className="text-sm text-brand font-medium flex items-center gap-1 cursor-pointer hover:text-brand-light transition-colors">View All <RiArrowRightSLine /></Link>
          </div>
          <div className="px-5 py-3 max-h-[320px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <TableSkeleton rows={5} />
            ) : topServices.length === 0 ? (
              <EmptyState message="No services data yet" />
            ) : (
              topServices.map((svc, i) => (
                <div key={i} onClick={() => router.push(`/admin/services?category_id=${svc.category_id}&service_id=${svc.id}`)} className="flex items-center gap-3 py-2.5 px-2 -mx-2 border-b border-admin-border last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer rounded-lg">
                  <span className="w-7 h-7 rounded-md bg-admin-surface-light flex items-center justify-center text-xs font-bold text-admin-text-muted shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{svc.name}</div>
                  </div>
                  <span className="text-sm font-semibold">{svc.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Customers */}
        <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-[18px] border-b border-admin-border">
            <span className="text-[0.95rem] font-semibold">Recent Customers</span>
            <Link href="/admin/customers" className="text-sm text-brand font-medium flex items-center gap-1 cursor-pointer hover:text-brand-light transition-colors">View All <RiArrowRightSLine /></Link>
          </div>
          <div className="px-5 py-3 max-h-[320px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <TableSkeleton rows={5} />
            ) : recentCustomers.length === 0 ? (
              <EmptyState message="No customers added yet" />
            ) : (
              recentCustomers.map((cust) => (
                <div key={cust.id} onClick={() => router.push(`/admin/customers?customer_id=${cust.id}`)} className="flex items-center gap-3 py-2.5 px-2 -mx-2 border-b border-admin-border last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-[0.7rem] font-bold text-white shrink-0">
                    {getInitials(cust.first_name, cust.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{cust.first_name} {cust.last_name || ''}</div>
                    <div className="text-xs text-admin-text-muted">{cust.phone || cust.email || '—'}</div>
                  </div>
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-accent-purple/15 text-accent-purple">New</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-[18px] border-b border-admin-border">
            <span className="text-[0.95rem] font-semibold">Inventory Alerts</span>
            <Link href="/admin/inventory" className="text-sm text-brand font-medium flex items-center gap-1 cursor-pointer hover:text-brand-light transition-colors">View All <RiArrowRightSLine /></Link>
          </div>
          <div className="px-5 py-3 max-h-[320px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <TableSkeleton rows={5} />
            ) : inventoryAlerts.length === 0 ? (
              <EmptyState message="No products in inventory yet" />
            ) : (
              inventoryAlerts.map((item) => (
                <div key={item.id} onClick={() => router.push(`/admin/inventory?product_id=${item.id}`)} className="flex items-center gap-3 py-2.5 px-2 -mx-2 border-b border-admin-border last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-admin-text-muted">{item.category || 'General'}</div>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${item.low ? 'bg-accent-red/15 text-accent-red' : 'bg-accent-green/15 text-accent-green'}`}>
                    {item.low ? 'Low Stock' : 'In Stock'}
                  </span>
                  <span className="text-sm font-semibold min-w-[24px] text-right">{item.stock_quantity}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Staff Performance */}
        <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-[18px] border-b border-admin-border">
            <span className="text-[0.95rem] font-semibold">Staff Performance</span>
            <span className="text-xs text-admin-text-muted">This Month</span>
          </div>
          <div className="px-5 py-3 max-h-[320px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <TableSkeleton rows={5} />
            ) : staffPerformance.length === 0 ? (
              <EmptyState message="No staff members added yet" />
            ) : (
              staffPerformance.map((staff) => (
                <div key={staff.id} onClick={() => router.push(`/admin/staff?staff_id=${staff.id}`)} className="flex items-center gap-3 py-2.5 px-2 -mx-2 border-b border-admin-border last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-[0.75rem] font-bold text-white shrink-0">
                    {staff.name?.[0] || '?'}
                  </div>
                  <div className="min-w-[80px]">
                    <div className="text-sm font-medium">{staff.name}</div>
                    <div className="text-xs text-admin-text-muted">{staff.role}</div>
                  </div>
                  <span className="text-sm font-semibold min-w-[24px] text-center">{staff.count}</span>
                  <div className="flex items-center gap-2 flex-1 min-w-[60px]">
                    <div className="flex-1 h-1.5 bg-admin-surface-light rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark transition-[width] duration-1000"
                        style={{ width: `${staff.perf}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold min-w-[36px] text-right">{staff.perf}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-accent-red/90 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-[fadeIn_0.3s_ease_forwards] z-50">
          <RiAlertLine className="text-lg" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-white/80 hover:text-white ml-2">✕</button>
        </div>
      )}
    </div>
  );
}
