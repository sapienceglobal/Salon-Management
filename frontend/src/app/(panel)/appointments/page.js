'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatTime, getInitials } from '@/lib/utils';
import { format } from 'date-fns';
import api from '@/lib/api';
import ScheduleGrid from '@/components/admin/ScheduleGrid';
import MiniCalendar from '@/components/admin/MiniCalendar';
import {
  RiCalendarEventLine, RiCheckDoubleLine, RiLoader2Line, RiCloseCircleLine, RiWalkLine,
  RiAddLine, RiCalendarLine, RiSearchLine, RiUserAddLine, RiMoreFill,
  RiArrowLeftSLine, RiArrowRightSLine, RiTimeLine, RiEditLine, RiDeleteBinLine
} from 'react-icons/ri';
import AddAppointmentModal from '@/components/admin/appointments/AddAppointmentModal';
import AppointmentDetailsDrawer from '@/components/admin/appointments/AppointmentDetailsDrawer';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

// Configuration
const INSIGHT_COLORS = ['#38d9a9', '#4dabf7', '#ffc034', '#ff6b6b']; // Confirmed, In Progress, Pending, Cancelled
const DURATION_OPTIONS = [
  { label: '30 Minutes', value: 30 },
  { label: '45 Minutes', value: 45 },
  { label: '1 Hour', value: 60 },
  { label: '1.5 Hours', value: 90 },
  { label: '2 Hours', value: 120 },
];
const TABS = ['Today', 'Upcoming', 'Pending', 'Cancelled'];

/* =============================================
   STATUS / PAYMENT BADGE STYLES
   ============================================= */
const STATUS_STYLES = {
  confirmed: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  planned: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  pending: 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30',
  'in-progress': 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
  ongoing: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
  completed: 'bg-[#f3f0ff] text-[#6741d9] border-[#d0bfff]',
  cancelled: 'bg-accent-red/15 text-accent-red border-accent-red/30',
  no_show: 'bg-accent-red/15 text-accent-red border-accent-red/30',
};

const PAYMENT_STYLES = {
  paid: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  partial: 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30',
  pending: 'bg-accent-red/15 text-accent-red border-accent-red/30',
  unpaid: 'bg-accent-red/15 text-accent-red border-accent-red/30',
  refunded: 'bg-admin-surface-light text-admin-text-secondary border-admin-border',
};

