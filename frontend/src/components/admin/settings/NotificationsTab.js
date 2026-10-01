import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { RiAddLine, RiMessage3Line, RiMailSendLine, RiWhatsappLine, RiCloseLine, RiNotification3Line } from 'react-icons/ri';
import { createPortal } from 'react-dom';

export default function NotificationsTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Template Form State
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ 
    event_type: 'appointment_created', 
    channel: 'sms', 
    subject: '', 
    body: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const closeModal = () => {
    setIsAdding(false);
  };

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/notifications');
      setTemplates(res.data || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status !== 404) {
        toast.error('Failed to load notification templates');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/settings/notifications', formData);
      toast.success('Template saved successfully');
      setFormData({ event_type: 'appointment_created', channel: 'sms', subject: '', body: '', is_active: true });
      closeModal();
      fetchTemplates();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSubmitting(false);
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'sms': return <RiMessage3Line className="text-blue-500" />;
      case 'email': return <RiMailSendLine className="text-orange-500" />;
      case 'whatsapp': return <RiWhatsappLine className="text-green-500" />;
      default: return <RiMessage3Line className="text-gray-500" />;
    }
  };

  const formatEventType = (type) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const inputClass = "w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#E91E63] rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors";
  const labelClass = "block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5";

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Templates</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure automated messages sent to customers for bookings and reminders.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#E91E63] text-white rounded-xl hover:bg-[#d81557] transition-all text-sm font-medium shadow-md shadow-[#E91E63]/25 cursor-pointer"
          >
            <RiAddLine className="text-lg" /> Create Template
          </button>
        )}
      </div>

      {/* Add Template Modal Popup */}
      {isAdding && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
          onMouseDown={closeModal}
        >
          <div 
            className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
                  <RiNotification3Line />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    New Notification Template
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Configure automated messages sent to customers.
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <RiCloseLine className="text-2xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 sm:px-8 py-6 custom-scrollbar">
              <form id="notifications-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={labelClass}>Trigger Event <span className="text-[#E91E63]">*</span></label>
                  <select 
                    required 
                    value={formData.event_type} 
                    onChange={e => setFormData({...formData, event_type: e.target.value})}
                    className={inputClass}
                  >
                    <option value="appointment_created">Appointment Created (Confirmation)</option>
                    <option value="appointment_reminder">Appointment Reminder (24h before)</option>
                    <option value="appointment_cancelled">Appointment Cancelled</option>
                    <option value="payment_received">Payment Received (Invoice)</option>
                    <option value="feedback_request">Feedback Request (Post-visit)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Channel <span className="text-[#E91E63]">*</span></label>
                  <select 
                    required 
                    value={formData.channel} 
                    onChange={e => setFormData({...formData, channel: e.target.value})}
                    className={inputClass}
                  >
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                {formData.channel === 'email' && (
                  <div>
                    <label className={labelClass}>Email Subject <span className="text-[#E91E63]">*</span></label>
                    <input 
                      type="text" 
                      required 
                      value={formData.subject} 
                      onChange={e => setFormData({...formData, subject: e.target.value})}
                      placeholder="e.g., Booking Confirmation - Luxe Salon"
                      className={inputClass} 
                    />
                  </div>
                )}

                <div>
                  <label className={labelClass}>
                    Message Body <span className="text-[#E91E63]">*</span>
                  </label>
                  <textarea 
                    required 
                    value={formData.body} 
                    onChange={e => setFormData({...formData, body: e.target.value})}
                    rows={5}
                    placeholder={`Hi {{customer_name}}, your appointment for {{services}} is confirmed on {{date}} at {{time}}.`}
                    className={`${inputClass} font-mono text-xs`} 
                  />
                  <div className="mt-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-3 rounded-xl text-xs text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-800 dark:text-gray-200">Supported Variables:</strong> <code className="text-[#E91E63] font-mono">{'{{customer_name}}, {{date}}, {{time}}, {{services}}, {{total_amount}}'}</code>
                  </div>
                </div>

                <div className="flex items-center pt-2">
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    checked={formData.is_active} 
                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-[#E91E63] rounded border-gray-300 dark:border-white/10 focus:ring-[#E91E63] cursor-pointer" 
                  />
                  <label htmlFor="is_active" className="ml-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Activate this template immediately
                  </label>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
              <button 
                type="button" 
                onClick={closeModal} 
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="notifications-form" 
                disabled={submitting} 
                className="px-6 py-2.5 text-sm font-semibold bg-[#E91E63] text-white rounded-xl hover:bg-[#d81557] transition-all disabled:opacity-50 shadow-md shadow-[#E91E63]/25 cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Templates List */}
      <div className="space-y-4">
        {templates.length === 0 ? (
          <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02]">
            No notification templates configured.
          </div>
        ) : (
          templates.map(template => (
            <div key={template.id} className="p-5 border border-gray-100 dark:border-white/10 rounded-2xl bg-white dark:bg-[#1a1a2e] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-10 w-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0 text-lg">
                    {getChannelIcon(template.channel)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{formatEventType(template.event_type)}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                        ${template.channel === 'sms' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : template.channel === 'email' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}
                      `}>
                        {template.channel}
                      </span>
                    </div>
                    {template.subject && <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject: {template.subject}</p>}
                    <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5 mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">{template.body}</p>
                    </div>
                  </div>
                </div>
                <div>
                   <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                      ${template.is_active ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'}
                    `}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
