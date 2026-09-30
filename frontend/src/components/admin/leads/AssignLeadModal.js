'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import {
  RiCloseLine,
  RiUserShared2Line,
  RiPhoneLine,
  RiMailLine,
  RiMapPinLine,
  RiInstagramLine,
  RiGlobalLine,
  RiScissorsLine,
  RiCalendarLine,
  RiSearchLine,
  RiCheckboxCircleFill,
  RiLoader2Line,
  RiWhatsappLine,
  RiFileTextLine,
  RiUserLine,
} from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AssignLeadModal({
  isOpen,
  onClose,
  lead,
  staffList = [],
  onSuccess,
}) {
  const [selectedStaffId, setSelectedStaffId] = useState(lead?.assigned_to || (staffList[0]?.id || ''));
  const [searchStaff, setSearchStaff] = useState('');
  const [notes, setNotes] = useState('Assigning this lead for initial follow-up. Please contact and share service details.');
  const [notifyStaff, setNotifyStaff] = useState(true);
  const [loading, setLoading] = useState(false);

  useScrollLock(isOpen);

  const filteredStaff = useMemo(() => {
    if (!searchStaff.trim()) return staffList;
    const q = searchStaff.toLowerCase();
    return staffList.filter(
      (s) =>
        (s.first_name || '').toLowerCase().includes(q) ||
        (s.last_name || '').toLowerCase().includes(q) ||
        (s.designation || '').toLowerCase().includes(q) ||
        (s.branch || s.branch_name || '').toLowerCase().includes(q)
    );
  }, [staffList, searchStaff]);

  if (!isOpen || !lead) return null;

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return toast.error('Please select a staff member');

    setLoading(true);
    try {
      await api.post(`/leads/${lead.id}/assign`, {
        staff_id: Number(selectedStaffId),
        notes: notes.trim() || undefined,
        notify: notifyStaff,
      });

      toast.success('Lead assigned to staff successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to assign lead');
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (src) => {
    if ((src || '').toLowerCase().includes('instagram')) return <RiInstagramLine className="text-pink-500" />;
    return <RiGlobalLine className="text-blue-500" />;
  };

  const interestedServicesText = Array.isArray(lead.interested_services)
    ? lead.interested_services.join(', ')
    : typeof lead.interested_services === 'string'
    ? lead.interested_services.replace(/[\[\]"']/g, '')
    : 'Hair Spa, Hair Colour';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1a2e] w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-pink-950/50 text-[#E91E63] flex items-center justify-center text-xl shrink-0 shadow-xs">
              <RiUserShared2Line />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Assign Lead to Staff
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Assign this lead to a team member for better follow-up and management.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <RiCloseLine className="text-lg" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {/* Top Lead Profile Summary Card */}
          <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={lead.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.name)}&background=E91E63&color=fff`}
                alt={lead.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-white/10 shadow-sm shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {lead.name}
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 capitalize">
                    {lead.status === 'new' ? 'New Lead' : lead.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{lead.phone}</span>
                  <a
                    href={`https://wa.me/${(lead.phone || '').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs hover:scale-110 transition-transform"
                    title="Chat on WhatsApp"
                  >
                    <RiWhatsappLine />
                  </a>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{lead.email || 'No email provided'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                  <RiMapPinLine className="text-sm text-gray-400" />
                  <span>{lead.location || 'Noida, Uttar Pradesh - 201301'}</span>
                </div>
              </div>
            </div>

            {/* Right Meta details */}
            <div className="flex flex-col gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-gray-200/80 dark:border-white/5 md:pl-4 text-xs w-full md:w-auto">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-[#E91E63] flex items-center justify-center text-sm shrink-0">
                  <RiScissorsLine />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-medium">Interested In</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    {interestedServicesText}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center text-sm shrink-0">
                  {getSourceIcon(lead.source)}
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-medium">Lead Source</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    {lead.source || 'Website'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center text-sm shrink-0">
                  <RiCalendarLine />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-medium">Created On</span>
                  <span className="font-semibold text-gray-600 dark:text-gray-400 text-xs">
                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Select Staff Member Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-[13px] font-semibold text-gray-900 dark:text-white">
                Select Staff Member <span className="text-[#E91E63]">*</span>
              </label>
              <span className="text-xs text-gray-400 font-medium">
                {filteredStaff.length} team members available
              </span>
            </div>

            {/* Search staff */}
            <div className="relative mb-3">
              <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
              <input
                type="text"
                placeholder="Search staff by name, role or branch..."
                value={searchStaff}
                onChange={(e) => setSearchStaff(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:border-[#E91E63] transition-colors"
              />
            </div>

            {/* Staff list with custom radio item cards */}
            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {filteredStaff.map((staff) => {
                const isSelected = String(selectedStaffId) === String(staff.id);
                return (
                  <div
                    key={staff.id}
                    onClick={() => setSelectedStaffId(staff.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#E91E63] bg-pink-50/40 dark:bg-pink-950/20 shadow-xs'
                        : 'border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Radio Circle */}
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                          isSelected ? 'border-[#E91E63]' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#E91E63]" />}
                      </div>

                      {/* Staff Avatar */}
                      <img
                        src={staff.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.first_name)}&background=E91E63&color=fff`}
                        alt={staff.first_name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />

                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                          {staff.first_name} {staff.last_name || ''}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {staff.designation || 'Specialist'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">
                        {staff.branch || staff.branch_name || 'Downtown Branch'}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40">
                        Active
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Note (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <RiFileTextLine className="text-[#E91E63]" />
                <span>Add Note (Optional)</span>
              </label>
              <span className="text-xs text-gray-400 font-mono">
                {notes.length}/500
              </span>
            </div>
            <textarea
              maxLength={500}
              placeholder="Add instructions or context for the assigned staff member..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-[#E91E63] transition-colors resize-none"
            />
          </div>

          {/* Notification Checkbox */}
          <label className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifyStaff}
              onChange={(e) => setNotifyStaff(e.target.checked)}
              className="w-4 h-4 rounded text-[#E91E63] border-gray-300 focus:ring-[#E91E63] cursor-pointer"
            />
            <span>Notify staff member by email and in-app notification</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#F43F5E] hover:from-[#D81B60] hover:to-[#E11D48] text-white text-sm font-bold shadow-md shadow-[#E91E63]/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? <RiLoader2Line className="animate-spin text-base" /> : <RiUserShared2Line className="text-base" />}
            <span>Assign Lead</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
