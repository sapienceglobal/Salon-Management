'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import { RiCloseLine, RiUserStarLine, RiMoneyDollarCircleLine, RiScissorsLine, RiCalendarCheckLine, RiDeleteBinLine, RiPhoneLine, RiMailLine } from 'react-icons/ri';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { useConfirm } from '@/context/ConfirmContext';

export default function StaffDetailsModal({ isOpen, onClose, staffId, onEdit, onDelete }) {
  const { confirm } = useConfirm();
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [staff, setStaff] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && staffId) {
      setIsClosing(false);
      fetchStaffDetails(staffId);
    }
  }, [isOpen, staffId]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200); // match animation duration
  };

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

  if (!mounted || !isOpen) return null;

  const specs = staff?.specializations 
    ? (typeof staff.specializations === 'string' ? JSON.parse(staff.specializations) : staff.specializations)
    : [];

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={handleClose}>
      <div 
        className={`bg-admin-card text-admin-text w-full max-w-[480px] h-full border-l border-admin-border shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex-1 p-6 space-y-6">
            <div className="h-24 bg-admin-surface-light rounded-2xl animate-pulse"></div>
            <div className="h-40 bg-admin-surface-light rounded-2xl animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-admin-surface-light rounded-2xl animate-pulse"></div>
              <div className="h-24 bg-admin-surface-light rounded-2xl animate-pulse"></div>
            </div>
          </div>
        ) : staff ? (
          <>
            {/* Header / Profile Card */}
            <div className="p-6 border-b border-admin-border bg-admin-surface/30 shrink-0 relative">
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button 
                  onClick={async () => {
                    const isConfirmed = await confirm({
                      title: 'Delete Staff',
                      message: 'Are you sure you want to delete this staff member? This cannot be undone.',
                      confirmText: 'Delete'
                    });
                    if (isConfirmed) {
                      onDelete && onDelete(staff.id);
                      handleClose();
                    }
                  }} 
                  className="text-admin-text-secondary hover:text-accent-red p-2 rounded-md hover:bg-accent-red/10 transition-colors"
                  title="Delete Staff"
                >
                  <RiDeleteBinLine className="text-xl" />
                </button>
                <button onClick={handleClose} className="text-admin-text-secondary hover:text-admin-text p-2 rounded-md hover:bg-admin-surface-light transition-colors" title="Close">
                  <RiCloseLine className="text-2xl" />
                </button>
              </div>
              
              <div className="flex items-center gap-5 mt-2">
                <div className="w-20 h-20 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-3xl shrink-0 font-bold border border-brand/20">
                  {staff.first_name.charAt(0)}{staff.last_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{staff.first_name} {staff.last_name}</h2>
                  <div className="flex items-center gap-2 mt-1 mb-2">
                    <span className="text-sm font-semibold text-admin-text-secondary uppercase tracking-wider">{staff.designation || 'Staff'}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-admin-border"></span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${staff.is_active ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' : 'bg-accent-red/10 text-accent-red border border-accent-red/20'}`}>
                      {staff.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <a href={`mailto:${staff.email}`} className="flex items-center gap-1.5 text-sm text-admin-text-muted hover:text-brand transition-colors">
                      <RiMailLine /> {staff.email}
                    </a>
                    <a href={`tel:${staff.phone}`} className="flex items-center gap-1.5 text-sm text-admin-text-muted hover:text-brand transition-colors">
                      <RiPhoneLine /> {staff.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Performance Metrics for Current Month */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-admin-text-muted mb-3 flex items-center gap-2">
                  <RiUserStarLine /> Current Month Performance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-admin-surface-light border border-admin-border p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-admin-text-secondary mb-1">
                      <RiScissorsLine /> <span className="text-xs font-semibold uppercase">Services</span>
                    </div>
                    <div className="text-2xl font-bold">{performance?.total_services || 0}</div>
                  </div>
                  
                  <div className="bg-admin-surface-light border border-admin-border p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-admin-text-secondary mb-1">
                      <RiMoneyDollarCircleLine /> <span className="text-xs font-semibold uppercase">Revenue</span>
                    </div>
                    <div className="text-2xl font-bold text-accent-green">{formatCurrency(performance?.total_revenue || 0)}</div>
                  </div>

                  <div className="bg-admin-surface-light border border-admin-border p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-admin-text-secondary mb-1">
                      <RiMoneyDollarCircleLine /> <span className="text-xs font-semibold uppercase">Commission</span>
                    </div>
                    <div className="text-2xl font-bold text-brand">{formatCurrency(performance?.total_commission || 0)}</div>
                  </div>

                  <div className="bg-admin-surface-light border border-admin-border p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-admin-text-secondary mb-1">
                      <RiCalendarCheckLine /> <span className="text-xs font-semibold uppercase">Attendance</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {performance?.present_days || 0} <span className="text-sm text-admin-text-muted font-normal">/ {performance?.present_days + performance?.absent_days + performance?.half_days || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specializations */}
              {specs.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-admin-text-muted mb-3">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {specs.map((spec, i) => (
                      <span key={i} className="px-3 py-1 bg-admin-surface-light border border-admin-border rounded-lg text-sm font-medium">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {staff.bio && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-admin-text-muted mb-3">Bio / Notes</h3>
                  <p className="text-sm text-admin-text-secondary leading-relaxed bg-admin-surface-light p-4 rounded-2xl border border-admin-border">
                    {staff.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-admin-border bg-admin-surface/50 shrink-0 grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={handleClose}
                className="flex items-center justify-center py-2.5 px-4 rounded-xl font-medium border border-admin-border hover:bg-admin-surface transition-colors w-full"
              >
                Close
              </button>
              
              <button 
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold bg-brand text-white hover:bg-brand-dark transition-colors shadow-lg shadow-brand/25 w-full"
                onClick={() => {
                  handleClose();
                  setTimeout(() => {
                    onEdit && onEdit(staff);
                  }, 250);
                }}
              >
                <RiUserStarLine className="text-lg" /> Edit Profile
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-admin-text-muted">Staff not found.</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
