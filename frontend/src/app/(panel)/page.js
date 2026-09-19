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
  RiMoreFill, RiLoader4Line, RiLoader2Line, RiAlertLine,
} from 'react-icons/ri';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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
  { icon: RiAddLine, text: 'New Appointment', color: 'bg-brand/15 text-brand', href: '/appointments' },
  { icon: RiWalkLine, text: 'Walk-in', color: 'bg-accent-blue/15 text-accent-blue', href: '/appointments' },
  { icon: RiUserAddLine, text: 'New Customer', color: 'bg-accent-green/15 text-accent-green', href: '/customers' },
  { icon: RiFileList3Line, text: 'New Invoice', color: 'bg-accent-purple/15 text-accent-purple', href: '/billing' },
  { icon: RiScissorsLine, text: 'Add Service', color: 'bg-accent-cyan/15 text-accent-cyan', href: '/services' },
  { icon: RiGiftLine, text: 'Add Package', color: 'bg-accent-yellow/15 text-accent-yellow', href: '/packages' },
  { icon: RiMailLine, text: 'Send Offer', color: 'bg-accent-red/15 text-accent-red', href: '/marketing' },
  { icon: RiVipCrownLine, text: 'Loyalty', color: 'bg-brand/15 text-brand', href: '/settings' },
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
  const [revenueData, setRevenueData] = useState({ chart: [], stats: {} });
  const [revenueDateRange, setRevenueDateRange] = useState('this_month');
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
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
        todayAptsRes,
        upcomingAptsRes,
        topSvcRes,
        recentCustRes,
        inventoryRes,
        staffPerfRes,
      ] = await Promise.allSettled([
        api.get('/dashboard/summary'),
        // revenue chart fetched separately
        api.get('/dashboard/today-appointments'),
        api.get('/dashboard/upcoming-appointments'),
        api.get('/dashboard/top-services'),
        api.get('/dashboard/recent-customers'),
        api.get('/dashboard/inventory-alerts'),
        api.get('/dashboard/staff-performance'),
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data);
      
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

  const fetchRevenueData = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const today = new Date();
      let start = new Date();
      let end = new Date();
      
      if (revenueDateRange === 'custom') {
        if (!customStartDate || !customEndDate) return; // Wait until both are selected
        start = new Date(customStartDate);
        end = new Date(customEndDate);
      } else if (revenueDateRange === 'today') {
        // start and end are today
      } else if (revenueDateRange === 'yesterday') {
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
      } else if (revenueDateRange === 'this_week') {
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        start = new Date(today.setDate(diff));
        end = new Date(); // up to today
      } else if (revenueDateRange === 'last_month') {
        start.setMonth(today.getMonth() - 1, 1);
        end.setMonth(today.getMonth(), 0);
      } else if (revenueDateRange === 'this_month') {
        start.setDate(1);
        end.setMonth(today.getMonth() + 1, 0);
      } else if (revenueDateRange === 'this_year') {
        start.setMonth(0, 1);
      }

      const pad = (n) => String(n).padStart(2, '0');
      const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      const startDate = toYMD(start);
      const endDate = toYMD(end);

      const res = await api.get(`/dashboard/revenue-chart?startDate=${startDate}&endDate=${endDate}`);
      setRevenueData(res.data?.data || res.data || { chart: [], stats: {} });
    } catch (err) {
      console.error(err);
    } finally {
      setRevenueLoading(false);
    }
  }, [revenueDateRange, customStartDate, customEndDate]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);


  // Derived stat cards from real data
  const statCards = [
    {
      icon: RiCalendarCheckLine,
      label: "Today's Appointments",
      value: summary?.today?.appointments?.total ?? 0,
      trend: `${summary?.trends?.today_appointments?.value ?? 0}% vs yesterday`,
      up: summary?.trends?.today_appointments?.is_up,
      color: 'bg-brand/15 text-brand',
      href: '/appointments'
    },
    {
      icon: RiUserLine,
      label: 'Total Customers',
      value: (summary?.customers?.total ?? 0).toLocaleString(),
      trend: `${summary?.trends?.monthly_customers?.value ?? 0}% vs last month`,
      up: summary?.trends?.monthly_customers?.is_up,
      color: 'bg-accent-blue/15 text-accent-blue',
      href: '/customers'
    },
    {
      icon: RiMoneyDollarCircleLine,
      label: "Today's Revenue",
      value: formatCurrency(summary?.today?.revenue ?? 0),
      trend: `${summary?.trends?.today_revenue?.value ?? 0}% vs yesterday`,
      up: summary?.trends?.today_revenue?.is_up,
      color: 'bg-accent-green/15 text-accent-green',
      href: '/billing'
    },
    {
      icon: RiTeamLine,
      label: 'Active Staff',
      value: summary?.staff?.active ?? 0,
      trend: `${summary?.today?.appointments?.ongoing ?? 0} currently busy`,
      up: null, // neutral gray
      color: 'bg-accent-purple/15 text-accent-purple',
      href: '/staff'
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
       
      </div>

      {/* ====== Stat Cards ====== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
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
              href={card.href}
              loading={loading}
              delay={`${(i + 1) * 0.1}s`}
            />
          ))
        )}
      </div>

      {/* ====== Row 2: Appointments Table + Revenue Chart ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* Today's Appointments */}
        <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden animate-[fadeIn_0.5s_ease_forwards]">
          <div className="flex items-center justify-between px-5 py-[18px] border-b border-admin-border">
            <span className="text-[0.95rem] font-semibold">Today&apos;s Appointments</span>
            <Link href="/appointments" className="text-sm text-brand font-medium flex items-center gap-1 cursor-pointer hover:text-brand-light transition-colors">View All <RiArrowRightSLine /></Link>
          </div>
          <div className="p-0 max-h-[360px] overflow-y-auto overflow-x-auto custom-scrollbar relative">
            {loading ? (
              <TableSkeleton rows={5} />
            ) : todayAppointments.length === 0 ? (
              <EmptyState message="No appointments scheduled for today" />
            ) : (
              <table className="w-full min-w-[500px] border-collapse">
                <thead className="sticky top-0 bg-admin-card z-10 shadow-sm">
                  <tr>
                    {['Time', 'Customer', 'Service', 'Staff', 'Status'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-admin-text-muted uppercase tracking-wider px-3 py-2.5 border-b border-admin-border bg-admin-card">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {todayAppointments.map((apt) => (
                    <tr key={apt.id} onClick={() => router.push(`/appointments?appointment_id=${apt.id}`)} className="hover:bg-white/[0.02] transition-colors cursor-pointer">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-[18px] border-b border-admin-border gap-3">
            <span className="text-[0.95rem] font-semibold">Revenue Overview</span>
            <div className="flex items-center gap-3">
              <select 
      value={revenueDateRange}
      onChange={(e) => setRevenueDateRange(e.target.value)}
      className="text-sm bg-admin-surface border border-admin-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand cursor-pointer"
    >
      <option value="today">Today</option>
      <option value="yesterday">Yesterday</option>
      <option value="this_week">This Week</option>
      <option value="this_month">This Month</option>
      <option value="last_month">Last Month</option>
      <option value="this_year">This Year</option>
      <option value="custom">Custom Range</option>
    </select>
    {revenueDateRange === 'custom' && (
      <div className="flex items-center gap-2 mt-2 sm:mt-0">
        <input 
          type="date" 
          value={customStartDate} 
          onChange={(e) => setCustomStartDate(e.target.value)}
          className="text-sm bg-admin-surface border border-admin-border rounded-lg px-2 py-1 focus:outline-none focus:border-brand"
        />
        <span className="text-admin-text-muted">to</span>
        <input 
          type="date" 
          value={customEndDate} 
          onChange={(e) => setCustomEndDate(e.target.value)}
          className="text-sm bg-admin-surface border border-admin-border rounded-lg px-2 py-1 focus:outline-none focus:border-brand"
        />
      </div>
    )}
            </div>
          </div>
          <div className="px-5 py-4 min-h-[300px] relative">
            {/* Show skeleton ONLY if we have no data yet (first load) */}
            {revenueLoading && !revenueData?.chart && (
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-[220px] w-full" />
              </div>
            )}
            
            <div className={`transition-opacity duration-300 ${revenueLoading && revenueData?.chart ? 'opacity-50 pointer-events-none' : 'opacity-100'}`} style={{ display: (revenueLoading && !revenueData?.chart) ? 'none' : 'block' }}>
              
              {revenueLoading && revenueData?.chart && (
                <div className="absolute inset-0 bg-admin-surface/30 z-50 flex items-center justify-center rounded-2xl backdrop-blur-[2px]">
                  <RiLoader2Line className="animate-spin text-brand text-4xl" />
                </div>
              )}

              <div className="flex items-baseline gap-2.5 mb-2">
                <span className="font-heading text-2xl font-bold">{formatCurrency(revenueData?.stats?.revenue ?? 0)}</span>
              </div>
              <div className="w-full h-[220px]">
                {revenueData?.chart?.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={revenueData.chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e74a8a" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#e74a8a" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <Bar 
                        dataKey="revenue" 
                        fill="url(#revenueGrad)" 
                        radius={[4, 4, 0, 0]} 
                        barSize={32}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No revenue data yet. Start billing to see charts." />
                )}
              </div>
              {/* Revenue Breakdown */}
              <div className="flex gap-4 mt-3">
                {[
                  { color: 'bg-accent-green', label: 'Collected', pct: formatCurrency(revenueData?.stats?.collected ?? 0) },
                  { color: 'bg-accent-red', label: 'Expenses', pct: formatCurrency(revenueData?.stats?.expenses ?? 0) },
                  { color: 'bg-accent-purple', label: 'Net Profit', pct: formatCurrency(revenueData?.stats?.net_profit ?? 0) },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                    <span className="text-xs text-admin-text-secondary">{item.label} <strong>{item.pct}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====== Row 3: Quick Actions + Upcoming ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 mb-6">

        {/* Quick Actions */}
        <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-[18px] border-b border-admin-border">
            <span className="text-[0.95rem] font-semibold">Quick Actions</span>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <Link href="/appointments" className="text-sm text-brand font-medium flex items-center gap-1 cursor-pointer hover:text-brand-light transition-colors">View All <RiArrowRightSLine /></Link>
          </div>
          <div className="px-5 py-3 max-h-[360px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <TableSkeleton rows={3} />
            ) : upcomingAppointments.length === 0 ? (
              <EmptyState message="No upcoming appointments" />
            ) : (
              upcomingAppointments.map((apt) => (
                <div key={apt.id} onClick={() => router.push(`/appointments?appointment_id=${apt.id}`)} className="flex items-center gap-3.5 py-3 border-b border-admin-border last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer px-2 rounded-lg -mx-2">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Top Services */}
        <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-[18px] border-b border-admin-border">
            <span className="text-[0.95rem] font-semibold">Top Services</span>
            <Link href="/services" className="text-sm text-brand font-medium flex items-center gap-1 cursor-pointer hover:text-brand-light transition-colors">View All <RiArrowRightSLine /></Link>
          </div>
          <div className="px-5 py-3 max-h-[320px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <TableSkeleton rows={5} />
            ) : topServices.length === 0 ? (
              <EmptyState message="No services data yet" />
            ) : (
              topServices.map((svc, i) => (
                <div key={i} onClick={() => router.push(`/services?category_id=${svc.category_id}&service_id=${svc.id}`)} className="flex items-center gap-3 py-2.5 px-2 -mx-2 border-b border-admin-border last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer rounded-lg">
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
            <Link href="/customers" className="text-sm text-brand font-medium flex items-center gap-1 cursor-pointer hover:text-brand-light transition-colors">View All <RiArrowRightSLine /></Link>
          </div>
          <div className="px-5 py-3 max-h-[320px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <TableSkeleton rows={5} />
            ) : recentCustomers.length === 0 ? (
              <EmptyState message="No customers added yet" />
            ) : (
              recentCustomers.map((cust) => (
                <div key={cust.id} onClick={() => router.push(`/customers?customer_id=${cust.id}`)} className="flex items-center gap-3 py-2.5 px-2 -mx-2 border-b border-admin-border last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer rounded-lg">
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
            <Link href="/inventory" className="text-sm text-brand font-medium flex items-center gap-1 cursor-pointer hover:text-brand-light transition-colors">View All <RiArrowRightSLine /></Link>
          </div>
          <div className="px-5 py-3 max-h-[320px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <TableSkeleton rows={5} />
            ) : inventoryAlerts.length === 0 ? (
              <EmptyState message="No products in inventory yet" />
            ) : (
              inventoryAlerts.map((item) => (
                <div key={item.id} onClick={() => router.push(`/inventory?product_id=${item.id}`)} className="flex items-center gap-3 py-2.5 px-2 -mx-2 border-b border-admin-border last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer rounded-lg">
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
                <div key={staff.id} onClick={() => router.push(`/staff?staff_id=${staff.id}`)} className="flex items-center gap-3 py-2.5 px-2 -mx-2 border-b border-admin-border last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer rounded-lg">
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
