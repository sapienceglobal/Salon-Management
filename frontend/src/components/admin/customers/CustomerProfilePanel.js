
'use client';

import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useScrollLock } from '@/hooks/useScrollLock';
import { RiCloseLine, RiEdit2Line, RiDeleteBinLine, RiPhoneLine, RiMailLine } from 'react-icons/ri';
import { useConfirm } from '@/context/ConfirmContext';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import ReceiptModal from '../billing/ReceiptModal';
import AppointmentDetailsDrawer from '../appointments/AppointmentDetailsDrawer';

export default function CustomerProfilePanel({ customer, isOpen, onClose, onEdit, onDelete }) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState('billing');
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Data states
  const [profileData, setProfileData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [wallet, setWallet] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && customer) {
      setIsClosing(false);
      fetchData();
    }
  }, [isOpen, customer]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profRes, invoicesRes, apptsRes, walletRes, rewardsRes] = await Promise.all([
        api.get(`/customers/${customer.id}/profile`),
        api.get(`/customers/${customer.id}/visits`),
        api.get(`/appointments?customer_id=${customer.id}`),
        api.get(`/customers/${customer.id}/wallet`),
        api.get(`/customers/${customer.id}/rewards`)
      ]);
      setProfileData(profRes.data);
      setInvoices(invoicesRes.data);
      setAppointments(apptsRes.data?.data || apptsRes.data || []);
      setWallet(walletRes.data);
      setRewards(rewardsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!mounted || !isOpen || !customer) return null;

  const TABS = ['Billing', 'Wallet', 'Points', 'Packages', 'Membership', 'Appointments'];

  return createPortal(
    <Fragment>
      <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.3s_ease_forwards]' : 'animate-[fadeIn_0.3s_ease_forwards]'}`} onMouseDown={handleClose}>
      <div 
        className={`bg-admin-card w-full max-w-2xl h-full shadow-2xl border-l border-admin-border flex flex-col ${isClosing ? 'animate-[slideOutRight_0.3s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        
        {/* Header Section */}
        <div className="p-6 pb-0 border-b border-admin-border shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-admin-text mb-1">Customer Profile</h2>
              <p className="text-sm text-admin-text-secondary">Complete customer information and history</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-admin-surface rounded-full transition-colors text-admin-text-secondary hover:text-admin-text">
              <RiCloseLine className="text-xl" />
            </button>
          </div>

          {/* Profile Info Card */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-admin-surface flex items-center justify-center text-xl font-bold text-brand border border-admin-border">
                {customer.first_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 text-admin-text">
                  {customer.first_name} {customer.last_name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-admin-surface border border-admin-border capitalize text-admin-text">
                    {customer.gender || 'Unknown'}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${customer.is_active ? 'bg-accent-green/10 text-accent-green border-accent-green/20' : 'bg-accent-red/10 text-accent-red border-accent-red/20'}`}>
                    {customer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-admin-text-secondary mt-3">
                  {customer.phone && (
                    <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 hover:text-brand transition-colors">
                      <RiPhoneLine /> +91 {customer.phone}
                    </a>
                  )}
                  {customer.email && (
                    <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 hover:text-brand transition-colors">
                      <RiMailLine /> {customer.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  handleClose();
                  setTimeout(() => onEdit && onEdit(customer), 300);
                }}
                className="p-2 bg-admin-surface-light rounded-lg transition-colors text-admin-text-secondary hover:text-brand border border-admin-border hover:border-brand/30"
                title="Edit Customer"
              >
                <RiEdit2Line className="text-lg" />
              </button>
              <button 
                onClick={async () => {
                  const isConfirmed = await confirm({
                    title: 'Mark Inactive',
                    message: 'Are you sure you want to mark this customer as inactive?',
                    confirmText: 'Mark Inactive'
                  });
                  if (isConfirmed) {
                    onDelete && onDelete(customer.id);
                    handleClose();
                  }
                }}
                className="px-3 py-1.5 bg-admin-surface-light rounded-lg transition-colors text-xs font-bold text-accent-red hover:bg-accent-red/10 border border-admin-border hover:border-accent-red/30"
              >
                Mark Inactive
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button 
              onClick={() => {
                handleClose();
                setTimeout(() => router.push(`/billing?customer_id=${customer.id}`), 300);
              }}
              className="flex-1 py-2.5 rounded-xl border border-admin-border bg-admin-surface-light hover:bg-admin-surface transition-colors font-bold text-sm text-admin-text"
            >
              Create Invoice
            </button>
            <button 
              onClick={() => {
                handleClose();
                setTimeout(() => router.push(`/appointments?customer_id=${customer.id}`), 300);
              }}
              className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-sm transition-colors shadow-lg shadow-brand/20"
            >
              Book Appointment
            </button>
          </div>
          
          <div className="flex justify-center mb-4">
            {/* View More is typically a dropdown for extra actions, but since we have all actions above, we can hide this or use it to expand profile info */}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar">
            {TABS.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.toLowerCase() ? 'border-brand text-brand' : 'border-transparent text-admin-text-secondary hover:text-admin-text'}`}
              >
                {tab} {tab === 'Points' && `(${profileData?.reward_points || 0})`}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-admin-surface/30">
          {loading ? (
             <div className="flex items-center justify-center h-40">
               <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full"></div>
             </div>
          ) : (
            <>
              {activeTab === 'billing' && (
                <div className="space-y-4">
                  {invoices.length === 0 ? (
                    <div className="text-center py-10 bg-admin-card rounded-xl border border-admin-border">
                      <p className="text-admin-text-secondary font-medium">No billing history found.</p>
                    </div>
                  ) : (
                    invoices.map((inv, i) => (
                      <div key={i} className="bg-admin-card border border-admin-border rounded-xl p-5 flex justify-between items-center hover:border-brand/30 transition-colors">
                        <div>
                          <h4 className="font-bold text-lg text-admin-text">{inv.invoice_number || `#${inv.id?.toString().padStart(5, '0')}`}</h4>
                          <p className="text-sm text-admin-text-secondary mt-1">{new Date(inv.created_at).toLocaleDateString()} at {new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                              inv.status === 'paid' || inv.status === 'completed' ? 'bg-accent-green/10 text-accent-green' : 
                              inv.status === 'cancelled' ? 'bg-accent-red/10 text-accent-red' : 
                              inv.status === 'partial' ? 'bg-orange-500/10 text-orange-500' : 
                              'bg-accent-blue/10 text-accent-blue'
                            }`}>
                              {inv.status.toUpperCase()}
                            </span>
                            {inv.total_amount && <h3 className="text-xl font-bold text-admin-text">{formatCurrency(inv.total_amount)}</h3>}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReceipt(inv);
                            }}
                            className="px-4 py-2 bg-admin-surface hover:bg-admin-surface-light text-brand text-sm font-bold rounded-lg border border-admin-border transition-colors whitespace-nowrap"
                          >
                            View Receipt
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <div className="text-center py-10 bg-admin-card rounded-xl border border-admin-border">
                      <p className="text-admin-text-secondary font-medium">No appointments found.</p>
                    </div>
                  ) : (
                    appointments.map((appt, i) => (
                      <div 
                        key={i} 
                        onClick={() => setSelectedAppointment(appt)}
                        className="bg-admin-card border border-admin-border rounded-xl p-5 flex justify-between items-center hover:border-brand/30 transition-colors cursor-pointer"
                      >
                        <div>
                          <h4 className="font-bold text-lg text-admin-text">#{appt.id?.toString().padStart(5, '0')} - {appt.service_name || 'Service'}</h4>
                          <p className="text-sm text-admin-text-secondary mt-1">{new Date(appt.appointment_date).toLocaleDateString()} • {appt.start_time} - {appt.end_time}</p>
                          {appt.staff_name && (
                            <p className="text-xs text-admin-text-muted mt-1">with {appt.staff_name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                            appt.status === 'completed' ? 'bg-accent-green/10 text-accent-green' : 
                            appt.status === 'cancelled' || appt.status === 'no_show' ? 'bg-accent-red/10 text-accent-red' : 
                            appt.status === 'ongoing' ? 'bg-orange-500/10 text-orange-500' : 
                            'bg-brand/10 text-brand'
                          }`}>
                            {appt.status.toUpperCase().replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="space-y-4">
                  <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-admin-card to-admin-surface border border-admin-border text-center">
                     <p className="text-sm text-admin-text-secondary font-bold uppercase tracking-wider mb-2">Wallet Balance</p>
                     <h2 className="text-4xl font-bold text-brand">{formatCurrency(profileData?.wallet_balance || 0)}</h2>
                  </div>
                  
                  {wallet.length === 0 ? (
                    <div className="text-center py-10 bg-admin-card rounded-xl border border-admin-border">
                      <p className="text-admin-text-secondary font-medium">No wallet transactions found.</p>
                    </div>
                  ) : (
                    wallet.map((txn, i) => (
                      <div key={i} className="bg-admin-card border border-admin-border rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-admin-text">{txn.type === 'credit' ? 'Added to Wallet' : 'Deducted from Wallet'}</p>
                          <p className="text-xs text-admin-text-secondary mt-1">{new Date(txn.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className={`font-bold ${txn.type === 'credit' ? 'text-accent-green' : 'text-admin-text'}`}>
                          {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'points' && (
                <div className="space-y-4">
                  {rewards.length === 0 ? (
                    <div className="text-center py-10 bg-admin-card rounded-xl border border-admin-border">
                      <p className="text-admin-text-secondary font-medium">No reward points history found.</p>
                    </div>
                  ) : (
                    rewards.map((txn, i) => (
                      <div key={i} className="bg-admin-card border border-admin-border rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold">{txn.points_earned > 0 ? 'Points Earned' : 'Points Redeemed'}</p>
                          <p className="text-xs text-admin-text-secondary mt-1">Invoice #{txn.invoice_id}</p>
                        </div>
                        <div className={`font-bold ${txn.points_earned > 0 ? 'text-accent-blue' : 'text-admin-text'}`}>
                          {txn.points_earned > 0 ? `+${txn.points_earned}` : `-${txn.points_redeemed}`} PTS
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'packages' && (
                <div className="space-y-4">
                  {profileData?.active_packages?.length > 0 ? (
                    profileData.active_packages.map((pkg, i) => (
                      <div key={i} className="bg-admin-card border border-admin-border rounded-xl p-5">
                         <h4 className="font-bold text-lg mb-1">Package #{pkg.package_id}</h4>
                         <div className="flex justify-between items-center text-sm text-admin-text-secondary mt-4">
                           <span>Status: <strong className="text-accent-green">Active</strong></span>
                           <span>Remaining Uses: <strong>{pkg.remaining_uses}</strong></span>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-admin-card rounded-xl border border-admin-border">
                      <p className="text-admin-text-secondary font-medium">No active packages.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'membership' && (
                <div className="space-y-4">
                  {profileData?.active_memberships?.length > 0 ? (
                    profileData.active_memberships.map((mem, i) => (
                      <div key={i} className="bg-admin-card border border-admin-border rounded-xl p-5">
                         <h4 className="font-bold text-lg mb-1">Membership #{mem.membership_id}</h4>
                         <div className="flex justify-between items-center text-sm text-admin-text-secondary mt-4">
                           <span>Status: <strong className="text-accent-green">Active</strong></span>
                           <span>Expires: <strong>{new Date(mem.end_date).toLocaleDateString()}</strong></span>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-admin-card rounded-xl border border-admin-border">
                      <p className="text-admin-text-secondary font-medium">No active memberships.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </div>
      
      {/* Modals */}
      <ReceiptModal 
        isOpen={!!selectedReceipt} 
        onClose={() => setSelectedReceipt(null)} 
        invoice={selectedReceipt} 
      />
      
      <AppointmentDetailsDrawer 
        isOpen={!!selectedAppointment} 
        onClose={() => setSelectedAppointment(null)} 
        appointment={selectedAppointment}
        onStatusUpdate={(id, newStatus) => {
          setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        }}
        onEdit={(appt) => {
          setSelectedAppointment(null);
          handleClose();
          setTimeout(() => router.push(`/appointments?appointment_id=${appt.id}`), 300);
        }}
      />
    </Fragment>,
    document.body
  );
}
