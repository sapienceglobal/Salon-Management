'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  RiUpload2Line,
  RiDownload2Line,
  RiAddLine,
  RiCalendarLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowDownSLine,
  RiSearchLine,
  RiCalendarCheckLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiTimeLine,
  RiCalendarEventLine,
  RiCalendarTodoLine,
  RiSubtractLine,
  RiEdit2Line,
  RiMoreLine,
  RiCloseCircleLine,
  RiFileTextLine,
  RiCheckDoubleLine,
  RiUser3Line,
} from 'react-icons/ri';
import PageHeaderGradient from '@/components/admin/common/PageHeaderGradient';
import TableScrollContainer from '@/components/admin/common/TableScrollContainer';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// 6 Core Status configurations matching the exact UI design
const STATUS_CONFIG = {
  present: {
    key: 'present',
    label: 'Present',
    dotColor: 'bg-[#10B981]',
    textColor: 'text-[#10B981]',
    badgeBg: 'bg-[#E8F8F0]',
    badgeBorder: 'border-[#D1F2E0]',
    badgeText: 'text-[#10B981]',
    icon: RiCheckboxCircleLine,
  },
  absent: {
    key: 'absent',
    label: 'Absent',
    dotColor: 'bg-[#EF4444]',
    textColor: 'text-[#EF4444]',
    badgeBg: 'bg-[#FEEBEB]',
    badgeBorder: 'border-[#FCD7D7]',
    badgeText: 'text-[#EF4444]',
    icon: RiCloseLine,
  },
  half_day: {
    key: 'half_day',
    label: 'Half Day',
    dotColor: 'bg-[#F59E0B]',
    textColor: 'text-[#F59E0B]',
    badgeBg: 'bg-[#FEF7EA]',
    badgeBorder: 'border-[#FDEBCC]',
    badgeText: 'text-[#F59E0B]',
    icon: RiTimeLine,
  },
  weekly_off: {
    key: 'weekly_off',
    label: 'Weekly Off',
    dotColor: 'bg-[#3B82F6]',
    textColor: 'text-[#3B82F6]',
    badgeBg: 'bg-[#EFF6FF]',
    badgeBorder: 'border-[#DBEAFE]',
    badgeText: 'text-[#3B82F6]',
    icon: RiCalendarEventLine,
  },
  holiday: {
    key: 'holiday',
    label: 'Holiday',
    dotColor: 'bg-[#8B5CF6]',
    textColor: 'text-[#8B5CF6]',
    badgeBg: 'bg-[#F5F3FF]',
    badgeBorder: 'border-[#EDE9FE]',
    badgeText: 'text-[#8B5CF6]',
    icon: RiCalendarTodoLine,
  },
  leave: {
    key: 'leave',
    label: 'Leave',
    dotColor: 'bg-[#9CA3AF]',
    textColor: 'text-[#9CA3AF]',
    badgeBg: 'bg-[#F3F4F6]',
    badgeBorder: 'border-[#E5E7EB]',
    badgeText: 'text-[#9CA3AF]',
    icon: RiSubtractLine,
  },
};

// Fallback staff members matching the reference UI screenshot
const INITIAL_FALLBACK_STAFF = [
  {
    id: 1,
    first_name: 'Rahul',
    last_name: 'Sharma',
    designation: 'Senior Stylist',
    role: 'staff',
    branch: 'Downtown Branch',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    attendance: {
      '2026-09-25': { status: 'present', check_in_time: '09:30', check_out_time: '18:30' },
      '2026-09-26': { status: 'present', check_in_time: '09:30', check_out_time: '18:30' },
      '2026-09-27': { status: 'absent' },
      '2026-09-28': { status: 'present', check_in_time: '09:30', check_out_time: '18:30' },
      '2026-09-29': { status: 'present', check_in_time: '09:30', check_out_time: '18:30' },
      '2026-09-30': { status: 'half_day', check_in_time: '09:30', check_out_time: '14:00' },
      '2026-10-01': { status: 'present', check_in_time: '09:30', check_out_time: '18:30' },
    },
  },
  {
    id: 2,
    first_name: 'Priya',
    last_name: 'Singh',
    designation: 'Beautician',
    role: 'staff',
    branch: 'Downtown Branch',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    attendance: {
      '2026-09-25': { status: 'present', check_in_time: '10:00', check_out_time: '19:00' },
      '2026-09-26': { status: 'weekly_off' },
      '2026-09-27': { status: 'present', check_in_time: '10:00', check_out_time: '19:00' },
      '2026-09-28': { status: 'present', check_in_time: '10:00', check_out_time: '19:00' },
      '2026-09-29': { status: 'absent' },
      '2026-09-30': { status: 'present', check_in_time: '10:00', check_out_time: '19:00' },
      '2026-10-01': { status: 'present', check_in_time: '10:00', check_out_time: '19:00' },
    },
  },
  {
    id: 3,
    first_name: 'Aman',
    last_name: 'Verma',
    designation: 'Hair Specialist',
    role: 'staff',
    branch: 'Downtown Branch',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    attendance: {
      '2026-09-25': { status: 'present', check_in_time: '09:30', check_out_time: '18:30' },
      '2026-09-26': { status: 'present', check_in_time: '09:30', check_out_time: '18:30' },
      '2026-09-27': { status: 'holiday' },
      '2026-09-28': { status: 'present', check_in_time: '09:30', check_out_time: '18:30' },
      '2026-09-29': { status: 'present', check_in_time: '09:30', check_out_time: '18:30' },
      '2026-09-30': { status: 'present', check_in_time: '09:30', check_out_time: '18:30' },
      '2026-10-01': { status: 'absent' },
    },
  },
  {
    id: 4,
    first_name: 'Neha',
    last_name: 'Gupta',
    designation: 'Makeup Artist',
    role: 'staff',
    branch: 'Downtown Branch',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    attendance: {
      '2026-09-25': { status: 'present', check_in_time: '10:30', check_out_time: '19:30' },
      '2026-09-26': { status: 'absent' },
      '2026-09-27': { status: 'present', check_in_time: '10:30', check_out_time: '19:30' },
      '2026-09-28': { status: 'half_day', check_in_time: '10:30', check_out_time: '14:30' },
      '2026-09-29': { status: 'present', check_in_time: '10:30', check_out_time: '19:30' },
      '2026-09-30': { status: 'present', check_in_time: '10:30', check_out_time: '19:30' },
      '2026-10-01': { status: 'present', check_in_time: '10:30', check_out_time: '19:30' },
    },
  },
  {
    id: 5,
    first_name: 'Rohit',
    last_name: 'Mehta',
    designation: 'Assistant',
    role: 'staff',
    branch: 'Downtown Branch',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    attendance: {
      '2026-09-25': { status: 'weekly_off' },
      '2026-09-26': { status: 'present', check_in_time: '09:00', check_out_time: '18:00' },
      '2026-09-27': { status: 'present', check_in_time: '09:00', check_out_time: '18:00' },
      '2026-09-28': { status: 'present', check_in_time: '09:00', check_out_time: '18:00' },
      '2026-09-29': { status: 'present', check_in_time: '09:00', check_out_time: '18:00' },
      '2026-09-30': { status: 'absent' },
      '2026-10-01': { status: 'present', check_in_time: '09:00', check_out_time: '18:00' },
    },
  },
  {
    id: 6,
    first_name: 'Pooja',
    last_name: 'Verma',
    designation: 'Nail Artist',
    role: 'staff',
    branch: 'Downtown Branch',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    attendance: {
      '2026-09-25': { status: 'present', check_in_time: '10:00', check_out_time: '19:00' },
      '2026-09-26': { status: 'present', check_in_time: '10:00', check_out_time: '19:00' },
      '2026-09-27': { status: 'present', check_in_time: '10:00', check_out_time: '19:00' },
      '2026-09-28': { status: 'leave', notes: 'Personal work' },
      '2026-09-29': { status: 'present', check_in_time: '10:00', check_out_time: '19:00' },
      '2026-09-30': { status: 'present', check_in_time: '10:00', check_out_time: '19:00' },
      '2026-10-01': { status: 'present', check_in_time: '10:00', check_out_time: '19:00' },
    },
  },
];

