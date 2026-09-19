import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { RiAddLine, RiMessage3Line, RiMailSendLine, RiWhatsappLine, RiCloseLine } from 'react-icons/ri';
import { createPortal } from 'react-dom';

export default function NotificationsTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Template Form State
  const [isAdding, setIsAdding] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
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

  const closeDrawer = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsAdding(false);
      setIsClosing(false);
    }, 200);
  };

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/notifications');
      setTemplates(res.data || []);
    } catch (err) {
      console.error(err);
      // Fail gracefully if table doesn't exist yet (not seeded)
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
      closeDrawer();
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

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Templates</h3>
          <p className="text-sm text-gray-500">Configure automated messages sent to customers for bookings and reminders.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-medium"
          >
            <RiAddLine /> Create Template
          </button>
        )}
      </div>

      {/* Add Template Drawer */}
      {isAdding && mounted && createPortal(
        <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={closeDrawer}>
          <div 
            className={`bg-white dark:bg-gray-900 w-full max-w-md h-full border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Notification Template</h2>
                <p className="text-xs text-gray-500 mt-1">Configure automated messages sent to customers.</p>
              </div>
              <button onClick={closeDrawer} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <RiCloseLine className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="notifications-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trigger Event *</label>
                  <select required value={formData.event_type} onChange={e => setFormData({...formData, event_type: e.target.value})}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors" >
                    <option value="appointment_created">Appointment Created (Confirmation)</option>
                    <option value="appointment_reminder">Appointment Reminder (24h before)</option>
                    <option value="appointment_cancelled">Appointment Cancelled</option>
                    <option value="payment_received">Payment Received (Invoice)</option>
                    <option value="feedback_request">Feedback Request (Post-visit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Channel *</label>
                  <select required value={formData.channel} onChange={e => setFormData({...formData, channel: e.target.value})}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors" >
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                {formData.channel === 'email' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email Subject *</label>
                    <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                      placeholder="e.g., Booking Confirmation - Luxe Salon"
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                    <span>Message Body *</span>
                  </label>
                  <textarea required value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})}
                    rows={6}
                    placeholder={`Hi {{customer_name}}, your appointment for {{services}} is confirmed on {{date}} at {{time}}.`}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors font-mono" />
                  <div className="mt-2 bg-gray-100 dark:bg-gray-800/50 p-2 rounded text-[10px] text-gray-600 dark:text-gray-400">
                    <strong>Variables:</strong> {'{{customer_name}}, {{date}}, {{time}}, {{services}}, {{total_amount}}'}
                  </div>
                </div>

                <div className="flex items-center pt-2">
                  <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-brand rounded focus:ring-brand dark:bg-gray-700 dark:border-gray-600" />
                  <label htmlFor="is_active" className="ml-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Activate this template immediately
                  </label>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 flex justify-end gap-3">
              <button type="button" onClick={closeDrawer} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" form="notifications-form" disabled={submitting} className="px-5 py-2.5 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-70 shadow-sm">
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
          <div className="py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/30">
            No notification templates configured.
          </div>
        ) : (
          templates.map(template => (
            <div key={template.id} className="p-5 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-10 w-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    {getChannelIcon(template.channel)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{formatEventType(template.event_type)}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                        ${template.channel === 'sms' ? 'bg-blue-100 text-blue-800' : template.channel === 'email' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}
                      `}>
                        {template.channel}
                      </span>
                    </div>
                    {template.subject && <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject: {template.subject}</p>}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 mt-2">
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
