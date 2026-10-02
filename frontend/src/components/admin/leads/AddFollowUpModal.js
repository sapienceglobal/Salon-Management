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
  RiInstagramLine,
  RiTimeLine,
  RiCalendarLine,
  RiListCheck,
  RiUserLine,
  RiAttachmentLine,
  RiInformationLine,
  RiLoader2Line,
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
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden relative animate-scaleUp"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* --- Header --- */}
        <div className="flex items-center justify-between px-6 py-3.5 sm:py-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-[#E91E63] flex items-center justify-center text-xl shrink-0 shadow-xs border border-pink-100 dark:border-pink-900/40">
              <RiCalendarCheckLine />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                Add Follow-Up
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Track your client conversation, next action steps, and schedule.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* --- Form Container --- */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Body */}
          <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4">
            {/* Compact Lead Profile Summary Banner */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {lead.avatar_url ? (
                  <div className="w-11 h-11 rounded-full overflow-hidden relative ring-2 ring-pink-100 shrink-0 shadow-xs">
                    <Image
                      src={lead.avatar_url}
                      alt={lead.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#E91E63] to-[#FB7185] flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-xs">
                    {getInitials(lead.name || 'Lead', '')}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      {lead.name}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 capitalize shrink-0">
                      {lead.status === 'new' ? 'New Lead' : lead.status || 'Active Lead'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                    {lead.phone && (
                      <div className="flex items-center gap-1">
                        <RiPhoneLine className="text-slate-400 text-xs shrink-0" />
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
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <RiMailLine className="text-slate-400 text-xs shrink-0" />
                        <span className="truncate max-w-[170px]">{lead.email}</span>
                      </div>
                    )}

                    {lead.source && (
                      <div className="flex items-center gap-1 text-[#E91E63] font-semibold text-[11px]">
                        <RiInstagramLine className="text-xs shrink-0" />
                        <span>Source: {lead.source}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {onViewDetails && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewDetails(lead);
                  }}
                  className="shrink-0 px-3.5 py-1.5 rounded-xl border border-pink-200/80 dark:border-pink-900/40 bg-pink-50 dark:bg-pink-950/30 hover:bg-pink-100 dark:hover:bg-pink-900/50 text-[#E91E63] font-bold text-xs shadow-xs transition-colors self-start sm:self-center cursor-pointer"
                >
                  View Lead Details
                </button>
              )}
            </div>

            {/* --- 2-Column Responsive Layout for Form --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Left Column: Follow-Up Details & Discussion */}
              <div className="space-y-3.5">
                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Follow-Up Date <span className="text-[#E91E63]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.follow_up_date}
                        onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                        required
                        className="w-full pl-9 pr-2.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]"
                      />
                      <RiCalendarLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Follow-Up Time <span className="text-[#E91E63]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.follow_up_time}
                        onChange={(e) => setFormData({ ...formData, follow_up_time: e.target.value })}
                        placeholder="11:30 AM"
                        required
                        className="w-full pl-9 pr-2.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]"
                      />
                      <RiTimeLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Type & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Follow-Up Type <span className="text-[#E91E63]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.follow_up_type}
                        onChange={(e) => setFormData({ ...formData, follow_up_type: e.target.value })}
                        className="w-full pl-9 pr-6 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer"
                      >
                        <option value="Phone Call" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Phone Call</option>
                        <option value="WhatsApp" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">WhatsApp</option>
                        <option value="Email" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Email</option>
                        <option value="Visit / Walk-in" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Visit / Walk-in</option>
                        <option value="SMS" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">SMS</option>
                      </select>
                      <RiPhoneLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Follow-Up Status <span className="text-[#E91E63]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.follow_up_status}
                        onChange={(e) => setFormData({ ...formData, follow_up_status: e.target.value })}
                        className="w-full pl-9 pr-6 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer"
                      >
                        <option value="Scheduled" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Scheduled</option>
                        <option value="Completed" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Completed</option>
                        <option value="Cancelled" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Cancelled</option>
                        <option value="No Response" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">No Response</option>
                      </select>
                      <RiTimeLine className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 text-sm pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Notes Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Notes / Discussion <span className="text-[#E91E63]">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formData.notes.length}/1000
                    </span>
                  </div>
                  <div className="relative">
                    <textarea
                      value={formData.notes}
                      onChange={(e) => {
                        if (e.target.value.length <= 1000) {
                          setFormData({ ...formData, notes: e.target.value });
                        }
                      }}
                      rows={3}
                      placeholder="Enter conversation details, customer requirements, agreed points..."
                      className="w-full p-2.5 sm:p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Next Steps, Assign & Attachment */}
              <div className="space-y-3.5">
                {/* Next Action & Next Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Next Action
                    </label>
                    <div className="relative">
                      <select
                        value={formData.next_action}
                        onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
                        className="w-full pl-9 pr-6 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer"
                      >
                        <option value="Call Again" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Call Again</option>
                        <option value="Send Proposal" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Send Proposal</option>
                        <option value="Book Appointment" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Book Appointment</option>
                        <option value="Follow Up Later" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Follow Up Later</option>
                        <option value="Lost / Not Interested" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Lost / Not Interested</option>
                      </select>
                      <RiListCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Next Follow-Up Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.next_follow_up_date}
                        onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                        className="w-full pl-9 pr-2.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]"
                      />
                      <RiCalendarLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Assign To */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Assign To
                  </label>
                  <div className="relative">
                    <select
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      className="w-full pl-9 pr-6 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer"
                    >
                      <option value="" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Select Staff Member</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id} className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">
                          {s.first_name} {s.last_name || ''} {s.role ? `(${s.role})` : ''}
                        </option>
                      ))}
                    </select>
                    <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                  </div>
                </div>

                {/* Attachment Box */}
                <div className="p-2.5 sm:p-3 rounded-2xl border border-pink-100 dark:border-pink-900/30 bg-[#FFF5F8]/70 dark:bg-pink-950/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/40 text-[#E91E63] flex items-center justify-center text-base shrink-0">
                      <RiAttachmentLine />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">
                        Attachment <span className="font-normal text-slate-500">(Optional)</span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block max-w-[200px] sm:max-w-[240px]">
                        {selectedFile ? selectedFile.name : 'Audio, image, PDF (Max 5 MB)'}
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
                    className="px-3 py-1.5 rounded-xl border border-pink-300 dark:border-pink-800 text-[#E91E63] font-bold text-xs hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors shrink-0 cursor-pointer"
                  >
                    {selectedFile ? 'Change' : 'Choose'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* --- Fixed Footer matching user requirement --- */}
          <div className="shrink-0 px-6 py-3.5 border-t border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.send_reminder}
                  onChange={(e) => setFormData({ ...formData, send_reminder: e.target.checked })}
                  className="w-4 h-4 rounded text-[#E91E63] border-gray-300 focus:ring-[#E91E63] cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Send reminder notification
                </span>
              </label>
              <span
                className="text-slate-400 text-sm cursor-help hover:text-slate-600 dark:hover:text-slate-200"
                title="A notification will be sent to the assigned staff member on the follow-up date."
              >
                <RiInformationLine />
              </span>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#F43F5E] hover:from-[#D81B60] hover:to-[#E11D48] text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading && <RiLoader2Line className="animate-spin text-base" />}
                <span>Save Follow-Up</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
