'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import {
  RiCloseLine,
  RiUserLine,
  RiPhoneLine,
  RiMailLine,
  RiCalendarLine,
  RiFileEditLine,
  RiPriceTag3Line,
  RiMapPinLine,
  RiTimeLine,
  RiSaveLine,
  RiSparklingLine,
  RiLoader2Line,
  RiScissorsLine,
} from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AddLeadModal({
  isOpen,
  onClose,
  onSuccess,
  editData = null,
  staffList = [],
  servicesList = [],
}) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    enquiry_date: new Date().toISOString().split('T')[0],
    enquiry_type: 'Service Enquiry',
    source: 'Instagram',
    interested_services: [],
    preferred_branch: 'Downtown Branch',
    preferred_staff_id: '',
    status: 'new',
    follow_up_date: '',
    follow_up_time: '',
    assigned_to: '',
    notes: '',
    avatar_url: '',
    gender: 'Female',
    location: '',
  });

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        let services = [];
        if (Array.isArray(editData.interested_services)) {
          services = editData.interested_services;
        } else if (typeof editData.interested_services === 'string') {
          try {
            services = JSON.parse(editData.interested_services);
          } catch {
            services = [editData.interested_services];
          }
        }

        setFormData({
          name: editData.name || '',
          phone: editData.phone || '',
          email: editData.email || '',
          enquiry_date: editData.created_at ? editData.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          enquiry_type: editData.enquiry_type || 'Service Enquiry',
          source: editData.source || 'Instagram',
          interested_services: services || [],
          preferred_branch: editData.preferred_branch || 'Downtown Branch',
          preferred_staff_id: editData.preferred_staff_id || '',
          status: editData.status || 'new',
          follow_up_date: editData.follow_up_date ? editData.follow_up_date.split('T')[0] : '',
          follow_up_time: editData.follow_up_time || '',
          assigned_to: editData.assigned_to || '',
          notes: editData.notes || '',
          avatar_url: editData.avatar_url || '',
          gender: editData.gender || 'Female',
          location: editData.location || '',
        });
      } else {
        setFormData({
          name: '',
          phone: '',
          email: '',
          enquiry_date: new Date().toISOString().split('T')[0],
          enquiry_type: 'Service Enquiry',
          source: 'Instagram',
          interested_services: [],
          preferred_branch: 'Downtown Branch',
          preferred_staff_id: '',
          status: 'new',
          follow_up_date: '',
          follow_up_time: '',
          assigned_to: '',
          notes: '',
          avatar_url: '',
          gender: 'Female',
          location: '',
        });
      }
    }
  }, [isOpen, editData]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Please enter lead name');
    if (!formData.phone.trim()) return toast.error('Please enter mobile number');

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        source: formData.source,
        enquiry_type: formData.enquiry_type,
        preferred_branch: formData.preferred_branch,
        preferred_staff_id: formData.preferred_staff_id ? Number(formData.preferred_staff_id) : null,
        interested_services: formData.interested_services,
        status: formData.status,
        follow_up_date: formData.follow_up_date || null,
        follow_up_time: formData.follow_up_time || null,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
        notes: formData.notes.trim() || undefined,
        gender: formData.gender,
        location: formData.location.trim() || undefined,
        avatar_url: formData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=E91E63&color=fff`,
      };

      if (editData && editData.id) {
        await api.put(`/leads/${editData.id}`, payload);
        toast.success('Lead updated successfully!');
      } else {
        await api.post('/leads', payload);
        toast.success('Lead added successfully!');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (svcName) => {
    setFormData((prev) => {
      const exists = prev.interested_services.includes(svcName);
      if (exists) {
        return {
          ...prev,
          interested_services: prev.interested_services.filter((s) => s !== svcName),
        };
      }
      return {
        ...prev,
        interested_services: [...prev.interested_services, svcName],
      };
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a2e] w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-[#E91E63] flex items-center justify-center text-xl shrink-0 shadow-xs">
              <RiUserLine />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {editData ? 'Edit Lead' : 'Add Lead'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Capture details of new customer inquiry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <RiCloseLine className="text-lg" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* Row 1: Name & Mobile Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Name <span className="text-[#E91E63]">*</span>
              </label>
              <div className="relative">
                <RiUserLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-[#E91E63] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Mobile Number <span className="text-[#E91E63]">*</span>
              </label>
              <div className="relative">
                <RiPhoneLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-[#E91E63] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Email & Enquiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-[#E91E63] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Enquiry Date <span className="text-[#E91E63]">*</span>
              </label>
              <div className="relative">
                <RiCalendarLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  type="date"
                  value={formData.enquiry_date}
                  onChange={(e) => setFormData({ ...formData, enquiry_date: e.target.value })}
                  required
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 outline-none focus:border-[#E91E63] transition-colors dark:[color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Enquiry Type & Lead Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Enquiry Type <span className="text-[#E91E63]">*</span>
              </label>
              <div className="relative">
                <RiFileEditLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E91E63] text-base pointer-events-none" />
                <select
                  value={formData.enquiry_type}
                  onChange={(e) => setFormData({ ...formData, enquiry_type: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 outline-none focus:border-[#E91E63] transition-colors cursor-pointer appearance-none"
                >
                  <option value="Service Enquiry">Service Enquiry</option>
                  <option value="Package Enquiry">Package Enquiry</option>
                  <option value="Bridal Consultation">Bridal Consultation</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Walk-in Consultation">Walk-in Consultation</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Lead Source <span className="text-[#E91E63]">*</span>
              </label>
              <div className="relative">
                <RiScissorsLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E91E63] text-base pointer-events-none" />
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 outline-none focus:border-[#E91E63] transition-colors cursor-pointer appearance-none"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="Website">Website</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Referral">Referral</option>
                  <option value="Phone Call">Phone Call</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 4: Interested In & Preferred Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Interested In (Services)
              </label>
              <div className="relative">
                <RiPriceTag3Line className="absolute left-3.5 top-3 text-[#E91E63] text-base pointer-events-none" />
                <div className="min-h-[44px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-2 py-1.5 flex flex-wrap gap-1.5 items-center">
                  {formData.interested_services.map((svc) => (
                    <span
                      key={svc}
                      className="inline-flex items-center gap-1.5 text-xs bg-[#E91E63]/10 text-[#E91E63] px-2.5 py-1 rounded-full font-semibold"
                    >
                      <span>{svc}</span>
                      <button
                        type="button"
                        onClick={() => toggleService(svc)}
                        className="hover:text-red-600 text-xs ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        toggleService(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="bg-transparent text-sm text-gray-600 dark:text-gray-300 outline-none py-1 cursor-pointer font-medium"
                  >
                    <option value="" disabled>
                      + Select Services
                    </option>
                    {[
                      'Hair Spa',
                      'Hair Colour',
                      'Keratin Treatment',
                      'Haircut',
                      'Facial',
                      'Bridal Makeup',
                      'Manicure',
                      'Pedicure',
                      'Smoothening',
                      'Party Makeup',
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Preferred Branch
              </label>
              <div className="relative">
                <RiMapPinLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E91E63] text-base pointer-events-none" />
                <select
                  value={formData.preferred_branch}
                  onChange={(e) => setFormData({ ...formData, preferred_branch: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 outline-none focus:border-[#E91E63] transition-colors cursor-pointer appearance-none"
                >
                  <option value="Downtown Branch">Downtown Branch</option>
                  <option value="Uptown Branch">Uptown Branch</option>
                  <option value="Westside Branch">Westside Branch</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 5: Preferred Staff & Lead Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Preferred Staff
              </label>
              <div className="relative">
                <RiUserLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none" />
                <select
                  value={formData.preferred_staff_id}
                  onChange={(e) => setFormData({ ...formData, preferred_staff_id: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 outline-none focus:border-[#E91E63] transition-colors cursor-pointer appearance-none"
                >
                  <option value="">Any Staff (No preference)</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.first_name} {st.last_name || ''} ({st.designation || 'Stylist'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Lead Status <span className="text-[#E91E63]">*</span>
              </label>
              <div className="relative">
                <RiTimeLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E91E63] text-base pointer-events-none" />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 outline-none focus:border-[#E91E63] transition-colors cursor-pointer appearance-none font-bold capitalize"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="interested">Interested</option>
                  <option value="in_progress">In Progress</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 6: Follow Up Date & Time + Assign To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Follow Up Date & Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-[#E91E63] transition-colors dark:[color-scheme:dark]"
                />
                <input
                  type="time"
                  value={formData.follow_up_time}
                  onChange={(e) => setFormData({ ...formData, follow_up_time: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-[#E91E63] transition-colors dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Assign To
              </label>
              <div className="relative">
                <RiUserLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none" />
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 outline-none focus:border-[#E91E63] transition-colors cursor-pointer appearance-none"
                >
                  <option value="">Select Staff Member</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.first_name} {st.last_name || ''} ({st.designation || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 7: Notes (Optional) with Character Counter */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300">Notes (Optional)</label>
              <span className="text-xs text-gray-400 font-mono">
                {formData.notes.length}/500
              </span>
            </div>
            <textarea
              maxLength={500}
              placeholder="Enter notes about the lead..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-[#E91E63] transition-colors resize-none font-medium"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#F43F5E] hover:from-[#D81B60] hover:to-[#E11D48] text-white text-sm font-bold shadow-md shadow-[#E91E63]/25 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <RiLoader2Line className="animate-spin text-base" />
              ) : (
                <RiSaveLine className="text-base" />
              )}
              <span>{editData ? 'Update Lead' : 'Save Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
