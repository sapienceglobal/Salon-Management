'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import { RiCloseLine, RiEdit2Line, RiDeleteBinLine, RiPhoneLine, RiMailLine, RiUserStarLine } from 'react-icons/ri';
import { useConfirm } from '@/context/ConfirmContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function EnquiryProfilePanel({ enquiry, isOpen, onClose, onEdit, onDelete, onConvert, fetchEnquiries }) {
  const { confirm } = useConfirm();
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && enquiry) {
      setIsClosing(false);
      setActiveTab('info');
    }
  }, [isOpen, enquiry]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      await api.put(`/leads/${enquiry.id}`, { status: newStatus });
      toast.success('Status updated successfully');
      if (fetchEnquiries) fetchEnquiries();
      // Keep panel open
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isOpen || !enquiry) return null;

  const getStatusColor = (status) => {
    const map = {
      new: 'bg-accent-blue/10 text-accent-blue',
      contacted: 'bg-accent-purple/10 text-accent-purple',
      follow_up: 'bg-accent-yellow/10 text-accent-yellow',
      converted: 'bg-accent-green/10 text-accent-green',
      lost: 'bg-accent-red/10 text-accent-red',
    };
    return map[status] || map.new;
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex justify-end ${isClosing ? 'animate-[fadeOut_0.3s_ease_forwards]' : 'animate-[fadeIn_0.3s_ease_forwards]'}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      
      <div className={`relative w-full max-w-xl bg-admin-surface h-full shadow-2xl flex flex-col ${isClosing ? 'animate-[slideRight_0.3s_ease_forwards]' : 'animate-[slideLeft_0.3s_ease_forwards]'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-admin-border bg-admin-card shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-2xl font-bold uppercase">
                {enquiry.name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-admin-text">{enquiry.name}</h2>
                <div className="flex items-center gap-3 text-sm text-admin-text-secondary mt-1">
                  {enquiry.phone && (
                    <div className="flex items-center gap-1"><RiPhoneLine /> {enquiry.phone}</div>
                  )}
                  {enquiry.email && (
                    <div className="flex items-center gap-1"><RiMailLine /> {enquiry.email}</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setTimeout(() => onEdit && onEdit(enquiry), 300);
                }}
                className="p-2 bg-admin-surface-light rounded-lg transition-colors text-admin-text-secondary hover:text-brand border border-admin-border hover:border-brand/30"
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
                    handleClose();
                  }
                }}
                className="px-3 py-1.5 bg-admin-surface-light rounded-lg transition-colors text-xs font-bold text-accent-red hover:bg-accent-red/10 border border-admin-border hover:border-accent-red/30"
              >
                Mark Inactive
              </button>
              <button 
                onClick={handleClose}
                className="p-2 bg-admin-surface-light rounded-lg hover:bg-admin-border text-admin-text-secondary transition-colors border border-admin-border"
              >
                <RiCloseLine className="text-lg" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <select
              value={enquiry.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold border outline-none ${getStatusColor(enquiry.status)}`}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="follow_up">Follow Up</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>

            {enquiry.status !== 'converted' && (
              <button 
                onClick={async () => {
                  const isConfirmed = await confirm({
                    title: 'Convert to Customer',
                    message: 'Convert this enquiry to a full Customer?',
                    confirmText: 'Convert',
                    type: 'warning'
                  });
                  if (isConfirmed) {
                    onConvert && onConvert(enquiry);
                    handleClose();
                  }
                }}
                className="px-4 py-1.5 bg-brand text-white rounded-lg text-sm font-bold shadow-lg shadow-brand/20 hover:bg-brand-light transition-colors flex items-center gap-2"
              >
                <RiUserStarLine /> Convert to Customer
              </button>
            )}
          </div>

          <div className="flex gap-4">
            {['info', 'notes'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-1 text-sm font-bold capitalize transition-colors border-b-2 ${activeTab === tab ? 'border-brand text-brand' : 'border-transparent text-admin-text-secondary hover:text-admin-text'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-admin-surface custom-scrollbar">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="bg-admin-card border border-admin-border rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-bold text-admin-text mb-4">Enquiry Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-admin-text-secondary mb-1">Source</p>
                    <p className="font-medium text-admin-text capitalize">{enquiry.source || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-admin-text-secondary mb-1">Gender</p>
                    <p className="font-medium text-admin-text">{enquiry.gender || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-admin-text-secondary mb-1">Follow Up Date</p>
                    <p className="font-medium text-admin-text">{enquiry.follow_up_date ? new Date(enquiry.follow_up_date).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-admin-text-secondary mb-1">Assigned To</p>
                    <p className="font-medium text-admin-text">
                      {enquiry.assigned_first_name ? `${enquiry.assigned_first_name} ${enquiry.assigned_last_name || ''}` : 'Unassigned'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-admin-text-secondary mb-1">Interested Services</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {enquiry.interested_services && enquiry.interested_services.length > 0 ? (
                        enquiry.interested_services.map((svc, i) => (
                          <span key={i} className="px-2.5 py-1 bg-admin-surface border border-admin-border rounded-lg text-xs font-medium text-admin-text">
                            {svc}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-admin-text-secondary">No services specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="bg-admin-card border border-admin-border rounded-xl p-5 shadow-sm min-h-[200px]">
              <h3 className="text-lg font-bold text-admin-text mb-4">Notes</h3>
              {enquiry.notes ? (
                <p className="text-admin-text whitespace-pre-wrap leading-relaxed">{enquiry.notes}</p>
              ) : (
                <div className="flex flex-col items-center justify-center text-admin-text-secondary py-10 opacity-50">
                  <p>No notes provided</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
