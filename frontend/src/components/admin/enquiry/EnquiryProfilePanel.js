'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  RiCloseLine, 
  RiPhoneLine, 
  RiMailLine, 
  RiCalendarEventLine, 
  RiEdit2Line, 
  RiUserStarLine, 
  RiDeleteBinLine, 
  RiQuestionAnswerLine,
  RiArchiveLine,
  RiCheckDoubleLine
} from 'react-icons/ri';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useConfirm } from '@/context/ConfirmContext';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function EnquiryProfilePanel({ isOpen, onClose, enquiry, onEdit, onDelete, onConvert }) {
  const { confirm } = useConfirm();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !enquiry) return null;

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      await api.patch(`/leads/${enquiry.id}/status`, { status: newStatus });
      enquiry.status = newStatus;
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const map = {
      new: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      contacted: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      follow_up: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      converted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      lost: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    };
    return map[status] || map.new;
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-[#E91E63]/10 text-[#E91E63] border border-[#E91E63]/20 flex items-center justify-center text-2xl font-bold uppercase shadow-sm shrink-0">
                {enquiry.name?.charAt(0) || 'E'}
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {enquiry.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {enquiry.phone && (
                    <a href={`tel:${enquiry.phone}`} className="flex items-center gap-1 hover:text-[#E91E63] transition-colors">
                      <RiPhoneLine className="text-[#E91E63]" /> {enquiry.phone}
                    </a>
                  )}
                  {enquiry.email && (
                    <a href={`mailto:${enquiry.email}`} className="flex items-center gap-1 hover:text-[#E91E63] transition-colors">
                      <RiMailLine className="text-[#E91E63]" /> {enquiry.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  onClose();
                  setTimeout(() => onEdit && onEdit(enquiry), 150);
                }}
                className="text-gray-400 hover:text-[#E91E63] dark:hover:text-[#E91E63] p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Edit Enquiry"
              >
                <RiEdit2Line className="text-lg" />
              </button>
              <button 
                onClick={async () => {
                  const isConfirmed = await confirm({
                    title: 'Mark Inactive',
                    message: 'Are you sure you want to mark this enquiry as inactive?',
                    confirmText: 'Mark Inactive'
                  });
                  if (isConfirmed) {
                    onDelete && onDelete(enquiry.id);
                    onClose();
                  }
                }}
                className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Mark Inactive"
              >
                <RiArchiveLine className="text-lg" />
              </button>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <RiCloseLine className="text-2xl" />
              </button>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Status:</label>
              <select
                value={enquiry.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={loading}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none uppercase cursor-pointer ${getStatusColor(enquiry.status)}`}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="follow_up">Follow Up</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            {enquiry.status !== 'converted' && (
              <button 
                onClick={async () => {
                  const isConfirmed = await confirm({
                    title: 'Convert to Customer',
                    message: 'Convert this enquiry to a full Customer in your client base?',
                    confirmText: 'Convert',
                    type: 'warning'
                  });
                  if (isConfirmed) {
                    onConvert && onConvert(enquiry);
                    onClose();
                  }
                }}
                className="px-4 py-1.5 bg-[#E91E63] text-white rounded-xl text-xs font-semibold shadow-md shadow-[#E91E63]/25 hover:bg-[#d81557] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RiUserStarLine className="text-sm" /> Convert to Customer
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-4">
            {['info', 'notes'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-1 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${activeTab === tab ? 'border-[#E91E63] text-[#E91E63]' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                {tab === 'info' ? 'Enquiry Info' : 'Notes & Remarks'}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[calc(100vh-280px)] px-6 sm:px-8 py-6 custom-scrollbar">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Prospect Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <p className="text-gray-400 mb-0.5 text-xs">Source</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">{enquiry.source || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5 text-xs">Gender</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{enquiry.gender || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5 text-xs">Follow Up Date</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {enquiry.follow_up_date ? new Date(enquiry.follow_up_date).toLocaleDateString() : 'Not scheduled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5 text-xs">Assigned Staff</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {enquiry.assigned_first_name ? `${enquiry.assigned_first_name} ${enquiry.assigned_last_name || ''}` : 'Unassigned'}
                    </p>
                  </div>
                  {enquiry.location && (
                    <div className="col-span-2">
                      <p className="text-gray-400 mb-0.5 text-xs">Location / City</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{enquiry.location}</p>
                    </div>
                  )}
                  <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-white/10">
                    <p className="text-gray-400 mb-1.5 text-xs">Interested Services</p>
                    <div className="flex flex-wrap gap-2">
                      {enquiry.interested_services && enquiry.interested_services.length > 0 ? (
                        enquiry.interested_services.map((svc, i) => (
                          <span key={i} className="px-3 py-1 bg-[#E91E63]/10 text-[#E91E63] border border-[#E91E63]/20 rounded-xl text-xs font-semibold">
                            {svc}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No specific services marked</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm min-h-[160px]">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Client Requirements & Notes
              </h3>
              {enquiry.notes ? (
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {enquiry.notes}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 py-10">
                  <p className="text-xs italic">No notes recorded for this enquiry.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
