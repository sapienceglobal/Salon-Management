'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import { 
  RiCloseLine, 
  RiUserStarLine, 
  RiMoneyDollarCircleLine, 
  RiScissorsLine, 
  RiCalendarCheckLine, 
  RiDeleteBinLine, 
  RiPhoneLine, 
  RiMailLine,
  RiEdit2Line
} from 'react-icons/ri';
import { formatCurrency, parseSpecializations } from '@/lib/utils';
import api from '@/lib/api';
import { useConfirm } from '@/context/ConfirmContext';
import toast from 'react-hot-toast';

export default function StaffDetailsModal({ isOpen, onClose, staffId, onEdit, onDelete, onStatusChange }) {
  const { confirm } = useConfirm();
  const [mounted, setMounted] = useState(false);
  const [staff, setStaff] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useScrollLock(isOpen);

  const fetchStaffDetails = async (id) => {
    setLoading(true);
    try {
      const [staffRes, perfRes] = await Promise.all([
        api.get(`/staff/${id}`),
        api.get(`/staff/${id}/performance`)
      ]);
      setStaff(staffRes.data);
      setPerformance(perfRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && staffId) {
      fetchStaffDetails(staffId);
    }
  }, [isOpen, staffId]);

  const handleToggleActive = async () => {
    if (!staff) return;
    const newStatus = !staff.is_active;
    setStaff(prev => ({ ...prev, is_active: newStatus }));
    try {
      await api.patch(`/staff/${staff.id}/toggle-active`);
      toast.success(`Staff member marked as ${newStatus ? 'Active' : 'Inactive'}`);
      if (onStatusChange) onStatusChange(staff.id, newStatus);
    } catch (err) {
      setStaff(prev => ({ ...prev, is_active: staff.is_active }));
      toast.error(err.response?.data?.message || 'Failed to update staff status');
    }
  };

  if (!mounted || !isOpen) return null;

  const specs = parseSpecializations(staff?.specializations);

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
        onMouseDown={e => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-8 space-y-6">
            <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse"></div>
              <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse"></div>
            </div>
            <div className="h-28 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse"></div>
          </div>
        ) : staff ? (
          <>
            {/* Modal Header / Profile Card */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-4">
                {staff.avatar_url ? (
                  <img
                    src={staff.avatar_url}
                    alt={`${staff.first_name} ${staff.last_name}`}
                    className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-gray-200 dark:border-white/10 ring-2 ring-[#E91E63]/30 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#E91E63]/10 text-[#E91E63] flex items-center justify-center text-xl shrink-0 font-bold border border-[#E91E63]/20">
                    {staff.first_name ? staff.first_name.charAt(0) : ''}{staff.last_name ? staff.last_name.charAt(0) : ''}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                      {staff.first_name} {staff.last_name}
                    </h2>
                    <button
                      type="button"
                      onClick={handleToggleActive}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                        staff.is_active 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}
                      title={`Click to ${staff.is_active ? 'deactivate' : 'activate'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${staff.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                      {staff.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                    {staff.designation || 'Staff Member'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={async () => {
                    const isConfirmed = await confirm({
                      title: 'Delete Staff',
                      message: 'Are you sure you want to delete this staff member? This cannot be undone.',
                      confirmText: 'Delete'
                    });
                    if (isConfirmed) {
                      onDelete && onDelete(staff.id);
                      onClose();
                    }
                  }} 
                  className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete Staff"
                >
                  <RiDeleteBinLine className="text-xl" />
                </button>
                <button 
                  onClick={onClose} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <RiCloseLine className="text-2xl" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 sm:px-8 py-6 space-y-6 custom-scrollbar">
              
              {/* Contact info strip */}
              <div className="flex flex-wrap gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                {staff.email && (
                  <a href={`mailto:${staff.email}`} className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-[#E91E63] dark:hover:text-[#E91E63] transition-colors">
                    <RiMailLine className="text-base text-[#E91E63]" /> {staff.email}
                  </a>
                )}
                {staff.phone && (
                  <a href={`tel:${staff.phone}`} className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-[#E91E63] dark:hover:text-[#E91E63] transition-colors">
                    <RiPhoneLine className="text-base text-[#E91E63]" /> {staff.phone}
                  </a>
                )}
              </div>

              {/* Performance Metrics for Current Month */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                  <RiUserStarLine className="text-[#E91E63]" /> Current Month Performance
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
                      <RiScissorsLine className="text-base text-[#E91E63]" /> 
                      <span className="text-[11px] font-semibold uppercase">Services</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{performance?.total_services || 0}</div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
                      <RiMoneyDollarCircleLine className="text-base text-emerald-500" /> 
                      <span className="text-[11px] font-semibold uppercase">Revenue</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(performance?.total_revenue || 0)}</div>
                  </div>

                  <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
                      <RiMoneyDollarCircleLine className="text-base text-[#E91E63]" /> 
                      <span className="text-[11px] font-semibold uppercase">Commission</span>
                    </div>
                    <div className="text-xl font-bold text-[#E91E63]">{formatCurrency(performance?.total_commission || 0)}</div>
                  </div>

                  <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 p-4 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-1">
                      <RiCalendarCheckLine className="text-base text-blue-500" /> 
                      <span className="text-[11px] font-semibold uppercase">Attendance</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {performance?.present_days || 0} <span className="text-xs text-gray-400 font-normal">/ {(performance?.present_days || 0) + (performance?.absent_days || 0) + (performance?.half_days || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specializations */}
              {specs.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">
                    Specializations & Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {specs.map((spec, i) => (
                      <span key={i} className="px-3 py-1.5 bg-[#E91E63]/10 text-[#E91E63] border border-[#E91E63]/20 rounded-xl text-xs font-semibold">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {staff.bio && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Bio / Notes
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/5 whitespace-pre-wrap">
                    {staff.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
              <button 
                type="button" 
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              
              <button 
                type="button"
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-[#E91E63] text-white rounded-xl hover:bg-[#d81557] transition-all shadow-md shadow-[#E91E63]/25 cursor-pointer"
                onClick={() => {
                  onClose();
                  setTimeout(() => {
                    onEdit && onEdit(staff);
                  }, 150);
                }}
              >
                <RiEdit2Line className="text-base" /> Edit Profile
              </button>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-gray-400">
            Staff not found.
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
