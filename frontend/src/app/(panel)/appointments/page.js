'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatTime, getInitials } from '@/lib/utils';
import { format } from 'date-fns';
import api from '@/lib/api';
import ScheduleGrid from '@/components/admin/ScheduleGrid';
import MiniCalendar from '@/components/admin/MiniCalendar';
import {
  RiCalendarEventLine,
  RiCheckLine,
  RiTimeLine,
  RiCloseLine,
  RiWalkLine,
  RiAddLine,
  RiCalendarLine,
  RiSearchLine,
  RiMoreFill,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiDeleteBinLine,
  RiShieldCheckLine,
  RiDownload2Line,
  RiUserUnfollowLine,
  RiFilter3Line,
} from 'react-icons/ri';
import AddAppointmentModal from '@/components/admin/appointments/AddAppointmentModal';
import AppointmentDetailsDrawer from '@/components/admin/appointments/AppointmentDetailsDrawer';
import TableScrollContainer from '@/components/admin/common/TableScrollContainer';
import BulkActionBar from '@/components/admin/common/BulkActionBar';
import VisualAvatar from '@/components/admin/common/VisualAvatar';
import { useConfirm } from '@/context/ConfirmContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

function MiniBarChart({ color = '#E91E63', bars = [40, 65, 50, 85, 100] }) {
  return (
    <div className="flex items-end gap-1 h-7">
      {bars.map((height, i) => (
        <div
          key={i}
          style={{ height: `${height}%`, backgroundColor: color }}
          className="w-1.5 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
        />
      ))}
    </div>
  );
}

const TOP_SERVICES = [
  { rank: 1, name: 'Hair Colour', percentage: 28, count: 14 },
  { rank: 2, name: 'Haircut & Styling', percentage: 21, count: 10 },
  { rank: 3, name: 'Facial Treatment', percentage: 17, count: 8 },
  { rank: 4, name: 'Hair Spa', percentage: 13, count: 6 },
  { rank: 5, name: 'Keratin Treatment', percentage: 12, count: 5 },
];

const TABS = ['Today', 'Upcoming', 'Pending', 'Unassigned', 'Cancelled'];

const STATUS_STYLES = {
  confirmed: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  planned: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  'in-progress': 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  ongoing: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  completed: 'bg-purple-500/15 text-purple-600 border-purple-300',
  cancelled: 'bg-red-500/15 text-red-500 border-red-500/30',
  no_show: 'bg-red-500/15 text-red-500 border-red-500/30',
  unassigned: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
};

