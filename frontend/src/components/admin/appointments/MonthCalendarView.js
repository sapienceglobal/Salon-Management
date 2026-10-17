'use client';

import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import {
  RiCalendarLine,
  RiTimeLine,
  RiScissorsLine,
  RiAddLine,
  RiUserLine,
  RiCloseLine,
  RiArrowRightLine,
  RiWalkLine,
  RiAlertLine,
  RiSparklingFill,
} from 'react-icons/ri';
import VisualAvatar from '@/components/admin/common/VisualAvatar';
import { formatCurrency, formatTime } from '@/lib/utils';

const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  planned: {
    label: 'Planned',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  'in-progress': {
    label: 'In Progress',
    bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20',
    dot: 'bg-blue-500',
  },
  ongoing: {
    label: 'In Progress',
    bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20',
    dot: 'bg-blue-500',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20',
    dot: 'bg-purple-500',
  },
  pending: {
    label: 'Pending',
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
    dot: 'bg-amber-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/20',
    dot: 'bg-red-500',
  },
  no_show: {
    label: 'No Show',
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20',
    dot: 'bg-rose-500',
  },
};

function getApptDateStr(appt) {
  if (!appt?.appointment_date) return '';
  if (typeof appt.appointment_date === 'string') {
    return appt.appointment_date.split('T')[0];
  }
  return format(new Date(appt.appointment_date), 'yyyy-MM-dd');
}

