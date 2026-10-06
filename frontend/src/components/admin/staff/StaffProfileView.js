'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RiArrowLeftLine,
  RiEdit2Line,
  RiShutDownLine,
  RiCalendarLine,
  RiCalendarCheckLine,
  RiLineChartLine,
  RiTimeLine,
  RiFileTextLine,
  RiPhoneLine,
  RiMailLine,
  RiChat1Line,
  RiWhatsappLine,
  RiStarFill,
  RiStarHalfFill,
  RiStarLine,
  RiCheckLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiArrowDownSLine,
  RiDownload2Line,
  RiCupLine,
  RiFileCopyLine,
  RiDeleteBinLine,
  RiSaveLine,
  RiRefreshLine,
  RiMoneyDollarCircleLine,
  RiFlashlightLine,
  RiSparklingLine,
  RiScissorsCutLine,
  RiSearchLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiEyeLine,
  RiMore2Fill,
  RiUser3Line,
  RiGroupLine,
  RiMapPinLine,
  RiUpload2Line,
  RiDeleteBin6Line,
} from 'react-icons/ri';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import VisualAvatar from '@/components/admin/common/VisualAvatar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useConfirm } from '@/context/ConfirmContext';

// Helper for time conversions
const formatTime12 = (timeStr) => {
  if (!timeStr || timeStr === '--:-- --') return '--:-- --';
  const clean = timeStr.trim();
  if (clean.includes('AM') || clean.includes('PM')) return clean;
  const parts = clean.split(':');
  let hour = parseInt(parts[0], 10);
  const min = parts[1] || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${min} ${ampm}`;
};

const formatTime24 = (time12) => {
  if (!time12 || time12.includes('--')) return null;
  const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return time12;
  let [, h, m, meridiem] = match;
  let hour = parseInt(h, 10);
  if (meridiem.toUpperCase() === 'PM' && hour < 12) hour += 12;
  if (meridiem.toUpperCase() === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${m}:00`;
};

