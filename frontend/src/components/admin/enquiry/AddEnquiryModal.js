'use client';

import { useState, useEffect } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { 
  RiCloseLine, 
  RiUserLine, 
  RiPhoneLine, 
  RiMailLine, 
  RiMapPinLine, 
  RiCalendarEventLine, 
  RiQuestionLine,
  RiInformationLine,
  RiQuestionAnswerLine
} from 'react-icons/ri';
import { leadSchema, formatZodErrors } from '@/lib/validations';
import toast from 'react-hot-toast';

export default function AddEnquiryModal({ isOpen, onClose, onEnquiryAdded, enquiryToEdit }) {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', gender: 'Male', location: '',
    source: 'Walk-in', status: 'new', assigned_to: '', follow_up_date: '', notes: ''
  });
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setFieldErrors({});
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
      api.get('/staff', { params: { active_only: true } })
        .then(res => {
          const raw = res.data?.staff || res.data || [];
          setStaffList(Array.isArray(raw) ? raw.filter(s => s.is_active !== false) : []);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError(''); 
    setFieldErrors({});
    
    try {
      const payload = { ...formData };
      if (!payload.assigned_to) delete payload.assigned_to;
      else payload.assigned_to = Number(payload.assigned_to);

      if (!payload.follow_up_date) delete payload.follow_up_date;

      const result = leadSchema.safeParse(payload);
      if (!result.success) {
        setFieldErrors(formatZodErrors(result.error));
        setLoading(false);
        return;
      }

      if (enquiryToEdit) {
        await api.put(`/leads/${enquiryToEdit.id}`, payload);
        toast.success('Enquiry updated successfully');
      } else {
        await api.post('/leads', payload);
        toast.success('Enquiry created successfully');
      }
      
      onEnquiryAdded && onEnquiryAdded();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Failed to save enquiry');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const inputClass = (fieldName) =>
    `w-full bg-gray-50 dark:bg-white/5 border ${fieldErrors[fieldName] ? 'border-red-400 dark:border-red-400/60 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-[#E91E63]'} rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors`;

  const labelClass = 'block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5';

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
              <RiQuestionAnswerLine />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {enquiryToEdit ? 'Edit Customer Enquiry' : 'New Customer Enquiry'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {enquiryToEdit ? 'Update prospective customer inquiry details.' : 'Log a new inquiry, consultation request, or prospective client lead.'}
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

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 sm:px-8 py-6 custom-scrollbar">
          {error && (
            <div className="flex items-center gap-2 p-3.5 mb-5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[13px] font-medium">
              <RiInformationLine className="shrink-0 text-base" />
              {error}
            </div>
          )}
          
          <form id="enquiryForm" onSubmit={handleSubmit} noValidate className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className={labelClass}>Full Name <span className="text-[#E91E63]">*</span></label>
                <div className="relative">
                  <RiUserLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base" />
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    className={`${inputClass('name')} pl-10`}
                    placeholder="Enter full name" 
                  />
                </div>
                {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className={labelClass}>Mobile Number <span className="text-[#E91E63]">*</span></label>
                <div className="relative">
                  <RiPhoneLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base" />
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange}
                    className={`${inputClass('phone')} pl-10`}
                    placeholder="10-digit number" 
                  />
                </div>
                {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base" />
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange}
                    className={`${inputClass('email')} pl-10`}
                    placeholder="Optional" 
                  />
                </div>
                {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
              </div>

              {/* Location */}
              <div>
                <label className={labelClass}>Location / Area</label>
                <div className="relative">
                  <RiMapPinLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base" />
                  <input 
                    name="location" 
                    value={formData.location} 
                    onChange={handleChange}
                    className={`${inputClass('location')} pl-10`}
                    placeholder="City or locality" 
                  />
                </div>
                {fieldErrors.location && <p className="text-red-500 text-xs mt-1">{fieldErrors.location}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gender */}
              <div>
                <label className={labelClass}>Gender</label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange}
                  className={inputClass('gender')}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {fieldErrors.gender && <p className="text-red-500 text-xs mt-1">{fieldErrors.gender}</p>}
              </div>

              {/* Source */}
              <div>
                <label className={labelClass}>Lead Source</label>
                <select 
                  name="source" 
                  value={formData.source} 
                  onChange={handleChange}
                  className={inputClass('source')}
                >
                  <option value="Walk-in">Walk-in</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Google">Google</option>
                  <option value="Referral">Referral</option>
                  <option value="Other">Other</option>
                </select>
                {fieldErrors.source && <p className="text-red-500 text-xs mt-1">{fieldErrors.source}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className={labelClass}>Enquiry Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                  className={inputClass('status')}
                >
                  <option value="new">NEW</option>
                  <option value="contacted">CONTACTED</option>
                  <option value="follow_up">FOLLOW UP</option>
                  <option value="converted">CONVERTED</option>
                  <option value="lost">LOST</option>
                </select>
                {fieldErrors.status && <p className="text-red-500 text-xs mt-1">{fieldErrors.status}</p>}
              </div>

              {/* Assigned To */}
              <div>
                <label className={labelClass}>Assigned Staff</label>
                <select 
                  name="assigned_to" 
                  value={formData.assigned_to} 
                  onChange={handleChange}
                  className={inputClass('assigned_to')}
                >
                  <option value="">Unassigned</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                  ))}
                </select>
                {fieldErrors.assigned_to && <p className="text-red-500 text-xs mt-1">{fieldErrors.assigned_to}</p>}
              </div>
            </div>

            {/* Follow Up Date */}
            <div>
              <label className={labelClass}>Follow-up Date</label>
              <div className="relative">
                <RiCalendarEventLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base" />
                <input 
                  type="date" 
                  name="follow_up_date" 
                  value={formData.follow_up_date} 
                  onChange={handleChange}
                  className={`${inputClass('follow_up_date')} pl-10`} 
                />
              </div>
              {fieldErrors.follow_up_date && <p className="text-red-500 text-xs mt-1">{fieldErrors.follow_up_date}</p>}
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>Requirement / Remarks / Notes</label>
              <textarea 
                name="notes" 
                value={formData.notes} 
                onChange={handleChange} 
                rows="3"
                className={`${inputClass('notes')} resize-none`}
                placeholder="Details of the services inquired, preferred timing, client requirements..."
              />
              {fieldErrors.notes && <p className="text-red-500 text-xs mt-1">{fieldErrors.notes}</p>}
            </div>
            
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="enquiryForm"
            disabled={loading}
            className="px-6 py-2.5 bg-[#E91E63] text-white rounded-xl text-sm font-semibold hover:bg-[#d81557] transition-all disabled:opacity-50 shadow-md shadow-[#E91E63]/25 cursor-pointer"
          >
            {loading ? 'Saving...' : enquiryToEdit ? 'Update Enquiry' : 'Save Enquiry'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
