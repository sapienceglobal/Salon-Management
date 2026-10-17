'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { 
  RiMoreFill, 
  RiUserLine, 
  RiUserUnfollowLine, 
  RiTimeLine, 
  RiAlertLine, 
  RiCheckLine, 
  RiCloseLine, 
  RiAddLine,
  RiInformationLine,
  RiSparklingFill,
  RiArrowRightSLine,
  RiArrowLeftSLine,
  RiStackLine,
  RiScissorsCutLine,
  RiSearchLine,
  RiCalendarLine,
} from 'react-icons/ri';
import VisualAvatar from '@/components/admin/common/VisualAvatar';

/**
 * Schedule Grid Component for Day View
 * True Industry-Standard Salon Timeline Grid (Fresha / Zenoti Model)
 * 
 * Features:
 * - Dynamic Operating Hours: Automatically derived from Settings -> Operations (working_hours_start & working_hours_end)
 * - Horizontal X-Axis Scrolling: 120px standard column width for legible, uncompressed appointment cards
 * - Sticky Left Staff Column (sticky left-0 z-20): Staff name, avatar & shift stay pinned while scrolling across the day
 * - Sticky Top Hour Headers (sticky top-0 z-30) with elevated corner
 * - Real-Time Live "NOW" Indicator: Live pulsing red vertical line showing current time across all staff rows
 * - Auto-Scroll to Current Time on load + Quick "Jump to Now" button
 * - Dedicated "Unassigned Queue / Nobody" Row at top
 * - Off-Shift Shading per Staff Shift Schedule
 * - Full Status-Aware Card Styling & Quick Slot Booking Trigger
 */