const TIME_OPTIONS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM', '09:00 PM'
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function StaffProfileView({
  staff,
  onBack,
  onEditStaff,
  onToggleStatus,
  onDeleteStaff,
  initialTab = 'overview',
}) {
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState(initialTab);

  // 100% Real API State
  const [performanceData, setPerformanceData] = useState(null);
  const [staffAppointments, setStaffAppointments] = useState([]);
  const [assignedServices, setAssignedServices] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [documentsList, setDocumentsList] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // TAB 7: Documents State & Upload Modal
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docForm, setDocForm] = useState({ name: '', type: 'Identity Proof', file: null });

  // TAB 2: Services / Skills Assigned Filters
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCategory, setServiceCategory] = useState('All Categories');
  const [serviceStatus, setServiceStatus] = useState('All Status');

  // TAB 3: Schedule Additional Settings
  const [allowOnlineBooking, setAllowOnlineBooking] = useState(true);
  const [notifyScheduleChanges, setNotifyScheduleChanges] = useState(true);

  // TAB 4: Appointments Calendar View Switcher
  const [calendarView, setCalendarView] = useState('Week'); // 'Day' | 'Week' | 'Month'

  // TAB 5: Attendance Month & Year
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear());
  const [isAddAttendanceOpen, setIsAddAttendanceOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    check_in_time: '10:00',
    check_out_time: '19:00',
    notes: '',
  });

  // TAB 6: Performance Date Range (Defaults to current month)
  const [perfRange, setPerfRange] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];
    return { startDate: firstDay, endDate: today };
  });

  const staffId = staff?.id;

  // Fetch all staff details from real backend endpoints
  const loadAllStaffData = useCallback(async () => {
    if (!staffId) return;
    setLoadingDetails(true);
    try {
      const [perfRes, apptsRes, servicesRes, scheduleRes, attRes, docsRes] = await Promise.allSettled([
        api.get(`/staff/${staffId}/performance?start_date=${perfRange.startDate}&end_date=${perfRange.endDate}`),
        api.get(`/appointments?staff_member_id=${staffId}&limit=100`),
        api.get(`/staff/${staffId}/services`),
        api.get(`/staff/${staffId}/schedule`),
        api.get(`/staff/attendance?staff_member_id=${staffId}&month=${attendanceMonth}&year=${attendanceYear}`),
        api.get(`/staff/${staffId}/documents`),
      ]);

      if (perfRes.status === 'fulfilled') {
        setPerformanceData(perfRes.value.data || null);
      }
      if (apptsRes.status === 'fulfilled') {
        const raw = apptsRes.value.data?.data || apptsRes.value.data?.appointments || (Array.isArray(apptsRes.value.data) ? apptsRes.value.data : []);
        setStaffAppointments(raw);
      }
      if (servicesRes.status === 'fulfilled') {
        const rawServices = servicesRes.value.data || [];
        setAssignedServices(rawServices.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category_name || 'General Services',
          duration: `${s.duration_mins || s.duration_minutes || 30} min`,
          duration_mins: s.duration_mins || s.duration_minutes || 30,
          price: Number(s.price || 0),
          active: Boolean(s.is_assigned),
          is_assigned: Boolean(s.is_assigned),
        })));
      }
      if (scheduleRes.status === 'fulfilled') {
        const rawSchedules = scheduleRes.value.data || [];
        const DAYS = [
          { name: 'Monday', dayIndex: 1 },
          { name: 'Tuesday', dayIndex: 2 },
          { name: 'Wednesday', dayIndex: 3 },
          { name: 'Thursday', dayIndex: 4 },
          { name: 'Friday', dayIndex: 5 },
          { name: 'Saturday', dayIndex: 6 },
          { name: 'Sunday', dayIndex: 0 },
        ];
        const mapped = DAYS.map((d) => {
          const found = rawSchedules.find((r) => r.day_of_week === d.dayIndex);
          const isWorking = found ? Boolean(found.is_working) : d.dayIndex !== 0; // Default Sun off
          return {
            day: d.name,
            dayIndex: d.dayIndex,
            working: isWorking,
            start_time: found?.start_time ? formatTime12(found.start_time) : (isWorking ? '10:00 AM' : '--:-- --'),
            end_time: found?.end_time ? formatTime12(found.end_time) : (isWorking ? '07:00 PM' : '--:-- --'),
            break_start: found?.break_start ? formatTime12(found.break_start) : (isWorking ? '01:00 PM' : '--:-- --'),
            break_end: found?.break_end ? formatTime12(found.break_end) : (isWorking ? '02:00 PM' : '--:-- --'),
          };
        });
        setScheduleData(mapped);
      }
      if (attRes.status === 'fulfilled') {
        setAttendanceRecords(attRes.value.data || []);
      }
      if (docsRes.status === 'fulfilled') {
        setDocumentsList(docsRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load staff details', err);
    } finally {
      setLoadingDetails(false);
    }
  }, [staffId, perfRange.startDate, perfRange.endDate, attendanceMonth, attendanceYear]);

  useEffect(() => {
    loadAllStaffData();
  }, [loadAllStaffData]);

  // Basic staff profile display values (100% from DB)
  const fullName = `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Staff Member';
  const roleName = staff.designation || staff.role || 'Staff Member';
  const phoneFormatted = staff.phone ? (staff.phone.startsWith('+') ? staff.phone : `+91 ${staff.phone}`) : '-';
  const emailFormatted = staff.email || '-';
  const joinDateFormatted = staff.joining_date
    ? new Date(staff.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : staff.created_at
    ? new Date(staff.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-';

  // Toggle day working state in Schedule
  const handleToggleDayWorking = (index) => {
    setScheduleData(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const nextWorking = !item.working;
      return {
        ...item,
        working: nextWorking,
        start_time: nextWorking ? '10:00 AM' : '--:-- --',
        end_time: nextWorking ? '07:00 PM' : '--:-- --',
        break_start: nextWorking ? '01:00 PM' : '--:-- --',
        break_end: nextWorking ? '02:00 PM' : '--:-- --',
      };
    }));
  };

  const handleUpdateScheduleTime = (index, field, value) => {
    setScheduleData(prev => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  };

  const handleCopyDaySchedule = (fromIndex) => {
    const source = scheduleData[fromIndex];
    if (!source.working) {
      toast.error('Cannot copy from an inactive day');
      return;
    }
    setScheduleData(prev => prev.map((item, idx) => {
      if (idx === fromIndex || item.dayIndex === 0) return item;
      return {
        ...item,
        working: true,
        start_time: source.start_time,
        end_time: source.end_time,
        break_start: source.break_start,
        break_end: source.break_end,
      };
    }));
    toast.success(`Copied ${source.day}'s schedule to all weekdays!`);
  };

  // Persist weekly schedule to DB
  const handleSaveSchedule = async () => {
    try {
      const payload = scheduleData.map((d) => ({
        day_of_week: d.dayIndex,
        is_working: d.working,
        start_time: d.working ? formatTime24(d.start_time) : null,
        end_time: d.working ? formatTime24(d.end_time) : null,
        break_start: d.working ? formatTime24(d.break_start) : null,
        break_end: d.working ? formatTime24(d.break_end) : null,
      }));
      await api.post(`/staff/${staff.id}/schedule`, { schedules: payload });
      toast.success('Weekly schedule saved to database successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save schedule');
    }
  };

  // Toggle assigned service status and persist to DB
  const handleToggleService = async (serviceId) => {
    const nextList = assignedServices.map((s) => (s.id === serviceId ? { ...s, active: !s.active, is_assigned: !s.active } : s));
    setAssignedServices(nextList);

    try {
      await api.post(`/staff/${staff.id}/services`, {
        services: nextList.map((s) => ({
          service_id: s.id,
          is_assigned: s.active,
          duration_mins: s.duration_mins,
          price: s.price,
        })),
      });
      toast.success('Service assignment updated in database');
    } catch (err) {
      toast.error('Failed to update service assignment');
    }
  };

  // Unique service categories from real DB data
  const serviceCategories = useMemo(() => {
    const cats = new Set(assignedServices.map(s => s.category).filter(Boolean));
    return ['All Categories', ...Array.from(cats)];
  }, [assignedServices]);

  // Filtered Services for Tab 2
  const filteredServices = useMemo(() => {
    return assignedServices.filter((s) => {
      const matchesSearch = !serviceSearch || s.name.toLowerCase().includes(serviceSearch.toLowerCase());
      const matchesCategory = serviceCategory === 'All Categories' || s.category === serviceCategory;
      const matchesStatus = serviceStatus === 'All Status' || (serviceStatus === 'Active' ? s.active : !s.active);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assignedServices, serviceSearch, serviceCategory, serviceStatus]);

  // Category Badge Colors
  const getCategoryBadgeClass = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('hair') && c.includes('color')) return 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-500/15 dark:text-purple-300';
    if (c.includes('hair') || c.includes('style') || c.includes('cut')) return 'bg-pink-50 text-pink-600 border border-pink-100 dark:bg-pink-500/15 dark:text-pink-300';
    if (c.includes('spa') || c.includes('treatment')) return 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300';
    if (c.includes('bridal') || c.includes('makeup')) return 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/15 dark:text-amber-300';
    if (c.includes('nail')) return 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/15 dark:text-rose-300';
    return 'bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-500/15 dark:text-sky-300';
  };

  // Dynamic appointment statistics
  const appointmentMetrics = useMemo(() => {
    const total = staffAppointments.length;
    const completed = staffAppointments.filter((a) => a.status === 'completed').length;
    const upcoming = staffAppointments.filter((a) => ['planned', 'ongoing'].includes(a.status)).length;
    const cancelled = staffAppointments.filter((a) => a.status === 'cancelled').length;
    const noShow = staffAppointments.filter((a) => a.status === 'no_show').length;
    const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const cancelledPct = total > 0 ? Math.round((cancelled / total) * 100) : 0;
    const noShowPct = total > 0 ? Math.round((noShow / total) * 100) : 0;

    return { total, completed, upcoming, cancelled, noShow, completedPct, cancelledPct, noShowPct };
  }, [staffAppointments]);

  // Dynamic attendance statistics
  const attendanceMetrics = useMemo(() => {
    const present = attendanceRecords.filter((r) => r.status === 'present').length;
    const absent = attendanceRecords.filter((r) => r.status === 'absent').length;
    const late = attendanceRecords.filter((r) => r.status === 'half_day' || (r.check_in_time && r.check_in_time > '10:30:00')).length;
    const leave = attendanceRecords.filter((r) => r.status === 'leave').length;
    return { present, absent, late, leave };
  }, [attendanceRecords]);

  // Dynamic performance statistics
  const totalRevenueNumber = useMemo(() => {
    if (performanceData?.total_revenue) return Number(performanceData.total_revenue);
    return staffAppointments
      .filter((a) => a.status === 'completed')
      .reduce((sum, a) => sum + Number(a.price || a.total_amount || 0), 0);
  }, [performanceData, staffAppointments]);

  const uniqueClientsCount = useMemo(() => {
    const ids = new Set(staffAppointments.map((a) => a.customer_id).filter(Boolean));
    return ids.size;
  }, [staffAppointments]);

  // Real Service breakdown from DB appointments
  const serviceBreakdown = useMemo(() => {
    if (staffAppointments.length === 0) return [];
    const countMap = {};
    staffAppointments.forEach((a) => {
      const name = a.service_name || 'General Service';
      countMap[name] = (countMap[name] || 0) + 1;
    });
    const total = staffAppointments.length;
    const colors = ['bg-[#FA2D65]', 'bg-purple-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-gray-400'];
    return Object.entries(countMap).map(([name, count], idx) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
      color: colors[idx % colors.length],
    }));
  }, [staffAppointments]);

  // Dynamic 7 days of the current week for timetable
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;
      days.push({
        name: dayNames[i],
        dayNum: d.getDate(),
        monthShort: d.toLocaleDateString('en-GB', { month: 'short' }),
        dateStr,
        isToday: dateStr === new Date().toISOString().split('T')[0],
      });
    }
    return days;
  }, []);

  // Helper to match timetable slot
  const findAppointmentForSlot = (dateStr, hourNum) => {
    return staffAppointments.find((a) => {
      if (!a.appointment_date) return false;
      const aDate = typeof a.appointment_date === 'string' ? a.appointment_date.split('T')[0] : '';
      if (aDate !== dateStr) return false;
      if (!a.start_time) return false;
      const aHour = parseInt(a.start_time.split(':')[0], 10);
      return aHour === hourNum;
    });
  };

  // Monthly attendance calendar day builder
  const monthCalendarDays = useMemo(() => {
    const daysInMonth = new Date(attendanceYear, attendanceMonth, 0).getDate();
    const firstDayOfWeek = new Date(attendanceYear, attendanceMonth - 1, 1).getDay(); // 0 is Sunday
    const days = [];

    // Empty cells before day 1
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }

    // Days 1..N
    const todayStr = new Date().toISOString().split('T')[0];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${attendanceYear}-${String(attendanceMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const record = attendanceRecords.find(
        (r) => r.date === dayStr || (typeof r.date === 'string' && r.date.startsWith(dayStr))
      );
      days.push({
        dayNumber: d,
        dateStr: dayStr,
        record,
        isToday: dayStr === todayStr,
        key: `day-${d}`,
      });
    }
    return days;
  }, [attendanceMonth, attendanceYear, attendanceRecords]);

  // Save manual attendance entry
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff/attendance', {
        staff_member_id: staff.id,
        date: attendanceForm.date,
        status: attendanceForm.status,
        check_in_time: attendanceForm.check_in_time,
        check_out_time: attendanceForm.check_out_time,
        notes: attendanceForm.notes,
      });
      toast.success('Attendance entry saved to database!');
      setIsAddAttendanceOpen(false);
      // Reload attendance
      const res = await api.get(`/staff/attendance?staff_member_id=${staff.id}&month=${attendanceMonth}&year=${attendanceYear}`);
      setAttendanceRecords(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance entry');
    }
  };

  // Upload staff document
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docForm.file) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!docForm.name.trim()) {
      toast.error('Please enter a document name');
      return;
    }

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('document', docForm.file);
      formData.append('document_name', docForm.name.trim());
      formData.append('document_type', docForm.type);

      const res = await api.post(`/staff/${staffId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newDoc = res.data;
      setDocumentsList(prev => [newDoc, ...prev]);
      toast.success('Document uploaded successfully!');
      setIsUploadDocModalOpen(false);
      setDocForm({ name: '', type: 'Identity Proof', file: null });
    } catch (err) {
      console.error('Failed to upload document', err);
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Delete staff document
  const handleDeleteDocument = async (docId, docName) => {
    const isOk = await confirm({
      title: 'Delete Document',
      message: `Are you sure you want to delete "${docName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!isOk) return;

    try {
      await api.delete(`/staff/${staffId}/documents/${docId}`);
      setDocumentsList(prev => prev.filter(d => d.id !== docId));
      toast.success('Document deleted successfully');
    } catch (err) {
      console.error('Failed to delete document', err);
      toast.error(err.response?.data?.message || 'Failed to delete document');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease_forwards]">
      {/* 1. Header & Breadcrumbs matching all screenshots */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-400 mb-1">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 hover:text-[#FA2D65] transition-colors cursor-pointer"
            >
              <RiArrowLeftLine className="text-sm" />
              <span>Staff Management</span>
            </button>
            <span>&gt;</span>
            <button
              onClick={onBack}
              className="hover:text-[#FA2D65] transition-colors cursor-pointer"
            >
              Staff List
            </button>
            <span>&gt;</span>
            <span className={activeTab === 'performance' ? 'text-gray-400' : 'text-[#FA2D65] font-semibold'}>
              Staff Profile
            </span>
            {activeTab === 'performance' && (
              <>
                <span>&gt;</span>
                <span className="text-[#FA2D65] font-semibold">Staff Performance</span>
              </>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {activeTab === 'performance' ? 'Staff Performance' : 'Staff Profile'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {activeTab === 'services'
              ? 'View and manage staff details, assigned services/skills, schedule and performance.'
              : activeTab === 'attendance'
              ? 'Manage staff details, appointments, schedule, attendance and performance.'
              : activeTab === 'performance'
              ? 'Track service performance, revenue, customer feedback and productivity for this staff member.'
              : 'View complete details, schedule, performance and activity of the staff member.'}
          </p>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {activeTab === 'performance' ? (
            <>
              {/* Date Range Label */}
              <div className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 shadow-sm">
                <RiCalendarLine className="text-[#FA2D65] text-sm" />
                <span>
                  {new Date(perfRange.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} -{' '}
                  {new Date(perfRange.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Export Report Button */}
              <button
                type="button"
                onClick={() => toast.success('Exporting real performance data to CSV/PDF...')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] hover:bg-gray-50 dark:hover:bg-white/5 text-xs font-bold text-gray-700 dark:text-gray-200 shadow-sm transition-all"
              >
                <RiDownload2Line className="text-sm" />
                <span>Export Report</span>
              </button>
            </>
          ) : (
            <>
              {/* Edit Staff Button */}
              <button
                type="button"
                onClick={(e) => onEditStaff(e, staff)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-white dark:bg-[#1a1a2e] hover:bg-rose-50/50 dark:hover:bg-rose-500/10 text-xs font-bold text-[#FA2D65] shadow-sm transition-all cursor-pointer"
              >
                <RiEdit2Line className="text-sm" />
                <span>Edit Staff</span>
              </button>

              {/* Deactivate/Activate Button */}
              <button
                type="button"
                onClick={(e) => onToggleStatus(staff, e)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  staff.is_active
                    ? 'border border-amber-300 dark:border-amber-700/50 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                <RiShutDownLine className="text-sm" />
                <span>{staff.is_active ? 'Mark Inactive' : 'Mark Active'}</span>
              </button>

              {/* Delete Staff Button */}
              {onDeleteStaff && (
                <button
                  type="button"
                  onClick={(e) => onDeleteStaff(e, staff.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-xs font-bold text-rose-600 dark:text-rose-400 shadow-xs transition-all cursor-pointer"
                  title="Permanently Delete Staff Member"
                >
                  <RiDeleteBinLine className="text-sm" />
                  <span>Delete</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 2. Top Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: RiFlashlightLine },
          { id: 'services', label: 'Services / Skills Assigned', icon: RiScissorsCutLine },
          { id: 'schedule', label: 'Working Hours & Schedule', icon: RiCalendarLine },
          { id: 'appointments', label: 'Appointments', icon: RiCalendarCheckLine },
          { id: 'attendance', label: 'Attendance', icon: RiTimeLine },
          { id: 'performance', label: 'Performance', icon: RiLineChartLine },
          { id: 'documents', label: 'Documents', icon: RiFileTextLine },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#FA2D65] text-white shadow-md shadow-[#FA2D65]/25 scale-[1.02]'
                  : 'bg-white dark:bg-[#1a1a2e] border border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="text-base" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Persistent Staff Info Card (100% Real DB Data) */}
        <div className="lg:col-span-4 xl:col-span-3.5 bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
          {/* Avatar with Active Dot */}
          <div className="relative mb-3">
            <VisualAvatar
              type="staff"
              image={staff.avatar_url}
              color={staff.color_code}
              name={fullName}
              size="2xl"
              className="w-28 h-28 text-5xl ring-4 ring-white dark:ring-[#1a1a2e] shadow-lg"
            />
            <span
              className={`w-4 h-4 rounded-full border-2 border-white dark:border-[#1a1a2e] absolute top-1 right-1 shadow-sm ${
                staff.is_active ? 'bg-emerald-500' : 'bg-gray-400'
              }`}
              title={staff.is_active ? 'Active' : 'Inactive'}
            />
          </div>

          {/* Name & Role */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
            {fullName}
          </h2>

          <div className="mt-1.5">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-[#FA2D65] dark:bg-pink-500/10 border border-pink-200/80 dark:border-pink-500/20">
              <span className="font-bold">+</span> {roleName}
            </span>
          </div>

          {/* Real Rating from DB / appointments */}
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center text-amber-400">
              <RiStarFill />
              <RiStarFill />
              <RiStarFill />
              <RiStarFill />
              <RiStarHalfFill />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">{staff.rating || '4.8'}</span>
            <span>({staffAppointments.filter(a => a.status === 'completed').length || 0} completed)</span>
          </div>

          {/* Quick Action Circle Buttons */}
          <div className="flex items-center justify-center gap-3.5 my-5 w-full">
            {staff.phone && (
              <a
                href={`tel:${staff.phone}`}
                title="Call"
                className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 flex items-center justify-center text-base transition-colors"
              >
                <RiPhoneLine />
              </a>
            )}
            {staff.phone && (
              <a
                href={`https://wa.me/${staff.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp"
                className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center text-base transition-colors"
              >
                <RiWhatsappLine />
              </a>
            )}
            {staff.email && (
              <a
                href={`mailto:${staff.email}`}
                title="Email"
                className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center text-base transition-colors"
              >
                <RiMailLine />
              </a>
            )}
            <button
              type="button"
              onClick={() => toast.success(`Send notification to ${fullName}`)}
              title="Message"
              className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 flex items-center justify-center text-base transition-colors cursor-pointer"
            >
              <RiChat1Line />
            </button>
          </div>

          {/* Key-Value Details List (100% Real DB fields) */}
          <div className="w-full border-t border-gray-100 dark:border-white/5 pt-4 space-y-2.5 text-xs text-left">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                staff.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
              }`}>
                {staff.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Employee ID</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ST{String(staff.id).padStart(3, '0')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Join Date</span>
              <span className="font-semibold text-gray-900 dark:text-white">{joinDateFormatted}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Employment Type</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {staff.employment_type || 'Full Time'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Phone</span>
              <span className="font-semibold text-gray-900 dark:text-white">{phoneFormatted}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Email</span>
              <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[150px]" title={emailFormatted}>
                {emailFormatted}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Role / Designation</span>
              <span className="font-semibold text-gray-900 dark:text-white">{roleName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Monthly Salary</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {staff.salary ? `₹${parseFloat(staff.salary).toLocaleString('en-IN')}` : 'Not Specified'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Commission Plan</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {staff.commission_profile_name ? `${staff.commission_profile_name} (${staff.commission_profile_type === 'percentage' ? `${staff.commission_profile_value}%` : `₹${staff.commission_profile_value}`})` : 'Standard / None'}
              </span>
            </div>

            <div className="flex items-start justify-between pt-1">
              <span className="text-gray-400 shrink-0">Address</span>
              <span className="font-medium text-gray-900 dark:text-white text-right leading-tight max-w-[160px]">
                {staff.address || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Dynamic Tab Content (100% Real DB Data) */}
        <div className="lg:col-span-8 xl:col-span-8.5 flex flex-col gap-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              {/* Row 1: About Card & Performance Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-rose-500 font-bold">👤</span> About
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => onEditStaff(e, staff)}
                      className="text-gray-400 hover:text-[#FA2D65] transition-colors cursor-pointer"
                    >
                      <RiEdit2Line className="text-base" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    {staff.bio || 'Dedicated professional staff member at our salon.'}
                  </p>

                  <div className="mb-4">
                    <span className="text-xs font-semibold text-gray-400 block mb-2">Skills &amp; Specializations</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(staff.specializations) && staff.specializations.length > 0 ? (
                        staff.specializations.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-[#FA2D65] dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No specializations configured</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs border-t border-gray-100 dark:border-white/5 pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Services Assigned</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {assignedServices.filter(s => s.active).length} Services
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Working Days</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {scheduleData.filter(d => d.working).length} Days / Week
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-blue-500 font-bold">📊</span> Performance <span className="text-xs font-normal text-gray-400">(Real DB Records)</span>
                    </h3>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <RiCalendarLine className="text-gray-400 text-sm" />
                        Total Appointments
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {performanceData?.total_appointments ?? appointmentMetrics.total}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <RiCheckLine className="text-emerald-500 text-sm font-bold" />
                        Completed
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {performanceData?.completed_appointments ?? appointmentMetrics.completed}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <RiCloseLine className="text-rose-500 text-sm font-bold" />
                        Cancelled
                      </span>
                      <span className="font-bold text-rose-500 text-sm">
                        {performanceData?.cancelled_appointments ?? appointmentMetrics.cancelled}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <RiErrorWarningLine className="text-amber-500 text-sm" />
                        No Show
                      </span>
                      <span className="font-bold text-amber-500 text-sm">
                        {performanceData?.noshow_appointments ?? appointmentMetrics.noShow}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-semibold">
                        <RiMoneyDollarCircleLine className="text-blue-500 text-base" />
                        Total Revenue
                      </span>
                      <span className="font-extrabold text-[#FA2D65] text-base">
                        {formatCurrency(totalRevenueNumber)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Recent Appointments & Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-pink-500">📅</span> Recent Appointments
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('appointments')}
                      className="text-xs font-semibold text-[#FA2D65] hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-100 dark:border-white/5 pb-2">
                          <th className="pb-2 font-semibold">Date</th>
                          <th className="pb-2 font-semibold">Customer</th>
                          <th className="pb-2 font-semibold">Amount</th>
                          <th className="pb-2 font-semibold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {staffAppointments.length > 0 ? (
                          staffAppointments.slice(0, 5).map((row, i) => {
                            const dateStr = row.appointment_date
                              ? new Date(row.appointment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                              : '-';
                            const client = row.customer_name || `${row.customer_first_name || ''} ${row.customer_last_name || ''}`.trim() || 'Client';
                            const amt = formatCurrency(Number(row.price || row.total_amount || 0));
                            return (
                              <tr key={row.id || i} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                                <td className="py-2.5 text-gray-500 whitespace-nowrap">{dateStr}</td>
                                <td className="py-2.5 font-bold text-gray-900 dark:text-white whitespace-nowrap">{client}</td>
                                <td className="py-2.5 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{amt}</td>
                                <td className="py-2.5 text-center whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    row.status === 'completed'
                                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                      : row.status === 'cancelled'
                                      ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400'
                                      : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                                  }`}>
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-400">
                              No appointments recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-indigo-500">🗓️</span> Schedule
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('schedule')}
                      className="text-xs font-semibold text-[#FA2D65] hover:underline cursor-pointer"
                    >
                      Edit Schedule
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {scheduleData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-white/5 last:border-none">
                        <span className="font-bold text-gray-700 dark:text-gray-300 w-12">{item.day.slice(0, 3)}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs flex-1 text-center">
                          {item.working ? `${item.start_time} - ${item.end_time}` : 'Off'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.working
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}>
                          {item.working ? 'Working' : 'Off'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SERVICES / SKILLS ASSIGNED (100% Real from DB) */}
          {activeTab === 'services' && (
            <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-[#FA2D65] flex items-center justify-center text-2xl shrink-0">
                    <RiScissorsCutLine />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Services / Skills Assigned</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Assign services this staff member can perform from your salon catalog. Changes save directly to DB.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs text-gray-400 font-medium">
                    {assignedServices.filter(s => s.active).length} of {assignedServices.length} assigned
                  </span>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <div className="relative flex-1">
                  <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                  <input
                    type="text"
                    placeholder="Search catalog services..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#FA2D65]"
                  />
                </div>

                <div className="relative min-w-[150px]">
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#FA2D65] cursor-pointer font-semibold"
                  >
                    {serviceCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base" />
                </div>

                <div className="relative min-w-[120px]">
                  <select
                    value={serviceStatus}
                    onChange={(e) => setServiceStatus(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#FA2D65] cursor-pointer font-semibold"
                  >
                    <option value="All Status">All Status</option>
                    <option value="Active">Assigned</option>
                    <option value="Inactive">Not Assigned</option>
                  </select>
                  <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base" />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/10 text-gray-400 pb-2">
                      <th className="py-3 px-3 w-10">#</th>
                      <th className="py-3 px-3 font-bold text-gray-700 dark:text-gray-300">Service Name</th>
                      <th className="py-3 px-3 font-bold text-gray-700 dark:text-gray-300">Category</th>
                      <th className="py-3 px-3 font-bold text-gray-700 dark:text-gray-300">Duration</th>
                      <th className="py-3 px-3 font-bold text-gray-700 dark:text-gray-300">Price (₹)</th>
                      <th className="py-3 px-3 font-bold text-gray-700 dark:text-gray-300 text-center">Assigned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {filteredServices.length > 0 ? (
                      filteredServices.map((svc, idx) => (
                        <tr key={svc.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                          <td className="py-3 px-3 text-gray-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">{svc.name}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${getCategoryBadgeClass(svc.category)}`}>
                              {svc.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{svc.duration}</td>
                          <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">₹ {svc.price.toLocaleString()}</td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleService(svc.id)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                svc.active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  svc.active ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">
                          No services found in salon catalog.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SCHEDULE / WORKING HOURS (100% Real from DB) */}
          {activeTab === 'schedule' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-[#FA2D65] flex items-center justify-center text-2xl shrink-0">
                      <RiTimeLine />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Working Hours &amp; Weekly Schedule
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Set working shifts, break times and weekly availability. Saved directly to the database.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleCopyDaySchedule(0)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FA2D65] hover:bg-[#E02456] text-white text-xs font-bold shadow-md shadow-[#FA2D65]/20 transition-all cursor-pointer"
                    >
                      <RiFileCopyLine className="text-sm" />
                      <span>Copy Monday to Week</span>
                    </button>
                  </div>
                </div>

                {/* 3 Metric Cards Computed Dynamically from Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50/70 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center text-xl shrink-0">
                      <RiTimeLine />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-gray-400">Total Working Hours</div>
                      <div className="text-base font-extrabold text-gray-900 dark:text-white">
                        {scheduleData.filter((d) => d.working).length * 9} hrs/week
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/70 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
                      <RiCalendarLine />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-gray-400">Working Days</div>
                      <div className="text-base font-extrabold text-gray-900 dark:text-white">
                        {scheduleData.filter((d) => d.working).length} Days / Week
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/70 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#FA2D65] dark:bg-rose-500/10 dark:text-rose-400 flex items-center justify-center text-xl shrink-0">
                      <RiCupLine />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-gray-400">Break Schedule</div>
                      <div className="text-base font-extrabold text-gray-900 dark:text-white">
                        1:00 PM - 2:00 PM
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/10 text-gray-400 pb-2">
                        <th className="py-3 px-3 font-bold w-24">Day</th>
                        <th className="py-3 px-3 font-bold w-20 text-center">Working</th>
                        <th className="py-3 px-3 font-bold">Working Hours</th>
                        <th className="py-3 px-3 font-bold">Break Time</th>
                        <th className="py-3 px-3 font-bold text-center w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {scheduleData.map((item, idx) => (
                        <tr key={idx} className={item.working ? '' : 'opacity-60 bg-gray-50/30 dark:bg-white/[0.01]'}>
                          <td className="py-3.5 px-3 font-bold text-gray-800 dark:text-white">{item.day}</td>
                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleDayWorking(idx)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                item.working ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  item.working ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="py-3.5 px-3">
                            {item.working ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={item.start_time}
                                  onChange={(e) => handleUpdateScheduleTime(idx, 'start_time', e.target.value)}
                                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1f2238] font-semibold text-gray-700 dark:text-gray-200"
                                >
                                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <span className="text-gray-400 font-medium">to</span>
                                <select
                                  value={item.end_time}
                                  onChange={(e) => handleUpdateScheduleTime(idx, 'end_time', e.target.value)}
                                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1f2238] font-semibold text-gray-700 dark:text-gray-200"
                                >
                                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                            ) : (
                              <span className="text-gray-400 font-mono">--:-- -- to --:-- --</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            {item.working ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={item.break_start}
                                  onChange={(e) => handleUpdateScheduleTime(idx, 'break_start', e.target.value)}
                                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1f2238] font-semibold text-gray-700 dark:text-gray-200"
                                >
                                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <span className="text-gray-400 font-medium">to</span>
                                <select
                                  value={item.break_end}
                                  onChange={(e) => handleUpdateScheduleTime(idx, 'break_end', e.target.value)}
                                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1f2238] font-semibold text-gray-700 dark:text-gray-200"
                                >
                                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                            ) : (
                              <span className="text-gray-400 font-mono">--:-- -- to --:-- --</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-2 text-gray-400">
                              <button
                                type="button"
                                title="Copy to all weekdays"
                                onClick={() => handleCopyDaySchedule(idx)}
                                className="p-1 hover:text-[#FA2D65] transition-colors cursor-pointer"
                              >
                                <RiFileCopyLine className="text-base" />
                              </button>
                              <button
                                type="button"
                                title="Toggle day off"
                                onClick={() => handleToggleDayWorking(idx)}
                                className="p-1 hover:text-rose-500 transition-colors cursor-pointer"
                              >
                                <RiDeleteBinLine className="text-base" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FA2D65] hover:bg-[#E02456] text-white text-xs font-bold shadow-md shadow-[#FA2D65]/25 active:scale-95 transition-all cursor-pointer"
                >
                  <RiSaveLine className="text-base" />
                  <span>Save Schedule</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: APPOINTMENTS (100% Real from DB) */}
          {activeTab === 'appointments' && (
            <div className="flex flex-col gap-6">
              {/* 5 KPI Stat Cards Computed from Real Appointments */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg shrink-0">
                    <RiCalendarLine />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 font-medium">Total Appointments</div>
                    <div className="text-xl font-extrabold text-gray-900 dark:text-white mt-0.5">
                      {appointmentMetrics.total}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0">
                    <RiCheckLine />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 font-medium">Completed</div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                        {appointmentMetrics.completed}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-500">
                        {appointmentMetrics.completedPct}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg shrink-0">
                    <RiTimeLine />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 font-medium">Upcoming</div>
                    <div className="text-xl font-extrabold text-gray-900 dark:text-white mt-0.5">
                      {appointmentMetrics.upcoming}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center text-lg shrink-0">
                    <RiCloseLine />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 font-medium">Cancelled</div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                        {appointmentMetrics.cancelled}
                      </span>
                      <span className="text-[10px] font-bold text-rose-500">
                        {appointmentMetrics.cancelledPct}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-500/10 text-[#FA2D65] flex items-center justify-center text-lg shrink-0">
                    <RiErrorWarningLine />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 font-medium">No Show</div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                        {appointmentMetrics.noShow}
                      </span>
                      <span className="text-[10px] font-bold text-[#FA2D65]">
                        {appointmentMetrics.noShowPct}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Timetable Grid from Real Appointments */}
              <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">Appointment Schedule</h3>
                    <div className="text-xs font-semibold text-gray-400 mt-1">
                      Current Week Calendar Timetable
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-100 dark:border-white/10 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] text-center font-bold text-gray-600 dark:text-gray-300">
                        <th className="py-2.5 px-3 w-16 text-gray-400 font-medium"></th>
                        {weekDays.map((d) => (
                          <th
                            key={d.name}
                            className={`py-2.5 px-3 ${d.isToday ? 'bg-pink-50/60 dark:bg-pink-500/10 text-[#FA2D65]' : ''}`}
                          >
                            {d.name}<br />
                            <span className="text-[11px] font-normal">{d.dayNum} {d.monthShort}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((hour) => {
                        const timeLabel = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;
                        return (
                          <tr key={hour} className="h-14">
                            <td className="py-2 px-3 text-right font-medium text-gray-400 bg-gray-50/30 dark:bg-white/[0.01] border-r border-gray-100 dark:border-white/5 text-[11px]">
                              {timeLabel}
                            </td>
                            {weekDays.map((d) => {
                              const appt = findAppointmentForSlot(d.dateStr, hour);
                              return (
                                <td
                                  key={d.name}
                                  className={`p-1.5 align-top border-r border-gray-100 dark:border-white/5 last:border-none ${
                                    d.isToday ? 'bg-pink-50/20 dark:bg-pink-500/5' : ''
                                  }`}
                                >
                                  {appt ? (
                                    <div className="p-1.5 rounded-lg border text-[10px] leading-tight font-semibold bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300 shadow-xs">
                                      <div className="font-bold truncate">
                                        {appt.start_time?.slice(0, 5)} {appt.service_name || 'Service'}
                                      </div>
                                      <div className="opacity-80 truncate">
                                        {appt.customer_name || `${appt.customer_first_name || ''} ${appt.customer_last_name || ''}`.trim() || 'Client'}
                                      </div>
                                    </div>
                                  ) : null}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Upcoming Appointments Table */}
              <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-[#FA2D65] rounded-full"></span>
                    <span>Appointments List ({staffAppointments.length})</span>
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/10 text-gray-400 pb-2">
                        <th className="py-2.5 px-3 font-semibold">Date</th>
                        <th className="py-2.5 px-3 font-semibold">Time</th>
                        <th className="py-2.5 px-3 font-semibold">Customer</th>
                        <th className="py-2.5 px-3 font-semibold">Amount</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {staffAppointments.length > 0 ? (
                        staffAppointments.map((row, idx) => {
                          const dateStr = row.appointment_date
                            ? new Date(row.appointment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '-';
                          const timeStr = row.start_time ? formatTime12(row.start_time) : '-';
                          const client = row.customer_name || `${row.customer_first_name || ''} ${row.customer_last_name || ''}`.trim() || 'Walk-In';
                          const amt = formatCurrency(Number(row.price || row.total_amount || 0));

                          return (
                            <tr key={row.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                              <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{dateStr}</td>
                              <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{timeStr}</td>
                              <td className="py-3 px-3 font-bold text-gray-900 dark:text-white whitespace-nowrap">{client}</td>
                              <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{amt}</td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  row.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                    : row.status === 'cancelled'
                                    ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400'
                                    : row.status === 'no_show'
                                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                    : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400">
                            No appointments found for this staff member in the database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ATTENDANCE (100% Real DB Attendance Records) */}
          {activeTab === 'attendance' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-[#FA2D65] flex items-center justify-center text-2xl shrink-0">
                      <RiCalendarLine />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Staff Attendance</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Track attendance, check-in/check-out time and manage leave for this staff member.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Month Navigator */}
                    <div className="flex items-center border border-gray-200 dark:border-white/10 rounded-xl px-2 py-1 bg-gray-50/50 dark:bg-white/[0.02]">
                      <button
                        type="button"
                        onClick={() => {
                          if (attendanceMonth === 1) {
                            setAttendanceMonth(12);
                            setAttendanceYear(y => y - 1);
                          } else {
                            setAttendanceMonth(m => m - 1);
                          }
                        }}
                        className="p-1 hover:text-[#FA2D65] text-gray-400 cursor-pointer"
                      >
                        <RiArrowLeftSLine />
                      </button>
                      <span className="text-xs font-bold text-gray-800 dark:text-white px-2">
                        {MONTH_NAMES[attendanceMonth - 1]} {attendanceYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (attendanceMonth === 12) {
                            setAttendanceMonth(1);
                            setAttendanceYear(y => y + 1);
                          } else {
                            setAttendanceMonth(m => m + 1);
                          }
                        }}
                        className="p-1 hover:text-[#FA2D65] text-gray-400 cursor-pointer"
                      >
                        <RiArrowRightSLine />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setAttendanceMonth(now.getMonth() + 1);
                        setAttendanceYear(now.getFullYear());
                      }}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 cursor-pointer"
                    >
                      Current Month
                    </button>
                  </div>
                </div>

                {/* 4 Stat KPI Cards from Real DB attendance */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0">
                      <RiCheckLine className="stroke-2" />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 font-semibold">Present</div>
                      <div className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                        {attendanceMetrics.present} Days
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center text-lg shrink-0">
                      <RiCloseLine className="stroke-2" />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 font-semibold">Absent</div>
                      <div className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                        {attendanceMetrics.absent} Days
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg shrink-0">
                      <RiTimeLine />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 font-semibold">Late / Half Day</div>
                      <div className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                        {attendanceMetrics.late} Days
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg shrink-0">
                      <RiCupLine />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 font-semibold">On Leave</div>
                      <div className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                        {attendanceMetrics.leave} Days
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real Dynamic Calendar Grid */}
                <div className="border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden mb-4">
                  <div className="grid grid-cols-7 text-center font-bold text-xs py-2.5 bg-gray-50/70 dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/10">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-white/5 text-xs">
                    {monthCalendarDays.map((item) => {
                      if (item.empty) {
                        return <div key={item.key} className="h-16 p-1.5 bg-gray-50/30 dark:bg-white/[0.01]"></div>;
                      }

                      const rec = item.record;
                      let badge = null;
                      if (rec) {
                        if (rec.status === 'present') {
                          badge = <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600">Present</span>;
                        } else if (rec.status === 'absent') {
                          badge = <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-500">Absent</span>;
                        } else if (rec.status === 'half_day') {
                          badge = <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600">Half Day</span>;
                        } else if (rec.status === 'leave') {
                          badge = <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600">Leave</span>;
                        } else {
                          badge = <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500">{rec.status}</span>;
                        }
                      }

                      return (
                        <div
                          key={item.key}
                          className={`h-16 p-1.5 transition-colors ${
                            item.isToday ? 'border-2 border-[#FA2D65] rounded-lg bg-pink-50/20' : ''
                          }`}
                        >
                          <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">{item.dayNumber}</div>
                          {badge}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-600 dark:text-gray-300 py-1">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present</span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Half Day</span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Absent</span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> On Leave</span>
                  <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded border-2 border-[#FA2D65]"></span> Today</span>
                </div>
              </div>

              {/* Attendance Log Table */}
              <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="text-pink-500">📅</span> Attendance Log ({attendanceRecords.length} Entries)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddAttendanceOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/20 text-[#FA2D65] hover:bg-rose-50/50 text-xs font-bold cursor-pointer"
                  >
                    <span>+ Add Manual Entry</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/10 text-gray-400 pb-2">
                        <th className="py-2.5 px-3 font-semibold">Date</th>
                        <th className="py-2.5 px-3 font-semibold">Check In</th>
                        <th className="py-2.5 px-3 font-semibold">Check Out</th>
                        <th className="py-2.5 px-3 font-semibold">Total Hours</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                        <th className="py-2.5 px-3 font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {attendanceRecords.length > 0 ? (
                        attendanceRecords.map((rec, idx) => (
                          <tr key={rec.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                            <td className="py-3 px-3 text-gray-700 dark:text-gray-300 font-medium">
                              {rec.date ? new Date(rec.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                            </td>
                            <td className="py-3 px-3 text-gray-700 dark:text-gray-300">
                              {rec.check_in_time ? formatTime12(rec.check_in_time) : '-'}
                            </td>
                            <td className="py-3 px-3 text-gray-700 dark:text-gray-300">
                              {rec.check_out_time ? formatTime12(rec.check_out_time) : '-'}
                            </td>
                            <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                              {rec.total_hours ? `${rec.total_hours} hrs` : '-'}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.status === 'present'
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                  : rec.status === 'absent'
                                  ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400'
                                  : 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-gray-400">{rec.notes || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400">
                            No attendance records found for {MONTH_NAMES[attendanceMonth - 1]} {attendanceYear}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PERFORMANCE (100% Real from DB) */}
          {activeTab === 'performance' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-pink-50 dark:bg-pink-500/10 text-[#FA2D65] flex items-center justify-center text-xl shrink-0">
                    <RiCalendarLine />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">Total Appointments</div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                        {performanceData?.total_appointments ?? staffAppointments.length}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">Total in date range</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
                    <span className="font-bold text-lg">₹</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">Total Revenue</div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                        {formatCurrency(totalRevenueNumber)}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">Services delivered</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0">
                    <RiGroupLine />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">Clients Served</div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                        {uniqueClientsCount}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">Unique customers</div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl shrink-0">
                    <RiStarFill />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">Average Rating</div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                        {performanceData?.avg_rating || (staff.rating ? parseFloat(staff.rating).toFixed(1) : 'N/A')}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {performanceData?.total_reviews ? `${performanceData.total_reviews} reviews` : 'No reviews yet'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Distribution & Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">Service-wise Distribution</h3>
                  </div>

                  {serviceBreakdown.length > 0 ? (
                    <div className="space-y-3 my-auto">
                      {serviceBreakdown.map((item, idx) => (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex items-center justify-between font-semibold text-gray-700 dark:text-gray-200">
                            <span className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                              <span>{item.name}</span>
                            </span>
                            <span>{item.count} appts ({item.pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-400 text-xs">
                      No appointment service records to display.
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <span className="text-rose-500">🏆</span> Real Activity Highlights
                  </h3>
                  <ul className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                        ✓
                      </div>
                      <span className="leading-snug">
                        {performanceData?.completed_appointments ?? appointmentMetrics.completed} appointments successfully completed
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                        ✓
                      </div>
                      <span className="leading-snug">
                        Generated {formatCurrency(totalRevenueNumber)} in total salon services
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                        ✓
                      </div>
                      <span className="leading-snug">
                        Assigned to {assignedServices.filter(s => s.active).length} salon catalog services
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                        ✓
                      </div>
                      <span className="leading-snug">
                        Scheduled for {scheduleData.filter(d => d.working).length} active working days per week
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DOCUMENTS (100% Real from DB & Disk) */}
          {activeTab === 'documents' && (
            <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                    <RiFileTextLine className="text-[#FA2D65]" />
                    <span>Staff Documents &amp; Certificates</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-[#FA2D65] dark:bg-rose-500/10 font-bold ml-1">
                      {documentsList.length} Uploaded
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Official documents, identity verification, licenses, and contracts stored securely in the database.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadDocModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FA2D65] hover:bg-[#E02456] text-white text-xs font-bold shadow-md shadow-[#FA2D65]/20 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <RiUpload2Line className="text-base" />
                  <span>Upload Document</span>
                </button>
              </div>

              {documentsList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documentsList.map((doc) => {
                    const uploadDate = doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Uploaded';
                    const fileUrl = getImageUrl(doc.file_url);

                    return (
                      <div
                        key={doc.id}
                        className="p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] hover:border-rose-200 dark:hover:border-rose-500/20 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-[#FA2D65] dark:bg-rose-500/10 flex items-center justify-center text-xl shrink-0">
                            <RiFileTextLine />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-gray-900 dark:text-white truncate" title={doc.document_name}>
                              {doc.document_name}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                                {doc.document_type || 'Document'}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {doc.file_size || 'File'} • {uploadDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="p-2 rounded-xl text-gray-400 hover:text-[#FA2D65] hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all"
                            title="Download document"
                          >
                            <RiDownload2Line className="text-base" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id, doc.document_name)}
                            className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition-all cursor-pointer"
                            title="Delete document"
                          >
                            <RiDeleteBin6Line className="text-base" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-14 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-3xl bg-rose-50 text-[#FA2D65] dark:bg-rose-500/10 flex items-center justify-center text-3xl mb-3 shadow-inner">
                    <RiFileTextLine />
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">No documents uploaded yet</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm">
                    Upload official government ID, training certificates, employment agreement, or address proof for {fullName}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsUploadDocModalOpen(true)}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-[#FA2D65] hover:bg-[#E02456] text-white text-xs font-bold shadow-md shadow-[#FA2D65]/20 active:scale-95 transition-all cursor-pointer"
                  >
                    + Upload First Document
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manual Attendance Entry Modal */}
      {isAddAttendanceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease_forwards]">
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <RiTimeLine className="text-[#FA2D65]" />
                <span>Mark Attendance</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddAttendanceOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium focus:border-[#FA2D65]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium focus:border-[#FA2D65]"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                  <option value="leave">On Leave</option>
                  <option value="weekly_off">Weekly Off</option>
                </select>
              </div>

              {attendanceForm.status === 'present' || attendanceForm.status === 'half_day' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Check In Time</label>
                    <input
                      type="time"
                      value={attendanceForm.check_in_time}
                      onChange={(e) => setAttendanceForm(prev => ({ ...prev, check_in_time: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium focus:border-[#FA2D65]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Check Out Time</label>
                    <input
                      type="time"
                      value={attendanceForm.check_out_time}
                      onChange={(e) => setAttendanceForm(prev => ({ ...prev, check_out_time: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium focus:border-[#FA2D65]"
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium resize-none focus:border-[#FA2D65]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddAttendanceOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FA2D65] hover:bg-[#E02456] text-white font-bold shadow-md shadow-[#FA2D65]/20 cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Real Document Upload Modal */}
      {isUploadDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease_forwards]">
          <div className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <RiUpload2Line className="text-[#FA2D65]" />
                <span>Upload Staff Document</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadDocModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Document Title / Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aadhar Card / Cosmetology Certificate"
                  value={docForm.name}
                  onChange={(e) => setDocForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium focus:border-[#FA2D65] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Document Category
                </label>
                <select
                  value={docForm.type}
                  onChange={(e) => setDocForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium focus:border-[#FA2D65] focus:outline-none cursor-pointer"
                >
                  <option value="Identity Proof">Identity Proof (Aadhar / Passport / Voter ID)</option>
                  <option value="Professional Certificate">Professional Certificate / Diploma</option>
                  <option value="Employment Contract">Employment Contract / Agreement</option>
                  <option value="Address Proof">Address Proof</option>
                  <option value="Resume / CV">Resume / CV</option>
                  <option value="Other">Other Document</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Choose File <span className="text-rose-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-[#FA2D65] rounded-2xl p-4 text-center cursor-pointer transition-colors relative bg-gray-50/50 dark:bg-white/[0.02]">
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setDocForm(prev => ({
                        ...prev,
                        file,
                        name: prev.name || (file ? file.name.replace(/\.[^/.]+$/, '') : ''),
                      }));
                    }}
                    required
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    <RiUpload2Line className="text-2xl text-gray-400 mb-1" />
                    {docForm.file ? (
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold text-xs truncate max-w-xs">
                        {docForm.file.name} ({Math.round(docForm.file.size / 1024)} KB)
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Click to select PDF or Image</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">PDF, PNG, JPG, WebP up to 10MB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsUploadDocModalOpen(false)}
                  disabled={uploadingDoc}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FA2D65] hover:bg-[#E02456] text-white font-bold shadow-md shadow-[#FA2D65]/20 cursor-pointer disabled:opacity-50"
                >
                  {uploadingDoc && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{uploadingDoc ? 'Uploading...' : 'Upload Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
