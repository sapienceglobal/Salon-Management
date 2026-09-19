import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

export default function OperationsTab({ settings, onUpdate }) {
  const [formData, setFormData] = useState({
    working_hours_start: '09:00:00',
    working_hours_end: '21:00:00',
    weekly_off_day: 1,
    appointment_slot_duration: 30,
    booking_advance_days: 30,
    cancellation_policy: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        working_hours_start: settings.working_hours_start || '09:00:00',
        working_hours_end: settings.working_hours_end || '21:00:00',
        weekly_off_day: settings.weekly_off_day ?? 1,
        appointment_slot_duration: settings.appointment_slot_duration || 30,
        booking_advance_days: settings.booking_advance_days || 30,
        cancellation_policy: settings.cancellation_policy || '',
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/settings/business-settings', formData);
      toast.success('Operational settings updated successfully');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (!settings) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Working Hours Start */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opening Time</label>
          <input
            type="time"
            name="working_hours_start"
            value={formData.working_hours_start}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors text-gray-900 dark:text-white"
            required
          />
        </div>

        {/* Working Hours End */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Closing Time</label>
          <input
            type="time"
            name="working_hours_end"
            value={formData.working_hours_end}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors text-gray-900 dark:text-white"
            required
          />
        </div>

        {/* Weekly Off Day */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weekly Off Day</label>
          <select
            name="weekly_off_day"
            value={formData.weekly_off_day}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors text-gray-900 dark:text-white"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slot Duration (Minutes)</label>
          <select
            name="appointment_slot_duration"
            value={formData.appointment_slot_duration}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors text-gray-900 dark:text-white"
          >
            <option value={15}>15 Minutes</option>
            <option value={30}>30 Minutes</option>
            <option value={45}>45 Minutes</option>
            <option value={60}>60 Minutes (1 Hour)</option>
          </select>
        </div>

        {/* Booking Advance Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Booking Advance (Days)</label>
          <input
            type="number"
            name="booking_advance_days"
            value={formData.booking_advance_days}
            onChange={handleChange}
            min={1}
            max={365}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors text-gray-900 dark:text-white"
          />
        </div>

        {/* Cancellation Policy */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cancellation Policy</label>
          <textarea
            name="cancellation_policy"
            value={formData.cancellation_policy}
            onChange={handleChange}
            rows={3}
            placeholder="E.g., Cancellations must be made 24 hours in advance to avoid a 50% charge."
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors text-gray-900 dark:text-white"
          />
        </div>

      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg shadow-sm shadow-brand/20 font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