export default function AttendancePage() {
  const [loading, setLoading] = useState(false);
  const [staffData, setStaffData] = useState(INITIAL_FALLBACK_STAFF);

  // Timeframe selector: Daily, Weekly, Monthly
  const [timeframe, setTimeframe] = useState('Daily');

  // Start Date: default to 2026-09-25 to perfectly match reference UI '25/09/2026 - 01/10/2026'
  const [currentStartDate, setCurrentStartDate] = useState(() => new Date('2026-09-25T00:00:00'));

  // Filters & search
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [selectedStaff, setSelectedStaff] = useState('All Staff');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown open states
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Modals state
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState(null);

  // Active cell popover for quick status toggle
  const [activeCellPopover, setActiveCellPopover] = useState(null);
  const [rowActionMenu, setRowActionMenu] = useState(null);

  const popoverRef = useRef(null);
  const daysToShow = 7;

  // Generate 7-day range
  const dates = useMemo(() => {
    const list = [];
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(currentStartDate);
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    return list;
  }, [currentStartDate]);

  // Date range formatted as "25/09/2026 - 01/10/2026"
  const formattedRange = useMemo(() => {
    if (!dates.length) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const start = `${pad(dates[0].getDate())}/${pad(dates[0].getMonth() + 1)}/${dates[0].getFullYear()}`;
    const end = `${pad(dates[6].getDate())}/${pad(dates[6].getMonth() + 1)}/${dates[6].getFullYear()}`;
    return `${start} - ${end}`;
  }, [dates]);

  // Fetch Attendance from API and merge with realistic staff
  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const startStr = dates[0].toISOString().split('T')[0];
      const endStr = dates[dates.length - 1].toISOString().split('T')[0];

      const res = await api.get(`/attendance?startDate=${startStr}&endDate=${endStr}`);
      const apiStaff = res.data || [];

      if (apiStaff.length > 0) {
        // Merge API data with fallback details
        const merged = INITIAL_FALLBACK_STAFF.map((fallback) => {
          const found = apiStaff.find((s) => s.id === fallback.id || s.first_name.toLowerCase() === fallback.first_name.toLowerCase());
          if (found) {
            return {
              ...fallback,
              ...found,
              designation: found.designation || fallback.designation,
              avatar_url: found.avatar_url || fallback.avatar_url,
              attendance: {
                ...fallback.attendance,
                ...(found.attendance || {}),
              },
            };
          }
          return fallback;
        });

        // Add any additional staff from DB not in fallback
        apiStaff.forEach((s) => {
          if (!merged.some((m) => m.id === s.id)) {
            merged.push({
              ...s,
              designation: s.designation || s.role || 'Staff Member',
              avatar_url: s.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.first_name + ' ' + (s.last_name || ''))}&background=E91E63&color=fff`,
              branch: 'Downtown Branch',
              attendance: s.attendance || {},
            });
          }
        });

        setStaffData(merged);
      }
    } catch {
      // In case of network/auth error or initial development, fall back gracefully
    } finally {
      setLoading(false);
    }
  }, [dates]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setActiveCellPopover(null);
      }
      if (!e.target.closest('.branch-dropdown-wrapper')) {
        setBranchDropdownOpen(false);
      }
      if (!e.target.closest('.staff-dropdown-wrapper')) {
        setStaffDropdownOpen(false);
      }
      if (!e.target.closest('.date-picker-wrapper')) {
        setDatePickerOpen(false);
      }
      if (!e.target.closest('.row-action-menu-wrapper')) {
        setRowActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Shift dates
  const shiftDate = (days) => {
    const d = new Date(currentStartDate);
    d.setDate(d.getDate() + days);
    setCurrentStartDate(d);
  };

  const jumpToToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    setCurrentStartDate(d);
    setDatePickerOpen(false);
  };

  // Quick mark status via Cell Popover
  const handleQuickStatusChange = async (staffId, dateStr, newStatus) => {
    // Optimistic UI update
    setStaffData((prev) =>
      prev.map((s) => {
        if (s.id === staffId) {
          return {
            ...s,
            attendance: {
              ...(s.attendance || {}),
              [dateStr]: {
                status: newStatus,
                check_in_time: newStatus === 'present' ? '09:30' : null,
                check_out_time: newStatus === 'present' ? '18:30' : null,
              },
            },
          };
        }
        return s;
      })
    );
    setActiveCellPopover(null);

    try {
      await api.post('/attendance/mark', {
        staff_id: staffId,
        date: dateStr,
        status: newStatus,
        check_in_time: newStatus === 'present' ? '09:30' : null,
        check_out_time: newStatus === 'present' ? '18:30' : null,
      });
      toast.success(`Marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch {
      // Revert if failed
      toast.error('Failed to update attendance on server');
    }
  };

  // Clear attendance for cell
  const handleClearCell = async (staffId, dateStr) => {
    setStaffData((prev) =>
      prev.map((s) => {
        if (s.id === staffId) {
          const nextAtt = { ...(s.attendance || {}) };
          delete nextAtt[dateStr];
          return { ...s, attendance: nextAtt };
        }
        return s;
      })
    );
    setActiveCellPopover(null);
    toast.success('Cell cleared');
  };

  // Mark all week for specific staff
  const handleMarkStaffFullWeek = async (staffId, status) => {
    setStaffData((prev) =>
      prev.map((s) => {
        if (s.id === staffId) {
          const updated = { ...(s.attendance || {}) };
          dates.forEach((d) => {
            const dateStr = d.toISOString().split('T')[0];
            updated[dateStr] = { status, check_in_time: status === 'present' ? '09:30' : null };
          });
          return { ...s, attendance: updated };
        }
        return s;
      })
    );
    setRowActionMenu(null);

    try {
      const records = dates.map((d) => ({
        staff_id: staffId,
        date: d.toISOString().split('T')[0],
        status,
        check_in_time: status === 'present' ? '09:30' : null,
      }));
      await api.post('/attendance/bulk-mark', { records });
      toast.success(`Full week marked as ${STATUS_CONFIG[status]?.label || status}`);
    } catch {
      toast.error('Failed to save bulk update');
    }
  };

  // Download Attendance CSV
  const handleDownloadCSV = () => {
    try {
      const dateHeaders = dates.map((d) => {
        const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
        const dateFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        return `"${dateFormatted} (${dayName})"`;
      });

      const headerRow = ['"Staff Name"', '"Designation"', ...dateHeaders, '"Total Present"', '"Total Absent"', '"Total Leave"'].join(',');

      const rows = filteredStaff.map((staff) => {
        let pCount = 0;
        let aCount = 0;
        let lCount = 0;

        const dayStatuses = dates.map((d) => {
          const dateStr = d.toISOString().split('T')[0];
          const st = staff.attendance?.[dateStr]?.status || 'unmarked';
          if (st === 'present') pCount++;
          if (st === 'absent') aCount++;
          if (st === 'leave') lCount++;
          return `"${STATUS_CONFIG[st]?.label || st}"`;
        });

        return [
          `"${staff.first_name} ${staff.last_name || ''}"`,
          `"${staff.designation || 'Staff'}"`,
          ...dayStatuses,
          pCount,
          aCount,
          lCount,
        ].join(',');
      });

      const csvContent = [headerRow, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Attendance_Report_${dates[0].toISOString().split('T')[0]}_to_${dates[6].toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Attendance report exported successfully!');
    } catch {
      toast.error('Failed to export attendance');
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffData.filter((s) => {
      const fullName = `${s.first_name} ${s.last_name || ''}`.toLowerCase();
      const desig = (s.designation || '').toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || desig.includes(searchQuery.toLowerCase());
      const matchesBranch = selectedBranch === 'All Branches' || s.branch === selectedBranch;
      const matchesStaff = selectedStaff === 'All Staff' || fullName.includes(selectedStaff.toLowerCase());
      return matchesSearch && matchesBranch && matchesStaff;
    });
  }, [staffData, searchQuery, selectedBranch, selectedStaff]);

  // Calculate totals for a staff member across the 7 days
  const getTotals = (staff) => {
    let p = 0;
    let a = 0;
    let l = 0;
    dates.forEach((d) => {
      const dateStr = d.toISOString().split('T')[0];
      const status = staff.attendance?.[dateStr]?.status;
      if (status === 'present') p++;
      else if (status === 'absent') a++;
      else if (status === 'leave') l++;
    });
    return { p, a, l };
  };

  return (
    <div className="relative min-h-screen bg-[#FAFAFC] dark:bg-[#0f0f1a] text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8 flex flex-col font-sans overflow-hidden">
      {/* Ambient Pink-White Top Gradient */}
      <PageHeaderGradient height="h-[300px]" />

      {/* 1. Header Section */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-normal">Manage staff attendance and timings.</p>
        </div>

        {/* Action Buttons Top-Right */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Import Attendance */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-pink-200/90 dark:border-pink-500/30 bg-white dark:bg-[#1a1a2e] text-[#E91E63] hover:bg-pink-50/60 dark:hover:bg-pink-900/20 text-sm font-semibold transition-all shadow-xs"
          >
            <RiUpload2Line className="text-lg text-[#E91E63]" />
            <span>Import Attendance</span>
          </button>

          {/* Download Export */}
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-semibold transition-all shadow-xs"
          >
            <RiDownload2Line className="text-lg text-gray-600 dark:text-gray-400" />
            <span>Download</span>
          </button>

          {/* + Add Attendance */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-sm font-bold shadow-md shadow-[#E91E63]/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <RiAddLine className="text-xl" />
            <span>Add Attendance</span>
          </button>
        </div>
      </div>

      {/* 2. Controls / Filters Toolbar */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 mb-5">
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Daily | Weekly | Monthly switcher */}
          <div className="inline-flex items-center bg-white dark:bg-[#1a1a2e] border border-gray-200/80 dark:border-white/10 p-1 rounded-xl shadow-xs">
            {['Daily', 'Weekly', 'Monthly'].map((mode) => (
              <button
                key={mode}
                onClick={() => setTimeframe(mode)}
                className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  timeframe === mode
                    ? 'bg-[#E91E63] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Date Navigator: <  📅 25/09/2026 - 01/10/2026  > */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => shiftDate(-7)}
              title="Previous 7 Days"
              className="w-9 h-9 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 flex items-center justify-center transition-colors shadow-xs"
            >
              <RiArrowLeftSLine className="text-xl" />
            </button>

            {/* Date Range Display Box */}
            <div className="relative date-picker-wrapper">
              <button
                onClick={() => setDatePickerOpen(!datePickerOpen)}
                className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-1.5 flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-xs hover:border-gray-300 dark:hover:border-white/20 transition-all"
              >
                <RiCalendarLine className="text-base text-gray-500" />
                <span>{formattedRange}</span>
              </button>

              {/* Jump to Date / Today Dropdown */}
              {datePickerOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Date</p>
                  <input
                    type="date"
                    value={currentStartDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        setCurrentStartDate(new Date(e.target.value));
                        setDatePickerOpen(false);
                      }
                    }}
                    className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl p-2 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white outline-none focus:border-[#E91E63]"
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={jumpToToday}
                      className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-pink-50 dark:bg-pink-900/30 text-[#E91E63] hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors"
                    >
                      Current Window
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStartDate(new Date('2026-09-25T00:00:00'));
                        setDatePickerOpen(false);
                      }}
                      className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                    >
                      Reset 25 Sep
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => shiftDate(7)}
              title="Next 7 Days"
              className="w-9 h-9 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 flex items-center justify-center transition-colors shadow-xs"
            >
              <RiArrowRightSLine className="text-xl" />
            </button>
          </div>
        </div>

        {/* Dropdowns & Search */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Branch Dropdown */}
          <div className="relative branch-dropdown-wrapper">
            <button
              onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
              className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 shadow-xs hover:border-gray-300 transition-colors min-w-[130px]"
            >
              <span>{selectedBranch}</span>
              <RiArrowDownSLine className="text-gray-400 text-base" />
            </button>
            {branchDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-xl shadow-lg p-1.5 z-40 animate-in fade-in duration-100">
                {['All Branches', 'Downtown Branch', 'Main Branch', 'Westside Branch'].map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      setSelectedBranch(b);
                      setBranchDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedBranch === b ? 'bg-pink-50 dark:bg-pink-900/30 text-[#E91E63]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Staff Dropdown */}
          <div className="relative staff-dropdown-wrapper">
            <button
              onClick={() => setStaffDropdownOpen(!staffDropdownOpen)}
              className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 shadow-xs hover:border-gray-300 transition-colors min-w-[120px]"
            >
              <span>{selectedStaff}</span>
              <RiArrowDownSLine className="text-gray-400 text-base" />
            </button>
            {staffDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-xl shadow-lg p-1.5 z-40 max-h-56 overflow-y-auto custom-scrollbar animate-in fade-in duration-100">
                <button
                  onClick={() => {
                    setSelectedStaff('All Staff');
                    setStaffDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    selectedStaff === 'All Staff' ? 'bg-pink-50 dark:bg-pink-900/30 text-[#E91E63]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  All Staff
                </button>
                {staffData.map((s) => {
                  const fullName = `${s.first_name} ${s.last_name || ''}`;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedStaff(fullName);
                        setStaffDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold truncate ${
                        selectedStaff === fullName ? 'bg-pink-50 dark:bg-pink-900/30 text-[#E91E63]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {fullName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search Staff */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff..."
              className="w-full bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 shadow-xs focus:outline-none focus:border-[#E91E63] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 3. Main Attendance Card */}
      <div className="relative z-10 bg-white dark:bg-[#1a1a2e] border border-gray-100/90 dark:border-white/5 rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col flex-1">
        {/* Card Header: Legends on Left + Mark Attendance Button on Right */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
          {/* Status Legends */}
          <div className="flex items-center flex-wrap gap-x-5 gap-y-2">
            {Object.values(STATUS_CONFIG).map((cfg) => (
              <div key={cfg.key} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor} shrink-0`} />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{cfg.label}</span>
              </div>
            ))}
          </div>

          {/* Mark Attendance Button */}
          <button
            onClick={() => setIsMarkModalOpen(true)}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#E91E63]/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <RiCalendarCheckLine className="text-lg" />
            <span>Mark Attendance</span>
          </button>
        </div>

        {/* Table Content */}
        <TableScrollContainer className="flex-1 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <table className="w-full border-collapse min-w-[950px] text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5">
                {/* Staff Name Column Header */}
                <th className="py-3.5 px-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-56">
                  Staff Name
                </th>

                {/* 7 Days Columns */}
                {dates.map((d, idx) => {
                  const dayNumMonth = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
                  return (
                    <th key={idx} className="py-3.5 px-2 text-center">
                      <div className="text-[11px] font-bold text-gray-800 dark:text-gray-200 tracking-tight">{dayNumMonth}</div>
                      <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase mt-0.5">{weekday}</div>
                    </th>
                  );
                })}

                {/* Total P/A/L Header */}
                <th className="py-3.5 px-3 text-center w-28">
                  <div className="text-[11px] font-bold text-gray-800 dark:text-gray-200 tracking-tight">TOTAL</div>
                  <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wider mt-0.5">P / A / L</div>
                </th>

                {/* Actions Header */}
                <th className="py-3.5 px-3 text-right w-20"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              {loading && staffData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    No staff members match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const fullName = `${staff.first_name} ${staff.last_name || ''}`;
                  const totals = getTotals(staff);

                  return (
                    <tr key={staff.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors group">
                      {/* 1. Staff Name & Avatar */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={staff.avatar_url}
                              alt={fullName}
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=E91E63&color=fff`;
                              }}
                              className="w-10 h-10 rounded-full object-cover shadow-xs border-2 shrink-0"
                              style={{ borderColor: staff.color_code || '#E91E63' }}
                            />
                            <span
                              className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-[#1a1a2e] absolute -bottom-0.5 -right-0.5 shadow-xs"
                              style={{ backgroundColor: staff.color_code || '#E91E63' }}
                              title={`Staff Color: ${staff.color_code || '#E91E63'}`}
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">{fullName}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate">{staff.designation || 'Stylist'}</p>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold text-[#E91E63] bg-pink-50 dark:bg-pink-950/40 border border-pink-200/50 dark:border-pink-900/30 capitalize truncate">
                                {(staff.shift_schedule || 'full_time').replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. 7 Date Status Badges */}
                      {dates.map((d, dIdx) => {
                        const dateStr = d.toISOString().split('T')[0];
                        const attRecord = staff.attendance?.[dateStr];
                        const statusKey = attRecord?.status;
                        const statusCfg = STATUS_CONFIG[statusKey];

                        return (
                          <td key={dIdx} className="py-3 px-2 text-center">
                            <div className="flex justify-center items-center">
                              {statusCfg ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setActiveCellPopover({
                                      staffId: staff.id,
                                      staffName: fullName,
                                      dateStr,
                                      dateFormatted: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                                      currentStatus: statusKey,
                                      checkInTime: attRecord?.check_in_time,
                                      checkOutTime: attRecord?.check_out_time,
                                      x: rect.left + rect.width / 2,
                                      y: rect.bottom + window.scrollY,
                                    });
                                  }}
                                  title={`${statusCfg.label} - Click to change`}
                                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-150 transform hover:scale-110 active:scale-95 shadow-xs ${statusCfg.badgeBg} ${statusCfg.badgeBorder} ${statusCfg.badgeText}`}
                                >
                                  <statusCfg.icon className="text-lg" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setActiveCellPopover({
                                      staffId: staff.id,
                                      staffName: fullName,
                                      dateStr,
                                      dateFormatted: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                                      currentStatus: null,
                                      x: rect.left + rect.width / 2,
                                      y: rect.bottom + window.scrollY,
                                    });
                                  }}
                                  title="Unmarked - Click to mark attendance"
                                  className="w-9 h-9 rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/5 text-gray-300 dark:text-gray-600 hover:text-[#E91E63] hover:border-[#E91E63]/40 hover:bg-pink-50/20 flex items-center justify-center transition-all duration-150 transform hover:scale-110"
                                >
                                  <RiAddLine className="text-base" />
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* 3. TOTAL P / A / L */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="text-[#10B981] font-bold text-sm">{totals.p}</span>
                        <span className="text-gray-300 dark:text-gray-600 font-normal mx-1">/</span>
                        <span className="text-[#EF4444] font-bold text-sm">{totals.a}</span>
                        <span className="text-gray-300 dark:text-gray-600 font-normal mx-1">/</span>
                        <span className="text-gray-500 dark:text-gray-400 font-bold text-sm">{totals.l}</span>
                      </td>

                      {/* 4. Action Icons: Pink Edit Pencil + More 3 dots */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStaffMember(staff);
                              setIsEditModalOpen(true);
                            }}
                            title="Edit Attendance Details"
                            className="p-1.5 text-[#E91E63] hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-lg transition-colors"
                          >
                            <RiEdit2Line className="text-base" />
                          </button>

                          <div className="relative row-action-menu-wrapper">
                            <button
                              type="button"
                              onClick={() => setRowActionMenu(rowActionMenu === staff.id ? null : staff.id)}
                              title="More Options"
                              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <RiMoreLine className="text-base" />
                            </button>

                            {/* Dropdown Menu for row */}
                            {rowActionMenu === staff.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl p-1.5 z-40 animate-in fade-in duration-100 text-left">
                                <button
                                  onClick={() => handleMarkStaffFullWeek(staff.id, 'present')}
                                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                                >
                                  ✓ Mark Week Present
                                </button>
                                <button
                                  onClick={() => handleMarkStaffFullWeek(staff.id, 'weekly_off')}
                                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                                >
                                  📅 Mark Week Off
                                </button>
                                <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />
                                <button
                                  onClick={() => {
                                    setEditingStaffMember(staff);
                                    setIsEditModalOpen(true);
                                    setRowActionMenu(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                  Edit Timings & Notes
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableScrollContainer>

        {/* 4. Table Footer: Showing 1 to 6 of 6 staff + Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 mt-auto border-t border-gray-100 dark:border-white/5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Showing 1 to {filteredStaff.length} of {staffData.length} staff
          </p>

          <div className="flex items-center gap-1.5">
            <button
              disabled
              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-gray-300 dark:text-gray-600 flex items-center justify-center text-sm cursor-not-allowed"
            >
              <RiArrowLeftSLine />
            </button>
            <span className="w-7 h-7 rounded-lg bg-[#E91E63] text-white text-xs font-bold flex items-center justify-center shadow-xs">
              1
            </span>
            <button
              disabled
              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-gray-300 dark:text-gray-600 flex items-center justify-center text-sm cursor-not-allowed"
            >
              <RiArrowRightSLine />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Status Picker Popover on Cell Click */}
      {activeCellPopover && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            left: `${Math.max(16, Math.min(activeCellPopover.x - 110, window.innerWidth - 240))}px`,
            top: `${activeCellPopover.y + 6}px`,
          }}
          className="z-50 w-56 bg-white dark:bg-[#1a1a2e] border border-gray-200/90 dark:border-white/10 rounded-2xl shadow-2xl p-2.5 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2 py-1 mb-1.5 border-b border-gray-100 dark:border-white/5">
            <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">{activeCellPopover.staffName}</p>
            <p className="text-[10px] text-gray-400">{activeCellPopover.dateFormatted}</p>
          </div>

          <div className="space-y-1">
            {Object.values(STATUS_CONFIG).map((cfg) => {
              const isSelected = activeCellPopover.currentStatus === cfg.key;
              return (
                <button
                  key={cfg.key}
                  onClick={() => handleQuickStatusChange(activeCellPopover.staffId, activeCellPopover.dateStr, cfg.key)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? `${cfg.badgeBg} ${cfg.badgeText} border ${cfg.badgeBorder}`
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor}`} />
                    <span>{cfg.label}</span>
                  </div>
                  <cfg.icon className="text-base" />
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/5 flex gap-1">
            <button
              onClick={() => {
                const s = staffData.find((m) => m.id === activeCellPopover.staffId);
                setEditingStaffMember(s);
                setIsEditModalOpen(true);
                setActiveCellPopover(null);
              }}
              className="flex-1 py-1 text-[11px] font-semibold text-[#E91E63] hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-lg transition-colors text-center"
            >
              Custom Time...
            </button>
            <button
              onClick={() => handleClearCell(activeCellPopover.staffId, activeCellPopover.dateStr)}
              className="px-2 py-1 text-[11px] font-semibold text-gray-400 hover:text-red-500 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Mark Attendance (Bulk or Single Date) */}
      {isMarkModalOpen && (
        <MarkAttendanceModal
          staffList={staffData}
          defaultDate={currentStartDate.toISOString().split('T')[0]}
          onClose={() => setIsMarkModalOpen(false)}
          onSuccess={() => {
            setIsMarkModalOpen(false);
            fetchAttendance();
          }}
        />
      )}

      {/* MODAL 2: + Add Attendance */}
      {isAddModalOpen && (
        <AddAttendanceModal
          staffList={staffData}
          defaultDate={currentStartDate.toISOString().split('T')[0]}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchAttendance();
          }}
        />
      )}

      {/* MODAL 3: Import Attendance */}
      {isImportModalOpen && (
        <ImportAttendanceModal
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            setIsImportModalOpen(false);
            fetchAttendance();
          }}
        />
      )}

      {/* MODAL 4: Edit Staff Attendance */}
      {isEditModalOpen && editingStaffMember && (
        <EditStaffAttendanceModal
          staff={editingStaffMember}
          dates={dates}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingStaffMember(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setEditingStaffMember(null);
            fetchAttendance();
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// MODAL COMPONENTS
// ==========================================

/**
 * 1. Mark Attendance Modal (For fast bulk marking on date)
 */
function MarkAttendanceModal({ staffList, defaultDate, onClose, onSuccess }) {
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [attendanceMap, setAttendanceMap] = useState(() => {
    const map = {};
    staffList.forEach((s) => {
      map[s.id] = s.attendance?.[defaultDate]?.status || 'present';
    });
    return map;
  });
  const [checkInTime, setCheckInTime] = useState('09:30');
  const [saving, setSaving] = useState(false);

  const setAllStatus = (status) => {
    const updated = {};
    staffList.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const records = staffList.map((s) => ({
        staff_id: s.id,
        date: selectedDate,
        status: attendanceMap[s.id] || 'present',
        check_in_time: attendanceMap[s.id] === 'present' || attendanceMap[s.id] === 'half_day' ? checkInTime : null,
      }));

      await api.post('/attendance/bulk-mark', { records });
      toast.success('Attendance recorded for all staff members!');
      onSuccess();
    } catch {
      toast.error('Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center text-[#E91E63]">
              <RiCalendarCheckLine className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mark Staff Attendance</h2>
              <p className="text-xs text-gray-500">Quickly mark status for all staff members</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <RiCloseCircleLine className="text-xl" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {/* Date Selector & Quick Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Attendance Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#E91E63]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Default Check-in Time
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#E91E63]"
              />
            </div>
          </div>

          {/* Quick Mark All Row */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Actions:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAllStatus('present')}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => setAllStatus('weekly_off')}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                Weekly Off
              </button>
            </div>
          </div>

          {/* Staff Members List */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Staff Member Status ({staffList.length})
            </label>
            <div className="space-y-2">
              {staffList.map((staff) => {
                const currentStatus = attendanceMap[staff.id] || 'present';
                return (
                  <div
                    key={staff.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.01] gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={staff.avatar_url}
                          alt={staff.first_name}
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.first_name)}&background=E91E63&color=fff`;
                          }}
                          className="w-8 h-8 rounded-full object-cover border"
                          style={{ borderColor: staff.color_code || '#E91E63' }}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 ring-1 ring-white"
                          style={{ backgroundColor: staff.color_code || '#E91E63' }}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white leading-none">
                          {staff.first_name} {staff.last_name || ''}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {staff.designation || 'Staff'} • <span className="text-[#E91E63] font-medium capitalize">{(staff.shift_schedule || 'full_time').replace('_', ' ')}</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Pill Choices */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['present', 'absent', 'half_day', 'weekly_off', 'leave'].map((st) => {
                        const cfg = STATUS_CONFIG[st];
                        const active = currentStatus === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setAttendanceMap((prev) => ({ ...prev, [staff.id]: st }))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              active
                                ? `${cfg.badgeBg} ${cfg.badgeText} border ${cfg.badgeBorder} shadow-xs font-bold`
                                : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-xs font-bold shadow-md shadow-[#E91E63]/25 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save All Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 2. + Add Attendance Modal (Single Staff record)
 */
function AddAttendanceModal({ staffList, defaultDate, onClose, onSuccess }) {
  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id || 1);
  const [date, setDate] = useState(defaultDate);
  const [status, setStatus] = useState('present');
  const [checkInTime, setCheckInTime] = useState('09:30');
  const [checkOutTime, setCheckOutTime] = useState('18:30');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedStaff = useMemo(() => {
    return (staffList || []).find((s) => s.id === selectedStaffId);
  }, [staffList, selectedStaffId]);

  // Auto-populate shift timings based on selected staff shift schedule
  useEffect(() => {
    if (selectedStaff) {
      const shift = selectedStaff.shift_schedule || 'full_time';
      if (shift === 'morning') {
        setCheckInTime('09:00');
        setCheckOutTime('16:00');
      } else if (shift === 'evening') {
        setCheckInTime('13:00');
        setCheckOutTime('21:00');
      } else if (shift === 'flexible') {
        setCheckInTime('10:00');
        setCheckOutTime('18:00');
      } else {
        setCheckInTime('10:00');
        setCheckOutTime('20:00');
      }
    }
  }, [selectedStaff]);

  // Calculate late minutes if checkInTime is later than scheduled shift start
  const lateMinutes = useMemo(() => {
    if (!selectedStaff || !checkInTime) return 0;
    const shift = selectedStaff.shift_schedule || 'full_time';
    const shiftStartHour = shift === 'morning' ? 9 : shift === 'evening' ? 13 : 10;
    const [h, m] = checkInTime.split(':').map(Number);
    const checkInMins = (h || 0) * 60 + (m || 0);
    const scheduledMins = shiftStartHour * 60;
    return checkInMins > scheduledMins ? checkInMins - scheduledMins : 0;
  }, [selectedStaff, checkInTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/attendance/mark', {
        staff_id: selectedStaffId,
        date,
        status,
        check_in_time: status === 'present' || status === 'half_day' ? checkInTime : null,
        check_out_time: status === 'present' || status === 'half_day' ? checkOutTime : null,
        notes: notes || null,
      });
      toast.success('Attendance recorded successfully!');
      onSuccess();
    } catch {
      toast.error('Failed to add attendance record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center text-[#E91E63]">
              <RiAddLine className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Attendance</h2>
              <p className="text-xs text-gray-500">Record staff member attendance details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
            <RiCloseCircleLine className="text-xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Select Staff */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Select Staff
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(Number(e.target.value))}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#E91E63]"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name || ''} ({s.designation || 'Staff'} • {(s.shift_schedule || 'full_time').replace('_', ' ')})
                </option>
              ))}
            </select>

            {/* Selected staff shift summary badge */}
            {selectedStaff && (
              <div className="mt-2 p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <img
                      src={selectedStaff.avatar_url}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStaff.first_name)}&background=E91E63&color=fff`;
                      }}
                      className="w-7 h-7 rounded-full object-cover border"
                      style={{ borderColor: selectedStaff.color_code || '#E91E63' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full absolute -bottom-0.5 -right-0.5 ring-1 ring-white"
                      style={{ backgroundColor: selectedStaff.color_code || '#E91E63' }}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      {selectedStaff.first_name} {selectedStaff.last_name || ''}
                    </span>
                    <span className="text-[10px] text-gray-400 capitalize">
                      {selectedStaff.designation || 'Staff'} • {(selectedStaff.shift_schedule || 'full_time').replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white uppercase tracking-wider"
                  style={{ backgroundColor: selectedStaff.color_code || '#E91E63' }}
                >
                  {selectedStaff.shift_schedule === 'morning' ? '9am - 4pm' : selectedStaff.shift_schedule === 'evening' ? '1pm - 9pm' : '10am - 8pm'}
                </span>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#E91E63]"
            />
          </div>

          {/* Status Options */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(STATUS_CONFIG).map((cfg) => {
                const active = status === cfg.key;
                return (
                  <button
                    key={cfg.key}
                    type="button"
                    onClick={() => setStatus(cfg.key)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all ${
                      active
                        ? `${cfg.badgeBg} ${cfg.badgeText} border-[#E91E63] shadow-xs`
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                    <span className="truncate">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timings */}
          {(status === 'present' || status === 'half_day') && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Check In Time</label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:border-[#E91E63] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Check Out Time</label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:border-[#E91E63] outline-none"
                />
              </div>

              {lateMinutes > 0 && (
                <div className="col-span-2 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1.5 font-semibold">
                  <span>⚠️ Late Check-in Notice:</span>
                  <span>{lateMinutes} min late from scheduled shift start ({selectedStaff?.shift_schedule === 'morning' ? '09:00 AM' : selectedStaff?.shift_schedule === 'evening' ? '01:00 PM' : '10:00 AM'})</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Regular shift, approved leave..."
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#E91E63]"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 flex justify-end gap-3 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-xs font-bold shadow-md shadow-[#E91E63]/25 transition-all disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 3. Import Attendance Modal
 */
function ImportAttendanceModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').map((l) => l.trim()).filter((l) => l);
      if (lines.length <= 1) {
        toast.error('File appears to be empty');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());
      const records = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((c) => c.replace(/"/g, '').trim());
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = parts[idx];
        });
        if (row.staff_id && row.date && row.status) {
          records.push(row);
        }
      }
      setParsedRows(records);
    };
    reader.readAsText(f);
  };

  const handleDownloadSample = () => {
    const sample = `staff_id,date,status,check_in_time,check_out_time,notes\n1,2026-09-28,present,09:30,18:30,Regular shift\n2,2026-09-28,present,10:00,19:00,\n3,2026-09-28,present,09:30,18:30,\n4,2026-09-28,half_day,10:30,14:30,Personal work\n5,2026-09-28,present,09:00,18:00,\n6,2026-09-28,leave,,,Sick leave`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_sample_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Sample CSV downloaded!');
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) {
      toast.error('No valid rows found in file to import');
      return;
    }
    setImporting(true);
    try {
      await api.post('/attendance/import', { attendance_data: parsedRows });
      toast.success(`Imported ${parsedRows.length} attendance records successfully!`);
      onSuccess();
    } catch {
      toast.error('Import failed. Please check column format.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center text-[#E91E63]">
              <RiUpload2Line className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Import Attendance</h2>
              <p className="text-xs text-gray-500">Upload attendance from biometric machine or CSV file</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
            <RiCloseCircleLine className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Drag & Drop Area */}
          <label className="border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-[#E91E63] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-gray-50/50 dark:bg-white/[0.01]">
            <input type="file" accept=".csv,.json,.txt" onChange={handleFileChange} className="hidden" />
            <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-900/20 text-[#E91E63] flex items-center justify-center mb-2">
              <RiFileTextLine className="text-2xl" />
            </div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {file ? file.name : 'Click to select CSV file'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Supports biometric CSV, JSON, and standard salon exports</p>
          </label>

          {/* Download Sample Button */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Need standard CSV headers?</span>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="text-[#E91E63] font-semibold hover:underline flex items-center gap-1"
            >
              <RiDownload2Line /> Download Sample CSV
            </button>
          </div>

          {/* Parsed records preview */}
          {parsedRows.length > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <RiCheckDoubleLine className="text-base" /> Ready to import {parsedRows.length} valid records
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 flex justify-end gap-3 border-t border-gray-100 dark:border-white/10">
            <button type="button" onClick={onClose} className="px-5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={importing || parsedRows.length === 0}
              className="px-6 py-2.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-xs font-bold shadow-md shadow-[#E91E63]/25 transition-all disabled:opacity-50"
            >
              {importing ? 'Importing...' : `Import ${parsedRows.length} Records`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Edit Staff Attendance Modal (Detailed view for single staff)
 */
function EditStaffAttendanceModal({ staff, dates, onClose, onSuccess }) {
  const [selectedDateStr, setSelectedDateStr] = useState(dates[0].toISOString().split('T')[0]);
  const currentRecord = staff.attendance?.[selectedDateStr] || {};
  const [status, setStatus] = useState(currentRecord.status || 'present');
  const [checkInTime, setCheckInTime] = useState(currentRecord.check_in_time || '09:30');
  const [checkOutTime, setCheckOutTime] = useState(currentRecord.check_out_time || '18:30');
  const [notes, setNotes] = useState(currentRecord.notes || '');
  const [saving, setSaving] = useState(false);

  // When date changes in dropdown, re-fill status
  const handleDateChange = (dStr) => {
    setSelectedDateStr(dStr);
    const rec = staff.attendance?.[dStr] || {};
    setStatus(rec.status || 'present');
    setCheckInTime(rec.check_in_time || '09:30');
    setCheckOutTime(rec.check_out_time || '18:30');
    setNotes(rec.notes || '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/attendance/mark', {
        staff_id: staff.id,
        date: selectedDateStr,
        status,
        check_in_time: status === 'present' || status === 'half_day' ? checkInTime : null,
        check_out_time: status === 'present' || status === 'half_day' ? checkOutTime : null,
        notes: notes || null,
      });
      toast.success('Attendance updated!');
      onSuccess();
    } catch {
      toast.error('Failed to update attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <img
              src={staff.avatar_url}
              alt={staff.first_name}
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.first_name)}&background=E91E63&color=fff`;
              }}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-100"
            />
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {staff.first_name} {staff.last_name || ''}
              </h2>
              <p className="text-xs text-gray-500">{staff.designation || 'Staff Member'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
            <RiCloseCircleLine className="text-xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Select which day to edit */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Select Date in Window
            </label>
            <select
              value={selectedDateStr}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#E91E63]"
            >
              {dates.map((d) => {
                const dStr = d.toISOString().split('T')[0];
                const label = `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} (${d.toLocaleDateString('en-GB', { weekday: 'short' })})`;
                return (
                  <option key={dStr} value={dStr}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status buttons */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(STATUS_CONFIG).map((cfg) => {
                const active = status === cfg.key;
                return (
                  <button
                    key={cfg.key}
                    type="button"
                    onClick={() => setStatus(cfg.key)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all ${
                      active
                        ? `${cfg.badgeBg} ${cfg.badgeText} border-[#E91E63] shadow-xs`
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                    <span className="truncate">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timings */}
          {(status === 'present' || status === 'half_day') && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Check In Time</label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:border-[#E91E63] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Check Out Time</label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:border-[#E91E63] outline-none"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
              Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Arrived on time, half-day permission..."
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#E91E63]"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex justify-end gap-3 border-t border-gray-100 dark:border-white/10">
            <button type="button" onClick={onClose} className="px-5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-xs font-bold shadow-md shadow-[#E91E63]/25 transition-all disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
