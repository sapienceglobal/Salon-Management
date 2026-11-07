'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { RiErrorWarningLine, RiCheckLine, RiTimeLine } from 'react-icons/ri';

export default function OperationsTab({ settings, onUpdate }) {
  const [formData, setFormData] = useState(() => ({
    working_hours_start: settings?.working_hours_start ? settings.working_hours_start.slice(0, 5) : '09:00',
    working_hours_end: settings?.working_hours_end ? settings.working_hours_end.slice(0, 5) : '21:00',
    weekly_off_day: settings?.weekly_off_day ?? 1,
    appointment_slot_duration: settings?.appointment_slot_duration || 30,
    booking_advance_days: settings?.booking_advance_days || 30,
    cancellation_policy: settings?.cancellation_policy || '',
  }));

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        working_hours_start: settings.working_hours_start ? settings.working_hours_start.slice(0, 5) : '09:00',
        working_hours_end: settings.working_hours_end ? settings.working_hours_end.slice(0, 5) : '21:00',
        weekly_off_day: settings.weekly_off_day ?? 1,
        appointment_slot_duration: settings.appointment_slot_duration || 30,
        booking_advance_days: settings.booking_advance_days || 30,
        cancellation_policy: settings.cancellation_policy || '',
      });
    }
  }, [settings]);

  const validateField = (name, value, currentForm) => {
    switch (name) {
      case 'working_hours_start':
        if (!value) return 'Opening time is required';
        return '';
      case 'working_hours_end':
        if (!value) return 'Closing time is required';
        if (currentForm?.working_hours_start && value <= currentForm.working_hours_start) {
          return 'Closing time must be after opening time';
        }
        return '';
      case 'booking_advance_days':
        if (!value || Number(value) < 1) return 'Must allow at least 1 advance booking day';
        if (Number(value) > 365) return 'Cannot exceed 365 days';
        return '';
      case 'cancellation_policy':
        if (value && value.length > 2000) return 'Cancellation policy cannot exceed 2000 characters';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;
    const updatedForm = { ...formData, [name]: finalValue };

    setFormData(updatedForm);

    if (touched[name] || errors[name]) {
      const err = validateField(name, finalValue, updatedForm);
      setErrors(prev => ({ ...prev, [name]: err }));
    }

    // If changing start time, re-validate end time if already touched
    if (name === 'working_hours_start' && touched.working_hours_end) {
      const endErr = validateField('working_hours_end', formData.working_hours_end, updatedForm);
      setErrors(prev => ({ ...prev, working_hours_end: endErr }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value, formData);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = {
      working_hours_start: true,
      working_hours_end: true,
      booking_advance_days: true,
      cancellation_policy: true,
    };
    setTouched(allTouched);

    const newErrors = {};
    const startErr = validateField('working_hours_start', formData.working_hours_start, formData);
    if (startErr) newErrors.working_hours_start = startErr;

    const endErr = validateField('working_hours_end', formData.working_hours_end, formData);
    if (endErr) newErrors.working_hours_end = endErr;

    const daysErr = validateField('booking_advance_days', formData.booking_advance_days, formData);
    if (daysErr) newErrors.booking_advance_days = daysErr;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the highlighted errors before saving');
      return;
    }

    setLoading(true);
    try {
      await api.put('/settings/business-settings', {
        ...formData,
        working_hours_start: formData.working_hours_start.length === 5 ? `${formData.working_hours_start}:00` : formData.working_hours_start,
        working_hours_end: formData.working_hours_end.length === 5 ? `${formData.working_hours_end}:00` : formData.working_hours_end,
        weekly_off_day: Number(formData.weekly_off_day),
        appointment_slot_duration: Number(formData.appointment_slot_duration),
        booking_advance_days: Number(formData.booking_advance_days),
      });
      toast.success('Operational settings updated successfully');
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 3000);
      if (onUpdate) await onUpdate();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const getInputClasses = (fieldName) => {
    const hasError = touched[fieldName] && Boolean(errors[fieldName]);
    return `w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none ${
      hasError
        ? 'bg-red-50/20 dark:bg-red-950/20 border-red-500 dark:border-red-500/80 text-gray-900 dark:text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 shadow-sm shadow-red-500/10'
        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20'
    }`;
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8 animate-in fade-in duration-300">
      
      <div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <RiTimeLine className="text-xl text-brand" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Salon Schedule & Booking Rules</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Working Hours Start */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Opening Time <span className="text-brand">*</span>
            </label>
            <input
              type="time"
              name="working_hours_start"
              value={formData.working_hours_start}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClasses('working_hours_start')}
            />
            {touched.working_hours_start && errors.working_hours_start && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.working_hours_start}</span>
              </p>
            )}
          </div>

          {/* Working Hours End */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Closing Time <span className="text-brand">*</span>
            </label>
            <input
              type="time"
              name="working_hours_end"
              value={formData.working_hours_end}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClasses('working_hours_end')}
            />
            {touched.working_hours_end && errors.working_hours_end && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.working_hours_end}</span>
              </p>
            )}
          </div>

          {/* Weekly Off Day */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Weekly Off Day
            </label>
            <select
              name="weekly_off_day"
              value={formData.weekly_off_day}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClasses('weekly_off_day')}
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>
          </div>

          {/* Appointment Slot Duration */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Slot Duration (Minutes)
            </label>
            <select
              name="appointment_slot_duration"
              value={formData.appointment_slot_duration}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClasses('appointment_slot_duration')}
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>60 Minutes (1 Hour)</option>
            </select>
          </div>

          {/* Booking Advance Days */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Max Booking Advance (Days) <span className="text-brand">*</span>
            </label>
            <input
              type="number"
              name="booking_advance_days"
              value={formData.booking_advance_days}
              onChange={handleChange}
              onBlur={handleBlur}
              min={1}
              max={365}
              className={getInputClasses('booking_advance_days')}
            />
            {touched.booking_advance_days && errors.booking_advance_days && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.booking_advance_days}</span>
              </p>
            )}
          </div>

          {/* Cancellation Policy */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Cancellation Policy <span className="text-xs font-normal text-gray-400">(Optional)</span>
            </label>
            <textarea
              name="cancellation_policy"
              value={formData.cancellation_policy}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={3}
              placeholder="e.g. Cancellations must be made at least 2 hours in advance."
              className={getInputClasses('cancellation_policy')}
            />
            {touched.cancellation_policy && errors.cancellation_policy && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.cancellation_policy}</span>
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Footer Submit Button */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
        <div>
          {isSavedRecently && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
              <RiCheckLine className="text-base" /> Operational settings saved successfully
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand hover:bg-brand-dark active:scale-[0.99] text-white rounded-xl shadow-md shadow-brand/20 font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>
    </form>
  );
}
