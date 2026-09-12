'use client';

import {  useState, useEffect  } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { RiCloseLine, RiUserLine, RiPhoneLine, RiMailLine, RiMapPinLine, RiCalendarEventLine } from 'react-icons/ri';

export default function AddEnquiryModal({ isOpen, onClose, onEnquiryAdded, enquiryToEdit }) {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', gender: 'Male', location: '',
    source: 'Walk-in', status: 'new', assigned_to: '', follow_up_date: '', notes: ''
  });
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setError('');
      if (enquiryToEdit) {
        setFormData({
          name: enquiryToEdit.name || '',
          phone: enquiryToEdit.phone || '',
          email: enquiryToEdit.email || '',
          gender: enquiryToEdit.gender || 'Male',
          location: enquiryToEdit.location || '',
          source: enquiryToEdit.source || 'Walk-in',
          status: enquiryToEdit.status || 'new',
          assigned_to: enquiryToEdit.assigned_to || '',
          follow_up_date: enquiryToEdit.follow_up_date ? new Date(enquiryToEdit.follow_up_date).toISOString().split('T')[0] : '',
          notes: enquiryToEdit.notes || ''
        });
      } else {
        setFormData({
          name: '', phone: '', email: '', gender: 'Male', location: '',
          source: 'walk_in', status: 'new', assigned_to: '', follow_up_date: '', notes: ''
        });
      }
    }
  }, [isOpen, enquiryToEdit]);

  // Fetch staff for assignment
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      api.get('/staff').then(res => setStaffList(res.data || [])).catch(console.error);
    }
  }, [isOpen]);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const payload = { ...formData };
      if (!payload.assigned_to) delete payload.assigned_to;
      else payload.assigned_to = Number(payload.assigned_to);

      if (!payload.follow_up_date) delete payload.follow_up_date;

      if (enquiryToEdit) {
        await api.put(`/leads/${enquiryToEdit.id}`, payload);
      } else {
        await api.post('/leads', payload);
      }
      
      onEnquiryAdded();
      handleClose();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Failed to save enquiry');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[110] flex justify-end ${isClosing ? 'animate-[fadeOut_0.3s_ease_forwards]' : 'animate-[fadeIn_0.3s_ease_forwards]'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div 
        className={`bg-admin-card text-admin-text w-full max-w-md h-full border-l border-admin-border shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-admin-border bg-admin-surface/50 shrink-0">
          <h2 className="text-xl font-bold">{enquiryToEdit ? 'Edit Enquiry' : 'Add New Enquiry'}</h2>
          <button onClick={handleClose} className="p-2 hover:bg-admin-surface rounded-full transition-colors text-admin-text-secondary hover:text-admin-text">
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6">
          {error && <div className="p-3 mb-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm">{error}</div>}
          
          <form id="enquiryForm" onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Full Name *</label>
              <div className="relative">
                <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
                <input required name="name" value={formData.name} onChange={handleChange}
                  className="w-full bg-admin-surface border border-admin-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand"
                  placeholder="Enter full name" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Mobile No *</label>
              <div className="relative">
                <RiPhoneLine className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
                <input required name="phone" value={formData.phone} onChange={handleChange}
                  className="w-full bg-admin-surface border border-admin-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand"
                  placeholder="10-digit number" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Email</label>
              <div className="relative">
                <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full bg-admin-surface border border-admin-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand"
                  placeholder="Optional" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3 py-2.5 text-sm text-admin-text outline-none focus:border-brand">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Source</label>
                <select name="source" value={formData.source} onChange={handleChange}
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3 py-2.5 text-sm text-admin-text outline-none focus:border-brand">
                  <option value="Walk-in">Walk-in</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Google">Google</option>
                  <option value="Referral">Referral</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Location</label>
              <div className="relative">
                <RiMapPinLine className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
                <input name="location" value={formData.location} onChange={handleChange}
                  className="w-full bg-admin-surface border border-admin-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand"
                  placeholder="City or Area" />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Lead Status</label>
              <select name="status" value={formData.status} onChange={handleChange}
                className="w-full bg-admin-surface border border-admin-border rounded-xl px-3 py-2.5 text-sm text-admin-text outline-none focus:border-brand">
                <option value="new">NEW</option>
                <option value="contacted">CONTACTED</option>
                <option value="follow_up">FOLLOW UP</option>
                <option value="converted">CONVERTED</option>
                <option value="lost">LOST</option>
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Assigned Staff</label>
              <select name="assigned_to" value={formData.assigned_to} onChange={handleChange}
                className="w-full bg-admin-surface border border-admin-border rounded-xl px-3 py-2.5 text-sm text-admin-text outline-none focus:border-brand">
                <option value="">Unassigned</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </select>
            </div>

            {/* Follow Up Date */}
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Follow-up Date</label>
              <div className="relative">
                <RiCalendarEventLine className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
                <input type="date" name="follow_up_date" value={formData.follow_up_date} onChange={handleChange}
                  className="w-full bg-admin-surface border border-admin-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand [color-scheme:dark] html[data-theme-mode='light']:![color-scheme:light]" />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Latest Note / Description</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3"
                className="w-full bg-admin-surface border border-admin-border rounded-xl p-4 text-sm text-admin-text outline-none focus:border-brand resize-none"
                placeholder="Enter enquiry details or remarks..."></textarea>
            </div>
            
            {/* Footer Buttons attached directly inside the form to avoid excessive empty space */}
            <div className="pt-4 mt-2 border-t border-admin-border flex flex-col sm:flex-row justify-end gap-3">
              <button type="button" onClick={handleClose} disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-admin-border text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface-light text-sm font-bold transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : enquiryToEdit ? 'Update Enquiry' : 'Save Enquiry'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
