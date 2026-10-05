'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useScrollLock } from '@/hooks/useScrollLock';
import { 
  RiCloseLine, 
  RiEdit2Line, 
  RiDeleteBinLine, 
  RiPhoneLine, 
  RiMailLine,
  RiUser3Line,
  RiCalendarCheckLine,
  RiFileTextLine,
  RiWallet3Line,
  RiGiftLine,
  RiVipCrownLine,
  RiBox3Line,
  RiCheckDoubleLine,
  RiLoader4Line,
  RiTimeLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { useConfirm } from '@/context/ConfirmContext';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import VisualAvatar from '@/components/admin/common/VisualAvatar';
import ReceiptModal from '../billing/ReceiptModal';
import AppointmentDetailsDrawer from '../appointments/AppointmentDetailsDrawer';

export default function CustomerProfilePanel({ customer, isOpen, onClose, onEdit, onDelete }) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState('billing');
  const [mounted, setMounted] = useState(false);

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
      setInvoices(invoicesRes.data || []);
      setAppointments(apptsRes.data?.data || apptsRes.data || []);
      setWallet(walletRes.data || []);
      setRewards(rewardsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [redeemingPkgId, setRedeemingPkgId] = useState(null);

  const handleRedeemPackage = async (pkg) => {
    const isConfirmed = await confirm({
      title: 'Redeem Package Session',
      message: `Are you sure you want to redeem 1 session from "${pkg.package_name || `Package #${pkg.package_id}`}"? Remaining sessions: ${pkg.remaining_uses}`,
      confirmText: 'Redeem 1 Session',
    });
    if (!isConfirmed) return;

    try {
      setRedeemingPkgId(pkg.id);
      const res = await api.post(`/catalog/customer-packages/${pkg.id}/redeem`);
      toast.success(res.data?.message || 'Package session redeemed successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to redeem package session');
    } finally {
      setRedeemingPkgId(null);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && customer) {
      fetchData();
    }
  }, [isOpen, customer]);

  if (!mounted || !isOpen || !customer) return null;

  const TABS = ['Billing', 'Wallet', 'Points', 'Packages', 'Membership', 'Appointments'];

  return createPortal(
    <Fragment>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
        onMouseDown={onClose}
      >
        <div 
          className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
          onMouseDown={e => e.stopPropagation()}
        >
          {/* Header Section */}
          <div className="px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Customer Profile</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Comprehensive customer details, history and wallet.</p>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    onClose();
                    setTimeout(() => onEdit && onEdit(customer), 150);
                  }}
                  className="p-2 text-gray-400 hover:text-[#E91E63] dark:hover:text-[#E91E63] rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Edit Customer"
                >
                  <RiEdit2Line className="text-xl" />
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
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl transition-colors text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                >
                  Mark Inactive
                </button>
                <button 
                  onClick={onClose} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <RiCloseLine className="text-2xl" />
                </button>
              </div>
            </div>

            {/* Profile Info Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#151522] border border-gray-100 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-4">
                <VisualAvatar
                  type="customer"
                  image={customer.profile_image_url}
                  name={`${customer.first_name} ${customer.last_name || ''}`}
                  size="xl"
                  shape="rounded"
                  className="w-13 h-13 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {customer.first_name} {customer.last_name || ''}
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 capitalize text-gray-600 dark:text-gray-400">
                      {customer.gender || 'Unknown'}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${customer.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800'}`}>
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {customer.phone && (
                      <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-[#E91E63] transition-colors">
                        <RiPhoneLine className="text-[#E91E63]" /> +91 {customer.phone}
                      </a>
                    )}
                    {customer.email && (
                      <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:text-[#E91E63] transition-colors">
                        <RiMailLine className="text-[#E91E63]" /> {customer.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    onClose();
                    setTimeout(() => router.push(`/billing?customer_id=${customer.id}`), 150);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors font-semibold text-xs text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                  Create Invoice
                </button>
                <button 
                  onClick={() => {
                    onClose();
                    setTimeout(() => router.push(`/appointments?customer_id=${customer.id}`), 150);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#E91E63] hover:bg-[#d81557] text-white font-semibold text-xs transition-colors shadow-md shadow-[#E91E63]/25 cursor-pointer"
                >
                  Book Appointment
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-6 overflow-x-auto mt-4 custom-scrollbar">
              {TABS.map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`pb-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors cursor-pointer ${activeTab === tab.toLowerCase() ? 'border-[#E91E63] text-[#E91E63]' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                >
                  {tab} {tab === 'Points' && `(${profileData?.reward_points || 0})`}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="overflow-y-auto max-h-[calc(100vh-320px)] p-6 sm:p-8 custom-scrollbar">
            {loading ? (
               <div className="flex items-center justify-center py-16">
                 <div className="animate-spin w-8 h-8 border-4 border-[#E91E63] border-t-transparent rounded-full"></div>
               </div>
            ) : (
              <>
                {activeTab === 'billing' && (
                  <div className="space-y-3">
                    {invoices.length === 0 ? (
                      <div className="text-center py-12 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 text-xs">
                        No billing history recorded for this customer.
                      </div>
                    ) : (
                      invoices.map((inv, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 hover:border-[#E91E63]/30 transition-colors">
                          <div>
                            <h4 className="font-bold text-base text-gray-900 dark:text-white">
                              {inv.invoice_number || `#${inv.id?.toString().padStart(5, '0')}`}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {new Date(inv.created_at).toLocaleDateString()} at {new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
                            <div className="text-left sm:text-right">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                                inv.status === 'paid' || inv.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                                inv.status === 'cancelled' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 
                                inv.status === 'partial' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                                'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {inv.status?.toUpperCase()}
                              </span>
                              {inv.total_amount && <h3 className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(inv.total_amount)}</h3>}
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReceipt(inv);
                              }}
                              className="px-3.5 py-1.5 bg-white dark:bg-white/5 hover:bg-[#E91E63]/10 text-[#E91E63] text-xs font-semibold rounded-xl border border-gray-200 dark:border-white/10 transition-colors whitespace-nowrap cursor-pointer"
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
                  <div className="space-y-3">
                    {appointments.length === 0 ? (
                      <div className="text-center py-12 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 text-xs">
                        No appointments found for this customer.
                      </div>
                    ) : (
                      appointments.map((appt, i) => (
                        <div 
                          key={i} 
                          onClick={() => setSelectedAppointment(appt)}
                          className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 sm:p-5 flex justify-between items-center hover:border-[#E91E63]/30 transition-colors cursor-pointer"
                        >
                          <div>
                            <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                              #{appt.id?.toString().padStart(5, '0')} - {appt.service_name || 'Salon Service'}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {new Date(appt.appointment_date).toLocaleDateString()} • {appt.start_time} - {appt.end_time}
                            </p>
                            {appt.staff_name && (
                              <p className="text-xs text-[#E91E63] mt-0.5 font-medium">Stylist: {appt.staff_name}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                              appt.status === 'cancelled' || appt.status === 'no_show' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 
                              appt.status === 'ongoing' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                              'bg-[#E91E63]/10 text-[#E91E63]'
                            }`}>
                              {appt.status?.toUpperCase().replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'wallet' && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-[#E91E63]/10 border border-[#E91E63]/20 text-center">
                       <p className="text-xs font-bold uppercase tracking-wider text-[#E91E63] mb-1">Prepaid Wallet Balance</p>
                       <h2 className="text-3xl sm:text-4xl font-extrabold text-[#E91E63]">{formatCurrency(profileData?.wallet_balance || 0)}</h2>
                    </div>
                    
                    {wallet.length === 0 ? (
                      <div className="text-center py-10 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 text-xs">
                        No wallet transactions recorded.
                      </div>
                    ) : (
                      wallet.map((txn, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                              {txn.type === 'credit' ? 'Added to Wallet' : 'Deducted from Wallet'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{new Date(txn.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className={`font-bold text-sm ${txn.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                            {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'points' && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-center">
                       <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Reward Loyalty Points</p>
                       <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400">{profileData?.reward_points || 0} PTS</h2>
                    </div>

                    {rewards.length === 0 ? (
                      <div className="text-center py-10 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 text-xs">
                        No reward points history found.
                      </div>
                    ) : (
                      rewards.map((txn, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{txn.points_earned > 0 ? 'Points Earned' : 'Points Redeemed'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Invoice #{txn.invoice_id}</p>
                          </div>
                          <div className={`font-bold text-sm ${txn.points_earned > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
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
                      profileData.active_packages.map((pkg, i) => {
                        const isExhausted = pkg.status === 'used' || pkg.remaining_uses <= 0;
                        const isExpired = pkg.status === 'expired' || (pkg.expires_at && new Date(pkg.expires_at) < new Date());
                        const canRedeem = !isExhausted && !isExpired && pkg.status === 'active';
                        const totalUses = pkg.package_max_uses || pkg.remaining_uses;
                        const progressPercent = totalUses > 0 ? Math.min(100, Math.max(0, (pkg.remaining_uses / totalUses) * 100)) : 100;
                        const imgUrl = pkg.image_url ? (
                          pkg.image_url.startsWith('http') 
                            ? pkg.image_url 
                            : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${pkg.image_url.startsWith('/') ? '' : '/'}${pkg.image_url}`
                        ) : null;

                        return (
                          <div key={pkg.id || i} className="bg-white dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
                              <div className="flex items-center gap-3.5">
                                {imgUrl ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={imgUrl}
                                    alt={pkg.package_name || 'Package'}
                                    className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-white/10 shrink-0 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand/20 to-purple-500/20 text-brand flex items-center justify-center shrink-0 border border-brand/20">
                                    <RiBox3Line className="text-2xl" />
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                                    {pkg.package_name || `Package #${pkg.package_id}`}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {pkg.package_price && (
                                      <span className="font-semibold text-brand">
                                        {formatCurrency(pkg.package_price)}
                                      </span>
                                    )}
                                    <span>•</span>
                                    <span>Purchased {pkg.purchased_at ? new Date(pkg.purchased_at).toLocaleDateString() : 'N/A'}</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                {isExpired ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                                    Expired
                                  </span>
                                ) : isExhausted ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                                    Fully Redeemed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Middle Section: Remaining Uses Progress & Expiry */}
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div className="bg-gray-50 dark:bg-white/[0.02] p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">Remaining Sessions</span>
                                  <span className="font-bold text-gray-900 dark:text-white text-sm">
                                    {pkg.remaining_uses} <span className="text-xs font-normal text-gray-400">/ {totalUses}</span>
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      pkg.remaining_uses > 1 ? 'bg-brand' : pkg.remaining_uses === 1 ? 'bg-amber-500' : 'bg-gray-400'
                                    }`}
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>

                              <div className="bg-gray-50 dark:bg-white/[0.02] p-3 rounded-xl border border-gray-100 dark:border-white/5 flex flex-col justify-center">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Validity / Expiry</span>
                                <span className="font-semibold text-gray-900 dark:text-white mt-1 flex items-center gap-1.5">
                                  <RiTimeLine className="text-sm text-gray-400" />
                                  {pkg.expires_at ? new Date(pkg.expires_at).toLocaleDateString() : 'Lifetime Validity'}
                                </span>
                              </div>
                            </div>

                            {/* Action Row */}
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                {canRedeem ? 'Customer can redeem service sessions anytime' : 'No available sessions left to redeem'}
                              </span>
                              <button
                                type="button"
                                disabled={!canRedeem || redeemingPkgId === pkg.id}
                                onClick={() => handleRedeemPackage(pkg)}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                  canRedeem
                                    ? 'bg-brand hover:bg-brand/90 text-white shadow-brand/20 active:scale-95'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-white/10'
                                }`}
                              >
                                {redeemingPkgId === pkg.id ? (
                                  <>
                                    <RiLoader4Line className="animate-spin text-sm" />
                                    <span>Redeeming...</span>
                                  </>
                                ) : (
                                  <>
                                    <RiCheckDoubleLine className="text-sm" />
                                    <span>Redeem 1 Session</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 text-xs">
                        <RiBox3Line className="text-3xl mx-auto mb-2 opacity-30" />
                        No active packages subscribed by this customer yet.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'membership' && (
                  <div className="space-y-4">
                    {profileData?.active_memberships?.length > 0 ? (
                      profileData.active_memberships.map((mem, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-5">
                           <h4 className="font-bold text-base text-gray-900 dark:text-white mb-1">Membership #{mem.membership_id}</h4>
                           <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                             <span>Status: <strong className="text-emerald-600 dark:text-emerald-400">Active</strong></span>
                             <span>Expires: <strong>{new Date(mem.end_date).toLocaleDateString()}</strong></span>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 text-xs">
                        No active memberships currently held.
                      </div>
                    )}
                  </div>
                )}
              </>
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
          onClose();
          setTimeout(() => router.push(`/appointments?appointment_id=${appt.id}`), 150);
        }}
      />
    </Fragment>,
    document.body
  );
}
