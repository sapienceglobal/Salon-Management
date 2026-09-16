'use client';

import { useState, useEffect } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { RiCloseLine, RiCalendarLine, RiSearchLine, RiUserAddLine, RiTimeLine, RiLoader2Line } from 'react-icons/ri';
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

export default function AddAppointmentModal({ isOpen, onClose, onSuccess, staffList, customersList, servicesList, initialDate, editData, preselectedCustomerId }) {
  const [formData, setFormData] = useState({
    customer_id: '',
    service_id: '',
    staff_id: '',
    appointment_date: '',
    start_time: '10:00:00',
    duration_minutes: 60,
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      if (editData) {
        // Calculate duration based on start/end times
        const [sh, sm] = editData.start_time.split(':').map(Number);
        const [eh, em] = editData.end_time.split(':').map(Number);
        const duration = ((eh * 60) + em) - ((sh * 60) + sm);
        
        setFormData({
          customer_id: editData.customer_id || '',
          service_id: editData.service_id || '',
          staff_id: editData.staff_member_id || '',
          appointment_date: editData.appointment_date.split('T')[0],
          start_time: editData.start_time.substring(0, 5) + ':00',
          duration_minutes: duration > 0 ? duration : 60,
          notes: editData.notes || ''
        });
      } else {
        setFormData(prev => ({ 
          ...prev, 
          customer_id: preselectedCustomerId || '',
          appointment_date: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          start_time: '10:00:00',
          duration_minutes: 60,
          service_id: '',
          staff_id: '',
          notes: ''
        }));
      }

      setError('');
      setFieldErrors({});
    }
  }, [isOpen, initialDate, editData]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const [hours, mins] = formData.start_time.split(':').map(Number);
      const endMins = (hours * 60) + mins + Number(formData.duration_minutes || 60);
      const endH = Math.floor(endMins / 60).toString().padStart(2, '0');
      const endM = (endMins % 60).toString().padStart(2, '0');
      const end_time = `${endH}:${endM}:00`;

      const payload = {
        customer_id: formData.customer_id,
        service_id: formData.service_id,
        staff_id: formData.staff_id || null,
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
                  <select className={`w-full border rounded-lg text-sm pl-9 pr-3 py-2.5 bg-admin-surface-light text-admin-text outline-none transition-colors ${fieldErrors.customer_id ? 'border-accent-red focus:border-accent-red' : 'border-admin-border focus:border-brand focus:bg-admin-card'}`}
                    value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })}>
                    <option value="">Search customer...</option>
                    {customersList.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name || ''}</option>)}
                  </select>
                </div>
                {/* Note: In a complete app, this button would open AddCustomerModal */}
                <button type="button" onClick={() => setShowAddCustomer(true)} className="w-[42px] h-[42px] rounded-lg bg-brand text-white flex items-center justify-center shrink-0 hover:bg-brand-light transition-colors shadow-sm" title="Add new customer">
                  <RiUserAddLine />
                </button>
              </div>
              {fieldErrors.customer_id && <p className="text-accent-red text-xs mt-1">{fieldErrors.customer_id}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold text-admin-text-secondary">Select Service *</label>
              <select className={`w-full border rounded-lg text-sm px-3 py-2.5 bg-admin-surface-light text-admin-text outline-none transition-colors ${fieldErrors.service_id ? 'border-accent-red focus:border-accent-red' : 'border-admin-border focus:border-brand focus:bg-admin-card'}`}
                value={formData.service_id} onChange={e => setFormData({ ...formData, service_id: e.target.value })}>
                <option value="">Choose a service...</option>
                {servicesList.map(s => <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.price)}</option>)}
              </select>
              {fieldErrors.service_id && <p className="text-accent-red text-xs mt-1">{fieldErrors.service_id}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-semibold text-admin-text-secondary">Select Staff</label>
              <select className={`w-full border rounded-lg text-sm px-3 py-2.5 bg-admin-surface-light text-admin-text outline-none transition-colors ${fieldErrors.staff_id ? 'border-accent-red focus:border-accent-red' : 'border-admin-border focus:border-brand focus:bg-admin-card'}`}
                value={formData.staff_id} onChange={e => setFormData({ ...formData, staff_id: e.target.value })}>
                <option value="">Anyone available</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
              {fieldErrors.staff_id && <p className="text-accent-red text-xs mt-1">{fieldErrors.staff_id}</p>}
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
