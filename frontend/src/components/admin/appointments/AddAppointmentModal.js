'use client';

import { useState, useEffect, useMemo } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { RiCloseLine, RiCalendarLine, RiSearchLine, RiUserAddLine, RiTimeLine, RiLoader2Line, RiAlertLine, RiCheckboxCircleLine, RiUserLine } from 'react-icons/ri';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { appointmentSchema, formatZodErrors } from '@/lib/validations';
import AddCustomerModal from '../customers/AddCustomerModal';

const DURATION_OPTIONS = [
  { label: '30 Minutes', value: 30 },
  { label: '45 Minutes', value: 45 },
  { label: '1 Hour', value: 60 },
  { label: '1.5 Hours', value: 90 },
  { label: '2 Hours', value: 120 },
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
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useScrollLock(isOpen);

  const selectedStaffMember = useMemo(() => {
    return (staffList || []).find((s) => String(s.id) === String(formData.staff_id));
  }, [staffList, formData.staff_id]);

  const timingConflict = useMemo(() => {
    if (!selectedStaffMember || !formData.start_time) return null;
    const shift = getShiftInfo(selectedStaffMember.shift_schedule || 'full_time');
    const [hours, mins] = (formData.start_time || '10:00').split(':').map(Number);
    const startMins = (hours || 0) * 60 + (mins || 0);
    const endMins = startMins + Number(formData.duration_minutes || 60);

    if (startMins < shift.startMinutes || endMins > shift.endMinutes) {
      const endH = Math.floor(endMins / 60).toString().padStart(2, '0');
      const endM = (endMins % 60).toString().padStart(2, '0');
      return {
        shift,
        startMins,
        endMins,
        reason: `${selectedStaffMember.first_name} works ${shift.label} (${shift.start} - ${shift.end}). This booking (${formData.start_time.substring(0, 5)} - ${endH}:${endM}) falls outside scheduled working hours.`,
      };
    }
    return null;
  }, [selectedStaffMember, formData.start_time, formData.duration_minutes]);

  useEffect(() => {
    setMounted(true);
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/settings/rooms');
      setRoomsList(res.data || []);
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      if (editData) {
        // Calculate duration based on start/end times
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

      // Convert IDs to numbers after validation
      payload.customer_id = parseInt(payload.customer_id);
      payload.service_id = parseInt(payload.service_id);
      if (payload.staff_id) payload.staff_id = parseInt(payload.staff_id);
      if (payload.room_id) payload.room_id = parseInt(payload.room_id);

      if (editData) {
        await api.patch(`/appointments/${editData.id}`, payload);
      } else {
        await api.post('/appointments', payload);
      }
      onSuccess();
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200); // Wait for animation
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={handleClose}>
      <div 
        className={`bg-admin-card text-admin-text w-full max-w-md h-full border-l border-admin-border shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-admin-border bg-admin-surface/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold">{editData ? 'Edit Appointment' : 'Book Appointment'}</h2>
            <p className="text-sm text-admin-text-secondary mt-1">
              {editData ? 'Modify appointment details.' : 'Create a new appointment booking.'}
            </p>
          </div>
          <button onClick={handleClose} className="text-admin-text-secondary hover:text-admin-text p-2 rounded-md hover:bg-admin-surface-light transition-colors">
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        {/* Body (Form content without pushing footer down) */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6">
          <form id="appointment-form" onSubmit={handleSubmit} noValidate className="space-y-4 flex flex-col">
            
            {error && <div className="text-sm text-accent-red font-medium p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg shrink-0">{error}</div>}

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold text-admin-text-secondary">Select Customer *</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted text-sm pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search name or mobile..."
                    className={`w-full border rounded-lg text-sm pl-9 pr-3 py-2.5 bg-admin-surface-light text-admin-text outline-none transition-colors ${fieldErrors.customer_id ? 'border-accent-red focus:border-accent-red' : 'border-admin-border focus:border-brand focus:bg-admin-card'}`}
                    value={customerSearch}
                    onChange={e => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                      setFormData(prev => ({ ...prev, customer_id: '' })); // clear ID if typing
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  />
                  {showCustomerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-admin-card border border-admin-border rounded-lg shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                      {customersList
                        .filter(c => `${c.first_name} ${c.last_name || ''} ${c.phone || ''}`.toLowerCase().includes(customerSearch.toLowerCase()))
                        .map(c => (
                          <div
                            key={c.id}
                            className="px-4 py-2 text-sm hover:bg-admin-surface-light cursor-pointer text-admin-text border-b border-admin-border/50 last:border-0"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, customer_id: c.id }));
                              setCustomerSearch(`${c.first_name} ${c.last_name || ''} ${c.phone ? `(${c.phone})` : ''}`);
                              setShowCustomerDropdown(false);
                            }}
                          >
                            <div className="font-semibold">{c.first_name} {c.last_name || ''}</div>
                            {c.phone && <div className="text-xs text-admin-text-muted">{c.phone}</div>}
                          </div>
                      ))}
                      {customersList.filter(c => `${c.first_name} ${c.last_name || ''} ${c.phone || ''}`.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3 text-sm text-admin-text-muted text-center">No customer found</div>
                      )}
                    </div>
                  )}
                </div>
                {/* Note: In a complete app, this button would open AddCustomerModal */}
                <button type="button" onClick={() => setShowAddCustomer(true)} className="w-[42px] h-[42px] rounded-lg bg-brand text-white flex items-center justify-center shrink-0 hover:bg-brand-light transition-colors shadow-sm" title="Add new customer">
                  <RiUserAddLine />
                </button>
              </div>
              {fieldErrors.customer_id && <p className="text-accent-red text-xs mt-1">{fieldErrors.customer_id}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold text-admin-text-secondary">Select Services *</label>
              <select 
                className={`w-full border rounded-lg text-sm px-3 py-2.5 bg-admin-surface-light text-admin-text outline-none transition-colors ${fieldErrors.service_id ? 'border-accent-red focus:border-accent-red' : 'border-admin-border focus:border-brand focus:bg-admin-card'}`}
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
                <div className="flex flex-wrap gap-2 mt-2 p-2.5 bg-admin-card border border-admin-border rounded-lg">
                  {formData.service_ids.map(id => {
                    const s = servicesList?.find(item => item.id == id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1.5 text-xs bg-brand/10 border border-brand/20 text-brand px-2.5 py-1 rounded-full font-medium">
                        <span>{s?.name || `Service #${id}`}</span>
                        <span className="text-[10px] opacity-75 font-semibold">({formatCurrency(s?.price || 0)})</span>
                        <button
                          type="button"
                          className="hover:text-accent-red text-admin-text-muted transition-colors ml-0.5"
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
                  <div className="w-full text-[11px] text-admin-text-muted pt-1 flex justify-between font-medium">
                    <span>{formData.service_ids.length} service(s) selected</span>
                    <span className="text-brand font-semibold">
                      Total: {formatCurrency(formData.service_ids.reduce((sum, id) => sum + parseFloat(servicesList?.find(s => s.id == id)?.price || 0), 0))}
                    </span>
                  </div>
                </div>
              )}

              {fieldErrors.service_id && <p className="text-accent-red text-xs mt-1">{fieldErrors.service_id}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[0.75rem] font-semibold text-admin-text-secondary">Staff Member</label>
                {selectedStaffMember && (
                  <span className="text-[10px] font-semibold text-admin-text-muted flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full inline-block shadow-xs"
                      style={{ backgroundColor: selectedStaffMember.color_code || '#E91E63' }}
                    />
                    {getShiftInfo(selectedStaffMember.shift_schedule || 'full_time').label}
                  </span>
                )}
              </div>

              <select
                className={`w-full border rounded-lg text-sm px-3 py-2.5 bg-admin-surface-light text-admin-text outline-none transition-colors ${
                  fieldErrors.staff_id ? 'border-accent-red focus:border-accent-red' : 'border-admin-border focus:border-brand focus:bg-admin-card'
                }`}
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

              {/* Rich Selected Staff Profile Card & Shift Timing Notice */}
              {selectedStaffMember && (
                <div className="mt-1 p-2.5 rounded-xl border border-admin-border bg-admin-card/60 flex flex-col gap-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        {selectedStaffMember.avatar_url ? (
                          <img
                            src={selectedStaffMember.avatar_url}
                            alt={selectedStaffMember.first_name}
                            className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-xs"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                            style={{ backgroundColor: selectedStaffMember.color_code || '#E91E63' }}
                          >
                            {selectedStaffMember.first_name?.[0]}
                          </div>
                        )}
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#1a1a2e]"
                          style={{ backgroundColor: selectedStaffMember.color_code || '#E91E63' }}
                          title="Staff Calendar Color"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-admin-text leading-tight flex items-center gap-1.5">
                          {selectedStaffMember.first_name} {selectedStaffMember.last_name || ''}
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-semibold text-white uppercase tracking-wider"
                            style={{ backgroundColor: selectedStaffMember.color_code || '#E91E63' }}
                          >
                            Staff
                          </span>
                        </div>
                        <div className="text-[11px] text-admin-text-muted mt-0.5">
                          {selectedStaffMember.designation || 'Specialist'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-admin-surface-light border border-admin-border text-admin-text-secondary">
                        <RiTimeLine className="text-[11px] text-brand" />
                        {getShiftInfo(selectedStaffMember.shift_schedule || 'full_time').start} - {getShiftInfo(selectedStaffMember.shift_schedule || 'full_time').end}
                      </span>
                    </div>
                  </div>

                  {/* Timing conflict warning notice */}
                  {timingConflict ? (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-amber-600 dark:text-amber-400">
                      <RiAlertLine className="text-base shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-tight">
                        <span className="font-bold">Shift Timing Notice: </span>
                        <span>{timingConflict.reason}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px]">
                      <RiCheckboxCircleLine className="text-sm shrink-0" />
                      <span>Within scheduled shift hours ({getShiftInfo(selectedStaffMember.shift_schedule || 'full_time').start} - {getShiftInfo(selectedStaffMember.shift_schedule || 'full_time').end})</span>
                    </div>
                  )}
                </div>
              )}

              {fieldErrors.staff_id && <p className="text-accent-red text-xs mt-1">{fieldErrors.staff_id}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold text-admin-text-secondary">Select Room</label>
              <select className={`w-full border rounded-lg text-sm px-3 py-2.5 bg-admin-surface-light text-admin-text outline-none transition-colors ${fieldErrors.room_id ? 'border-accent-red focus:border-accent-red' : 'border-admin-border focus:border-brand focus:bg-admin-card'}`}
                value={formData.room_id} onChange={e => setFormData({ ...formData, room_id: e.target.value })}>
                <option value="">Any room</option>
                {roomsList.map(r => <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>)}
              </select>
              {fieldErrors.room_id && <p className="text-accent-red text-xs mt-1">{fieldErrors.room_id}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold text-admin-text-secondary">Date &amp; Time *</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input type="date" className={`w-full border rounded-lg text-sm px-3 py-2.5 bg-admin-surface-light text-admin-text outline-none transition-colors dark:[color-scheme:dark] ${fieldErrors.appointment_date ? 'border-accent-red focus:border-accent-red' : 'border-admin-border focus:border-brand focus:bg-admin-card'}`}
                    value={formData.appointment_date} onChange={e => setFormData({ ...formData, appointment_date: e.target.value })} />
                </div>
                <div className="relative">
                  <input type="time" className={`w-full border rounded-lg text-sm px-3 py-2.5 bg-admin-surface-light text-admin-text outline-none transition-colors dark:[color-scheme:dark] ${fieldErrors.start_time ? 'border-accent-red focus:border-accent-red' : 'border-admin-border focus:border-brand focus:bg-admin-card'}`}
                    value={formData.start_time.substring(0, 5)} onChange={e => setFormData({ ...formData, start_time: e.target.value + ':00' })} />
                </div>
              </div>
              {(fieldErrors.appointment_date || fieldErrors.start_time) && <p className="text-accent-red text-xs mt-1">{fieldErrors.appointment_date || fieldErrors.start_time}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold text-admin-text-secondary">Duration</label>
              <select className="w-full border border-admin-border rounded-lg text-sm px-3 py-2.5 bg-admin-surface-light text-admin-text focus:border-brand focus:bg-admin-card outline-none transition-colors"
                value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}>
                {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold text-admin-text-secondary">Notes (Optional)</label>
              <textarea placeholder="Add any special request..." className={`w-full border rounded-lg text-sm px-3 py-2.5 bg-admin-surface-light text-admin-text outline-none transition-colors min-h-[80px] resize-none ${fieldErrors.notes ? 'border-accent-red focus:border-accent-red' : 'border-admin-border focus:border-brand focus:bg-admin-card'}`}
                value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              {fieldErrors.notes && <p className="text-accent-red text-xs mt-1">{fieldErrors.notes}</p>}
            </div>

            {/* Footer Buttons attached directly inside the form to avoid excessive empty space below notes */}
            <div className="pt-4 mt-2 border-t border-admin-border flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-admin-card text-admin-text border border-admin-border hover:bg-admin-surface-light transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-brand text-white hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm shadow-brand/20"
              >
                {loading && <RiLoader2Line className="animate-spin" />}
                {editData ? 'Save Changes' : 'Book Appointment'}
              </button>
            </div>
            
          </form>
        </div>

        <AddCustomerModal 
          isOpen={showAddCustomer} 
          onClose={() => setShowAddCustomer(false)} 
          onSuccess={(newCustomer) => {
            // Optimistically add to list so it can be selected immediately
            if (!customersList.find(c => c.id === newCustomer.id)) {
              customersList.push(newCustomer);
            }
            setFormData(prev => ({ ...prev, customer_id: newCustomer.id }));
            setShowAddCustomer(false);
          }} 
        />
      </div>
    </div>,
    document.body
  );
}
