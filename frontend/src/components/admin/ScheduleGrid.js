'use client';

import { useState } from 'react';
import { 
  RiMoreFill, 
  RiUserLine, 
  RiUserUnfollowLine, 
  RiTimeLine, 
  RiAlertLine, 
  RiCheckLine, 
  RiCloseLine, 
  RiAddLine,
  RiInformationLine
} from 'react-icons/ri';
import VisualAvatar from '@/components/admin/common/VisualAvatar';

/**
 * Schedule Grid Component for Day View
 * Industry-Standard Salon Timeline Grid
 * Features:
 * - Dedicated "Unassigned Queue / Nobody" Row at top with exact slot positioning & status alerts
 * - Full Status-Aware Card Styling (Pending, In Progress, Confirmed, Completed, Cancelled)
 * - Empty Slot Hover & Quick Booking Triggers
 * - Off-Shift Shading per Staff Shift Schedule
 * - Responsive Multi-Hour Timeline
 */
export default function ScheduleGrid({
  staff = [],
  appointments = [],
  businessSettings,
  onAppointmentClick,
  onSlotClick,
  onAssignStaff,
  statusFilter = 'all',
  showCancelled = true,
  className = '',
}) {
  const START_HOUR = 9; // 9 AM
  
  // Hours: 9 AM to 6 PM (10 columns)
  const hours = [
    '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'
  ];
  const TOTAL_HOURS = hours.length;

  const getStaffShiftRange = (shiftType) => {
    switch (shiftType) {
      case 'morning':
        return { label: 'Morning (9am - 4pm)', startHour: 9, endHour: 16 };
      case 'evening':
        return { label: 'Evening (1pm - 9pm)', startHour: 13, endHour: 21 };
      case 'flexible':
        return { label: 'Flexible (10am - 6pm)', startHour: 10, endHour: 18 };
      default:
        return { label: 'Full-time (10am - 8pm)', startHour: 10, endHour: 20 };
    }
  };

  const DEFAULT_STAFF = [
    { id: 101, first_name: 'Riya', last_name: 'Sharma', designation: 'Senior Stylist', avatar_url: 'icon:icon_female', color_code: '#EC4899' },
    { id: 102, first_name: 'Anjali', last_name: 'Patel', designation: 'Beautician', avatar_url: 'icon:icon_female', color_code: '#8B5CF6' },
    { id: 103, first_name: 'Pooja', last_name: 'Verma', designation: 'Hair Specialist', avatar_url: 'icon:icon_scissors', color_code: '#10B981' },
    { id: 104, first_name: 'Karan', last_name: 'Mehta', designation: 'Makeup Artist', avatar_url: 'icon:icon_male', color_code: '#3B82F6' },
    { id: 105, first_name: 'Neha', last_name: 'Gupta', designation: 'Nail Artist', avatar_url: 'icon:icon_brush', color_code: '#F59E0B' },
  ];

  const DEFAULT_APPOINTMENTS = [
    { id: 'd1', staff_member_id: 101, customer_first_name: 'Priya', customer_last_name: 'Sharma', service_name: 'Hair Colour', start_time: '09:30:00', end_time: '10:30:00', status: 'confirmed', color: 'pink' },
    { id: 'd2', staff_member_id: 101, customer_first_name: 'Neha', customer_last_name: 'Gupta', service_name: 'Facial Treatment', start_time: '11:00:00', end_time: '12:00:00', status: 'confirmed', color: 'green' },
    { id: 'd3', staff_member_id: 101, customer_first_name: 'Kavita', customer_last_name: 'Singh', service_name: 'Hair Spa', start_time: '13:00:00', end_time: '14:00:00', status: 'confirmed', color: 'purple' },
    { id: 'd4', staff_member_id: null, customer_first_name: 'Pooja', customer_last_name: 'Jain', service_name: 'Party Makeup', start_time: '10:00:00', end_time: '11:30:00', status: 'pending', color: 'amber' },
    { id: 'd5', staff_member_id: 102, customer_first_name: 'Ritika', customer_last_name: 'Verma', service_name: 'Keratin Treatment', start_time: '10:00:00', end_time: '11:00:00', status: 'ongoing', color: 'blue' },
    { id: 'd6', staff_member_id: 102, customer_first_name: 'Walk-in', customer_last_name: '', service_name: 'Haircut', start_time: '12:30:00', end_time: '13:30:00', status: 'confirmed', color: 'amber', is_walk_in: true },
    { id: 'd7', staff_member_id: 103, customer_first_name: 'Rekha', customer_last_name: 'Jain', service_name: 'Hair Spa', start_time: '09:00:00', end_time: '10:00:00', status: 'completed', color: 'pink' },
    { id: 'd8', staff_member_id: 104, customer_first_name: 'Aman', customer_last_name: 'Verma', service_name: 'Beard Styling', start_time: '14:00:00', end_time: '15:00:00', status: 'cancelled', color: 'pink' },
  ];

  // If real staff exists, always use real staff. Only fallback if no staff found anywhere.
  const effectiveStaff = staff.length > 0 ? staff : DEFAULT_STAFF;
  
  // Only inject mock appointments if BOTH staff and appointments are empty (i.e. fresh local dev demo)
  const effectiveAppointments = (staff.length > 0) 
    ? appointments 
    : (appointments.length > 0 ? appointments : DEFAULT_APPOINTMENTS);

  const timeToFractionalHour = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = START_HOUR * 60;
    return Math.max(0, (totalMinutes - startMinutes) / 60);
  };

  // Filter appointments according to statusFilter and showCancelled
  const filteredAppointments = effectiveAppointments.filter((a) => {
    const st = (a.status || 'confirmed').toLowerCase();
    const isCancelled = st === 'cancelled' || st === 'no_show';
    const isUnassigned = !a.staff_member_id && !a.staff_id;

    if (statusFilter === 'unassigned') return isUnassigned;
    if (statusFilter === 'pending') return st === 'pending';
    if (statusFilter === 'in-progress') return st === 'ongoing' || st === 'in-progress';
    if (statusFilter === 'confirmed') return st === 'confirmed' || st === 'planned';
    if (statusFilter === 'cancelled') return isCancelled;

    // 'all' filter
    if (isCancelled && !showCancelled) return false;
    return true;
  });

  // Separate Unassigned appointments (no staff member assigned or staff not in staff list)
  const unassignedAppointments = filteredAppointments.filter((a) => {
    if (!a.staff_member_id && !a.staff_id) return true;
    const assignedId = a.staff_member_id || a.staff_id;
    return !effectiveStaff.some((s) => String(s.id) === String(assignedId));
  });

  const getStaffAppointments = (staffId) => {
    return filteredAppointments.filter((a) => {
      const assignedId = a.staff_member_id || a.staff_id;
      return String(assignedId) === String(staffId);
    });
  };

  /**
   * Premium Status & Service-Aware Styling
   */
  const getCardStyle = (appt) => {
    const status = (appt.status || 'confirmed').toLowerCase();
    const isUnassigned = !appt.staff_member_id && !appt.staff_id;

    // 1. Cancelled / No-show: Muted strikethrough styling with red accent
    if (status === 'cancelled' || status === 'no_show') {
      return {
        card: 'bg-gray-100/90 dark:bg-white/[0.04] border-dashed border-red-300 dark:border-red-900/50 opacity-70 hover:opacity-100',
        serviceText: 'text-gray-500 dark:text-gray-400 line-through font-normal',
        customerText: 'text-gray-600 dark:text-gray-300 line-through',
        badgeBg: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-900/40',
        badgeText: 'Cancelled',
        dot: 'bg-red-400',
      };
    }

    // 2. Pending Approval: High-alert glowing amber styling
    if (status === 'pending') {
      return {
        card: 'bg-amber-50/95 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 shadow-xs ring-1 ring-amber-400/25',
        serviceText: 'text-amber-700 dark:text-amber-300 font-semibold',
        customerText: 'text-amber-950 dark:text-amber-100',
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/50',
        badgeText: 'Pending Approval',
        dot: 'bg-amber-500 animate-pulse',
      };
    }

    // 3. In Progress / Ongoing: Active pulsing blue styling
    if (status === 'ongoing' || status === 'in-progress') {
      return {
        card: 'bg-blue-50/95 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700/60 shadow-xs ring-1 ring-blue-400/25',
        serviceText: 'text-[#2E90FA] font-semibold',
        customerText: 'text-blue-950 dark:text-blue-100',
        badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
        badgeText: 'In Progress',
        dot: 'bg-blue-500 animate-ping',
      };
    }

    // 4. Completed: Clean emerald styling
    if (status === 'completed') {
      return {
        card: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40',
        serviceText: 'text-[#12B76A] font-semibold',
        customerText: 'text-gray-900 dark:text-white',
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/30',
        badgeText: 'Completed',
        dot: 'bg-[#12B76A]',
      };
    }

    // 5. Unassigned: Distinct dashed amber/purple border
    if (isUnassigned) {
      return {
        card: 'bg-amber-50/90 dark:bg-amber-950/40 border-2 border-dashed border-amber-400 dark:border-amber-600/70 shadow-xs',
        serviceText: 'text-amber-700 dark:text-amber-300 font-semibold',
        customerText: 'text-gray-900 dark:text-white',
        badgeBg: 'bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200 border-amber-300 dark:border-amber-700',
        badgeText: 'Needs Stylist',
        dot: 'bg-amber-500 animate-pulse',
      };
    }

    // 6. Confirmed / Planned (Categorized by Service & Color)
    if (appt.color === 'pink' || appt.service_name?.toLowerCase().includes('colour') || appt.service_name?.toLowerCase().includes('color') || appt.service_name?.toLowerCase().includes('haircut & styling') || appt.service_name?.toLowerCase().includes('party makeup')) {
      return {
        card: 'bg-[#FFF0F5] dark:bg-pink-950/30 border-pink-200 dark:border-pink-900/40 text-gray-900 dark:text-white',
        serviceText: 'text-[#E91E63] font-semibold',
        customerText: 'text-gray-900 dark:text-white',
        badgeBg: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200/60',
        badgeText: 'Confirmed',
        dot: 'bg-[#E91E63]',
      };
    }
    if (appt.color === 'green' || appt.service_name?.toLowerCase().includes('facial') || appt.service_name?.toLowerCase().includes('blow dry') || appt.service_name?.toLowerCase().includes('nail')) {
      return {
        card: 'bg-[#E8F8EE] dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-gray-900 dark:text-white',
        serviceText: 'text-[#12B76A] font-semibold',
        customerText: 'text-gray-900 dark:text-white',
        badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60',
        badgeText: 'Confirmed',
        dot: 'bg-[#12B76A]',
      };
    }
    if (appt.color === 'blue' || appt.service_name?.toLowerCase().includes('keratin') || appt.service_name?.toLowerCase().includes('manicure') || (appt.service_name?.toLowerCase().includes('haircut') && !appt.is_walk_in)) {
      return {
        card: 'bg-[#EFF8FF] dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-gray-900 dark:text-white',
        serviceText: 'text-[#2E90FA] font-semibold',
        customerText: 'text-gray-900 dark:text-white',
        badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60',
        badgeText: 'Confirmed',
        dot: 'bg-[#2E90FA]',
      };
    }
    if (appt.color === 'amber' || appt.is_walk_in || appt.customer_first_name === 'Walk-in' || appt.service_name?.toLowerCase().includes('beard')) {
      return {
        card: 'bg-[#FEF6EE] dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-gray-900 dark:text-white',
        serviceText: 'text-[#F79009] font-semibold',
        customerText: 'text-gray-900 dark:text-white',
        badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60',
        badgeText: 'Confirmed',
        dot: 'bg-[#F79009]',
      };
    }

    return {
      card: 'bg-[#F5F0FF] dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/40 text-gray-900 dark:text-white',
      serviceText: 'text-[#7F56D9] font-semibold',
      customerText: 'text-gray-900 dark:text-white',
      badgeBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60',
      badgeText: 'Confirmed',
      dot: 'bg-[#7F56D9]',
    };
  };

  return (
    <div className={`bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full w-full justify-between ${className}`}>
      <div className="overflow-x-auto no-scrollbar flex-1 flex flex-col w-full">
        <div className="w-full min-w-[900px] flex-1 flex flex-col">
          {/* Header Row (Staff Count + Hours) */}
          <div
            className="grid border-b border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02] shrink-0"
            style={{ gridTemplateColumns: `170px repeat(${TOTAL_HOURS}, minmax(0, 1fr))` }}
          >
            <div className="px-4 py-3.5 font-bold text-xs text-gray-800 dark:text-white border-r border-gray-100 dark:border-white/5 flex items-center justify-between">
              <span>Staff ({effectiveStaff.length})</span>
              {unassignedAppointments.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                  {unassignedAppointments.length} Open
                </span>
              )}
            </div>
            {hours.map((hour, idx) => (
              <div
                key={idx}
                className="px-1 py-3.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 text-center border-r border-gray-100 dark:border-white/5 last:border-r-0 flex items-center justify-center truncate"
              >
                {hour}
              </div>
            ))}
          </div>

          {/* ========================================================
              UNASSIGNED / OPEN QUEUE ("Nobody" Lane)
              Industry-standard open appointments buffer
             ======================================================== */}
          <div
            className={`border-b transition-colors ${
              unassignedAppointments.length > 0
                ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-200/70 dark:border-amber-900/30'
                : 'bg-gray-50/30 dark:bg-white/[0.01] border-gray-100 dark:border-white/5'
            } grid`}
            style={{ gridTemplateColumns: `170px repeat(${TOTAL_HOURS}, minmax(0, 1fr))` }}
          >
            {/* Unassigned Lane Header Column */}
            <div className="px-4 py-3 border-r border-gray-100 dark:border-white/5 flex items-center gap-2.5 relative z-10">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-xs">
                  <RiUserUnfollowLine className="text-base" />
                </div>
                {unassignedAppointments.length > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#1a1a2e] absolute -top-0.5 -right-0.5 animate-ping" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    Unassigned Queue
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {unassignedAppointments.length > 0
                    ? `${unassignedAppointments.length} awaiting staff`
                    : 'No open bookings'}
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border truncate max-w-full ${
                      unassignedAppointments.length > 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/50'
                        : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400 border-gray-200 dark:border-white/10'
                    }`}
                  >
                    {unassignedAppointments.length > 0 ? 'Needs Assignment' : 'Open Buffer'}
                  </span>
                </div>
              </div>
            </div>

            {/* Unassigned Lane Timeline */}
            <div
              className="relative h-full min-h-[88px]"
              style={{
                gridColumn: `2 / span ${TOTAL_HOURS}`,
                backgroundImage:
                  'linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px)',
                backgroundSize: `${100 / TOTAL_HOURS}% 100%`,
              }}
            >
              {unassignedAppointments.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1.5 opacity-60">
                    <RiInformationLine /> All appointments assigned to staff
                  </span>
                </div>
              ) : (
                unassignedAppointments.map((appt) => {
                  const startOffset = timeToFractionalHour(appt.start_time);
                  const endOffset = timeToFractionalHour(appt.end_time);
                  const duration = Math.max(0.5, endOffset - startOffset);

                  if (startOffset < 0 || startOffset >= TOTAL_HOURS) return null;

                  const leftPct = (startOffset / TOTAL_HOURS) * 100;
                  const widthPct = (duration / TOTAL_HOURS) * 100;
                  const style = getCardStyle(appt);

                  return (
                    <div
                      key={appt.id}
                      onClick={() => onAppointmentClick && onAppointmentClick(appt)}
                      className={`absolute top-2 bottom-2 rounded-xl border ${style.card} px-2.5 py-1.5 flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-md hover:scale-[1.01] hover:z-20 transition-all select-none shadow-xs`}
                      style={{
                        left: `calc(${leftPct}% + 4px)`,
                        width: `calc(${widthPct}% - 8px)`,
                        minWidth: '95px',
                      }}
                      title={`Unassigned: ${appt.customer_first_name || 'Walk-in'} - ${appt.service_name} (${appt.start_time?.substring(0, 5)} - ${appt.end_time?.substring(0, 5)})`}
                    >
                      {/* Top Row: Time + Status Pill */}
                      <div className="flex items-center justify-between gap-1 leading-none">
                        <span className="text-[10px] font-bold tracking-tight opacity-90 truncate">
                          {appt.start_time?.substring(0, 5)} - {appt.end_time?.substring(0, 5)}
                        </span>
                        <span className={`text-[8px] font-bold px-1 py-0.2 rounded border shrink-0 ${style.badgeBg}`}>
                          {style.badgeText}
                        </span>
                      </div>

                      {/* Bottom Row: Customer Avatar + Name & Service */}
                      <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/80 dark:border-black/30 shadow-2xs">
                          {appt.is_walk_in || appt.customer_first_name === 'Walk-in' ? (
                            <div className="w-full h-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px]">
                              <RiUserLine />
                            </div>
                          ) : (
                            <VisualAvatar
                              type="customer"
                              image={appt.customer_avatar_url || appt.profile_image_url}
                              name={`${appt.customer_first_name || ''} ${appt.customer_last_name || ''}`}
                              size="xs"
                              className="w-full h-full"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 leading-none">
                          <div className={`text-[11px] font-bold truncate ${style.customerText || 'text-gray-900 dark:text-white'}`}>
                            {appt.customer_first_name || 'Walk-in'} {appt.customer_last_name || ''}
                          </div>
                          <div className={`text-[10px] truncate mt-0.5 ${style.serviceText}`}>
                            {appt.service_name}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ========================================================
              STAFF ROWS CONTAINER
             ======================================================== */}
          <div className="flex-1 flex flex-col divide-y divide-gray-100 dark:divide-white/5">
            {effectiveStaff.map((member) => (
              <div
                key={member.id}
                className="flex-1 min-h-[92px] grid hover:bg-gray-50/30 dark:hover:bg-white/[0.01] transition-colors"
                style={{ gridTemplateColumns: `170px repeat(${TOTAL_HOURS}, minmax(0, 1fr))` }}
              >
                {/* Staff Info Column */}
                <div className="px-4 py-3.5 border-r border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a1a2e] flex items-center gap-2.5 relative z-10 h-full">
                  <div className="relative shrink-0">
                    <VisualAvatar
                      type="staff"
                      image={member.avatar_url}
                      color={member.color_code}
                      name={`${member.first_name || ''} ${member.last_name || ''}`}
                      size="md"
                    />
                    <span
                      className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-[#1a1a2e] absolute -bottom-0.5 -right-0.5 shadow-xs"
                      style={{ backgroundColor: member.color_code || '#E91E63' }}
                      title={`Staff Color: ${member.color_code || '#E91E63'}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {member.first_name} {member.last_name}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {member.designation || member.specialization || 'Stylist'}
                    </div>
                    <div className="mt-1">
                      <span className="inline-block text-[9px] font-semibold text-[#E91E63] bg-pink-50 dark:bg-pink-950/40 px-1.5 py-0.5 rounded border border-pink-200/50 dark:border-pink-900/30 truncate max-w-full">
                        {getStaffShiftRange(member.shift_schedule).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Schedule Timeline Column */}
                <div
                  className="relative bg-white dark:bg-[#1a1a2e] h-full min-h-[85px]"
                  style={{
                    gridColumn: `2 / span ${TOTAL_HOURS}`,
                    backgroundImage:
                      'linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px)',
                    backgroundSize: `${100 / TOTAL_HOURS}% 100%`,
                  }}
                >
                  {/* Off-shift background shading */}
                  {(() => {
                    const shift = getStaffShiftRange(member.shift_schedule);
                    const offRanges = [];
                    // Before shift start (if within grid hours 9..18)
                    if (shift.startHour > START_HOUR) {
                      const dur = Math.min(shift.startHour - START_HOUR, TOTAL_HOURS);
                      if (dur > 0) offRanges.push({ start: 0, duration: dur });
                    }
                    // After shift end (if within grid hours 9..18)
                    const gridEndHour = START_HOUR + TOTAL_HOURS; // 19
                    if (shift.endHour < gridEndHour) {
                      const startOffset = Math.max(0, shift.endHour - START_HOUR);
                      const dur = gridEndHour - shift.endHour;
                      if (startOffset < TOTAL_HOURS && dur > 0) {
                        offRanges.push({ start: startOffset, duration: Math.min(dur, TOTAL_HOURS - startOffset) });
                      }
                    }
                    return offRanges.map((off, oIdx) => (
                      <div
                        key={oIdx}
                        className="absolute top-0 bottom-0 bg-slate-100/50 dark:bg-black/35 pointer-events-none border-x border-dashed border-slate-200/50 dark:border-white/5 flex items-center justify-center select-none z-0"
                        style={{
                          left: `${(off.start / TOTAL_HOURS) * 100}%`,
                          width: `${(off.duration / TOTAL_HOURS) * 100}%`,
                        }}
                      >
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest opacity-60">
                          Off-Shift
                        </span>
                      </div>
                    ));
                  })()}

                  {/* Empty Slot Interactive Click Areas */}
                  {onSlotClick && (
                    <div className="absolute inset-0 grid grid-cols-10 pointer-events-none z-0">
                      {hours.map((_, hIdx) => (
                        <div
                          key={hIdx}
                          onClick={() => onSlotClick({ staff: member, hour: START_HOUR + hIdx })}
                          className="h-full pointer-events-auto hover:bg-[#E91E63]/5 transition-colors cursor-pointer group flex items-center justify-center"
                          title={`Click to book with ${member.first_name} at ${hours[hIdx]}`}
                        >
                          <span className="opacity-0 group-hover:opacity-100 text-[#E91E63] text-xs font-bold transition-opacity">
                            +
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Appointment Blocks */}
                  {getStaffAppointments(member.id).map((appt) => {
                    const startOffset = timeToFractionalHour(appt.start_time);
                    const endOffset = timeToFractionalHour(appt.end_time);
                    const duration = Math.max(0.5, endOffset - startOffset);

                    if (startOffset < 0 || startOffset >= TOTAL_HOURS) return null;

                    const leftPct = (startOffset / TOTAL_HOURS) * 100;
                    const widthPct = (duration / TOTAL_HOURS) * 100;
                    const style = getCardStyle(appt);

                    return (
                      <div
                        key={appt.id}
                        onClick={() => onAppointmentClick && onAppointmentClick(appt)}
                        className={`absolute top-2 bottom-2 rounded-xl border ${style.card} px-2.5 py-1.5 flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-md hover:scale-[1.01] hover:z-20 transition-all select-none shadow-xs`}
                        style={{
                          left: `calc(${leftPct}% + 4px)`,
                          width: `calc(${widthPct}% - 8px)`,
                          minWidth: '85px',
                        }}
                        title={`${appt.customer_first_name || 'Walk-in'} - ${appt.service_name} (${appt.start_time?.substring(0, 5)} - ${appt.end_time?.substring(0, 5)}) [${style.badgeText}]`}
                      >
                        {/* Top Row: Time Range + Status Badge */}
                        <div className="flex items-center justify-between gap-1 leading-none">
                          <span className="text-[10px] font-bold tracking-tight opacity-90 truncate">
                            {appt.start_time?.substring(0, 5)} - {appt.end_time?.substring(0, 5)}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {style.badgeText && (
                              <span className={`text-[8px] font-bold px-1 py-0.2 rounded border ${style.badgeBg}`}>
                                {style.badgeText}
                              </span>
                            )}
                            <RiMoreFill className="text-xs opacity-50 hover:opacity-100" />
                          </div>
                        </div>

                        {/* Bottom Row: Customer Avatar + Name & Service */}
                        <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/80 dark:border-black/30 shadow-2xs">
                            {appt.is_walk_in || appt.customer_first_name === 'Walk-in' ? (
                              <div className="w-full h-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px]">
                                <RiUserLine />
                              </div>
                            ) : (
                              <VisualAvatar
                                type="customer"
                                image={appt.customer_avatar_url || appt.profile_image_url}
                                name={`${appt.customer_first_name || ''} ${appt.customer_last_name || ''}`}
                                size="xs"
                                className="w-full h-full"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 leading-none">
                            <div className={`text-[11px] font-bold truncate ${style.customerText || 'text-gray-900 dark:text-white'}`}>
                              {appt.customer_first_name || 'Walk-in'} {appt.customer_last_name || ''}
                            </div>
                            <div className={`text-[10px] truncate mt-0.5 ${style.serviceText}`}>
                              {appt.service_name}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}