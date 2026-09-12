'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import { formatCurrency } from '@/lib/utils';
import { 
  RiCloseLine, RiEdit2Line, RiCalendarCheckLine, RiMoneyDollarCircleLine, 
  RiPhoneLine, RiMailLine, RiUserLine, RiScissorsLine, RiTimeLine 
} from 'react-icons/ri';
import api from '@/lib/api';

const STATUS_CONFIG = {
  planned: { label: 'Planned', color: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' },
  ongoing: { label: 'In Progress', color: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20' },
  completed: { label: 'Completed', color: 'bg-accent-green/10 text-accent-green border-accent-green/20' },
  cancelled: { label: 'Cancelled', color: 'bg-accent-red/10 text-accent-red border-accent-red/20' },
};

export default function AppointmentDetailsDrawer({ isOpen, onClose, appointment, onEdit, onStatusUpdate }) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [error, setError] = useState(null);
  
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || !appointment) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setError(null);
    }, 200); // Wait for animation
  };

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
    <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={handleClose}>
      <div 
        className={`bg-admin-card text-admin-text w-full max-w-md h-full border-l border-admin-border shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-admin-border bg-admin-surface/50 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">Appointment Details</h2>
              <span className={`px-2.5 py-1 text-xs font-medium border rounded-full ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-admin-text-secondary mt-1">
              Ref: #{appointment.id?.toString().substring(0, 8).toUpperCase() || 'N/A'}
            </p>
          </div>
          <button onClick={handleClose} className="text-admin-text-secondary hover:text-admin-text p-2 rounded-md hover:bg-admin-surface-light transition-colors">
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-6">
          
          {error && <div className="text-sm text-accent-red font-medium p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg shrink-0">{error}</div>}

          {/* Customer Info */}
          <div className="bg-admin-surface rounded-xl p-5 border border-admin-border shadow-sm">
            <h3 className="text-sm font-semibold text-admin-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
              <RiUserLine className="text-brand" /> Customer Info
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-lg font-bold">{appointment.customer_first_name || 'Walk-in'} {appointment.customer_last_name || ''}</p>
                {isWalkIn && <span className="inline-block mt-1 px-2 py-0.5 text-[0.65rem] uppercase font-bold bg-accent-yellow/10 text-accent-yellow rounded">Walk-In Customer</span>}
              </div>
              
              {appointment.customer_phone && (
                <a href={`tel:${appointment.customer_phone}`} className="flex items-center gap-2 text-sm text-admin-text hover:text-brand transition-colors">
                  <RiPhoneLine className="text-admin-text-muted" /> {appointment.customer_phone}
                </a>
              )}
              
              {appointment.customer_email && (
                <a href={`mailto:${appointment.customer_email}`} className="flex items-center gap-2 text-sm text-admin-text hover:text-brand transition-colors truncate">
                  <RiMailLine className="text-admin-text-muted shrink-0" /> {appointment.customer_email}
                </a>
              )}
            </div>
          </div>

          {/* Service & Schedule */}
          <div className="bg-admin-surface rounded-xl p-5 border border-admin-border shadow-sm">
            <h3 className="text-sm font-semibold text-admin-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
              <RiCalendarCheckLine className="text-brand" /> Service Details
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-admin-text-muted mb-1 flex items-center gap-1.5"><RiScissorsLine /> Service</p>
                  <p className="font-semibold text-base">{appointment.service_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-admin-text-muted mb-1">Price</p>
                  <p className="font-bold text-base text-brand">{formatCurrency(appointment.service_price || 0)}</p>
                </div>
              </div>

              <div className="flex justify-between items-start pt-3 border-t border-admin-border">
                <div>
                  <p className="text-sm text-admin-text-muted mb-1 flex items-center gap-1.5"><RiTimeLine /> Date & Time</p>
                  <p className="font-semibold">{new Date(appointment.appointment_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-sm text-admin-text-secondary mt-0.5">
                    {appointment.start_time?.substring(0, 5)} - {appointment.end_time?.substring(0, 5)} 
                    <span className="opacity-70 ml-1">({appointment.duration_minutes} min)</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-admin-border">
                <p className="text-sm text-admin-text-muted mb-1">Assigned Staff</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-[0.65rem] font-bold text-brand uppercase">
                    {appointment.staff_first_name?.charAt(0) || 'N'}{appointment.staff_last_name?.charAt(0) || 'A'}
                  </div>
                  <p className="font-medium text-sm">{appointment.staff_first_name} {appointment.staff_last_name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-admin-surface rounded-xl p-5 border border-admin-border shadow-sm">
              <h3 className="text-sm font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-admin-text leading-relaxed whitespace-pre-wrap">{appointment.notes}</p>
            </div>
          )}

          {/* Status Updater */}
          <div className="bg-admin-surface rounded-xl p-5 border border-admin-border shadow-sm">
            <h3 className="text-sm font-semibold text-admin-text-secondary uppercase tracking-wider mb-3">Update Status</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                disabled={loadingStatus}
                onClick={() => handleStatusChange('planned')}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${appointment.status === 'planned' ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'border-admin-border hover:bg-admin-surface-light text-admin-text-secondary'}`}
              >
                Planned
              </button>
              <button 
                disabled={loadingStatus}
                onClick={() => handleStatusChange('ongoing')}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${appointment.status === 'ongoing' ? 'bg-accent-yellow/10 border-accent-yellow text-accent-yellow' : 'border-admin-border hover:bg-admin-surface-light text-admin-text-secondary'}`}
              >
                In Progress
              </button>
              <button 
                disabled={loadingStatus}
                onClick={() => handleStatusChange('completed')}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${appointment.status === 'completed' ? 'bg-accent-green/10 border-accent-green text-accent-green' : 'border-admin-border hover:bg-admin-surface-light text-admin-text-secondary'}`}
              >
                Completed
              </button>
              <button 
                disabled={loadingStatus}
                onClick={() => handleStatusChange('cancelled')}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${appointment.status === 'cancelled' ? 'bg-accent-red/10 border-accent-red text-accent-red' : 'border-admin-border hover:bg-admin-surface-light text-admin-text-secondary'}`}
              >
                Cancelled
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-admin-border bg-admin-surface/50 shrink-0 grid grid-cols-2 gap-3">
          <button 
            type="button" 
            onClick={() => {
              handleClose();
              setTimeout(() => {
                onEdit(appointment);
              }, 250);
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium border border-admin-border hover:bg-admin-surface transition-colors w-full"
          >
            <RiEdit2Line /> Edit
          </button>
          
          <button 
            type="button"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold bg-brand text-white hover:bg-brand-dark transition-colors shadow-lg shadow-brand/25 w-full"
            onClick={() => {
              handleClose();
              setTimeout(() => {
                window.location.href = `/billing?appointment_id=${appointment.id}`;
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