export default function AppointmentsPage() {
  const { user } = useAuth();

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('Day'); // Day, Week, Month, List
  const [activeTab, setActiveTab] = useState('Today');
  const [appointments, setAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [monthAppointments, setMonthAppointments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedViewAppointment, setSelectedViewAppointment] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [preselectedCustomerId, setPreselectedCustomerId] = useState('');
  const [backendStats, setBackendStats] = useState(null);
  const [businessSettings, setBusinessSettings] = useState(null);

  // Top-level stats derived from the loaded day's appointments
  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed' || a.status === 'planned' || a.status === 'completed').length,
    inProgress: appointments.filter(a => a.status === 'ongoing' || a.status === 'in-progress').length,
    cancelled: appointments.filter(a => a.status === 'cancelled' || a.status === 'no_show').length,
    pending: appointments.filter(a => a.status === 'pending').length,
    walkIns: appointments.filter(a => a.source === 'walk_in').length,
  };

  const pct = (n) => (stats.total > 0 ? Math.round((n / stats.total) * 100) : 0);

  const avgServiceMinutes = useMemo(() => {
    if (!appointments.length) return 0;
    const totalMins = appointments.reduce((sum, a) => {
      if (!a.start_time || !a.end_time) return sum;
      const [sh, sm] = a.start_time.split(':').map(Number);
      const [eh, em] = a.end_time.split(':').map(Number);
      return sum + ((eh * 60 + em) - (sh * 60 + sm));
    }, 0);
    return Math.round(totalMins / appointments.length);
  }, [appointments]);

  const insightData = [
    { name: 'Confirmed', value: stats.confirmed || (stats.total === 0 ? 1 : 0) }, // Default to 1 if all 0 to show grey circle
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Pending', value: stats.pending },
    { name: 'Cancelled', value: stats.cancelled },
  ];

  const STAT_CARDS = [
    {
      key: 'total', label: 'Total Appointments', value: backendStats?.total?.value ?? stats.total, icon: RiCalendarEventLine,
      bg: 'bg-brand/10', iconBg: 'bg-brand', sub: backendStats?.total ? `${backendStats.total.trend.is_up ? '↑' : '↓'} ${backendStats.total.trend.value}% vs yesterday` : '...', subColor: backendStats?.total?.trend?.is_up === false ? 'text-accent-red' : 'text-accent-green'
    },
    {
      key: 'confirmed', label: 'Confirmed', value: backendStats?.confirmed?.value ?? stats.confirmed, icon: RiCheckDoubleLine,
      bg: 'bg-accent-blue/10', iconBg: 'bg-accent-blue', sub: backendStats?.confirmed ? `${backendStats.confirmed.trend.is_up ? '↑' : '↓'} ${backendStats.confirmed.trend.value}% vs yesterday` : '...', subColor: backendStats?.confirmed?.trend?.is_up === false ? 'text-accent-red' : 'text-accent-blue'
    },
    {
      key: 'inProgress', label: 'In Progress', value: backendStats?.in_progress?.value ?? stats.inProgress, icon: RiLoader2Line,
      bg: 'bg-accent-yellow/10', iconBg: 'bg-accent-yellow', sub: backendStats?.in_progress ? `${backendStats.in_progress.trend.is_up ? '↑' : '↓'} ${backendStats.in_progress.trend.value}% vs yesterday` : '...', subColor: backendStats?.in_progress?.trend?.is_up === false ? 'text-accent-red' : 'text-accent-yellow'
    },
    {
      key: 'cancelled', label: 'Cancelled', value: backendStats?.cancelled?.value ?? stats.cancelled, icon: RiCloseCircleLine,
      bg: 'bg-accent-red/10', iconBg: 'bg-accent-red', sub: backendStats?.cancelled ? `${backendStats.cancelled.trend.is_up ? '↑' : '↓'} ${backendStats.cancelled.trend.value}% vs yesterday` : '...', subColor: backendStats?.cancelled?.trend?.is_up === false ? 'text-accent-green' : 'text-accent-red' // cancel up is bad
    },
    {
      key: 'walkIns', label: 'Walk-ins', value: backendStats?.walk_ins?.value ?? stats.walkIns, icon: RiWalkLine,
      bg: 'bg-accent-green/10', iconBg: 'bg-accent-green', sub: backendStats?.walk_ins ? `${backendStats.walk_ins.trend.is_up ? '↑' : '↓'} ${backendStats.walk_ins.trend.value}% vs yesterday` : '...', subColor: backendStats?.walk_ins?.trend?.is_up === false ? 'text-accent-red' : 'text-accent-green'
    },
  ];

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      const tomorrowDate = new Date(currentDate);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = format(tomorrowDate, 'yyyy-MM-dd');

      let apptQuery = `/appointments?date=${dateStr}&limit=100`;
      if (selectedStaff) apptQuery += `&staff_id=${selectedStaff}`;
      if (selectedService) apptQuery += `&service_id=${selectedService}`;

      let upcomingQuery = `/appointments?from_date=${tomorrowStr}&status=planned&limit=100`;
      if (selectedStaff) upcomingQuery += `&staff_id=${selectedStaff}`;
      if (selectedService) upcomingQuery += `&service_id=${selectedService}`;

      // Fetch month appointments for calendar dots
      const monthStartStr = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd');
      const monthEndStr = format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd');
      let monthQuery = `/appointments?from_date=${monthStartStr}&to_date=${monthEndStr}&limit=500`;
      if (selectedStaff) monthQuery += `&staff_id=${selectedStaff}`;

      let statsQuery = `/appointments/stats?date=${dateStr}`;
      if (selectedStaff) statsQuery += `&staff_id=${selectedStaff}`;
      if (selectedService) statsQuery += `&service_id=${selectedService}`;

      const [apptsRes, upcomingRes, monthRes, staffRes, custRes, servRes, statsRes, settingsRes] = await Promise.allSettled([
        api.get(apptQuery),
        api.get(upcomingQuery),
        api.get(monthQuery),
        api.get('/staff'),
        api.get('/customers?limit=100'),
        api.get('/services'),
        api.get(statsQuery),
        api.get('/settings')
      ]);

      if (apptsRes.status === 'fulfilled') setAppointments(apptsRes.value.data?.appointments || apptsRes.value.data || []);
      if (upcomingRes.status === 'fulfilled') setUpcomingAppointments(upcomingRes.value.data?.appointments || upcomingRes.value.data || []);
      if (monthRes.status === 'fulfilled') setMonthAppointments(monthRes.value.data?.appointments || monthRes.value.data || []);
      if (staffRes.status === 'fulfilled') setStaffList(staffRes.value.data?.users || staffRes.value.data || []);
      if (custRes.status === 'fulfilled') setCustomersList(custRes.value.data?.customers || custRes.value.data || []);
      if (servRes.status === 'fulfilled') setServicesList(servRes.value.data?.services || servRes.value.data || []);
      if (statsRes.status === 'fulfilled') setBackendStats(statsRes.value.data?.data || statsRes.value.data);
      if (settingsRes.status === 'fulfilled') setBusinessSettings(settingsRes.value.data?.settings || settingsRes.value.data?.data?.settings || null);

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
      const found = appointments.find(a => a.id == appointmentId) || upcomingAppointments.find(a => a.id == appointmentId);
      if (found) {
        setSelectedViewAppointment(found);
      } else {
        api.get(`/appointments/${appointmentId}`).then(res => {
          setSelectedViewAppointment(res.data.data || res.data.appointment || res.data);
        }).catch(console.error);
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete appointment');
    }
  };

  // Tab split for the appointments table below the schedule.
  // NOTE: this is computed client-side from the single day already loaded
  // by fetchData(). "Upcoming" is only accurate for *today's* remaining
  // slots — a true cross-day "Upcoming" list needs a dedicated backend
  // endpoint (e.g. GET /appointments?from=today&status=confirmed,pending).
  // Happy to wire that in once you share the appointments API route.
  const tabAppointments = {
    Today: appointments.filter(a => a.status !== 'cancelled' && a.status !== 'no_show'),
    Upcoming: upcomingAppointments,
    Pending: appointments.filter(a => a.status === 'pending'),
    Cancelled: appointments.filter(a => a.status === 'cancelled' || a.status === 'no_show'),
  };

  const visibleAppointments = tabAppointments[activeTab] || [];

  return (
    <div className="w-full min-w-0 flex flex-col gap-6 animate-[fadeIn_0.5s_ease_forwards]">

      {/* TOP ROW: MAIN CONTENT + SIDEBAR */}
      <div className="w-full min-w-0 flex flex-col xl:flex-row gap-6 items-start">

        {/* ====== LEFT MAIN CONTENT ====== */}
        <div className="w-full min-w-0 flex-1">

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading text-[1.75rem] font-bold">Appointments</h1>
            <p className="text-sm text-admin-text-secondary mt-1">Manage your salon appointments, walk-ins and staff schedules.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors shadow-lg shadow-brand/20 flex items-center gap-2 shrink-0"
          >
            <RiAddLine className="text-lg" /> New Appointment
          </button>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.key} className={`${card.bg} border border-admin-border-light rounded-xl p-4`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-9 h-9 rounded-full ${card.iconBg} text-white flex items-center justify-center text-base shrink-0`}>
                    <Icon />
                  </div>
                  <span className="text-[0.7rem] font-medium text-admin-text-secondary leading-tight">{card.label}</span>
                </div>
                <div className="font-heading text-2xl font-bold leading-none">{loading ? '-' : card.value}</div>
                <div className={`text-[0.7rem] font-semibold mt-1.5 ${card.subColor}`}>{card.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center bg-admin-surface-light border border-admin-border rounded-lg p-1">
            {['Day', 'Week', 'Month'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === mode ? 'bg-brand text-white shadow-sm' : 'text-admin-text-secondary hover:text-admin-text'}`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => handleDateChange(-1)} className="p-2 border border-admin-border rounded-lg hover:bg-admin-surface-light transition-colors"><RiArrowLeftSLine /></button>
            <div className="px-4 py-2 border border-admin-border rounded-lg text-sm font-semibold bg-admin-card text-admin-text flex items-center gap-2 min-w-[170px] justify-center">
              <RiCalendarLine className="text-admin-text-muted" /> {format(currentDate, 'EEE, d MMM yyyy')}
            </div>
            <button onClick={() => handleDateChange(1)} className="p-2 border border-admin-border rounded-lg hover:bg-admin-surface-light transition-colors"><RiArrowRightSLine /></button>
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end min-w-[240px]">
            <select
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
              className="border border-admin-border rounded-lg text-sm px-3 py-2 bg-admin-card text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            >
              <option value="">All Staff</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name}</option>)}
            </select>
            <select
              value={selectedService}
              onChange={e => setSelectedService(e.target.value)}
              className="border border-admin-border rounded-lg text-sm px-3 py-2 bg-admin-card text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            >
              <option value="">All Services</option>
              {servicesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Main View Area */}
        <div className="relative w-full rounded-2xl">
          {loading && (
            <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-2xl backdrop-blur-[2px]">
              <RiLoader2Line className="animate-spin text-brand text-4xl" />
            </div>
          )}
          
          {viewMode === 'Week' || viewMode === 'Month' ? (
            <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden p-12 h-[600px] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-admin-surface-light flex items-center justify-center text-brand mb-4">
                <RiCalendarLine className="text-2xl" />
              </div>
              <h3 className="text-lg font-bold">Interactive {viewMode} View</h3>
              <p className="text-sm text-admin-text-secondary mt-2 max-w-sm">
                The advanced {viewMode.toLowerCase()}ly schedule grid is currently being optimized for large datasets. Please use the <strong>Day</strong> view in the meantime.
              </p>
              <button onClick={() => setViewMode('Day')} className="mt-6 px-4 py-2 bg-admin-surface-light hover:bg-admin-border transition-colors rounded-lg text-sm font-semibold">
                Switch to Day View
              </button>
            </div>
          ) : (
            <div className={loading ? "opacity-50 pointer-events-none" : ""}>
              <ScheduleGrid 
                staff={staffList} 
                appointments={appointments} 
                businessSettings={businessSettings}
                onAppointmentClick={(appt) => setSelectedViewAppointment(appt)} 
              />
            </div>
          )}
        </div>

      </div>

      {/* ====== RIGHT SIDEBAR ====== */}
      <div className="w-full xl:w-[320px] shrink-0 flex flex-col gap-6">

        <MiniCalendar selectedDate={currentDate} onSelectDate={handleCalendarSelect} appointments={monthAppointments} />


        {/* Appointment Insights Chart */}
        <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-admin-border flex items-center justify-between">
            <h3 className="font-semibold text-[0.95rem]">Appointment Insights</h3>
            <span className="text-[0.65rem] font-semibold text-admin-text-muted uppercase tracking-wider bg-admin-surface-light px-2 py-1 rounded">This Week</span>
          </div>
          <div className="p-5 flex items-center gap-4">
            <div className="w-[100px] h-[100px] relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart key={currentDate.toISOString()}>
                  <Pie data={insightData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value" stroke="none">
                    {insightData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={stats.total === 0 ? '#f1f5f9' : INSIGHT_COLORS[index % INSIGHT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold">{stats.total}</span>
                <span className="text-[0.55rem] text-admin-text-muted uppercase font-bold tracking-wider -mt-1">Total</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-2.5">
              {[
                { label: 'Confirmed', value: stats.confirmed, color: 'bg-[#38d9a9]' },
                { label: 'In Progress', value: stats.inProgress, color: 'bg-[#4dabf7]' },
                { label: 'Pending', value: stats.pending, color: 'bg-[#ffc034]' },
                { label: 'Cancelled', value: stats.cancelled, color: 'bg-[#ff6b6b]' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                    <span className="text-[0.7rem] text-admin-text-secondary">{item.label}</span>
                  </div>
                  <span className="text-xs font-semibold">{pct(item.value)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Average Service Time */}
        <div className="bg-admin-card border border-admin-border rounded-2xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-blue/15 text-accent-blue flex items-center justify-center text-lg shrink-0">
            <RiTimeLine />
          </div>
          <div>
            <div className="text-[0.7rem] text-admin-text-secondary mb-0.5">Average Service Time</div>
            <div className="font-heading text-base font-bold">
              {avgServiceMinutes >= 60
                ? `${(avgServiceMinutes / 60).toFixed(1)} Hours`
                : `${avgServiceMinutes} Mins`}
            </div>
          </div>
        </div>

      </div>
      </div>

      {/* ====== FULL WIDTH BOTTOM SECTION ====== */}
      {viewMode !== 'List' && (
        <div className={`bg-admin-card border border-admin-border rounded-2xl overflow-hidden mt-6 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-6 px-5 border-b border-admin-border overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative py-4 text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab ? 'text-brand' : 'text-admin-text-secondary hover:text-admin-text'
                  }`}
              >
                {tab === 'Today' ? "Today's Appointments" : tab} ({tabAppointments[tab].length})
                {activeTab === tab && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand rounded-full" />}
              </button>
            ))}
          </div>
          <AppointmentsTable appointments={visibleAppointments} onEdit={handleEdit} onDelete={handleDeleteClick} onViewDetails={setSelectedViewAppointment} />
        </div>
      )}
      
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
      />

      {/* Appointment Details Drawer */}
      <AppointmentDetailsDrawer
        isOpen={!!selectedViewAppointment}
        onClose={handleCloseDrawer}
        appointment={selectedViewAppointment}
        onEdit={(appt) => {
          setEditData(appt);
          setIsAddModalOpen(true);
        }}
        onStatusUpdate={(newStatus) => {
          if (newStatus) {
            setSelectedViewAppointment(prev => prev ? { ...prev, status: newStatus } : null);
          }
          fetchData();
        }}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease_forwards]">
          <div className="bg-admin-card w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.3s_ease_forwards]">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-accent-red/10 text-accent-red flex items-center justify-center text-3xl mx-auto mb-4">
                <RiDeleteBinLine />
              </div>
              <h3 className="text-xl font-bold mb-2">Delete Appointment</h3>
              <p className="text-sm text-admin-text-secondary">
                Are you sure you want to delete this appointment for <strong>{itemToDelete?.customer_first_name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-admin-surface-light border-t border-admin-border">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-admin-card text-admin-text border border-admin-border hover:bg-admin-surface-light transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-accent-red text-white hover:bg-red-600 transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =============================================
   APPOINTMENTS TABLE — shared by List view + tabbed table
   ============================================= */
function AppointmentsTable({ appointments, onEdit, onDelete, onViewDetails }) {
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="overflow-x-auto custom-scrollbar pb-24">
      <table className="w-full border-collapse min-w-full whitespace-nowrap lg:whitespace-normal">
        <thead>
          <tr>
            {['#', 'Time', 'Customer', 'Service', 'Staff', 'Status', 'Payment', 'Amount', ''].map((h, i) => (
              <th key={i} className="text-left text-xs font-semibold text-admin-text-muted uppercase tracking-wider px-3 py-3 border-b border-admin-border">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {appointments.length === 0 ? (
            <tr><td colSpan="9" className="text-center py-8 text-admin-text-muted">No appointments found.</td></tr>
          ) : (
            appointments.map((apt, idx) => (
              <tr 
                key={apt.id} 
                className="hover:bg-admin-surface-light/40 transition-colors cursor-pointer"
                onClick={() => onViewDetails && onViewDetails(apt)}
              >
                <td className="px-3 py-3 text-sm text-admin-text-muted border-b border-admin-border">{idx + 1}</td>
                <td className="px-3 py-3 text-sm font-medium border-b border-admin-border whitespace-nowrap">{formatTime(apt.start_time)}</td>
                <td className="px-3 py-3 text-sm border-b border-admin-border">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-admin-surface-light flex items-center justify-center text-[0.6rem] font-bold shrink-0">
                      {getInitials(apt.customer_first_name, apt.customer_last_name)}
                    </div>
                    <span className="truncate max-w-[120px]">{apt.customer_first_name} {apt.customer_last_name || ''}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-sm border-b border-admin-border truncate max-w-[120px]" title={apt.service_name}>{apt.service_name}</td>
                <td className="px-3 py-3 text-sm border-b border-admin-border truncate max-w-[100px]" title={apt.staff_first_name || 'Unassigned'}>{apt.staff_first_name || 'Unassigned'}</td>
                <td className="px-3 py-3 text-sm border-b border-admin-border">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[0.6rem] font-bold uppercase tracking-wider border ${STATUS_STYLES[apt.status] || STATUS_STYLES.pending}`}>
                    {apt.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-sm border-b border-admin-border">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[0.6rem] font-bold uppercase tracking-wider border ${PAYMENT_STYLES[apt.payment_status] || PAYMENT_STYLES.unpaid}`}>
                    {apt.payment_status || 'unpaid'}
                  </span>
                </td>
                <td className="px-3 py-3 text-sm border-b border-admin-border font-medium whitespace-nowrap">{formatCurrency(apt.service_price)}</td>
                <td className="px-3 py-3 text-sm border-b border-admin-border text-right relative dropdown-container">
                  <button 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setOpenDropdownId(openDropdownId === apt.id ? null : apt.id);
                    }}
                    className="w-7 h-7 rounded-lg hover:bg-admin-surface-light flex items-center justify-center text-admin-text-secondary transition-colors ml-auto"
                  >
                    <RiMoreFill />
                  </button>
                  {openDropdownId === apt.id && (
                    <div className="absolute right-6 top-10 bg-admin-card border border-admin-border rounded-lg shadow-lg py-1 z-50 w-36 overflow-hidden">
                      <button 
                        onMouseDown={(e) => { e.preventDefault(); onEdit(apt); setOpenDropdownId(null); }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-admin-surface-light transition-colors flex items-center gap-2 text-admin-text"
                      >
                        <RiEditLine className="text-sm" /> Edit
                      </button>
                      <button 
                        onMouseDown={(e) => { e.preventDefault(); onDelete(apt); setOpenDropdownId(null); }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
                      >
                        <RiDeleteBinLine className="text-sm" /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}