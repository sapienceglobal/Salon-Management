'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { 
  RiCloseLine, 
  RiCalendarLine, 
  RiSearchLine, 
  RiUserAddLine, 
  RiTimeLine, 
  RiLoader2Line, 
  RiAlertLine, 
  RiCheckboxCircleLine, 
  RiUserLine, 
  RiScissorsLine, 
  RiSaveLine, 
  RiInformationLine, 
  RiFileTextLine, 
  RiDoorLine,
  RiCheckLine,
  RiLockLine,
  RiRefreshLine,
  RiSparklingLine
} from 'react-icons/ri';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { appointmentSchema, formatZodErrors } from '@/lib/validations';
import AddCustomerModal from '../customers/AddCustomerModal';
import toast from 'react-hot-toast';

const DURATION_OPTIONS = [
  { label: '15 Minutes', value: 15 },
  { label: '30 Minutes', value: 30 },
  { label: '45 Minutes', value: 45 },
  { label: '1 Hour', value: 60 },
  { label: '1.5 Hours', value: 90 },
  { label: '2 Hours', value: 120 },
  { label: '2.5 Hours', value: 150 },
  { label: '3 Hours', value: 180 },
];

const getShiftInfo = (shiftType) => {
  switch (shiftType) {
    case 'morning':
      return { label: 'Morning Shift', start: '09:00 AM', end: '04:00 PM', startMinutes: 9 * 60, endMinutes: 16 * 60 };
    case 'evening':
      return { label: 'Evening Shift', start: '01:00 PM', end: '09:00 PM', startMinutes: 13 * 60, endMinutes: 21 * 60 };
    case 'flexible':
      return { label: 'Flexible Shift', start: '10:00 AM', end: '06:00 PM', startMinutes: 10 * 60, endMinutes: 18 * 60 };
    default:
      return { label: 'Full-time', start: '10:00 AM', end: '08:00 PM', startMinutes: 10 * 60, endMinutes: 20 * 60 };
  }
};

const ALL_TIME_SLOTS = [
  { time: '09:00:00', label: '09:00 AM', period: 'morning', startMinutes: 9 * 60 },
  { time: '09:30:00', label: '09:30 AM', period: 'morning', startMinutes: 9 * 60 + 30 },
  { time: '10:00:00', label: '10:00 AM', period: 'morning', startMinutes: 10 * 60 },
  { time: '10:30:00', label: '10:30 AM', period: 'morning', startMinutes: 10 * 60 + 30 },
  { time: '11:00:00', label: '11:00 AM', period: 'morning', startMinutes: 11 * 60 },
  { time: '11:30:00', label: '11:30 AM', period: 'morning', startMinutes: 11 * 60 + 30 },
  { time: '12:00:00', label: '12:00 PM', period: 'afternoon', startMinutes: 12 * 60 },
  { time: '12:30:00', label: '12:30 PM', period: 'afternoon', startMinutes: 12 * 60 + 30 },
  { time: '13:00:00', label: '01:00 PM', period: 'afternoon', startMinutes: 13 * 60 },
  { time: '13:30:00', label: '01:30 PM', period: 'afternoon', startMinutes: 13 * 60 + 30 },
  { time: '14:00:00', label: '02:00 PM', period: 'afternoon', startMinutes: 14 * 60 },
  { time: '14:30:00', label: '02:30 PM', period: 'afternoon', startMinutes: 14 * 60 + 30 },
  { time: '15:00:00', label: '03:00 PM', period: 'afternoon', startMinutes: 15 * 60 },
  { time: '15:30:00', label: '03:30 PM', period: 'afternoon', startMinutes: 15 * 60 + 30 },
  { time: '16:00:00', label: '04:00 PM', period: 'evening', startMinutes: 16 * 60 },
  { time: '16:30:00', label: '04:30 PM', period: 'evening', startMinutes: 16 * 60 + 30 },
  { time: '17:00:00', label: '05:00 PM', period: 'evening', startMinutes: 17 * 60 },
  { time: '17:30:00', label: '05:30 PM', period: 'evening', startMinutes: 17 * 60 + 30 },
  { time: '18:00:00', label: '06:00 PM', period: 'evening', startMinutes: 18 * 60 },
  { time: '18:30:00', label: '06:30 PM', period: 'evening', startMinutes: 18 * 60 + 30 },
  { time: '19:00:00', label: '07:00 PM', period: 'evening', startMinutes: 19 * 60 },
  { time: '19:30:00', label: '07:30 PM', period: 'evening', startMinutes: 19 * 60 + 30 },
  { time: '20:00:00', label: '08:00 PM', period: 'evening', startMinutes: 20 * 60 },
];

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr ? mStr.substring(0, 2) : '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, '0')}:${m} ${ampm}`;
};

