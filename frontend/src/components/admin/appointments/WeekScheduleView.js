'use client';

import { useMemo } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameDay,
  parseISO,
} from 'date-fns';
import {
  RiCalendarLine,
  RiTimeLine,
  RiScissorsLine,
  RiUserLine,
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiAlertLine,
  RiSparklingFill,
  RiWalkLine,
  RiShieldCheckLine,
  RiArrowRightLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from 'react-icons/ri';
import VisualAvatar from '@/components/admin/common/VisualAvatar';
import { formatCurrency, formatTime } from '@/lib/utils';

const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmed',
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  planned: {
    label: 'Planned',
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  'in-progress': {
    label: 'In Progress',
    border: 'border-l-blue-500',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-500/20',
    dot: 'bg-blue-500',
  },
  ongoing: {
    label: 'In Progress',
    border: 'border-l-blue-500',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-500/20',
    dot: 'bg-blue-500',
  },
  completed: {
    label: 'Completed',
    border: 'border-l-purple-500',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-500/20',
    dot: 'bg-purple-500',
  },
  pending: {
    label: 'Pending',
    border: 'border-l-amber-500',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
    dot: 'bg-amber-500',
  },
  cancelled: {
    label: 'Cancelled',
    border: 'border-l-red-500',
    badge: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-500/20',
    dot: 'bg-red-500',
  },
  no_show: {
    label: 'No Show',
    border: 'border-l-rose-500',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-500/20',
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

export default function WeekScheduleView({
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
  onPrevWeek,
  onNextWeek,
  onToday,
}) {
  // 1. Calculate the 7 days of the current week (Monday to Sunday)
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

  const isCurrentWeek = useMemo(() => {
    const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return isSameDay(todayWeekStart, weekStart);
  }, [weekStart]);

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

      // Selected Staff filter
      if (selectedStaff) {
        const staffId = appt.staff_member_id || appt.staff_id;
        if (String(staffId) !== String(selectedStaff)) return false;
      }

      // Selected Service filter
      if (selectedService) {
        if (String(appt.service_id) !== String(selectedService)) return false;
      }

      // Search Query filter
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

  // 3. Group filtered appointments by date string ('yyyy-MM-dd')
  const appointmentsByDay = useMemo(() => {
    const map = {};
    weekDays.forEach((day) => {
      map[format(day, 'yyyy-MM-dd')] = [];
    });

    filteredAppointments.forEach((appt) => {
      const dateStr = getApptDateStr(appt);
      if (map[dateStr]) {
        map[dateStr].push(appt);
      }
    });

    // Sort each day's appointments chronologically by start_time
    Object.keys(map).forEach((dateStr) => {
      map[dateStr].sort((a, b) => {
        const timeA = a.start_time || '00:00:00';
        const timeB = b.start_time || '00:00:00';
        return timeA.localeCompare(timeB);
      });
    });

    return map;
  }, [weekDays, filteredAppointments]);

  // 4. Week Top-level Stats Summary
  const weekStats = useMemo(() => {
    let totalRev = 0;
    let confirmedCount = 0;
    let completedCount = 0;
    let pendingCount = 0;

    filteredAppointments.forEach((a) => {
      const price = parseFloat(a.service_price || a.final_amount || 0);
      if (!isNaN(price) && a.status !== 'cancelled' && a.status !== 'no_show') {
        totalRev += price;
      }
      if (a.status === 'confirmed' || a.status === 'planned') confirmedCount++;
      if (a.status === 'completed') completedCount++;
      if (a.status === 'pending') pendingCount++;
    });

    return {
      total: filteredAppointments.length,
      confirmed: confirmedCount,
      completed: completedCount,
      pending: pendingCount,
      revenue: totalRev,
    };
  }, [filteredAppointments]);

  return (
    <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden flex flex-col">
      {/* ──────────────────────────────────────────────────────────
          WEEK HEADER BAR (Overview + Stats)
         ────────────────────────────────────────────────────────── */}
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E91E63]/10 text-[#E91E63] flex items-center justify-center text-lg font-bold shadow-xs">
            <RiCalendarLine />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                Week Schedule
              </h3>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              7-Day Staff & Customer Booking Overview (Monday to Sunday)
            </p>
          </div>
        </div>

        {/* Dynamic Previous / Next Week Navigation Control */}
        {(onPrevWeek || onNextWeek) && (
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#161626] border border-gray-200/80 dark:border-white/10 p-1 rounded-2xl shadow-xs">
            {onPrevWeek && (
              <button
                type="button"
                onClick={onPrevWeek}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center gap-1 cursor-pointer"
                title="Previous Week"
              >
                <RiArrowLeftSLine className="text-base" />
                <span className="hidden sm:inline">Prev</span>
              </button>
            )}

            <div className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200">
              <RiCalendarLine className="text-[#E91E63] text-sm shrink-0" />
              <span>
                {format(weekStart, 'd MMM')} – {format(weekEnd, 'd MMM yyyy')}
              </span>
            </div>

            {onNextWeek && (
              <button
                type="button"
                onClick={onNextWeek}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center gap-1 cursor-pointer"
                title="Next Week"
              >
                <span className="hidden sm:inline">Next</span>
                <RiArrowRightSLine className="text-base" />
              </button>
            )}

            {!isCurrentWeek && onToday && (
              <button
                type="button"
                onClick={onToday}
                className="ml-1 px-3 py-1.5 text-xs font-extrabold rounded-xl bg-pink-50 text-[#E91E63] dark:bg-[#E91E63]/10 dark:text-pink-300 border border-pink-200 dark:border-pink-500/20 hover:bg-pink-100 dark:hover:bg-[#E91E63]/20 transition-all cursor-pointer shadow-2xs"
                title="Jump to Current Week"
              >
                This Week
              </button>
            )}
          </div>
        )}

        {/* Quick Week Metrics */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#161626] border border-gray-100 dark:border-white/10 shadow-xs">
            <span className="text-gray-400">Total:</span>
            <span className="font-extrabold text-gray-900 dark:text-white">
              {weekStats.total}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#161626] border border-gray-100 dark:border-white/10 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-400">Confirmed:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              {weekStats.confirmed}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#161626] border border-gray-100 dark:border-white/10 shadow-xs">
            <span className="text-gray-400">Est. Revenue:</span>
            <span className="font-extrabold text-[#E91E63]">
              {formatCurrency(weekStats.revenue)}
            </span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          7-DAY HORIZONTAL COLUMNS (Fresha / Zenoti Model)
         ────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto p-4 sm:p-5 custom-scrollbar">
        <div className="grid grid-cols-7 gap-3 min-w-[1050px]">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayAppts = appointmentsByDay[dateStr] || [];
            const isCurrentDay = isToday(day);
            const isSelected = isSameDay(day, currentDate);

            return (
              <div
                key={dateStr}
                className={`flex flex-col rounded-2xl border transition-all ${
                  isCurrentDay
                    ? 'border-[#E91E63] shadow-md shadow-[#E91E63]/10 bg-pink-50/20 dark:bg-[#E91E63]/5 ring-1 ring-[#E91E63]/50'
                    : isSelected
                    ? 'border-gray-300 dark:border-white/20 bg-gray-50/50 dark:bg-white/[0.01]'
                    : 'border-gray-200/80 dark:border-white/10 bg-gray-50/30 dark:bg-white/[0.01]'
                }`}
              >
                {/* ─── Column Header ─── */}
                <div
                  className={`p-3 border-b flex items-center justify-between rounded-t-2xl transition-colors ${
                    isCurrentDay
                      ? 'bg-[#E91E63]/10 border-[#E91E63]/30'
                      : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#181829]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider ${
                          isCurrentDay
                            ? 'text-[#E91E63]'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {format(day, 'EEE')}
                      </span>
                      {isCurrentDay && (
                        <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded bg-[#E91E63] text-white">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <button
                        type="button"
                        onClick={() => onDayClick && onDayClick(day)}
                        className={`text-sm font-extrabold cursor-pointer hover:underline ${
                          isCurrentDay
                            ? 'text-[#E91E63]'
                            : 'text-gray-900 dark:text-white'
                        }`}
                        title="Click to view full Day timeline"
                      >
                        {format(day, 'd MMM')}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Badge Count */}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        dayAppts.length > 0
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {dayAppts.length}
                    </span>

                    {/* Quick Add Slot Button */}
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
                      title={`Book appointment on ${format(day, 'EEE, d MMM')}`}
                      className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-[#E91E63] hover:text-white text-gray-500 dark:text-gray-400 flex items-center justify-center transition-colors cursor-pointer text-sm"
                    >
                      <RiAddLine />
                    </button>
                  </div>
                </div>

                {/* ─── Column Body (Appointments List) ─── */}
                <div className="p-2 sm:p-2.5 flex-1 flex flex-col gap-2 min-h-[460px] max-h-[680px] overflow-y-auto custom-scrollbar">
                  {dayAppts.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-200 dark:border-white/10 rounded-xl my-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center text-sm mb-2">
                        <RiCalendarLine />
                      </div>
                      <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                        No appointments
                      </p>
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
                        className="mt-3 text-[10px] font-bold text-[#E91E63] hover:text-[#D81B60] flex items-center gap-1 cursor-pointer bg-[#E91E63]/10 px-2 py-1 rounded-lg transition-colors"
                      >
                        <RiAddLine /> Book Slot
                      </button>
                    </div>
                  ) : (
                    dayAppts.map((appt) => {
                      const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.planned;
                      const isUnassigned = !appt.staff_member_id && !appt.staff_id;
                      const isWalkIn =
                        appt.source === 'walk_in' ||
                        appt.notes?.toLowerCase().includes('walk-in');

                      return (
                        <div
                          key={appt.id}
                          onClick={() => onAppointmentClick && onAppointmentClick(appt)}
                          className={`bg-white dark:bg-[#181829] border border-gray-200/80 dark:border-white/10 rounded-xl p-2.5 shadow-xs hover:shadow-md hover:border-[#E91E63]/50 transition-all cursor-pointer group relative overflow-hidden border-l-4 ${cfg.border} hover:-translate-y-0.5`}
                        >
                          {/* Top: Time & Status */}
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span className="text-[11px] font-extrabold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                              <RiTimeLine className="text-[#E91E63] text-xs shrink-0" />
                              {formatTime(appt.start_time)}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${cfg.badge}`}
                            >
                              {cfg.label}
                            </span>
                          </div>

                          {/* Customer */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <VisualAvatar
                                type="customer"
                                image={appt.customer_avatar_url}
                                name={`${appt.customer_first_name || ''} ${
                                  appt.customer_last_name || ''
                                }`}
                                size="xs"
                              />
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {appt.customer_first_name || 'Walk-in'}{' '}
                                {appt.customer_last_name || ''}
                              </p>
                            </div>
                            {isWalkIn && (
                              <span
                                title="Walk-In Customer"
                                className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.2 rounded shrink-0 flex items-center gap-0.5"
                              >
                                <RiWalkLine className="text-[10px]" /> Walk-in
                              </span>
                            )}
                          </div>

                          {/* Service */}
                          <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400 mb-2 truncate">
                            <RiScissorsLine className="text-gray-400 text-xs shrink-0" />
                            <span className="truncate">{appt.service_name}</span>
                          </div>

                          {/* Bottom Row: Staff + Price */}
                          <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                            {isUnassigned ? (
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md">
                                <RiAlertLine className="text-xs" /> Unassigned
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <VisualAvatar
                                  type="staff"
                                  image={appt.staff_avatar_url}
                                  color={appt.staff_color}
                                  name={`${appt.staff_first_name || ''} ${
                                    appt.staff_last_name || ''
                                  }`}
                                  size="xs"
                                />
                                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                                  {appt.staff_first_name}
                                </span>
                              </div>
                            )}

                            <span className="text-[11px] font-extrabold text-[#E91E63] shrink-0 ml-1">
                              {formatCurrency(appt.service_price || 0)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* ─── Column Footer: Jump to Day Timeline ─── */}
                <div className="p-2 border-t border-gray-100 dark:border-white/5 bg-white/50 dark:bg-[#181829]/50 rounded-b-2xl text-center">
                  <button
                    type="button"
                    onClick={() => onDayClick && onDayClick(day)}
                    className="text-[10px] font-bold text-gray-500 hover:text-[#E91E63] dark:text-gray-400 dark:hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    View Day Schedule <RiArrowRightLine className="text-xs" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
