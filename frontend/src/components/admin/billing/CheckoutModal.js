'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import { formatCurrency } from '@/lib/utils';
import { 
  RiCloseLine, 
  RiMoneyDollarCircleLine, 
  RiBankCardLine, 
  RiQrCodeLine, 
  RiWallet3Line,
  RiSecurePaymentLine
} from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: RiMoneyDollarCircleLine },
  { id: 'card', label: 'Card (POS)', icon: RiBankCardLine },
  { id: 'upi', label: 'UPI / QR', icon: RiQrCodeLine },
  { id: 'wallet', label: 'Wallet', icon: RiWallet3Line },
];

export default function CheckoutModal({ isOpen, onClose, onSuccess, cart, customer, appointmentId }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState(['cash']);
  const [amountReceived, setAmountReceived] = useState('');
  
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalAmount = cart.reduce((sum, item) => sum + (item.cart_price * item.qty), 0);

  useEffect(() => {
    if (isOpen) {
      setAmountReceived(totalAmount.toString());
    }
  }, [isOpen, totalAmount]);

  if (!mounted || !isOpen) return null;

  const handlePayment = async () => {
    if (!customer) {
      toast.error('Customer is required');
      return;
    }

    const requestedAmount = parseFloat(amountReceived) || totalAmount;
    const isSplit = selectedMethods.includes('wallet') && requestedAmount > (customer?.wallet_balance || 0);
    const secondaryMethod = selectedMethods.find(m => m !== 'wallet');

    setLoading(true);
    try {
      // 1. Create Invoice
      const invoicePayload = {
        customer_id: customer.id,
        appointment_id: appointmentId ? parseInt(appointmentId) : undefined,
        items: cart.map(item => ({
          item_type: item.type ? (item.type.endsWith('s') && item.type !== 'services' ? item.type.slice(0, -1) : (item.type === 'services' ? 'service' : item.type)) : 'service',
          item_id: parseInt(item.id),
          quantity: parseInt(item.qty) || 1,
          unit_price: parseFloat(item.cart_price) || 0,
          staff_member_id: item.staff_member_id ? parseInt(item.staff_member_id) : undefined
        }))
      };

      const invoiceRes = await api.post('/invoices', invoicePayload);
      const invoiceId = invoiceRes.data?.id;

      if (!invoiceId) throw new Error('Failed to create invoice');

      const finalPaymentAmount = (parseFloat(amountReceived) === totalAmount) 
        ? parseFloat(invoiceRes.data.total_amount) 
        : (parseFloat(amountReceived) || totalAmount);

      let finalPaymentRes;

      if (isSplit) {
        const walletAmount = parseFloat(customer.wallet_balance || 0);
        if (walletAmount > 0) {
          await api.post(`/invoices/${invoiceId}/payment`, {
            amount: walletAmount,
            payment_method: 'wallet',
          });
        }
        
        const remainingAmount = parseFloat((finalPaymentAmount - walletAmount).toFixed(2));
        finalPaymentRes = await api.post(`/invoices/${invoiceId}/payment`, {
          amount: remainingAmount,
          payment_method: secondaryMethod,
        });
      } else {
        finalPaymentRes = await api.post(`/invoices/${invoiceId}/payment`, {
          amount: parseFloat(finalPaymentAmount),
          payment_method: selectedMethods[0],
        });
      }

      // If appointment exists, mark it as completed
      if (appointmentId) {
        await api.patch(`/appointments/${appointmentId}/status`, { status: 'completed' });
      }

      toast.success('Payment collected successfully!');
      
      onClose();
      setTimeout(() => {
        onSuccess(invoiceRes.data, finalPaymentRes.data);
      }, 150);

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
              <RiSecurePaymentLine />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Collect Payment
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Process checkout and record customer payment.
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

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 sm:px-8 py-6 space-y-6 custom-scrollbar">
          {/* Summary Card */}
          <div className="bg-[#E91E63]/10 border border-[#E91E63]/20 rounded-2xl p-6 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#E91E63] mb-1">Total Amount Due</p>
            <p className="text-4xl font-extrabold text-[#E91E63]">{formatCurrency(totalAmount)}</p>
            {customer && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                Customer: <span className="font-bold text-gray-900 dark:text-white">{customer.first_name} {customer.last_name || ''}</span>
              </p>
            )}
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Payment Method
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PAYMENT_METHODS.map(method => {
                const Icon = method.icon;
                const isSelected = selectedMethods.includes(method.id);
                const isDisabled = method.id === 'wallet' && (!customer || (customer.wallet_balance || 0) <= 0);
                return (
                  <button
                    key={method.id}
                    disabled={isDisabled}
                    type="button"
                    onClick={() => {
                      const requestedAmount = parseFloat(amountReceived) || totalAmount;
                      const isWalletInsufficient = requestedAmount > (customer?.wallet_balance || 0);

                      if (method.id === 'wallet') {
                        if (isSelected) {
                          setSelectedMethods(selectedMethods.filter(m => m !== 'wallet'));
                        } else {
                          if (isWalletInsufficient) {
                            if (selectedMethods.length === 1 && selectedMethods[0] !== 'wallet') {
                              setSelectedMethods(['wallet', selectedMethods[0]]);
                            } else {
                              setSelectedMethods(['wallet']);
                            }
                          } else {
                            setSelectedMethods(['wallet']);
                          }
                        }
                      } else {
                        if (selectedMethods.includes('wallet') && isWalletInsufficient) {
                          setSelectedMethods(['wallet', method.id]);
                        } else {
                          setSelectedMethods([method.id]);
                        }
                      }
                    }}
                    className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      isDisabled
                        ? 'border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                        : isSelected 
                          ? 'border-[#E91E63] bg-[#E91E63]/10 text-[#E91E63] shadow-md shadow-[#E91E63]/15' 
                          : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="text-2xl" />
                    <span className="text-xs font-bold text-center">
                      {method.label}
                      {method.id === 'wallet' && customer && (
                        <span className="block text-[10px] font-normal opacity-80 mt-0.5 whitespace-nowrap">
                          {formatCurrency(customer.wallet_balance || 0)}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Split warning */}
            {selectedMethods.includes('wallet') && customer && (parseFloat(amountReceived) || totalAmount) > (customer.wallet_balance || 0) && (
               <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-400">
                 Wallet balance ({formatCurrency(customer.wallet_balance || 0)}) is insufficient. Please also select Cash, Card or UPI for the remaining {formatCurrency((parseFloat(amountReceived) || totalAmount) - (customer.wallet_balance || 0))}.
               </div>
            )}
          </div>

          {/* Amount Received */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Amount Received
            </h3>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-base">₹</span>
              <input
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3 pl-9 pr-4 font-bold text-lg text-gray-900 dark:text-white outline-none focus:border-[#E91E63] transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            disabled={
              loading || 
              selectedMethods.length === 0 || 
              (selectedMethods.includes('wallet') && (parseFloat(amountReceived) || totalAmount) > (customer?.wallet_balance || 0) && selectedMethods.length < 2)
            }
            onClick={handlePayment}
            className="px-6 py-2.5 font-bold text-sm bg-[#E91E63] text-white hover:bg-[#d81557] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#E91E63]/25 cursor-pointer flex items-center justify-center min-w-[150px]"
          >
            {loading ? 'Processing...' : `Collect ${formatCurrency(parseFloat(amountReceived) || totalAmount)}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