const getEndTimeFormatted = (startTimeStr, durationMinutes) => {
  if (!startTimeStr) return '';
  const [h, m] = startTimeStr.split(':').map(Number);
  const totalMins = (h || 0) * 60 + (m || 0) + Number(durationMinutes || 60);
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  const ampm = endH >= 12 ? 'PM' : 'AM';
  const displayH = endH % 12 === 0 ? 12 : endH % 12;
  return `${String(displayH).padStart(2, '0')}:${String(endM).padStart(2, '0')} ${ampm}`;
};

const subscribe = () => () => {};

export default function AddAppointmentModal({ isOpen, onClose, onSuccess, staffList, customersList, servicesList, initialDate, editData, preselectedCustomerId }) {
  const [formData, setFormData] = useState({
    customer_id: '',
    service_id: '',
    staff_id: '',
    appointment_date: '',
    start_time: '10:00:00',
    duration_minutes: 60,
    room_id: '',
    notes: ''
  });
  
  const [roomsList, setRoomsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Time Slots & Staff Availability State
  const [dayAppointments, setDayAppointments] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotPeriod, setSlotPeriod] = useState('all');
  const [showCustomTime, setShowCustomTime] = useState(false);

  useScrollLock(isOpen);

  const selectedStaffMember = useMemo(() => {
    return (staffList || []).find((s) => String(s.id) === String(formData.staff_id));
  }, [staffList, formData.staff_id]);

  // Fetch appointments for the selected date to compute live availability
  const fetchDayAppointments = useCallback(async (date) => {
    if (!date) return;
    setLoadingSlots(true);
    try {
      const res = await api.get('/appointments', { params: { date, limit: 100 } });
      const list = res.data?.data || res.data || [];
      setDayAppointments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load slots for date', err);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && formData.appointment_date) {
      fetchDayAppointments(formData.appointment_date);
    }
  }, [isOpen, formData.appointment_date, fetchDayAppointments]);

  // Calculate live availability for each standard 30-min slot
  const slotAvailabilityList = useMemo(() => {
    const duration = Number(formData.duration_minutes || 60);
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = formData.appointment_date === todayStr;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const shift = selectedStaffMember 
      ? getShiftInfo(selectedStaffMember.shift_schedule || 'full_time')
      : null;

    return ALL_TIME_SLOTS.map((slot) => {
      const startMins = slot.startMinutes;
      const endMins = startMins + duration;

      // 1. Past check
      if (isToday && startMins < currentMins) {
        return { ...slot, status: 'past', reason: 'Time has already passed' };
      }

      // 2. Shift check (if staff is selected)
      if (shift && (startMins < shift.startMinutes || endMins > shift.endMinutes)) {
        return {
          ...slot,
          status: 'outside_shift',
          reason: `Outside ${selectedStaffMember.first_name}'s shift (${shift.start} - ${shift.end})`,
        };
      }

      // 3. Appointment conflict check
      const conflictAppt = dayAppointments.find((appt) => {
        if (editData && String(appt.id) === String(editData.id)) return false;
        if (['cancelled', 'no_show'].includes(appt.status)) return false;
        if (formData.staff_id && String(appt.staff_member_id) !== String(formData.staff_id)) return false;

        const [ah1, am1] = (appt.start_time || '00:00').split(':').map(Number);
        const [ah2, am2] = (appt.end_time || '00:00').split(':').map(Number);
        const aStart = (ah1 || 0) * 60 + (am1 || 0);
        const aEnd = (ah2 || 0) * 60 + (am2 || 0);

        return aStart < endMins && aEnd > startMins;
      });

      if (conflictAppt) {
        const cStart = formatTime12h(conflictAppt.start_time);
        const cEnd = formatTime12h(conflictAppt.end_time);
        return {
          ...slot,
          status: 'busy',
          reason: `Booked (${cStart} - ${cEnd})`,
        };
      }

      return { ...slot, status: 'available', reason: 'Available' };
    });
  }, [formData.duration_minutes, formData.appointment_date, formData.staff_id, selectedStaffMember, dayAppointments, editData]);

  // Real-time conflict evaluator for the currently selected start_time
  const activeConflict = useMemo(() => {
    if (!formData.start_time) return null;
    const [h, m] = (formData.start_time || '00:00').split(':').map(Number);
    const startMins = (h || 0) * 60 + (m || 0);
    const duration = Number(formData.duration_minutes || 60);
    const endMins = startMins + duration;

    // Check shift
    if (selectedStaffMember) {
      const shift = getShiftInfo(selectedStaffMember.shift_schedule || 'full_time');
      if (startMins < shift.startMinutes || endMins > shift.endMinutes) {
        return {
          type: 'shift',
          message: `${selectedStaffMember.first_name}'s working shift is ${shift.start} - ${shift.end}. This booking (${formatTime12h(formData.start_time)} - ${getEndTimeFormatted(formData.start_time, duration)}) falls outside their scheduled working hours.`,
        };
      }
    }

    // Check conflict
    const conflictAppt = dayAppointments.find((appt) => {
      if (editData && String(appt.id) === String(editData.id)) return false;
      if (['cancelled', 'no_show'].includes(appt.status)) return false;
      if (formData.staff_id && String(appt.staff_member_id) !== String(formData.staff_id)) return false;

      const [ah1, am1] = (appt.start_time || '00:00').split(':').map(Number);
      const [ah2, am2] = (appt.end_time || '00:00').split(':').map(Number);
      const aStart = (ah1 || 0) * 60 + (am1 || 0);
      const aEnd = (ah2 || 0) * 60 + (am2 || 0);

      return aStart < endMins && aEnd > startMins;
    });

    if (conflictAppt) {
      const staffName = selectedStaffMember 
        ? `${selectedStaffMember.first_name} ${selectedStaffMember.last_name || ''}`.trim() 
        : 'Staff';
      const cStart = formatTime12h(conflictAppt.start_time);
      const cEnd = formatTime12h(conflictAppt.end_time);
      return {
        type: 'conflict',
        message: `${staffName} already has an active appointment from ${cStart} to ${cEnd}. Please pick an available slot marked in green.`,
      };
    }

    return null;
  }, [formData.start_time, formData.duration_minutes, formData.staff_id, selectedStaffMember, dayAppointments, editData]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get('/settings/rooms');
      setRoomsList(res.data || []);
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        const [sh, sm] = editData.start_time.split(':').map(Number);
        const [eh, em] = editData.end_time.split(':').map(Number);
        const duration = ((eh * 60) + em) - ((sh * 60) + sm);
        
        const editServiceIds = editData.services && editData.services.length > 0
          ? editData.services.map(s => String(s.service_id))
          : editData.service_ids && editData.service_ids.length > 0
            ? editData.service_ids.map(String)
            : editData.service_id ? [String(editData.service_id)] : [];

        setFormData({
          customer_id: editData.customer_id || '',
          service_id: editServiceIds[0] || '',
          service_ids: editServiceIds,
          staff_id: editData.staff_member_id || '',
          room_id: editData.room_id || '',
          appointment_date: editData.appointment_date.split('T')[0],
          start_time: editData.start_time.substring(0, 5) + ':00',
          duration_minutes: duration > 0 ? duration : 60,
          notes: editData.notes || ''
        });

        const cust = customersList.find(c => c.id == editData.customer_id);
        if (cust) setCustomerSearch(`${cust.first_name} ${cust.last_name || ''} ${cust.phone ? `(${cust.phone})` : ''}`);
        
      } else {
        setFormData(prev => ({ 
          ...prev, 
          customer_id: preselectedCustomerId || '',
          appointment_date: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          start_time: '10:00:00',
          duration_minutes: 60,
          service_id: '',
          service_ids: [],
          staff_id: '',
          room_id: '',
          notes: ''
        }));
        
        if (preselectedCustomerId) {
           const cust = customersList.find(c => c.id == preselectedCustomerId);
           if (cust) setCustomerSearch(`${cust.first_name} ${cust.last_name || ''} ${cust.phone ? `(${cust.phone})` : ''}`);
        } else {
           setCustomerSearch('');
        }
      }

      setError('');
      setFieldErrors({});
    }
  }, [isOpen, initialDate, editData, preselectedCustomerId, customersList]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const serviceIds = (formData.service_ids && formData.service_ids.length > 0)
        ? formData.service_ids.map(Number)
        : formData.service_id ? [Number(formData.service_id)] : [];

      if (serviceIds.length === 0) {
        setFieldErrors({ service_id: 'Please select at least one service' });
        setLoading(false);
        return;
      }

      const [hours, mins] = formData.start_time.split(':').map(Number);
      const endMins = (hours * 60) + mins + Number(formData.duration_minutes || 60);
      const endH = Math.floor(endMins / 60).toString().padStart(2, '0');
      const endM = (endMins % 60).toString().padStart(2, '0');
      const end_time = `${endH}:${endM}:00`;

      const payload = {
        customer_id: formData.customer_id,
        service_id: serviceIds[0],
        service_ids: serviceIds,
        staff_id: formData.staff_id || null,
        room_id: formData.room_id || null,
        appointment_date: formData.appointment_date,
        start_time: formData.start_time,
        end_time,
        notes: formData.notes,
        status: editData ? editData.status : 'planned'
      };

      const result = appointmentSchema.safeParse(payload);
      if (!result.success) {
        setFieldErrors(formatZodErrors(result.error));
        setLoading(false);
        return;
      }

      payload.customer_id = parseInt(payload.customer_id);
      payload.service_id = parseInt(payload.service_id);
      if (payload.staff_id) payload.staff_id = parseInt(payload.staff_id);
      if (payload.room_id) payload.room_id = parseInt(payload.room_id);

      if (activeConflict) {
        setError(activeConflict.message);
        toast.error(activeConflict.message, { duration: 4000 });
        setLoading(false);
        return;
      }

      if (editData) {
        await api.patch(`/appointments/${editData.id}`, payload);
      } else {
        await api.post('/appointments', payload);
      }
      toast.success(editData ? 'Appointment updated successfully!' : 'Appointment booked successfully!');
      onSuccess();
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      const statusCode = err?.response?.status;
      
      if (statusCode === 409 || (serverMsg && serverMsg.toLowerCase().includes('conflict'))) {
        const staffName = selectedStaffMember 
          ? `${selectedStaffMember.first_name} ${selectedStaffMember.last_name || ''}`.trim()
          : 'The selected staff member';
        const friendly = `${staffName} already has an appointment booked at this time. Please pick another time slot marked in green.`;
        setError(friendly);
        toast.error(friendly, { duration: 5000 });
      } else {
        const fallback = serverMsg || 'Failed to book appointment. Please check details and try again.';
        setError(fallback);
        toast.error(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName) =>
    `w-full bg-gray-50 dark:bg-white/5 border ${fieldErrors[fieldName] ? 'border-red-400 dark:border-red-400/60 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-[#E91E63]'} rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors`;

  const labelClass = 'block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ══════════════════════════════════════════════════════════
            MODAL HEADER
           ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
              <RiCalendarLine />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {editData ? 'Edit Appointment' : 'Book New Appointment'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {editData ? 'Modify appointment details and schedule.' : 'Schedule a new appointment with service, staff and timing.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
            MODAL BODY
           ══════════════════════════════════════════════════════════ */}
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 sm:px-8 py-6">
          {error && (
            <div className="flex items-center gap-2 p-3.5 mb-5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[13px] font-medium">
              <RiInformationLine className="shrink-0 text-base" />
              {error}
            </div>
          )}

          <form id="appointment-form" onSubmit={handleSubmit} noValidate>
            {/* ─── Section: Customer ─── */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <RiUserLine className="text-[#E91E63] text-base" />
                <h3 className="text-[14px] font-bold text-gray-800 dark:text-white">Customer</h3>
              </div>

              <div>
                <label className={labelClass}>Select Customer <span className="text-[#E91E63]">*</span></label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search customer name or mobile..."
                      className={`${inputClass('customer_id')} pl-10`}
                      value={customerSearch}
                      onChange={e => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                        setFormData(prev => ({ ...prev, customer_id: '' }));
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                    />
                    {showCustomerDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#1e1e36] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {customersList
                          .filter(c => `${c.first_name} ${c.last_name || ''} ${c.phone || ''}`.toLowerCase().includes(customerSearch.toLowerCase()))
                          .map(c => (
                            <div
                              key={c.id}
                              className="px-4 py-2.5 text-[13px] hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 last:border-0"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, customer_id: c.id }));
                                setCustomerSearch(`${c.first_name} ${c.last_name || ''} ${c.phone ? `(${c.phone})` : ''}`);
                                setShowCustomerDropdown(false);
                              }}
                            >
                              <div className="font-semibold">{c.first_name} {c.last_name || ''}</div>
                              {c.phone && <div className="text-xs text-gray-500 dark:text-gray-400">{c.phone}</div>}
                            </div>
                        ))}
                        {customersList.filter(c => `${c.first_name} ${c.last_name || ''} ${c.phone || ''}`.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                          <div className="px-4 py-3 text-[13px] text-gray-400 dark:text-gray-500 text-center">No customer found</div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomer(true)}
                    className="w-[42px] h-[42px] rounded-xl bg-[#E91E63] text-white flex items-center justify-center shrink-0 hover:bg-[#D81B60] transition-colors shadow-md shadow-[#E91E63]/25 cursor-pointer"
                    title="Add new customer"
                  >
                    <RiUserAddLine />
                  </button>
                </div>
                {fieldErrors.customer_id && <p className="text-red-500 text-xs mt-1">{fieldErrors.customer_id}</p>}
              </div>
            </div>

            {/* ─── Section: Services ─── */}
            <div className="mb-6 pt-5 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <RiScissorsLine className="text-[#E91E63] text-base" />
                <h3 className="text-[14px] font-bold text-gray-800 dark:text-white">Services</h3>
              </div>

              <div>
                <label className={labelClass}>Select Services <span className="text-[#E91E63]">*</span></label>
                <select 
                  className={inputClass('service_id')}
                  value="" 
                  onChange={e => {
                    const sId = e.target.value;
                    if (!sId) return;
                    const current = formData.service_ids || [];
                    if (!current.includes(sId)) {
                      const nextIds = [...current, sId];
                      const totalDur = nextIds.reduce((sum, id) => {
                        const s = servicesList?.find(item => item.id == id);
                        return sum + (s?.duration || s?.duration_minutes || 30);
                      }, 0);
                      setFormData(prev => ({
                        ...prev,
                        service_ids: nextIds,
                        service_id: nextIds[0],
                        duration_minutes: totalDur > 0 ? totalDur : prev.duration_minutes
                      }));
                    }
                  }}
                >
                  <option value="">+ Add a service...</option>
                  {(servicesList || [])
                    .filter(s => s.is_active !== false || (formData.service_ids || []).includes(String(s.id)))
                    .map(s => {
                      const isAdded = (formData.service_ids || []).includes(String(s.id));
                      return (
                        <option key={s.id} value={s.id} disabled={isAdded}>
                          {s.name} - {formatCurrency(s.price)} {isAdded ? '(Added)' : `(${s.duration || 30} mins)`}
                        </option>
                      );
                    })}
                </select>

                {/* Selected Services Badges */}
                {(formData.service_ids && formData.service_ids.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-50/60 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl">
                    {formData.service_ids.map(id => {
                      const s = servicesList?.find(item => item.id == id);
                      return (
                        <span key={id} className="inline-flex items-center gap-1.5 text-[12px] bg-[#E91E63]/10 border border-[#E91E63]/20 text-[#E91E63] px-2.5 py-1 rounded-full font-semibold">
                          <span>{s?.name || `Service #${id}`}</span>
                          <span className="text-[10px] opacity-75 font-bold">({formatCurrency(s?.price || 0)})</span>
                          <button
                            type="button"
                            className="hover:text-red-600 text-gray-400 transition-colors ml-0.5"
                            onClick={() => {
                              const nextIds = formData.service_ids.filter(item => item !== id);
                              const totalDur = nextIds.reduce((sum, item) => {
                                const s = servicesList?.find(x => x.id == item);
                                return sum + (s?.duration || s?.duration_minutes || 30);
                              }, 0);
                              setFormData(prev => ({
                                ...prev,
                                service_ids: nextIds,
                                service_id: nextIds[0] || '',
                                duration_minutes: totalDur > 0 ? totalDur : 30
                              }));
                            }}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    <div className="w-full text-[11px] text-gray-500 dark:text-gray-400 pt-1 flex justify-between font-medium">
                      <span>{formData.service_ids.length} service(s) selected</span>
                      <span className="text-[#E91E63] font-bold">
                        Total: {formatCurrency(formData.service_ids.reduce((sum, id) => sum + parseFloat(servicesList?.find(s => s.id == id)?.price || 0), 0))}
                      </span>
                    </div>
                  </div>
                )}
                {fieldErrors.service_id && <p className="text-red-500 text-xs mt-1">{fieldErrors.service_id}</p>}
              </div>
            </div>

            {/* ─── Section: Staff & Room ─── */}
            <div className="mb-6 pt-5 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <RiUserLine className="text-[#E91E63] text-base" />
                <h3 className="text-[14px] font-bold text-gray-800 dark:text-white">Staff & Room</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Staff */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13px] font-semibold text-gray-600 dark:text-gray-400">Staff Member</label>
                    {selectedStaffMember && (
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: selectedStaffMember.color_code || '#E91E63' }}
                        />
                        {getShiftInfo(selectedStaffMember.shift_schedule || 'full_time').label}
                      </span>
                    )}
                  </div>
                  <select
                    className={inputClass('staff_id')}
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                  >
                    <option value="">Anyone available</option>
                    {(staffList || [])
                      .filter((s) => s.is_active !== false || (editData && editData.staff_member_id == s.id))
                      .map((s) => {
                        const shift = getShiftInfo(s.shift_schedule || 'full_time');
                        return (
                          <option key={s.id} value={s.id}>
                            {s.first_name} {s.last_name || ''} ({shift.label}: {shift.start} - {shift.end})
                          </option>
                        );
                      })}
                  </select>
                  {fieldErrors.staff_id && <p className="text-red-500 text-xs mt-1">{fieldErrors.staff_id}</p>}
                </div>

                {/* Room */}
                <div>
                  <label className={labelClass}>Room</label>
                  <select
                    className={inputClass('room_id')}
                    value={formData.room_id}
                    onChange={e => setFormData({ ...formData, room_id: e.target.value })}
                  >
                    <option value="">Any room</option>
                    {roomsList.map(r => <option key={r.id} value={r.id}>{r.name} (Capacity: {r.capacity})</option>)}
                  </select>
                  {fieldErrors.room_id && <p className="text-red-500 text-xs mt-1">{fieldErrors.room_id}</p>}
                </div>
              </div>

              {/* Rich Staff Card */}
              {selectedStaffMember && (
                <div className="mt-3 p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-white/[0.02] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        {selectedStaffMember.avatar_url ? (
                          <img
                            src={selectedStaffMember.avatar_url}
                            alt={selectedStaffMember.first_name}
                            className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-white/10 shadow-sm"
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: selectedStaffMember.color_code || '#E91E63' }}
                          >
                            {selectedStaffMember.first_name?.[0]}
                          </div>
                        )}
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#1a1a2e]"
                          style={{ backgroundColor: selectedStaffMember.color_code || '#E91E63' }}
                        />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          {selectedStaffMember.first_name} {selectedStaffMember.last_name || ''}
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-bold text-white uppercase tracking-wider"
                            style={{ backgroundColor: selectedStaffMember.color_code || '#E91E63' }}
                          >
                            Staff
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {selectedStaffMember.designation || 'Specialist'}
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400">
                      <RiTimeLine className="text-[11px] text-[#E91E63]" />
                      {getShiftInfo(selectedStaffMember.shift_schedule || 'full_time').start} - {getShiftInfo(selectedStaffMember.shift_schedule || 'full_time').end}
                    </span>
                  </div>

                  {activeConflict && activeConflict.type === 'shift' ? (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-start gap-2 text-amber-600 dark:text-amber-400">
                      <RiAlertLine className="text-base shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-tight">
                        <span className="font-bold">Shift Timing Notice: </span>
                        <span>{activeConflict.message}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px]">
                      <RiCheckboxCircleLine className="text-sm shrink-0" />
                      <span>Within scheduled shift hours ({getShiftInfo(selectedStaffMember.shift_schedule || 'full_time').start} - {getShiftInfo(selectedStaffMember.shift_schedule || 'full_time').end})</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Section: Date, Time & Duration ─── */}
            <div className="mb-6 pt-5 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <RiTimeLine className="text-[#E91E63] text-base" />
                  <h3 className="text-[14px] font-bold text-gray-800 dark:text-white">Schedule & Slots</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomTime(!showCustomTime)}
                  className="text-xs text-[#E91E63] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {showCustomTime ? 'Hide Custom Time' : 'Custom Time / Exact Min'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Date */}
                <div>
                  <label className={labelClass}>Appointment Date <span className="text-[#E91E63]">*</span></label>
                  <div className="relative">
                    <RiCalendarLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base pointer-events-none" />
                    <input
                      type="date"
                      className={`${inputClass('appointment_date')} pl-10 dark:[color-scheme:dark]`}
                      value={formData.appointment_date}
                      onChange={e => setFormData({ ...formData, appointment_date: e.target.value })}
                    />
                  </div>
                  {fieldErrors.appointment_date && <p className="text-red-500 text-xs mt-1">{fieldErrors.appointment_date}</p>}
                </div>

                {/* Duration */}
                <div>
                  <label className={labelClass}>Estimated Duration</label>
                  <select
                    className={inputClass('duration_minutes')}
                    value={formData.duration_minutes}
                    onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                  >
                    {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Optional Custom Time Input */}
              {showCustomTime && (
                <div className="mb-4 p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                  <label className={labelClass}>Exact Start Time</label>
                  <div className="relative max-w-xs">
                    <RiTimeLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base pointer-events-none" />
                    <input
                      type="time"
                      className={`${inputClass('start_time')} pl-10 dark:[color-scheme:dark]`}
                      value={formData.start_time.substring(0, 5)}
                      onChange={e => setFormData({ ...formData, start_time: e.target.value + ':00' })}
                    />
                  </div>
                </div>
              )}

              {/* Active Conflict Warning */}
              {activeConflict && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-start gap-3 text-rose-600 dark:text-rose-400 animate-[fadeIn_0.2s_ease_forwards]">
                  <RiAlertLine className="text-lg shrink-0 mt-0.5" />
                  <div className="text-[12px] leading-relaxed">
                    <span className="font-bold">Timing Conflict: </span>
                    <span>{activeConflict.message}</span>
                  </div>
                </div>
              )}

              {/* Interactive Time Slots Grid */}
              <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.01]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
                  <div>
                    <span className="text-[13px] font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <RiSparklingLine className="text-[#E91E63]" />
                      Available Time Slots
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {selectedStaffMember 
                        ? `Live schedule for ${selectedStaffMember.first_name} (${getShiftInfo(selectedStaffMember.shift_schedule || 'full_time').label})`
                        : 'Select staff member above to see personalized shift availability.'}
                    </p>
                  </div>

                  {/* Period Filter Tabs */}
                  <div className="flex items-center gap-1 bg-white dark:bg-white/5 p-1 rounded-xl border border-gray-200/80 dark:border-white/10 shrink-0">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'morning', label: 'Morning' },
                      { id: 'afternoon', label: 'Afternoon' },
                      { id: 'evening', label: 'Evening' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSlotPeriod(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          slotPeriod === tab.id
                            ? 'bg-[#E91E63] text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slots Grid */}
                {loadingSlots ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-400 text-xs">
                    <RiLoader2Line className="animate-spin text-xl text-[#E91E63]" />
                    <span>Checking live staff schedule...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {slotAvailabilityList
                      .filter(slot => slotPeriod === 'all' || slot.period === slotPeriod)
                      .map((slot) => {
                        const isSelected = formData.start_time.startsWith(slot.time.substring(0, 5));
                        const isAvailable = slot.status === 'available';
                        const isBusy = slot.status === 'busy';
                        const isOutsideShift = slot.status === 'outside_shift';
                        const isPast = slot.status === 'past';

                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, start_time: slot.time }));
                              setError('');
                            }}
                            title={slot.reason}
                            className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                              isSelected
                                ? 'bg-[#E91E63] border-[#E91E63] text-white shadow-md shadow-[#E91E63]/30 scale-[1.02] ring-2 ring-[#E91E63]/30 font-bold'
                                : isAvailable
                                ? 'bg-white dark:bg-white/[0.03] border-emerald-500/30 hover:border-[#E91E63] text-gray-900 dark:text-white hover:bg-[#E91E63]/5 hover:scale-[1.01]'
                                : isBusy
                                ? 'bg-rose-50/70 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-500 dark:text-rose-400 opacity-60 cursor-not-allowed line-through'
                                : isOutsideShift
                                ? 'bg-gray-100/60 dark:bg-white/[0.02] border-dashed border-gray-300 dark:border-white/10 text-gray-400 opacity-50 cursor-not-allowed'
                                : 'bg-gray-100/40 dark:bg-white/[0.01] border-gray-200 dark:border-white/5 text-gray-300 dark:text-gray-600 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <span className="text-[12px] font-semibold tracking-tight">
                              {slot.label}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : isAvailable
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : isBusy
                                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 no-underline'
                                : isOutsideShift
                                ? 'text-gray-400'
                                : 'text-gray-400'
                            }`}>
                              {isSelected ? 'Selected' : isAvailable ? 'Free' : isBusy ? 'Busy' : isOutsideShift ? 'Off' : 'Past'}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}

                {/* Slots Legend & Selected Time Pill */}
                <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px]">
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Free Slot
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      Booked (Busy)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                      Outside Shift
                    </span>
                  </div>

                  {formData.start_time && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E91E63]/10 border border-[#E91E63]/20 text-[#E91E63] font-bold">
                      <RiCheckLine className="text-sm" />
                      <span>{formatTime12h(formData.start_time)} – {getEndTimeFormatted(formData.start_time, formData.duration_minutes)} ({formData.duration_minutes}m)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Section: Notes ─── */}
            <div className="pt-5 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <RiFileTextLine className="text-[#E91E63] text-base" />
                <h3 className="text-[14px] font-bold text-gray-800 dark:text-white">Notes</h3>
              </div>

              <div>
                <label className={labelClass}>Special Requests (Optional)</label>
                <textarea
                  placeholder="Add any special requests or notes for this appointment..."
                  className={`${inputClass('notes')} min-h-[80px] resize-none`}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
                {fieldErrors.notes && <p className="text-red-500 text-xs mt-1">{fieldErrors.notes}</p>}
              </div>
            </div>
          </form>
        </div>

        {/* ══════════════════════════════════════════════════════════
            MODAL FOOTER
           ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="appointment-form"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-[14px] font-bold shadow-lg shadow-[#E91E63]/25 hover:shadow-[#E91E63]/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? <RiLoader2Line className="animate-spin" /> : <RiSaveLine className="text-base" />}
            {editData ? 'Save Changes' : 'Book Appointment'}
          </button>
        </div>

        <AddCustomerModal 
          isOpen={showAddCustomer} 
          onClose={() => setShowAddCustomer(false)} 
          onSuccess={(newCustomer) => {
            if (!customersList.find(c => c.id === newCustomer.id)) {
              customersList.push(newCustomer);
            }
            setFormData(prev => ({ ...prev, customer_id: newCustomer.id }));
            setCustomerSearch(`${newCustomer.first_name} ${newCustomer.last_name || ''} ${newCustomer.phone ? `(${newCustomer.phone})` : ''}`);
            setShowAddCustomer(false);
          }} 
        />
      </div>
    </div>,
    document.body
  );
}
