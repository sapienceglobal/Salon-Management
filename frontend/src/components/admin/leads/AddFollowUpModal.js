'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getInitials } from '@/lib/utils';
import {
  RiCalendarCheckLine,
  RiCloseLine,
  RiPhoneLine,
  RiWhatsappLine,
  RiMailLine,
  RiMapPinLine,
  RiInstagramLine,
  RiTimeLine,
  RiCalendarLine,
  RiListCheck,
  RiUserLine,
  RiAttachmentLine,
  RiInformationLine,
  RiLoader2Line,
  RiGlobalLine,
} from 'react-icons/ri';

export default function AddFollowUpModal({
  isOpen,
  onClose,
  lead,
  staffList = [],
  onSuccess,
  onViewDetails,
}) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    follow_up_date: '',
    follow_up_time: '11:30 AM',
    follow_up_type: 'Phone Call',
    follow_up_status: 'Scheduled',
    notes: '',
    next_action: 'Call Again',
    next_follow_up_date: '',
    assigned_to: '',
    send_reminder: true,
  });

  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format today's date for display (e.g. 2026-08-07)
  const getTodayISO = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const getFutureISO = (daysAhead = 5) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (isOpen && lead) {
      setFormData({
        follow_up_date: lead.follow_up_date || getTodayISO(),
        follow_up_time: lead.follow_up_time || '11:30 AM',
        follow_up_type: 'Phone Call',
        follow_up_status: 'Scheduled',
        notes: '',
        next_action: 'Call Again',
        next_follow_up_date: getFutureISO(5),
        assigned_to: lead.assigned_to || (staffList.length > 0 ? staffList[0].id : ''),
        send_reminder: true,
      });
      setSelectedFile(null);
    }
  }, [isOpen, lead, staffList]);

  if (!isOpen || !mounted || !lead) return null;

  const handleWhatsApp = (phone, name) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const msg = encodeURIComponent(
      `Hello ${name || 'there'}, greeting from our salon regarding your enquiry! How can we assist you today?`
    );
    window.open(`https://wa.me/${cleanPhone.replace('+', '')}?text=${msg}`, '_blank');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Attachment size exceeds 5 MB limit');
        return;
      }
      setSelectedFile(file);
      toast.success(`Attached: ${file.name}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.follow_up_date) {
      toast.error('Please specify follow-up date');
      return;
    }

    if (!formData.notes.trim()) {
      toast.error('Please enter discussion notes');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        follow_up_date: formData.follow_up_date,
        follow_up_time: formData.follow_up_time,
        follow_up_type: formData.follow_up_type,
        follow_up_status: formData.follow_up_status,
        notes: formData.notes.trim(),
        next_action: formData.next_action,
        next_follow_up_date: formData.next_follow_up_date,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : undefined,
        send_reminder: formData.send_reminder,
      };

      await api.post(`/leads/${lead.id}/follow-up`, payload);

      toast.success('Follow-up recorded successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save follow-up');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-scaleUp"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* --- Header matching Image 1 --- */}
        <div className="flex items-center justify-between px-6 sm:px-7 py-4.5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-[#E91E63] flex items-center justify-center text-xl shrink-0 shadow-xs border border-pink-100 dark:border-pink-900/40">
              <RiCalendarCheckLine />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Add Follow-Up
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Add a follow-up to track your conversation and next steps.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* --- Lead Profile Summary Banner (Exact Image 1) --- */}
        <div className="px-6 sm:px-7 pt-5 pb-3">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              {lead.avatar_url ? (
                <div className="w-14 h-14 rounded-full overflow-hidden relative ring-2 ring-pink-100 shrink-0 shadow-sm">
                  <Image
                    src={lead.avatar_url}
                    alt={lead.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#E91E63] to-[#FB7185] flex items-center justify-center text-white font-extrabold text-lg shrink-0 shadow-sm">
                  {getInitials(lead.name || 'Lead', '')}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {lead.name}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/70 text-emerald-700 border border-emerald-200/60 capitalize">
                    {lead.status === 'new' ? 'New Lead' : lead.status || 'Active Lead'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {lead.phone && (
                    <div className="flex items-center gap-1.5">
                      <RiPhoneLine className="text-slate-400 text-sm" />
                      <span className="font-semibold">{lead.phone}</span>
                      <button
                        type="button"
                        onClick={() => handleWhatsApp(lead.phone, lead.name)}
                        className="text-emerald-500 hover:text-emerald-600 text-sm ml-0.5"
                        title="Chat on WhatsApp"
                      >
                        <RiWhatsappLine />
                      </button>
                    </div>
                  )}

                  {lead.email && (
                    <div className="flex items-center gap-1.5">
                      <RiMailLine className="text-slate-400 text-sm" />
                      <span className="truncate max-w-[180px]">{lead.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <RiMapPinLine className="text-slate-400 text-sm" />
                    <span>{lead.location || 'Noida, Uttar Pradesh - 201301'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#E91E63] font-semibold">
                    <RiInstagramLine className="text-sm" />
                    <span>Source: {lead.source || 'Instagram'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Right "View Lead Details" action */}
            {onViewDetails && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewDetails(lead);
                }}
                className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#F43F5E] hover:from-[#D81B60] hover:to-[#E11D48] text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                View Lead Details
              </button>
            )}
          </div>
        </div>

        {/* --- Form Section --- */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-7 py-3 space-y-4">
          {/* Row 1: Follow-Up Date & Follow-Up Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Follow-Up Date <span className="text-[#E91E63]">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]"
                />
                <RiCalendarLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Follow-Up Time <span className="text-[#E91E63]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.follow_up_time}
                  onChange={(e) => setFormData({ ...formData, follow_up_time: e.target.value })}
                  placeholder="11:30 AM"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]"
                />
                <RiTimeLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Follow-Up Type & Follow-Up Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Follow-Up Type <span className="text-[#E91E63]">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.follow_up_type}
                  onChange={(e) => setFormData({ ...formData, follow_up_type: e.target.value })}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer appearance-none"
                >
                  <option value="Phone Call">Phone Call</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="Visit / Walk-in">Visit / Walk-in</option>
                  <option value="SMS">SMS</option>
                </select>
                <RiPhoneLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Follow-Up Status <span className="text-[#E91E63]">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.follow_up_status}
                  onChange={(e) => setFormData({ ...formData, follow_up_status: e.target.value })}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer appearance-none"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No Response">No Response</option>
                </select>
                <RiTimeLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500 text-base pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 3: Notes / Discussion (Left) and Next Action Stack (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Notes Textarea */}
            <div>
              <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Notes / Discussion <span className="text-[#E91E63]">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={formData.notes}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) {
                      setFormData({ ...formData, notes: e.target.value });
                    }
                  }}
                  rows={6}
                  placeholder="Enter conversation details, customer response, requirements, etc..."
                  className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] resize-none"
                />
                <span className="absolute bottom-2.5 right-3 text-xs text-slate-400 font-mono">
                  {formData.notes.length}/1000
                </span>
              </div>
            </div>

            {/* Right Stack: Next Action, Next Date, Assign To */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Next Action
                </label>
                <div className="relative">
                  <select
                    value={formData.next_action}
                    onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
                    className="w-full pl-10 pr-8 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer appearance-none"
                  >
                    <option value="Call Again">Call Again</option>
                    <option value="Send Proposal">Send Proposal</option>
                    <option value="Book Appointment">Book Appointment</option>
                    <option value="Follow Up Later">Follow Up Later</option>
                    <option value="Lost / Not Interested">Lost / Not Interested</option>
                  </select>
                  <RiListCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Next Follow-Up Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.next_follow_up_date}
                    onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]"
                  />
                  <RiCalendarLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Assign To
                </label>
                <div className="relative">
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full pl-10 pr-8 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer appearance-none"
                  >
                    <option value="">Select Staff Member</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name || ''} {s.role ? `(${s.role})` : ''}
                      </option>
                    ))}
                  </select>
                  <RiUserLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* --- Attachment (Optional) Box matching Image 1 --- */}
          <div className="p-3.5 rounded-2xl border border-pink-100 dark:border-pink-900/30 bg-[#FFF5F8]/70 dark:bg-pink-950/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/40 text-[#E91E63] flex items-center justify-center text-lg shrink-0">
                <RiAttachmentLine />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white block">
                  Attachment <span className="font-normal text-slate-500">(Optional)</span>
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 block">
                  {selectedFile
                    ? `Selected: ${selectedFile.name}`
                    : 'Upload call recording, images, documents, etc. (Max 5 MB each)'}
                </span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="audio/*,image/*,.pdf,.doc,.docx"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl border border-pink-300 dark:border-pink-800 text-[#E91E63] font-bold text-xs sm:text-xs hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors shrink-0"
            >
              Choose Files
            </button>
          </div>

          {/* --- Reminder Notification Toggle --- */}
          <div className="flex items-center gap-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.send_reminder}
                onChange={(e) => setFormData({ ...formData, send_reminder: e.target.checked })}
                className="w-4 h-4 rounded text-[#E91E63] border-gray-300 focus:ring-[#E91E63]"
              />
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Send reminder notification
              </span>
            </label>
            <span
              className="text-slate-400 text-sm cursor-help"
              title="A notification will be sent to the assigned staff member on the follow-up date."
            >
              <RiInformationLine />
            </span>
          </div>

          {/* --- Footer Buttons --- */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#F43F5E] hover:from-[#D81B60] hover:to-[#E11D48] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <RiLoader2Line className="animate-spin text-base" />}
              <span>Save Follow-Up</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
