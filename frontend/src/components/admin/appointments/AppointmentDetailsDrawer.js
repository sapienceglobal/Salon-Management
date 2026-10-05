'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import { formatCurrency } from '@/lib/utils';
import { 
  RiCloseLine, RiEdit2Line, RiCalendarCheckLine, RiMoneyDollarCircleLine, 
  RiPhoneLine, RiMailLine, RiUserLine, RiScissorsLine, RiTimeLine,
  RiInformationLine
} from 'react-icons/ri';
import api from '@/lib/api';
import VisualAvatar from '@/components/admin/common/VisualAvatar';

const STATUS_CONFIG = {
  planned: { label: 'Planned', color: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20', dotColor: 'bg-blue-500' },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', dotColor: 'bg-emerald-500' },
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', dotColor: 'bg-amber-500' },
  ongoing: { label: 'In Progress', color: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20', dotColor: 'bg-blue-500' },
  completed: { label: 'Completed', color: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20', dotColor: 'bg-purple-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20', dotColor: 'bg-red-500' },
};

export default function AppointmentDetailsDrawer({ isOpen, onClose, appointment, onEdit, onStatusUpdate }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [error, setError] = useState(null);
  
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || !appointment) return null;

  const handleStatusChange = async (newStatus) => {
    if (appointment.status === newStatus) return;
    setLoadingStatus(true);
    setError(null);
    try {
      await api.patch(`/appointments/${appointment.id}/status`, { status: newStatus });
      if (onStatusUpdate) {
        onStatusUpdate(newStatus);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setLoadingStatus(false);
    }
  };

  const statusConfig = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.planned;
  const isWalkIn = appointment.source === 'walk_in' || appointment.notes?.toLowerCase().includes('walk-in');

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ══════════════════════════════════════════════════════════
            MODAL HEADER
           ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
              <RiCalendarCheckLine />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Appointment Details
                </h2>
                <span className={`px-2.5 py-1 text-[11px] font-bold border rounded-full ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Ref: #{appointment.id?.toString().substring(0, 8).toUpperCase() || 'N/A'}
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

        {/* ══════════════════════════════════════════════════════════
            MODAL BODY
           ══════════════════════════════════════════════════════════ */}
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 sm:px-8 py-6 space-y-5">
          
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[13px] font-medium">
              <RiInformationLine className="shrink-0 text-base" />
              {error}
            </div>
          )}

          {/* ─── Customer Info ─── */}
          <div className="bg-gray-50/60 dark:bg-white/[0.02] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 mb-3.5">
              <RiUserLine className="text-[#E91E63] text-base" />
              <h3 className="text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer Info</h3>
            </div>
            
            <div className="flex items-center gap-4">
              <VisualAvatar
                type="customer"
                image={appointment.customer_avatar_url}
                name={`${appointment.customer_first_name || ''} ${appointment.customer_last_name || ''}`}
                size="lg"
              />
              <div className="space-y-1">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    {appointment.customer_first_name || 'Walk-in'} {appointment.customer_last_name || ''}
                  </p>
                  {isWalkIn && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] uppercase font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded">
                      Walk-In Customer
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-4 pt-1">
                  {appointment.customer_phone && (
                    <a href={`tel:${appointment.customer_phone}`} className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-gray-300 hover:text-[#E91E63] transition-colors">
                      <RiPhoneLine className="text-gray-400 dark:text-gray-500" /> {appointment.customer_phone}
                    </a>
                  )}
                  
                  {appointment.customer_email && (
                    <a href={`mailto:${appointment.customer_email}`} className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-gray-300 hover:text-[#E91E63] transition-colors truncate">
                      <RiMailLine className="text-gray-400 dark:text-gray-500 shrink-0" /> {appointment.customer_email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Service & Schedule ─── */}
          <div className="bg-gray-50/60 dark:bg-white/[0.02] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 mb-3.5">
              <RiScissorsLine className="text-[#E91E63] text-base" />
              <h3 className="text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Service Details</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <VisualAvatar
                    type="service"
                    image={appointment.service_image_url}
                    icon={appointment.service_icon}
                    color={appointment.service_color}
                    name={appointment.service_name}
                    shape="rounded"
                    size="md"
                  />
                  <div>
                    <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-0.5 flex items-center gap-1.5"><RiScissorsLine className="text-[11px]" /> Service</p>
                    <p className="font-bold text-[15px] text-gray-900 dark:text-white">{appointment.service_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-1">Price</p>
                  <p className="font-bold text-[15px] text-[#E91E63]">{formatCurrency(appointment.service_price || 0)}</p>
                </div>
              </div>

              <div className="flex justify-between items-start pt-3 border-t border-gray-200/60 dark:border-white/5">
                <div>
                  <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1.5"><RiTimeLine className="text-[11px]" /> Date & Time</p>
                  <p className="font-bold text-[14px] text-gray-900 dark:text-white">
                    {new Date(appointment.appointment_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {appointment.start_time?.substring(0, 5)} - {appointment.end_time?.substring(0, 5)} 
                    <span className="opacity-70 ml-1">({appointment.duration_minutes} min)</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200/60 dark:border-white/5">
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-1.5">Assigned Staff</p>
                {appointment.staff_member_id || appointment.staff_first_name ? (
                  <div className="flex items-center gap-2.5">
                    <VisualAvatar
                      type="staff"
                      image={appointment.staff_avatar_url}
                      color={appointment.staff_color}
                      name={`${appointment.staff_first_name || ''} ${appointment.staff_last_name || ''}`}
                      size="sm"
                    />
                    <p className="font-semibold text-[14px] text-gray-900 dark:text-white">
                      {appointment.staff_first_name} {appointment.staff_last_name || ''}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                        ?
                      </div>
                      <div>
                        <p className="font-bold text-[13px] text-amber-600 dark:text-amber-400">Unassigned (Nobody Assigned)</p>
                        <p className="text-[11px] text-gray-400">Needs staff assignment</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setTimeout(() => onEdit(appointment), 250);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E91E63] text-white hover:bg-[#D81B60] transition-colors cursor-pointer shadow-xs"
                    >
                      Assign Staff Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Notes ─── */}
          {appointment.notes && (
            <div className="bg-gray-50/60 dark:bg-white/[0.02] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
              <h3 className="text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{appointment.notes}</p>
            </div>
          )}

          {/* ─── Status Updater ─── */}
          <div className="bg-gray-50/60 dark:bg-white/[0.02] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
            <h3 className="text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Update Status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <button
                  key={status}
                  disabled={loadingStatus}
                  onClick={() => handleStatusChange(status)}
                  className={`py-2 px-3 rounded-xl text-[13px] font-semibold border transition-all cursor-pointer ${
                    appointment.status === status
                      ? config.color
                      : 'border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            MODAL FOOTER
           ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
          <button 
            type="button" 
            onClick={() => {
              onClose();
              setTimeout(() => {
                onEdit(appointment);
              }, 250);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <RiEdit2Line className="text-base" /> Edit
          </button>
          
          <button 
            type="button"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-[14px] font-bold shadow-lg shadow-[#E91E63]/25 hover:shadow-[#E91E63]/35 transition-all cursor-pointer"
            onClick={() => {
              onClose();
              setTimeout(() => {
                router.push(`/billing?appointment_id=${appointment.id}`);
              }, 250);
            }}
          >
            <RiMoneyDollarCircleLine className="text-lg" /> Checkout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