export default function MonthCalendarView({
  appointments = [],
  currentDate = new Date(),
  businessSettings,
  statusFilter = 'all',
  showCancelled = true,
  searchQuery = '',
  selectedStaff = '',
  selectedService = '',
  onAppointmentClick,
  onSlotClick,
  onDayClick,
}) {
  const [selectedDayModal, setSelectedDayModal] = useState(null);

  // 1. Month boundaries and 7x5 / 7x6 grid calculation
  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);
  const calendarStart = useMemo(
    () => startOfWeek(monthStart, { weekStartsOn: 1 }),
    [monthStart]
  );
  const calendarEnd = useMemo(
    () => endOfWeek(monthEnd, { weekStartsOn: 1 }),
    [monthEnd]
  );
  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  );

  // 2. Filter appointments by status, search, cancelled, staff, and service
  const filteredAppointments = useMemo(() => {
    return (appointments || []).filter((appt) => {
      // Cancelled filter
      if (!showCancelled && (appt.status === 'cancelled' || appt.status === 'no_show')) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'confirmed') {
          if (appt.status !== 'confirmed' && appt.status !== 'planned') return false;
        } else if (statusFilter === 'in-progress') {
          if (appt.status !== 'ongoing' && appt.status !== 'in-progress') return false;
        } else if (statusFilter === 'pending') {
          if (appt.status !== 'pending') return false;
        } else if (statusFilter === 'unassigned') {
          if (appt.staff_member_id || appt.staff_id) return false;
        } else if (statusFilter === 'cancelled') {
          if (appt.status !== 'cancelled' && appt.status !== 'no_show') return false;
        }
      }

      // Staff filter
      if (selectedStaff) {
        const staffId = appt.staff_member_id || appt.staff_id;
        if (String(staffId) !== String(selectedStaff)) return false;
      }

      // Service filter
      if (selectedService) {
        if (String(appt.service_id) !== String(selectedService)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const clientMatch = `${appt.customer_first_name || ''} ${appt.customer_last_name || ''}`
          .toLowerCase()
          .includes(q);
        const serviceMatch = (appt.service_name || '').toLowerCase().includes(q);
        const staffMatch = `${appt.staff_first_name || ''} ${appt.staff_last_name || ''}`
          .toLowerCase()
          .includes(q);
        if (!clientMatch && !serviceMatch && !staffMatch) return false;
      }

      return true;
    });
  }, [
    appointments,
    statusFilter,
    showCancelled,
    selectedStaff,
    selectedService,
    searchQuery,
  ]);

  // 3. Group appointments by 'yyyy-MM-dd'
  const appointmentsByDay = useMemo(() => {
    const map = {};
    filteredAppointments.forEach((appt) => {
      const dateStr = getApptDateStr(appt);
      if (!map[dateStr]) {
        map[dateStr] = [];
      }
      map[dateStr].push(appt);
    });

    // Sort chronologically
    Object.keys(map).forEach((dateStr) => {
      map[dateStr].sort((a, b) => {
        const timeA = a.start_time || '00:00:00';
        const timeB = b.start_time || '00:00:00';
        return timeA.localeCompare(timeB);
      });
    });

    return map;
  }, [filteredAppointments]);

  // 4. Monthly metrics summary
  const monthStats = useMemo(() => {
    let totalRev = 0;
    let confirmedCount = 0;
    let completedCount = 0;
    let inProgressCount = 0;

    filteredAppointments.forEach((a) => {
      const price = parseFloat(a.service_price || a.final_amount || 0);
      if (!isNaN(price) && a.status !== 'cancelled' && a.status !== 'no_show') {
        totalRev += price;
      }
      if (a.status === 'confirmed' || a.status === 'planned') confirmedCount++;
      if (a.status === 'completed') completedCount++;
      if (a.status === 'ongoing' || a.status === 'in-progress') inProgressCount++;
    });

    return {
      total: filteredAppointments.length,
      confirmed: confirmedCount,
      completed: completedCount,
      inProgress: inProgressCount,
      revenue: totalRev,
    };
  }, [filteredAppointments]);

  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden flex flex-col">
      {/* ──────────────────────────────────────────────────────────
          MONTH HEADER BAR (Overview + Stats)
         ────────────────────────────────────────────────────────── */}
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E91E63]/10 text-[#E91E63] flex items-center justify-center text-lg font-bold shadow-xs">
            <RiCalendarLine />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                Month Calendar
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-200/80 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                {format(currentDate, 'MMMM yyyy')}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Full Month Salon Booking Schedule & Workload Distribution
            </p>
          </div>
        </div>

        {/* Quick Month Metrics */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#161626] border border-gray-100 dark:border-white/10 shadow-xs">
            <span className="text-gray-400">Total:</span>
            <span className="font-extrabold text-gray-900 dark:text-white">
              {monthStats.total}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#161626] border border-gray-100 dark:border-white/10 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-400">Confirmed:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              {monthStats.confirmed}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#161626] border border-gray-100 dark:border-white/10 shadow-xs">
            <span className="text-gray-400">Est. Revenue:</span>
            <span className="font-extrabold text-[#E91E63]">
              {formatCurrency(monthStats.revenue)}
            </span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          CALENDAR MATRIX GRID (7 Columns)
         ────────────────────────────────────────────────────────── */}
      <div className="p-3 sm:p-5 overflow-x-auto custom-scrollbar">
        <div className="min-w-[850px]">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {weekDayLabels.map((lbl, idx) => (
              <div
                key={lbl}
                className={`py-2 text-[11px] font-black uppercase tracking-wider ${
                  idx >= 5
                    ? 'text-pink-600/80 dark:text-pink-400/80'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {lbl}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayAppts = appointmentsByDay[dateStr] || [];
              const inMonth = isSameMonth(day, monthStart);
              const isCurrentDay = isToday(day);
              const isSelected = isSameDay(day, currentDate);
              const maxVisibleAppts = 3;
              const overflowCount = Math.max(0, dayAppts.length - maxVisibleAppts);

              return (
                <div
                  key={dateStr}
                  className={`min-h-[120px] sm:min-h-[135px] rounded-xl sm:rounded-2xl p-2 border flex flex-col justify-between transition-all group relative ${
                    isCurrentDay
                      ? 'border-[#E91E63] ring-2 ring-[#E91E63]/40 bg-pink-50/20 dark:bg-[#E91E63]/5 shadow-xs'
                      : isSelected
                      ? 'border-gray-300 dark:border-white/20 bg-gray-50/80 dark:bg-white/[0.03]'
                      : inMonth
                      ? 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#181829] hover:border-gray-300 dark:hover:border-white/20'
                      : 'border-transparent bg-gray-50/40 dark:bg-white/[0.01] opacity-40 hover:opacity-75'
                  }`}
                >
                  {/* Cell Header: Day Number + Add Button + Count */}
                  <div className="flex items-center justify-between mb-1.5">
                    <button
                      type="button"
                      onClick={() => onDayClick && onDayClick(day)}
                      title={`Open Day timeline for ${format(day, 'd MMM yyyy')}`}
                      className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                        isCurrentDay
                          ? 'bg-[#E91E63] text-white shadow-xs'
                          : inMonth
                          ? 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                          : 'text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      {format(day, 'd')}
                    </button>

                    <div className="flex items-center gap-1">
                      {dayAppts.length > 0 && (
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                          {dayAppts.length}
                        </span>
                      )}

                      {/* Quick Add Button on Hover */}
                      <button
                        type="button"
                        onClick={() =>
                          onSlotClick &&
                          onSlotClick({
                            date: dateStr,
                            hour: 10,
                            staff: selectedStaff ? { id: selectedStaff } : null,
                          })
                        }
                        title={`Add appointment on ${format(day, 'EEE, d MMM')}`}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md bg-gray-100 dark:bg-white/10 hover:bg-[#E91E63] hover:text-white text-gray-500 dark:text-gray-400 flex items-center justify-center transition-all cursor-pointer text-xs"
                      >
                        <RiAddLine />
                      </button>
                    </div>
                  </div>

                  {/* Cell Body: Compact Appointment Chips */}
                  <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                    {dayAppts.slice(0, maxVisibleAppts).map((appt) => {
                      const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.planned;
                      return (
                        <div
                          key={appt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick && onAppointmentClick(appt);
                          }}
                          title={`${formatTime(appt.start_time)} - ${appt.customer_first_name || 'Walk-in'} (${appt.service_name})`}
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 truncate cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${cfg.bg}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`}
                          />
                          <span className="font-extrabold text-[9px] shrink-0">
                            {appt.start_time?.substring(0, 5)}
                          </span>
                          <span className="truncate">
                            {appt.customer_first_name || 'Walk-in'}
                          </span>
                        </div>
                      );
                    })}

                    {/* "+X more" chip */}
                    {overflowCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDayModal({
                            date: day,
                            dateStr,
                            appointments: dayAppts,
                          })
                        }
                        className="text-[10px] font-black text-[#E91E63] hover:text-[#D81B60] dark:text-pink-400 py-0.5 text-left flex items-center gap-0.5 cursor-pointer hover:underline"
                      >
                        +{overflowCount} more...
                      </button>
                    )}
                  </div>

                  {/* Day Footer Subtotal (if any appointments) */}
                  {dayAppts.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[9px] text-gray-400">
                      <span>{dayAppts.length} appt{dayAppts.length > 1 ? 's' : ''}</span>
                      <button
                        type="button"
                        onClick={() => onDayClick && onDayClick(day)}
                        className="text-[#E91E63] hover:underline font-bold"
                      >
                        View &rarr;
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          OVERFLOW DAY MODAL (When clicking "+X more")
         ────────────────────────────────────────────────────────── */}
      {selectedDayModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease_forwards]"
          onClick={() => setSelectedDayModal(null)}
        >
          <div
            className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 p-5 sm:p-6 overflow-hidden flex flex-col max-h-[85vh] animate-[scaleUp_0.2s_ease_forwards]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5 mb-3">
              <div>
                <h4 className="text-base font-extrabold text-gray-900 dark:text-white">
                  {format(selectedDayModal.date, 'EEEE, d MMMM yyyy')}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedDayModal.appointments.length} Appointments Scheduled
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDayModal(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1 my-1">
              {selectedDayModal.appointments.map((appt) => {
                const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.planned;
                return (
                  <div
                    key={appt.id}
                    onClick={() => {
                      setSelectedDayModal(null);
                      onAppointmentClick && onAppointmentClick(appt);
                    }}
                    className="p-3 rounded-xl border border-gray-200/80 dark:border-white/10 hover:border-[#E91E63]/50 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-[#202038] transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#E91E63]/10 text-[#E91E63] flex items-center justify-center font-extrabold text-xs shrink-0">
                        {appt.start_time?.substring(0, 5)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                          {appt.customer_first_name || 'Walk-in'} {appt.customer_last_name || ''}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                          <RiScissorsLine className="text-xs shrink-0" /> {appt.service_name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg}`}>
                        {cfg.label}
                      </span>
                      <p className="text-xs font-extrabold text-[#E91E63] mt-1">
                        {formatCurrency(appt.service_price || 0)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  const day = selectedDayModal.date;
                  setSelectedDayModal(null);
                  if (onDayClick) onDayClick(day);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E91E63] text-white hover:bg-[#D81B60] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                Switch to Day View <RiArrowRightLine />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDayModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