const PAYMENT_STYLES = {
  paid: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  partial: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  pending: 'bg-red-500/15 text-red-500 border-red-500/30',
  unpaid: 'bg-red-500/15 text-red-500 border-red-500/30',
  refunded: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { confirm } = useConfirm();

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('Day'); // Day, Week, Month
  const [activeTab, setActiveTab] = useState('Today');
  const [appointments, setAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [monthAppointments, setMonthAppointments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedViewAppointment, setSelectedViewAppointment] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [preselectedCustomerId, setPreselectedCustomerId] = useState('');
  const [backendStats, setBackendStats] = useState(null);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCancelled, setShowCancelled] = useState(true);
  const [prefilledSlot, setPrefilledSlot] = useState(null);

  // Top-level stats
  const stats = {
    total: appointments.length || 12,
    confirmed:
      appointments.filter(
        (a) => a.status === 'confirmed' || a.status === 'planned' || a.status === 'completed'
      ).length || 8,
    inProgress:
      appointments.filter((a) => a.status === 'ongoing' || a.status === 'in-progress').length || 3,
    cancelled:
      appointments.filter((a) => a.status === 'cancelled' || a.status === 'no_show').length || 1,
    pending: appointments.filter((a) => a.status === 'pending').length || 0,
    unassigned: appointments.filter((a) => !a.staff_member_id && !a.staff_id).length || 0,
    walkIns: appointments.filter((a) => a.source === 'walk_in').length || 4,
  };

  const pct = (n) => (stats.total > 0 ? Math.round((n / stats.total) * 100) : 0);

  const insightData = [
    { name: 'Confirmed', value: stats.confirmed || 8, color: '#10B981' },
    { name: 'In Progress', value: stats.inProgress || 3, color: '#3B82F6' },
    { name: 'Pending', value: stats.pending || 0.01, color: '#F59E0B' },
    { name: 'Cancelled', value: stats.cancelled || 1, color: '#EF4444' },
  ];

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      let apptQuery = `/appointments?date=${dateStr}&limit=100`;
      if (selectedStaff) apptQuery += `&staff_id=${selectedStaff}`;
      if (selectedService) apptQuery += `&service_id=${selectedService}`;

      let upcomingQuery = `/appointments?upcoming=true&limit=20`;
      if (selectedStaff) upcomingQuery += `&staff_id=${selectedStaff}`;

      const monthStartStr = format(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        'yyyy-MM-dd'
      );
      const monthEndStr = format(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
        'yyyy-MM-dd'
      );
      let monthQuery = `/appointments?from_date=${monthStartStr}&to_date=${monthEndStr}&limit=500`;
      if (selectedStaff) monthQuery += `&staff_id=${selectedStaff}`;

      let statsQuery = `/appointments/stats?date=${dateStr}`;
      if (selectedStaff) statsQuery += `&staff_id=${selectedStaff}`;
      if (selectedService) statsQuery += `&service_id=${selectedService}`;

      const [
        apptsRes,
        upcomingRes,
        monthRes,
        staffRes,
        custRes,
        servRes,
        statsRes,
        settingsRes,
      ] = await Promise.allSettled([
        api.get(apptQuery),
        api.get(upcomingQuery),
        api.get(monthQuery),
        api.get('/staff'),
        api.get('/customers?limit=100'),
        api.get('/services?active_only=true'),
        api.get(statsQuery),
        api.get('/settings'),
      ]);

      if (apptsRes.status === 'fulfilled') {
        setAppointments(apptsRes.value.data?.appointments || apptsRes.value.data || []);
      }
      if (upcomingRes.status === 'fulfilled') {
        setUpcomingAppointments(upcomingRes.value.data?.appointments || upcomingRes.value.data || []);
      }
      if (monthRes.status === 'fulfilled') {
        setMonthAppointments(monthRes.value.data?.appointments || monthRes.value.data || []);
      }
      if (staffRes.status === 'fulfilled') {
        const rawStaff = staffRes.value.data?.users || staffRes.value.data || [];
        setStaffList(Array.isArray(rawStaff) ? rawStaff.filter((s) => s.is_active !== false) : []);
      }
      if (custRes.status === 'fulfilled') {
        setCustomersList(custRes.value.data?.customers || custRes.value.data || []);
      }
      if (servRes.status === 'fulfilled') {
        const rawServices = servRes.value.data?.services || servRes.value.data || [];
        setServicesList(Array.isArray(rawServices) ? rawServices.filter((s) => s.is_active !== false) : []);
      }
      if (statsRes.status === 'fulfilled') {
        setBackendStats(statsRes.value.data?.data || statsRes.value.data);
      }
      if (settingsRes.status === 'fulfilled') {
        setBusinessSettings(
          settingsRes.value.data?.settings || settingsRes.value.data?.data?.settings || null
        );
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load appointments data');
    } finally {
      setLoading(false);
    }
  }, [currentDate, selectedStaff, selectedService]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Deep Link Handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appointmentId = params.get('appointment_id');
    const customerId = params.get('customer_id');

    if (appointmentId && !selectedViewAppointment) {
      const found =
        appointments.find((a) => a.id == appointmentId) ||
        upcomingAppointments.find((a) => a.id == appointmentId);
      if (found) {
        setSelectedViewAppointment(found);
      } else {
        api
          .get(`/appointments/${appointmentId}`)
          .then((res) => {
            setSelectedViewAppointment(res.data.data || res.data.appointment || res.data);
          })
          .catch(console.error);
      }
    }

    if (customerId && !isAddModalOpen) {
      setPreselectedCustomerId(customerId);
      setIsAddModalOpen(true);
    }
  }, [appointments, upcomingAppointments, selectedViewAppointment, isAddModalOpen]);

  const handleCloseDrawer = () => {
    setSelectedViewAppointment(null);
    const url = new URL(window.location);
    if (url.searchParams.has('appointment_id')) {
      url.searchParams.delete('appointment_id');
      window.history.replaceState({}, '', url);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditData(null);
    setPreselectedCustomerId('');
    setPrefilledSlot(null);
    const url = new URL(window.location);
    if (url.searchParams.has('customer_id')) {
      url.searchParams.delete('customer_id');
      window.history.replaceState({}, '', url);
    }
  };

  const handleDateChange = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const handleCalendarSelect = (date) => {
    setCurrentDate(date);
  };

  const handleEdit = (apt) => {
    setEditData(apt);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (apt) => {
    setItemToDelete(apt);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/appointments/${itemToDelete.id}`);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchData();
      toast.success('Appointment deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete appointment');
    }
  };

  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments;
    const q = searchQuery.toLowerCase();
    return appointments.filter(
      (a) =>
        (a.customer_first_name || '').toLowerCase().includes(q) ||
        (a.customer_last_name || '').toLowerCase().includes(q) ||
        (a.service_name || '').toLowerCase().includes(q) ||
        (a.staff_first_name || '').toLowerCase().includes(q)
    );
  }, [appointments, searchQuery]);

  const tabAppointments = {
    Today: appointments.filter((a) => showCancelled ? true : (a.status !== 'cancelled' && a.status !== 'no_show')),
    Upcoming: upcomingAppointments,
    Pending: appointments.filter((a) => a.status === 'pending'),
    Unassigned: appointments.filter((a) => !a.staff_member_id && !a.staff_id),
    Cancelled: appointments.filter((a) => a.status === 'cancelled' || a.status === 'no_show'),
  };

  const visibleAppointments = tabAppointments[activeTab] || [];

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(visibleAppointments.map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkStatus = async (status) => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await api.post('/appointments/bulk-status', { ids: selectedIds, status });
      toast.success(`${selectedIds.length} appointment${selectedIds.length > 1 ? 's' : ''} updated to ${status}`);
      fetchData();
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update appointments');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportSelected = () => {
    if (selectedIds.length === 0) return;
    const selectedAppts = appointments.filter(a => selectedIds.includes(a.id));
    const headers = ['Customer', 'Phone', 'Service', 'Staff', 'Date', 'Time', 'Status'];
    const csvRows = [headers.join(',')];

    for (const row of selectedAppts) {
      const custName = `${row.customer_first_name || ''} ${row.customer_last_name || ''}`.trim();
      const staffName = `${row.staff_first_name || ''} ${row.staff_last_name || ''}`.trim() || 'Any Staff';
      const values = [
        `"${custName}"`,
        `"${row.customer_phone || ''}"`,
        `"${row.service_name || ''}"`,
        `"${staffName}"`,
        `"${row.appointment_date || ''}"`,
        `"${row.start_time?.substring(0, 5) || ''} - ${row.end_time?.substring(0, 5) || ''}"`,
        `"${row.status || ''}"`,
      ];
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `selected_appointments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedAppts.length} selected appointments`);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const ok = await confirm({
      title: 'Delete Selected Appointments',
      message: `Are you sure you want to permanently delete ${selectedIds.length} appointment${selectedIds.length > 1 ? 's' : ''}?`,
      confirmText: 'Delete Permanently',
      type: 'danger',
    });
    if (!ok) return;

    setBulkLoading(true);
    try {
      await api.post('/appointments/bulk-delete', { ids: selectedIds });
      toast.success(`${selectedIds.length} appointment${selectedIds.length > 1 ? 's' : ''} deleted`);
      fetchData();
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete selected appointments');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* ========================================================
          1. EXACT HERO HEADER & 5 STATS CARDS SECTION
             (Full-bleed from root header down behind stat cards)
         ======================================================== */}
      <div className="relative w-full mb-6">
        <div
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
          }}
        >
          {/* ========================================================
              LIGHT MODE GRADIENTS (Hidden completely in dark mode)
             ======================================================== */}
          {/* Full-bleed ambient backdrop extending down through the stat cards */}
          <div
            className="dark:hidden absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, #FDE2EC 0%, #FDEBF2 45%, rgba(253, 235, 242, 0.4) 75%, transparent 100%)',
            }}
          />

          {/* Ambient radial pink aura centered behind model & quote */}
          <div
            className="dark:hidden absolute top-0 right-0 w-3/4 h-[380px] pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 65% at 75% 25%, rgba(255, 202, 225, 0.85) 0%, rgba(255, 226, 239, 0.45) 50%, transparent 85%)',
            }}
          />

          {/* ========================================================
              DARK MODE GRADIENTS (Luxury seamless dark aura matching #0f0f1a)
             ======================================================== */}
          {/* Primary vertical dark wash: delicate rose-wine diffusing into dark background */}
          <div
            className="hidden dark:block absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(233, 30, 99, 0.16) 0%, rgba(194, 24, 91, 0.08) 35%, rgba(15, 15, 26, 0.3) 70%, transparent 100%)',
            }}
          />

          {/* Dark mode radial pink aura centered behind header & stat cards */}
          <div
            className="hidden dark:block absolute top-0 right-0 w-3/4 h-[380px] pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 75% 65% at 75% 20%, rgba(233, 30, 99, 0.18) 0%, rgba(194, 24, 91, 0.06) 50%, transparent 85%)',
            }}
          />

          {/* Dark mode secondary violet aura on left for rich depth */}
          <div
            className="hidden dark:block absolute top-0 left-0 w-1/2 h-[300px] pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(168, 85, 247, 0.09) 0%, transparent 75%)',
            }}
          />
        </div>

        {/* Exact Model & Calligraphy Graphic (commented out for now) */}
        {/* <div className="hidden lg:block absolute right-0 xl:right-4 2xl:right-8 top-0 pointer-events-none z-0">
          <img
            src="/appointment_hero_full.png"
            alt="More Bookings Happier Clients"
            className="h-[215px] xl:h-[235px] 2xl:h-[250px] w-auto object-contain object-right select-none"
          />
        </div> */}

        {/* Top Bar: Title on left */}
        <div className="relative z-10 flex items-start justify-between min-h-[105px] xl:min-h-[118px] 2xl:min-h-[128px] px-6 pt-5 sm:pt-6 mb-1">
          <div className="max-w-[340px] xl:max-w-md z-10 pt-1">
            <h1 className="text-2xl xl:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Appointments
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your salon appointments, walk-ins and staff schedules.
            </p>
          </div>
        </div>

        {/* 5 Metric Stat Cards (moved slightly up) */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 px-6 mt-0">
          {/* Card 1: Total Appointments */}
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FFD4E2] dark:bg-pink-900/50 text-[#E91E63] flex items-center justify-center text-lg shrink-0 shadow-xs">
                  <RiCalendarEventLine />
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-tight">
                  Total<br />Appointments
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                <RiMoreFill />
              </button>
            </div>
            <div className="flex items-end justify-between my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {backendStats?.total?.value ?? (stats.total || 12)}
              </span>
              <MiniBarChart color="#E91E63" bars={[35, 60, 50, 80, 100]} />
            </div>
            <div className="text-xs font-bold text-emerald-500 flex items-center gap-1 mt-1">
              <RiArrowUpLine /> 33% vs yesterday
            </div>
          </div>

          {/* Card 2: Confirmed */}
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center text-lg shrink-0 shadow-xs">
                  <RiCheckLine />
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-tight">
                  Confirmed
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                <RiMoreFill />
              </button>
            </div>
            <div className="flex items-end justify-between my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {backendStats?.confirmed?.value ?? (stats.confirmed || 8)}
              </span>
              <MiniBarChart color="#3B82F6" bars={[30, 50, 70, 90, 100]} />
            </div>
            <div className="text-xs font-bold text-emerald-500 flex items-center gap-1 mt-1">
              <RiArrowUpLine /> 60% vs yesterday
            </div>
          </div>

          {/* Card 3: In Progress */}
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center text-lg shrink-0 shadow-xs">
                  <RiTimeLine />
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-tight">
                  In Progress
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                <RiMoreFill />
              </button>
            </div>
            <div className="flex items-end justify-between my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {backendStats?.in_progress?.value ?? (stats.inProgress || 3)}
              </span>
              <MiniBarChart color="#F59E0B" bars={[40, 60, 55, 85, 100]} />
            </div>
            <div className="text-xs font-bold text-amber-500 flex items-center gap-1 mt-1">
              <RiArrowUpLine /> 200% vs yesterday
            </div>
          </div>

          {/* Card 4: Cancelled */}
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-500 flex items-center justify-center text-lg shrink-0 shadow-xs">
                  <RiCloseLine />
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-tight">
                  Cancelled
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                <RiMoreFill />
              </button>
            </div>
            <div className="flex items-end justify-between my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {backendStats?.cancelled?.value ?? (stats.cancelled || 1)}
              </span>
              <MiniBarChart color="#EF4444" bars={[60, 45, 75, 55, 80]} />
            </div>
            <div className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1">
              <RiArrowDownLine /> 50% vs yesterday
            </div>
          </div>

          {/* Card 5: Walk-ins */}
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center text-lg shrink-0 shadow-xs">
                  <RiWalkLine />
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-tight">
                  Walk-ins
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                <RiMoreFill />
              </button>
            </div>
            <div className="flex items-end justify-between my-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {backendStats?.walk_ins?.value ?? (stats.walkIns || 4)}
              </span>
              <MiniBarChart color="#10B981" bars={[40, 65, 55, 85, 100]} />
            </div>
            <div className="text-xs font-bold text-emerald-500 flex items-center gap-1 mt-1">
              <RiArrowUpLine /> 33% vs yesterday
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. CONTROLS TOOLBAR (View Switcher + Date Nav + Filters + Search)
         ======================================================== */}
      <div className="px-6 flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Day / Week / Month Switch */}
          <div className="flex items-center bg-white dark:bg-[#1a1a2e] border border-gray-200/80 dark:border-white/10 p-1 rounded-xl shadow-xs">
            {['Day', 'Week', 'Month'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-[#E91E63] text-white shadow-xs font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Date Nav Stepper */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-2 border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#1a1a2e] rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-gray-600 dark:text-gray-300"
            >
              <RiArrowLeftSLine className="text-base" />
            </button>
            <div className="px-4 py-2 border border-gray-200/80 dark:border-white/10 rounded-xl text-xs font-semibold bg-white dark:bg-[#1a1a2e] text-gray-800 dark:text-gray-200 flex items-center gap-2 min-w-[160px] justify-center shadow-xs">
              <RiCalendarLine className="text-[#E91E63] text-sm" />
              {format(currentDate, 'EEE, d MMM yyyy')}
            </div>
            <button
              onClick={() => handleDateChange(1)}
              className="p-2 border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#1a1a2e] rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-gray-600 dark:text-gray-300"
            >
              <RiArrowRightSLine className="text-base" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Staff Filter Dropdown */}
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="bg-white dark:bg-[#1a1a2e] border border-gray-200/80 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none focus:border-[#E91E63] shadow-xs cursor-pointer"
          >
            <option value="">All Staff</option>
            {staffList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.first_name} {st.last_name || ''}
              </option>
            ))}
          </select>

          {/* Services Filter Dropdown */}
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="bg-white dark:bg-[#1a1a2e] border border-gray-200/80 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 outline-none focus:border-[#E91E63] shadow-xs cursor-pointer"
          >
            <option value="">All Services</option>
            {servicesList.map((sv) => (
              <option key={sv.id} value={sv.id}>
                {sv.name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[230px]">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search staff or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1a1a2e] border border-gray-200/80 dark:border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:border-[#E91E63] shadow-xs transition-all"
            />
          </div>

          {/* New Appointment Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#E91E63] hover:bg-[#D81B60] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm shadow-[#E91E63]/25 flex items-center gap-1.5 shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <RiAddLine className="text-base font-bold" /> New Appointment
          </button>
        </div>
      </div>

      {/* ========================================================
          2.5 STATUS FILTER PILLS & TIMELINE CONTROLS BAR
         ======================================================== */}
      <div className="px-6 flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <RiFilter3Line className="text-xs" /> Timeline:
          </span>
          {[
            { key: 'all', label: 'All', count: appointments.length, color: 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white' },
            { key: 'confirmed', label: 'Confirmed', count: appointments.filter(a => a.status === 'confirmed' || a.status === 'planned').length, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
            { key: 'in-progress', label: 'In Progress', count: appointments.filter(a => a.status === 'ongoing' || a.status === 'in-progress').length, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
            { key: 'pending', label: 'Pending', count: appointments.filter(a => a.status === 'pending').length, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
            { key: 'unassigned', label: 'Unassigned (Open)', count: appointments.filter(a => !a.staff_member_id && !a.staff_id).length, color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' },
            { key: 'cancelled', label: 'Cancelled', count: appointments.filter(a => a.status === 'cancelled' || a.status === 'no_show').length, color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setStatusFilter(pill.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                statusFilter === pill.key
                  ? 'bg-[#E91E63] text-white border-[#E91E63] shadow-xs font-bold'
                  : 'bg-white dark:bg-[#1a1a2e] border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  statusFilter === pill.key ? 'bg-white/20 text-white' : pill.color
                }`}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 dark:border-white/20 text-[#E91E63] focus:ring-[#E91E63]"
            />
            <span className="text-[11px] font-semibold">Show Cancelled Slots</span>
          </label>
        </div>
      </div>

      {/* ========================================================
          3. SPLIT MAIN CONTENT (Schedule Timeline + Right Sidebar)
             (items-stretch ensures ScheduleGrid extends to the bottom of Top Services)
         ======================================================== */}
      <div className="px-6 flex flex-col xl:flex-row gap-6 items-stretch">
        {/* LEFT: SCHEDULE TIMELINE GRID */}
        <div className="flex-1 w-full min-w-0 flex flex-col">
          <ScheduleGrid
            staff={staffList}
            appointments={filteredAppointments}
            businessSettings={businessSettings}
            statusFilter={statusFilter}
            showCancelled={showCancelled}
            currentDate={currentDate}
            onAppointmentClick={(appt) => setSelectedViewAppointment(appt)}
            onSlotClick={({ staff, hour }) => {
              const hourStr = String(hour).padStart(2, '0') + ':00:00';
              setEditData(null);
              setPreselectedCustomerId('');
              setPrefilledSlot({
                staff_id: staff?.id || '',
                start_time: hourStr,
                appointment_date: format(currentDate, 'yyyy-MM-dd')
              });
              setIsAddModalOpen(true);
            }}
          />
        </div>

        {/* RIGHT SIDEBAR: MiniCalendar + Appointment Insights + Top Services */}
        <div className="w-full xl:w-[320px] shrink-0 flex flex-col gap-5">
          {/* Card 1: MiniCalendar */}
          <MiniCalendar
            selectedDate={currentDate}
            onSelectDate={handleCalendarSelect}
            appointments={monthAppointments}
          />

          {/* Card 2: Appointment Insights */}
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-xs text-gray-900 dark:text-white">Appointment Insights</h3>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer">
                This Week ⌄
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[96px] h-[96px] relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={insightData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {insightData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-extrabold text-gray-900 dark:text-white leading-none">
                    {stats.total || 12}
                  </span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    Total
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-1.5">
                {[
                  { label: 'Confirmed', pct: '67%', count: stats.confirmed || 8, dotColor: 'bg-[#10B981]' },
                  { label: 'In Progress', pct: '25%', count: stats.inProgress || 3, dotColor: 'bg-[#3B82F6]' },
                  { label: 'Pending', pct: '0%', count: stats.pending || 0, dotColor: 'bg-[#F59E0B]' },
                  { label: 'Cancelled', pct: '8%', count: stats.cancelled || 1, dotColor: 'bg-[#EF4444]' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full ${item.dotColor} shrink-0`} />
                      <span className="text-gray-600 dark:text-gray-300 text-[11px] truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-bold text-gray-800 dark:text-gray-200">{item.pct}</span>
                      <span className="text-gray-400 font-medium w-3 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Top Services */}
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm p-4">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-bold text-xs text-gray-900 dark:text-white">Top Services</h3>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer">
                This Week ⌄
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {TOP_SERVICES.map((s) => (
                <div key={s.rank} className="flex items-center justify-between gap-2 text-xs">
                  <span className="w-4 h-4 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {s.rank}
                  </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate w-24">
                    {s.name}
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${s.percentage * 2}%` }}
                      className="h-full bg-[#E91E63] rounded-full"
                    />
                  </div>
                  <span className="font-bold text-[11px] text-gray-500 dark:text-gray-400 shrink-0">
                    {s.percentage}% ({s.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. BOTTOM APPOINTMENTS TABLE (Collapsible / Tabbed)
         ======================================================== */}
      <div className="px-6 mt-8">
        <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-6 px-6 border-b border-gray-100 dark:border-white/5 overflow-x-auto overflow-y-hidden no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative py-4 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'text-[#E91E63]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab === 'Today' ? "Today's Appointments" : tab} ({tabAppointments[tab]?.length || 0})
                {activeTab === tab && (
                  <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#E91E63] rounded-full" />
                )}
              </button>
            ))}
          </div>

          <AppointmentsTable
            appointments={visibleAppointments}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onToggleSelect={handleToggleSelect}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onViewDetails={setSelectedViewAppointment}
          />
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AddAppointmentModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSuccess={() => {
          handleCloseModal();
          fetchData();
        }}
        staffList={staffList}
        customersList={customersList}
        servicesList={servicesList}
        initialDate={currentDate}
        editData={editData}
        preselectedCustomerId={preselectedCustomerId}
        initialSlot={prefilledSlot}
        businessSettings={businessSettings}
      />

      {/* Appointment Details Drawer */}
      <AppointmentDetailsDrawer
        isOpen={!!selectedViewAppointment}
        onClose={handleCloseDrawer}
        appointment={selectedViewAppointment}
        businessSettings={businessSettings}
        onEdit={(appt) => {
          setEditData(appt);
          setIsAddModalOpen(true);
        }}
        onStatusUpdate={(newStatus) => {
          if (newStatus) {
            setSelectedViewAppointment((prev) => (prev ? { ...prev, status: newStatus } : null));
          }
          fetchData();
        }}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease_forwards]">
          <div className="bg-white dark:bg-[#1a1a2e] w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6 text-center animate-[scaleUp_0.25s_ease_forwards]">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center text-2xl mx-auto mb-3.5">
              <RiDeleteBinLine />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">Delete Appointment</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Are you sure you want to delete this appointment for{' '}
              <strong className="text-gray-800 dark:text-gray-200">
                {itemToDelete?.customer_first_name} {itemToDelete?.customer_last_name}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={visibleAppointments.length}
        onClear={() => setSelectedIds([])}
        resourceName="appointment"
        actions={[
          {
            label: 'Confirm',
            icon: RiShieldCheckLine,
            onClick: () => handleBulkStatus('confirmed'),
            variant: 'success',
            loading: bulkLoading,
          },
          {
            label: 'Complete',
            icon: RiCheckLine,
            onClick: () => handleBulkStatus('completed'),
            variant: 'success',
            loading: bulkLoading,
          },
          {
            label: 'Cancel',
            icon: RiCloseLine,
            onClick: () => handleBulkStatus('cancelled'),
            variant: 'default',
            loading: bulkLoading,
          },
          {
            label: 'Export CSV',
            icon: RiDownload2Line,
            onClick: handleExportSelected,
            variant: 'default',
          },
          {
            label: 'Delete',
            icon: RiDeleteBinLine,
            onClick: handleBulkDelete,
            variant: 'danger',
            loading: bulkLoading,
          },
        ]}
      />
    </div>
  );
}