export default function ScheduleGrid({
  staff = [],
  appointments = [],
  businessSettings,
  currentDate = new Date(),
  onAppointmentClick,
  onSlotClick,
  onAssignStaff,
  onPrevDay,
  onNextDay,
  onToday,
  statusFilter = 'all',
  showCancelled = true,
  className = '',
}) {
  const scrollContainerRef = useRef(null);

  // -------------------------------------------------------------
  // 1. DYNAMIC OPERATING HOURS CALCULATION (from Business Settings)
  // -------------------------------------------------------------
  const parseHour = (timeStr, defaultHour) => {
    if (!timeStr) return defaultHour;
    const parts = String(timeStr).split(':');
    const h = parseInt(parts[0], 10);
    return isNaN(h) ? defaultHour : h;
  };

  // Default salon operating hours: 9:00 AM (09:00:00) to 9:00 PM (21:00:00)
  const configuredStart = parseHour(businessSettings?.working_hours_start, 9);
  const configuredEnd = parseHour(businessSettings?.working_hours_end, 21);

  // Safeguard: Check if any appointment starts earlier or ends later so no card is clipped
  let minApptHour = configuredStart;
  let maxApptHour = configuredEnd;
  (appointments || []).forEach((a) => {
    if (a.start_time) {
      const h = parseInt(String(a.start_time).split(':')[0], 10);
      if (!isNaN(h) && h < minApptHour) minApptHour = h;
    }
    if (a.end_time) {
      const h = parseInt(String(a.end_time).split(':')[0], 10);
      if (!isNaN(h) && h > maxApptHour) maxApptHour = h;
    }
  });

  const START_HOUR = Math.max(6, Math.min(minApptHour, 11));
  const END_HOUR = Math.max(START_HOUR + 4, Math.min(maxApptHour, 23));
  const TOTAL_HOURS = END_HOUR - START_HOUR + 1;

  // Grid sizing constants (Industry Standard)
  const STAFF_COL_WIDTH = 180; // px
  const HOUR_WIDTH = 120; // px per hour (allows comfortable 60px 30-min cards)
  const TOTAL_GRID_WIDTH = STAFF_COL_WIDTH + TOTAL_HOURS * HOUR_WIDTH;

  // Generate dynamic hour slots
  const hours = useMemo(() => {
    const list = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      list.push({ hour: h, label: `${displayH} ${period}` });
    }
    return list;
  }, [START_HOUR, END_HOUR]);

  // -------------------------------------------------------------
  // 2. LIVE CURRENT TIME INDICATOR & AUTO-SCROLL
  // -------------------------------------------------------------
  const [currentMinutesFromMidnight, setCurrentMinutesFromMidnight] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  // State for overlapping appointment cluster popover
  const [isMounted, setIsMounted] = useState(false);
  const [activeCluster, setActiveCluster] = useState(null);
  const [clusterSearch, setClusterSearch] = useState('');
  const leaveTimerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Dismiss floating cluster popover on container scroll, window resize, or Escape key
  useEffect(() => {
    const container = scrollContainerRef.current;
    const dismiss = () => {
      if (activeCluster) {
        setActiveCluster(null);
        setClusterSearch('');
      }
    };
    if (container) {
      container.addEventListener('scroll', dismiss, { passive: true });
    }
    window.addEventListener('resize', dismiss, { passive: true });
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (container) {
        container.removeEventListener('scroll', dismiss);
      }
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeCluster]);

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setCurrentMinutesFromMidnight(d.getHours() * 60 + d.getMinutes());
    }, 30000); // 30s update
    return () => clearInterval(interval);
  }, []);

  const isTodayDate = useMemo(() => {
    if (!currentDate) return true;
    try {
      const d = new Date(currentDate);
      const now = new Date();
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    } catch {
      return false;
    }
  }, [currentDate]);

  const nowHourFraction = currentMinutesFromMidnight / 60;
  const isNowWithinGrid =
    nowHourFraction >= START_HOUR && nowHourFraction <= END_HOUR + 1;
  const nowLeftPct = ((nowHourFraction - START_HOUR) / TOTAL_HOURS) * 100;

  const scrollToNow = () => {
    if (!scrollContainerRef.current) return;
    const targetPx = Math.max(0, (nowHourFraction - START_HOUR) * HOUR_WIDTH - 160);
    scrollContainerRef.current.scrollTo({ left: targetPx, behavior: 'smooth' });
  };

  const scrollLeftBy = (amount) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Auto-scroll on initial load if today
  useEffect(() => {
    if (isTodayDate && isNowWithinGrid && scrollContainerRef.current) {
      const timer = setTimeout(() => {
        const targetPx = Math.max(0, (nowHourFraction - START_HOUR) * HOUR_WIDTH - 160);
        scrollContainerRef.current?.scrollTo({ left: targetPx, behavior: 'smooth' });
      }, 250);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTodayDate, isNowWithinGrid, START_HOUR]);

  // -------------------------------------------------------------
  // 3. STAFF & SHIFTS
  // -------------------------------------------------------------
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

  const effectiveStaff = staff.length > 0 ? staff : DEFAULT_STAFF;
  
  const effectiveAppointments = (staff.length > 0) 
    ? appointments 
    : (appointments.length > 0 ? appointments : DEFAULT_APPOINTMENTS);

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = String(timeStr).split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  const formatTime12h = (timeStr) => {
    if (!timeStr) return '';
    const parts = String(timeStr).split(':');
    const h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m} ${period}`;
  };

  const timeToFractionalHour = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const totalMinutes = h * 60 + m;
    const startMinutes = START_HOUR * 60;
    return Math.max(0, (totalMinutes - startMinutes) / 60);
  };

  // Group overlapping appointments in the same lane into clusters
  const clusterAppointments = (appts) => {
    if (!appts || appts.length === 0) return [];
    const sorted = [...appts].sort((a, b) => {
      const diff = timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
      if (diff !== 0) return diff;
      return timeToMinutes(a.end_time) - timeToMinutes(b.end_time);
    });

    const clusters = [];
    let current = [sorted[0]];
    let maxEnd = timeToMinutes(sorted[0].end_time || sorted[0].start_time);

    for (let i = 1; i < sorted.length; i++) {
      const appt = sorted[i];
      const apptStart = timeToMinutes(appt.start_time);
      const apptEnd = timeToMinutes(appt.end_time || appt.start_time);

      // Overlap with 1-min tolerance (prevents back-to-back appts from clustering)
      if (apptStart < maxEnd - 1) {
        current.push(appt);
        maxEnd = Math.max(maxEnd, apptEnd);
      } else {
        clusters.push(current);
        current = [appt];
        maxEnd = apptEnd;
      }
    }
    if (current.length > 0) {
      clusters.push(current);
    }
    return clusters;
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

  // Separate Unassigned appointments
  const unassignedAppointments = filteredAppointments.filter((a) => {
    if (!a.staff_member_id && !a.staff_id) return true;
    const assignedId = a.staff_member_id || a.staff_id;
    return !effectiveStaff.some((s) => String(s.id) === String(assignedId));
  });

  const getStaffAppointments = (staffId) => {
    return filteredAppointments.filter(
      (a) => String(a.staff_member_id || a.staff_id) === String(staffId)
    );
  };

  // -------------------------------------------------------------
  // 4. CARD STYLES BY STATUS / SERVICE
  // -------------------------------------------------------------
  const getCardStyle = (appt) => {
    const st = (appt.status || 'confirmed').toLowerCase();

    if (st === 'cancelled' || st === 'no_show') {
      return {
        card: 'bg-red-50/70 dark:bg-red-950/20 border-dashed border-red-300 dark:border-red-900/40 text-red-700 dark:text-red-400 opacity-60 line-through',
        serviceText: 'text-red-600 dark:text-red-400 line-through',
        customerText: 'text-red-700 dark:text-red-300 line-through',
        badgeBg: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200/60',
        badgeText: 'Cancelled',
        dot: 'bg-red-500',
      };
    }

    if (st === 'pending') {
      return {
        card: 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 shadow-amber-500/5',
        serviceText: 'text-amber-700 dark:text-amber-300 font-semibold',
        customerText: 'text-amber-900 dark:text-amber-100 font-bold',
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/80 animate-pulse',
        badgeText: 'Pending Approval',
        dot: 'bg-amber-500',
      };
    }

    if (st === 'ongoing' || st === 'in-progress') {
      return {
        card: 'bg-blue-50/95 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700/60 text-blue-900 dark:text-blue-100 ring-1 ring-blue-400/40 shadow-blue-500/10',
        serviceText: 'text-blue-700 dark:text-blue-300 font-semibold',
        customerText: 'text-blue-950 dark:text-white font-bold',
        badgeBg: 'bg-blue-500 text-white dark:bg-blue-600 border-blue-400 animate-pulse',
        badgeText: 'In Progress',
        dot: 'bg-blue-500',
      };
    }

    if (st === 'completed') {
      return {
        card: 'bg-purple-50/70 dark:bg-purple-950/25 border-purple-200/80 dark:border-purple-900/40 text-purple-900 dark:text-purple-200',
        serviceText: 'text-purple-700 dark:text-purple-300 font-medium',
        customerText: 'text-purple-950 dark:text-purple-100 font-semibold',
        badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200',
        badgeText: 'Completed',
        dot: 'bg-purple-500',
      };
    }

    // Default Confirmed Styles
    if (appt.color === 'pink' || appt.service_name?.toLowerCase().includes('colour') || appt.service_name?.toLowerCase().includes('color')) {
      return {
        card: 'bg-[#FDF2F8] dark:bg-pink-950/30 border-pink-200 dark:border-pink-900/40 text-gray-900 dark:text-white',
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

  // -------------------------------------------------------------
  // 5. CLUSTER HOVER & INTERACTION HANDLERS
  // -------------------------------------------------------------
  const handleClusterMouseEnter = (e, cluster, staffName, isUnassigned, clusterId) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const earliestStartMins = Math.min(...cluster.map((a) => timeToMinutes(a.start_time)));
    const latestEndMins = Math.max(...cluster.map((a) => timeToMinutes(a.end_time || a.start_time)));
    const durMins = Math.max(15, latestEndMins - earliestStartMins);
    const durHours = Math.floor(durMins / 60);
    const durRemainMins = durMins % 60;
    const durationLabel = durHours > 0 
      ? `${durHours}h${durRemainMins > 0 ? ` ${durRemainMins}m` : ''}` 
      : `${durRemainMins}m`;

    const earliestH = Math.floor(earliestStartMins / 60);
    const earliestM = String(earliestStartMins % 60).padStart(2, '0');
    const latestH = Math.floor(latestEndMins / 60);
    const latestM = String(latestEndMins % 60).padStart(2, '0');

    setActiveCluster({
      clusterId,
      cluster,
      staffName,
      isUnassigned,
      rect,
      earliestTime: formatTime12h(`${earliestH}:${earliestM}`),
      latestTime: formatTime12h(`${latestH}:${latestM}`),
      durationLabel,
    });
  };

  const handleClusterMouseLeave = () => {
    leaveTimerRef.current = setTimeout(() => {
      setActiveCluster(null);
      setClusterSearch('');
    }, 260);
  };

  const handlePopoverMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    leaveTimerRef.current = setTimeout(() => {
      setActiveCluster(null);
      setClusterSearch('');
    }, 220);
  };

  const handleClusterClick = (e, cluster, staffName, isUnassigned, clusterId) => {
    e.stopPropagation();
    handleClusterMouseEnter(e, cluster, staffName, isUnassigned, clusterId);
  };

  // Render a standard single appointment card
  const renderSingleAppointmentCard = (appt, staffContext) => {
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
          minWidth: '60px',
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
  };

  // Render a 3D Stacked Deck card for overlapping appointments
  const renderClusterCard = (cluster, staffName, isUnassigned, index, staffColor) => {
    const earliestStartMins = Math.min(...cluster.map((a) => timeToMinutes(a.start_time)));
    const latestEndMins = Math.max(...cluster.map((a) => timeToMinutes(a.end_time || a.start_time)));
    
    const startOffset = Math.max(0, (earliestStartMins - START_HOUR * 60) / 60);
    const endOffset = Math.max(0, (latestEndMins - START_HOUR * 60) / 60);
    const duration = Math.max(0.65, endOffset - startOffset);

    if (startOffset < 0 || startOffset >= TOTAL_HOURS) return null;

    const leftPct = (startOffset / TOTAL_HOURS) * 100;
    const widthPct = (duration / TOTAL_HOURS) * 100;

    const earliestTimeStr = `${String(Math.floor(earliestStartMins / 60)).padStart(2, '0')}:${String(earliestStartMins % 60).padStart(2, '0')}`;
    const latestTimeStr = `${String(Math.floor(latestEndMins / 60)).padStart(2, '0')}:${String(latestEndMins % 60).padStart(2, '0')}`;

    const clusterId = `${staffName}-${index}`;
    const isActive = activeCluster && activeCluster.clusterId === clusterId;

    return (
      <div
        key={clusterId}
        className="absolute top-2 bottom-2 select-none group/cluster"
        style={{
          left: `calc(${leftPct}% + 4px)`,
          width: `calc(${widthPct}% - 8px)`,
          minWidth: '85px',
          zIndex: isActive ? 28 : 10,
        }}
        onMouseEnter={(e) => handleClusterMouseEnter(e, cluster, staffName, isUnassigned, clusterId)}
        onMouseLeave={handleClusterMouseLeave}
        onClick={(e) => handleClusterClick(e, cluster, staffName, isUnassigned, clusterId)}
      >
        {/* 3D Stack Deck Layer 2 (Backmost) */}
        <div 
          className={`absolute -top-1.5 left-2 right-2 h-full rounded-xl transition-all duration-200 pointer-events-none ${
            isUnassigned
              ? 'bg-amber-200/50 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/40'
              : 'bg-violet-200/60 dark:bg-violet-950/40 border border-violet-300/60 dark:border-violet-700/40'
          } ${isActive ? '-translate-y-1' : 'group-hover/cluster:-translate-y-1'}`}
        />

        {/* 3D Stack Deck Layer 1 (Middle) */}
        <div 
          className={`absolute -top-0.5 left-1 right-1 h-full rounded-xl transition-all duration-200 pointer-events-none ${
            isUnassigned
              ? 'bg-amber-100/70 dark:bg-amber-900/40 border border-amber-300/80 dark:border-amber-700/50'
              : 'bg-violet-100/80 dark:bg-violet-900/40 border border-violet-300/80 dark:border-violet-700/50'
          } ${isActive ? '-translate-y-0.5' : 'group-hover/cluster:-translate-y-0.5'}`}
        />

        {/* Main Front Stack Card */}
        <div
          className={`relative h-full rounded-xl px-2.5 py-1.5 flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-200 shadow-sm ${
            isUnassigned
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-[#2a2218] dark:to-[#221c15] border border-amber-300/90 dark:border-amber-600/60 text-amber-950 dark:text-amber-100'
              : 'bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-[#231e3d] dark:to-[#1c1a30] border border-violet-300/90 dark:border-violet-600/60 text-gray-900 dark:text-white'
          } ${
            isActive 
              ? 'ring-2 ring-violet-500 dark:ring-violet-400 shadow-lg scale-[1.01]' 
              : 'hover:shadow-md hover:scale-[1.01]'
          }`}
        >
          {/* Top Row: Time Span + Stack Badge */}
          <div className="flex items-center justify-between gap-1 leading-none">
            <span className="text-[10px] font-extrabold tracking-tight truncate opacity-90">
              {earliestTimeStr} – {latestTimeStr}
            </span>
            <span 
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 shadow-2xs ${
                isUnassigned
                  ? 'bg-amber-500 text-white dark:bg-amber-600'
                  : 'bg-violet-600 text-white dark:bg-violet-500'
              }`}
            >
              <RiStackLine className="text-[10px]" />
              <span>{cluster.length} Bookings</span>
            </span>
          </div>

          {/* Bottom Row: Overlapping Avatars + Summary & Expand Cue */}
          <div className="flex items-center justify-between gap-1.5 min-w-0 mt-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Avatar Stack */}
              <div className="flex -space-x-1.5 overflow-hidden shrink-0 py-0.5">
                {cluster.slice(0, 3).map((a, i) => (
                  <div
                    key={a.id || i}
                    className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-[#1a1a2e] overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0"
                  >
                    {a.is_walk_in || a.customer_first_name === 'Walk-in' ? (
                      <div className="w-full h-full bg-amber-100 text-amber-600 flex items-center justify-center text-[9px]">
                        <RiUserLine />
                      </div>
                    ) : (
                      <VisualAvatar
                        type="customer"
                        image={a.customer_avatar_url || a.profile_image_url}
                        name={`${a.customer_first_name || ''} ${a.customer_last_name || ''}`}
                        size="xs"
                        className="w-full h-full"
                      />
                    )}
                  </div>
                ))}
                {cluster.length > 3 && (
                  <div className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-[#1a1a2e] bg-gray-900 text-white dark:bg-gray-700 text-[8px] font-bold flex items-center justify-center shrink-0">
                    +{cluster.length - 3}
                  </div>
                )}
              </div>

              {/* Names preview */}
              <div className="min-w-0 leading-none">
                <div className="text-[10px] font-bold truncate">
                  {cluster[0]?.customer_first_name || 'Walk-in'}
                  {cluster.length > 1 ? `, ${cluster[1]?.customer_first_name || ''}` : ''}
                  {cluster.length > 2 ? '...' : ''}
                </div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400 truncate mt-0.5 font-medium">
                  {cluster.length} overlapping
                </div>
              </div>
            </div>

            {/* Sparkle / Hover Cue */}
            <div className="shrink-0 flex items-center gap-0.5 text-[9px] font-bold text-violet-600 dark:text-violet-400 bg-white/80 dark:bg-white/10 px-1 py-0.5 rounded-md border border-violet-200 dark:border-white/10 opacity-80 group-hover/cluster:opacity-100 transition-opacity">
              <RiSparklingFill className="text-[9px]" />
              <span className="hidden sm:inline">Deck</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full w-full justify-between ${className}`}>
      
      {/* ========================================================
          TOP UTILITY BAR (Operating Hours Info + Jump to Now)
         ======================================================== */}
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-white/[0.015] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
            <RiTimeLine className="text-[#E91E63]" />
            Operating Timeline:
            <span className="px-2 py-0.5 rounded-md font-bold text-gray-900 dark:text-white bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-2xs">
              {hours[0]?.label} – {hours[hours.length - 1]?.label} ({TOTAL_HOURS}h)
            </span>
          </span>

          {/* Dedicated Day Navigation Stepper */}
          {(onPrevDay || onNextDay) && (
            <div className="flex items-center gap-1 bg-white dark:bg-[#161626] border border-gray-200/80 dark:border-white/10 p-0.5 rounded-xl shadow-xs">
              {onPrevDay && (
                <button
                  type="button"
                  onClick={onPrevDay}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                  title="Previous Day"
                >
                  <RiArrowLeftSLine className="text-sm" />
                </button>
              )}
              <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-gray-800 dark:text-gray-200">
                <RiCalendarLine className="text-[#E91E63] text-xs shrink-0" />
                <span>{format(new Date(currentDate), 'EEE, d MMM yyyy')}</span>
              </div>
              {onNextDay && (
                <button
                  type="button"
                  onClick={onNextDay}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                  title="Next Day"
                >
                  <RiArrowRightSLine className="text-sm" />
                </button>
              )}
              {!isTodayDate && onToday && (
                <button
                  type="button"
                  onClick={onToday}
                  className="ml-0.5 px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-pink-50 text-[#E91E63] dark:bg-[#E91E63]/10 dark:text-pink-300 border border-pink-200 dark:border-pink-500/20 hover:bg-pink-100 dark:hover:bg-[#E91E63]/20 transition-all cursor-pointer"
                  title="Jump to Today"
                >
                  Today
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll Nav buttons for mouse/desktop convenience */}
          <div className="flex items-center border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-white/5 shadow-2xs">
            <button
              type="button"
              onClick={() => scrollLeftBy(-240)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
              title="Scroll Left (Earlier)"
            >
              <RiArrowLeftSLine className="text-base" />
            </button>
            <span className="w-[1px] h-3 bg-gray-200 dark:bg-white/10" />
            <button
              type="button"
              onClick={() => scrollLeftBy(240)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
              title="Scroll Right (Later)"
            >
              <RiArrowRightSLine className="text-base" />
            </button>
          </div>

          {/* Jump to Now button */}
          {isTodayDate && isNowWithinGrid && (
            <button
              type="button"
              onClick={scrollToNow}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-full hover:bg-rose-100 dark:hover:bg-rose-950/80 transition-colors shadow-2xs group"
              title="Center timeline on current time"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse group-hover:scale-125 transition-transform" />
              <span>Jump to Now</span>
            </button>
          )}

          <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden xl:inline">
            ↔ Scroll horizontally for full day
          </span>
        </div>
      </div>

      {/* ========================================================
          HORIZONTAL SCROLLABLE SCHEDULE TIMELINE
         ======================================================== */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-auto flex-1 flex flex-col w-full relative select-none"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div 
          className="flex-1 flex flex-col"
          style={{ minWidth: `${TOTAL_GRID_WIDTH}px` }}
        >
          {/* ----------------------------------------------------
              HEADER ROW (Staff Count + Hours)
              Sticky Top Header & Sticky Left Staff Cell
             ---------------------------------------------------- */}
          <div
            className="grid border-b border-gray-200 dark:border-white/10 bg-gray-50/95 dark:bg-[#16162a] sticky top-0 z-30 shrink-0 backdrop-blur-sm"
            style={{ 
              gridTemplateColumns: `${STAFF_COL_WIDTH}px repeat(${TOTAL_HOURS}, ${HOUR_WIDTH}px)`,
              minWidth: `${TOTAL_GRID_WIDTH}px`
            }}
          >
            {/* Top-Left Corner: Double-sticky (top-0 and left-0) */}
            <div 
              className="px-4 py-3.5 font-bold text-xs text-gray-800 dark:text-white border-r border-gray-200 dark:border-white/10 flex items-center justify-between sticky left-0 z-40 bg-gray-50 dark:bg-[#16162a] shadow-[4px_0_12px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_12px_-2px_rgba(0,0,0,0.3)]"
              style={{ width: `${STAFF_COL_WIDTH}px`, minWidth: `${STAFF_COL_WIDTH}px` }}
            >
              <span>Staff ({effectiveStaff.length})</span>
              {unassignedAppointments.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                  {unassignedAppointments.length} Open
                </span>
              )}
            </div>

            {/* Hour Columns */}
            {hours.map((hObj, idx) => (
              <div
                key={idx}
                className="px-1 py-3.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300 text-center border-r border-gray-100 dark:border-white/5 last:border-r-0 flex items-center justify-center truncate relative"
                style={{ width: `${HOUR_WIDTH}px` }}
              >
                <span>{hObj.label}</span>
              </div>
            ))}

            {/* Live NOW Header Badge */}
            {isTodayDate && isNowWithinGrid && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-35 flex flex-col items-center"
                style={{
                  left: `calc(${STAFF_COL_WIDTH}px + ${(nowHourFraction - START_HOUR) * HOUR_WIDTH}px)`,
                  transform: 'translateX(-50%)',
                }}
              >
                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-rose-500 text-white tracking-wider shadow-sm uppercase mt-1 animate-pulse">
                  NOW
                </span>
                <div className="w-[2px] flex-1 bg-rose-500" />
              </div>
            )}
          </div>

          {/* ----------------------------------------------------
              UNASSIGNED / OPEN QUEUE ("Nobody" Lane)
              Industry-standard open appointments buffer
             ---------------------------------------------------- */}
          <div
            className={`border-b transition-colors relative ${
              unassignedAppointments.length > 0
                ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-200/70 dark:border-amber-900/30'
                : 'bg-gray-50/30 dark:bg-white/[0.01] border-gray-100 dark:border-white/5'
            } grid`}
            style={{ 
              gridTemplateColumns: `${STAFF_COL_WIDTH}px repeat(${TOTAL_HOURS}, ${HOUR_WIDTH}px)`,
              minWidth: `${TOTAL_GRID_WIDTH}px`
            }}
          >
            {/* Unassigned Lane Header Column - STICKY LEFT */}
            <div 
              className="px-4 py-3 border-r border-gray-200 dark:border-white/10 flex items-center gap-2.5 sticky left-0 z-20 bg-[#fffdf9] dark:bg-[#1f1d27] shadow-[4px_0_12px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_12px_-2px_rgba(0,0,0,0.3)]"
              style={{ width: `${STAFF_COL_WIDTH}px`, minWidth: `${STAFF_COL_WIDTH}px` }}
            >
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
              {/* Live NOW Vertical Indicator Line */}
              {isTodayDate && isNowWithinGrid && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-25 flex flex-col items-center"
                  style={{ left: `${nowLeftPct}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="w-[2px] h-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                </div>
              )}

              {unassignedAppointments.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1.5 opacity-60">
                    <RiInformationLine /> All appointments assigned to staff
                  </span>
                </div>
              ) : (
                clusterAppointments(unassignedAppointments).map((cluster, cIdx) => {
                  if (cluster.length === 1) {
                    return renderSingleAppointmentCard(cluster[0], 'Unassigned Queue');
                  }
                  return renderClusterCard(cluster, 'Unassigned Queue', true, cIdx);
                })
              )}
            </div>
          </div>

          {/* ----------------------------------------------------
              STAFF ROWS CONTAINER
              Each row has a STICKY LEFT staff card
             ---------------------------------------------------- */}
          <div className="flex-1 flex flex-col divide-y divide-gray-100 dark:divide-white/5">
            {effectiveStaff.map((member) => (
              <div
                key={member.id}
                className="flex-1 min-h-[92px] grid hover:bg-gray-50/30 dark:hover:bg-white/[0.01] transition-colors"
                style={{ 
                  gridTemplateColumns: `${STAFF_COL_WIDTH}px repeat(${TOTAL_HOURS}, ${HOUR_WIDTH}px)`,
                  minWidth: `${TOTAL_GRID_WIDTH}px`
                }}
              >
                {/* Staff Info Column - STICKY LEFT */}
                <div 
                  className="px-4 py-3.5 border-r border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] flex items-center gap-2.5 sticky left-0 z-20 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_12px_-2px_rgba(0,0,0,0.3)] h-full"
                  style={{ width: `${STAFF_COL_WIDTH}px`, minWidth: `${STAFF_COL_WIDTH}px` }}
                >
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
                    // Before shift start (if within grid hours)
                    if (shift.startHour > START_HOUR) {
                      const dur = Math.min(shift.startHour - START_HOUR, TOTAL_HOURS);
                      if (dur > 0) offRanges.push({ start: 0, duration: dur });
                    }
                    // After shift end (if within grid hours)
                    const gridEndHour = START_HOUR + TOTAL_HOURS;
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
                    <div 
                      className="absolute inset-0 pointer-events-none z-0"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${TOTAL_HOURS}, minmax(0, 1fr))`,
                      }}
                    >
                      {hours.map((hObj, hIdx) => (
                        <div
                          key={hIdx}
                          onClick={() => onSlotClick({ staff: member, hour: hObj.hour })}
                          className="h-full pointer-events-auto hover:bg-[#E91E63]/5 transition-colors cursor-pointer group flex items-center justify-center border-r border-transparent hover:border-[#E91E63]/20"
                          title={`Click to book with ${member.first_name} at ${hObj.label}`}
                        >
                          <span className="opacity-0 group-hover:opacity-100 text-[#E91E63] text-xs font-bold transition-opacity">
                            +
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Live NOW Vertical Indicator Line */}
                  {isTodayDate && isNowWithinGrid && (
                    <div
                      className="absolute top-0 bottom-0 pointer-events-none z-25 flex flex-col items-center"
                      style={{ left: `${nowLeftPct}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="w-[2px] h-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                    </div>
                  )}

                  {/* Appointment Blocks */}
                  {clusterAppointments(getStaffAppointments(member.id)).map((cluster, cIdx) => {
                    if (cluster.length === 1) {
                      return renderSingleAppointmentCard(cluster[0], `${member.first_name} ${member.last_name}`);
                    }
                    return renderClusterCard(
                      cluster,
                      `${member.first_name} ${member.last_name}`,
                      false,
                      cIdx,
                      member.color_code
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          FLOATING EXPANDED DECK POPOVER (PORTAL)
          Renders overlapping appointments cleanly without clipping
         ======================================================== */}
      {isMounted && activeCluster && typeof document !== 'undefined' && createPortal(
        (() => {
          const { rect, cluster, staffName, isUnassigned, earliestTime, latestTime, durationLabel } = activeCluster;
          const popoverWidth = 400;

          // Horizontal center relative to cluster card
          let popoverLeft = (rect.left + rect.width / 2) - popoverWidth / 2;
          if (popoverLeft < 12) popoverLeft = 12;
          if (popoverLeft + popoverWidth > window.innerWidth - 12) {
            popoverLeft = window.innerWidth - popoverWidth - 12;
          }

          // Vertical positioning: Upward if room, else downward
          const isAbove = rect.top >= 320;
          const popoverStyle = isAbove
            ? {
                position: 'fixed',
                left: `${popoverLeft}px`,
                bottom: `${window.innerHeight - rect.top + 12}px`,
                width: `${popoverWidth}px`,
                zIndex: 99999,
              }
            : {
                position: 'fixed',
                left: `${popoverLeft}px`,
                top: `${rect.bottom + 12}px`,
                width: `${popoverWidth}px`,
                zIndex: 99999,
              };

          const cardCenterX = rect.left + rect.width / 2;
          const stemX = Math.max(24, Math.min(popoverWidth - 24, cardCenterX - popoverLeft));

          // Filter appointments if searching
          const filteredInCluster = cluster.filter((a) => {
            if (!clusterSearch.trim()) return true;
            const q = clusterSearch.toLowerCase();
            const name = `${a.customer_first_name || ''} ${a.customer_last_name || ''}`.toLowerCase();
            const sName = (a.service_name || '').toLowerCase();
            return name.includes(q) || sName.includes(q);
          });

          return (
            <div
              style={popoverStyle}
              onMouseEnter={handlePopoverMouseEnter}
              onMouseLeave={handlePopoverMouseLeave}
              className="animate-in fade-in zoom-in-95 duration-200 select-none"
            >
              {/* Floating Connecting Guide Stem & Pointer Line */}
              {isAbove ? (
                <>
                  {/* Downward stem connecting popover to timeline card */}
                  <div
                    className="absolute -bottom-[12px] w-[2px] h-[12px] bg-gradient-to-b from-violet-500 to-indigo-500 pointer-events-none"
                    style={{ left: `${stemX}px`, transform: 'translateX(-50%)' }}
                  />
                  {/* Pulsing anchor dot on timeline card boundary */}
                  <div
                    className="absolute -bottom-[16px] w-2.5 h-2.5 rounded-full bg-violet-600 ring-2 ring-white dark:ring-[#1a1a2e] shadow-md pointer-events-none animate-pulse"
                    style={{ left: `${stemX}px`, transform: 'translateX(-50%)' }}
                  />
                  {/* Popover bottom caret arrow */}
                  <div
                    className="absolute -bottom-1.5 w-3 h-3 rotate-45 bg-white dark:bg-[#18182b] border-r border-b border-gray-200/80 dark:border-white/10"
                    style={{ left: `${stemX}px`, transform: 'translateX(-50%)' }}
                  />
                </>
              ) : (
                <>
                  {/* Upward stem connecting popover to timeline card */}
                  <div
                    className="absolute -top-[12px] w-[2px] h-[12px] bg-gradient-to-t from-violet-500 to-indigo-500 pointer-events-none"
                    style={{ left: `${stemX}px`, transform: 'translateX(-50%)' }}
                  />
                  {/* Pulsing anchor dot on timeline card boundary */}
                  <div
                    className="absolute -top-[16px] w-2.5 h-2.5 rounded-full bg-violet-600 ring-2 ring-white dark:ring-[#1a1a2e] shadow-md pointer-events-none animate-pulse"
                    style={{ left: `${stemX}px`, transform: 'translateX(-50%)' }}
                  />
                  {/* Popover top caret arrow */}
                  <div
                    className="absolute -top-1.5 w-3 h-3 rotate-45 bg-white dark:bg-[#18182b] border-l border-t border-gray-200/80 dark:border-white/10"
                    style={{ left: `${stemX}px`, transform: 'translateX(-50%)' }}
                  />
                </>
              )}

              {/* Main Popover Card Box */}
              <div className="bg-white/95 dark:bg-[#18182d]/95 backdrop-blur-xl border border-gray-200/90 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[500px] ring-1 ring-black/5 dark:ring-white/10">
                
                {/* Header */}
                <div className="p-3.5 border-b border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isUnassigned
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                          : 'bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300'
                      }`}>
                        <RiStackLine className="text-base" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {cluster.length} Overlapping Bookings
                        </h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                          {isUnassigned ? 'Unassigned Queue' : `Staff: ${staffName}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isUnassigned
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                          : 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40'
                      }`}>
                        {cluster.length} Cards
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCluster(null);
                          setClusterSearch('');
                        }}
                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        title="Close popover"
                      >
                        <RiCloseLine className="text-base" />
                      </button>
                    </div>
                  </div>

                  {/* Visual Timeline Range Connecting Line Indicator */}
                  <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                      <RiTimeLine className="text-[#E91E63]" />
                      {earliestTime}
                    </span>
                    <div className="flex-1 mx-2 flex items-center gap-1">
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-violet-500 via-pink-500 to-indigo-500 rounded-full" />
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 px-1 bg-white dark:bg-[#18182d] rounded shrink-0">
                        {durationLabel} span
                      </span>
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-pink-500 via-indigo-500 to-violet-500 rounded-full" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                      {latestTime}
                    </span>
                  </div>
                </div>

                {/* Quick Search if more than 4 appointments */}
                {cluster.length > 4 && (
                  <div className="px-3 pt-2.5 pb-1">
                    <div className="relative">
                      <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                      <input
                        type="text"
                        value={clusterSearch}
                        onChange={(e) => setClusterSearch(e.target.value)}
                        placeholder="Search customer or service..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}

                {/* Scrollable Individual Cards List */}
                <div className="p-3 overflow-y-auto space-y-2 max-h-[340px] custom-scrollbar">
                  {filteredInCluster.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
                      No matching bookings found
                    </div>
                  ) : (
                    filteredInCluster.map((appt) => {
                      const style = getCardStyle(appt);
                      return (
                        <div
                          key={appt.id}
                          onClick={() => {
                            setActiveCluster(null);
                            setClusterSearch('');
                            if (onAppointmentClick) onAppointmentClick(appt);
                          }}
                          className={`p-2.5 rounded-xl border ${style.card} transition-all duration-150 cursor-pointer hover:scale-[1.01] hover:shadow-md select-none group/item relative overflow-hidden`}
                        >
                          {/* Top Row: Time + Price + Status */}
                          <div className="flex items-center justify-between gap-1.5 mb-1.5 leading-none">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-gray-700 dark:text-gray-200">
                              <RiTimeLine className="text-violet-500 text-xs" />
                              <span>
                                {formatTime12h(appt.start_time)} – {formatTime12h(appt.end_time)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {(appt.total_amount || appt.price) && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                                  ₹{appt.total_amount || appt.price}
                                </span>
                              )}
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${style.badgeBg}`}>
                                {style.badgeText}
                              </span>
                            </div>
                          </div>

                          {/* Bottom Row: Customer Avatar + Name & Service */}
                          <div className="flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-white dark:border-gray-800 shadow-2xs">
                                {appt.is_walk_in || appt.customer_first_name === 'Walk-in' ? (
                                  <div className="w-full h-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">
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

                              <div className="min-w-0">
                                <div className={`text-xs font-bold truncate ${style.customerText || 'text-gray-900 dark:text-white'}`}>
                                  {appt.customer_first_name || 'Walk-in'} {appt.customer_last_name || ''}
                                </div>
                                <div className="text-[11px] truncate flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-0.5">
                                  <RiScissorsCutLine className="text-[10px] text-gray-400 shrink-0" />
                                  <span className={`truncate ${style.serviceText}`}>
                                    {appt.service_name || 'Salon Service'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Manage Arrow Indicator */}
                            <div className="shrink-0 flex items-center text-[10px] font-semibold text-violet-600 dark:text-violet-400 group-hover/item:translate-x-0.5 transition-transform opacity-80 group-hover/item:opacity-100">
                              <span>Details</span>
                              <RiArrowRightSLine className="text-sm" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-3.5 py-2 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.015] flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
                  <span>Click any appointment to open details</span>
                  <span>Esc to close</span>
                </div>
              </div>
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
}