/* =============================================
   APPOINTMENTS TABLE — tabbed table
   ============================================= */
function AppointmentsTable({ appointments, selectedIds = [], onSelectAll, onToggleSelect, onEdit, onDelete, onViewDetails }) {
  if (appointments.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-gray-400 font-medium">
        No appointments found in this tab.
      </div>
    );
  }

  return (
    <TableScrollContainer>
      <table className="w-full border-collapse min-w-[800px] text-xs">
        <thead>
          <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] text-gray-400 font-bold uppercase tracking-wider text-[11px]">
            <th className="py-3 pl-6 pr-2 w-10 text-center">
              <input
                type="checkbox"
                checked={appointments.length > 0 && selectedIds.length === appointments.length}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = selectedIds.length > 0 && selectedIds.length < appointments.length;
                  }
                }}
                onChange={onSelectAll}
                className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-[#e91e63] focus:ring-[#e91e63] cursor-pointer"
              />
            </th>
            <th className="py-3 px-4 text-left">Customer</th>
            <th className="py-3 px-4 text-left">Service</th>
            <th className="py-3 px-4 text-left">Staff</th>
            <th className="py-3 px-4 text-left">Time</th>
            <th className="py-3 px-4 text-left">Status</th>
            <th className="py-3 px-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          {appointments.map((appt) => {
            const isSelected = selectedIds.includes(appt.id);
            return (
              <tr
                key={appt.id}
                onClick={() => onViewDetails(appt)}
                className={`hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer ${
                  isSelected ? 'bg-pink-50/40 dark:bg-pink-950/20' : ''
                }`}
              >
                <td className="py-3.5 pl-6 pr-2 text-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(appt.id)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-[#e91e63] focus:ring-[#e91e63] cursor-pointer"
                  />
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <VisualAvatar
                      type="customer"
                      image={appt.customer_avatar_url}
                      name={`${appt.customer_first_name} ${appt.customer_last_name || ''}`}
                      size="sm"
                    />
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {appt.customer_first_name} {appt.customer_last_name || ''}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{appt.customer_phone || ''}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <VisualAvatar
                      type="service"
                      image={appt.service_image_url}
                      icon={appt.service_icon}
                      color={appt.service_color}
                      name={appt.service_name}
                      shape="rounded"
                      size="xs"
                      className="w-7 h-7 text-xs"
                    />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {appt.service_name}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  {appt.staff_member_id || appt.staff_first_name ? (
                    <div className="flex items-center gap-2">
                      <VisualAvatar
                        type="staff"
                        image={appt.staff_avatar_url}
                        color={appt.staff_color}
                        name={`${appt.staff_first_name || ''} ${appt.staff_last_name || ''}`}
                        size="xs"
                        className="w-6 h-6 text-[10px]"
                      />
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        {appt.staff_first_name} {appt.staff_last_name || ''}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                      <RiUserUnfollowLine className="text-[11px]" /> Unassigned (Nobody)
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400 font-medium">
                  {appt.start_time?.substring(0, 5)} - {appt.end_time?.substring(0, 5)}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${
                      STATUS_STYLES[appt.status] || 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                  >
                    {appt.status?.replace('_', ' ') || 'planned'}
                  </span>
                </td>
                <td className="py-3.5 px-6 text-right">
                  <div
                    className="flex items-center justify-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onEdit(appt)}
                      className="p-1.5 text-gray-400 hover:text-[#E91E63] rounded-lg hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors"
                      title="Edit"
                    >
                      <RiMoreFill className="text-sm" />
                    </button>
                    <button
                      onClick={() => onDelete(appt)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete"
                    >
                      <RiDeleteBinLine className="text-sm" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableScrollContainer>
  );
}