'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import { formatCurrency } from '@/lib/utils';
import { RiCloseLine, RiMoneyDollarCircleLine, RiBankCardLine, RiQrCodeLine, RiWallet3Line } from 'react-icons/ri';
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
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handlePayment = async () => {
    if (!customer) {
      toast.error('Customer is required');
      return;
    }

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

      // 2. Add Payment
      const paymentPayload = {
        amount: parseFloat(amountReceived) || totalAmount,
        payment_method: paymentMethod,
      };

      const paymentRes = await api.post(`/invoices/${invoiceId}/payment`, paymentPayload);

      // If appointment exists, mark it as completed
      if (appointmentId) {
        await api.patch(`/appointments/${appointmentId}/status`, { status: 'completed' });
      }

      toast.success('Payment collected successfully!');
      
      // Close and pass invoice data for receipt
      handleClose();
      setTimeout(() => {
        onSuccess(invoiceRes.data, paymentRes.data);
      }, 250);

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={handleClose}>
      <div 
        className={`bg-admin-card text-admin-text w-full max-w-md h-full border-l border-admin-border shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-admin-border bg-admin-surface/50 shrink-0">
          <h2 className="text-xl font-bold">Collect Payment</h2>
          <button onClick={handleClose} className="text-admin-text-secondary hover:text-admin-text p-2 rounded-md hover:bg-admin-surface-light transition-colors">
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-6">
          {/* Summary */}
          <div className="bg-brand/10 border border-brand/20 rounded-xl p-6 text-center">
            <p className="text-sm font-semibold text-brand mb-1">Total Amount Due</p>
            <p className="text-4xl font-black text-brand">{formatCurrency(totalAmount)}</p>
            {customer && (
              <p className="text-sm text-admin-text-secondary mt-2">
                Billed to: <span className="font-bold text-admin-text">{customer.first_name} {customer.last_name}</span>
              </p>
            )}
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-sm font-bold uppercase text-admin-text-secondary mb-3">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? 'border-brand bg-brand/5 text-brand' 
                        : 'border-admin-border bg-admin-surface text-admin-text-secondary hover:border-admin-text-muted hover:text-admin-text'
                    }`}
                  >
                    <Icon className="text-2xl" />
                    <span className="text-sm font-bold">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Received (for partial/extra) */}
          <div>
            <label className="text-sm font-bold text-admin-text mb-1.5 block">Amount Received (₹)</label>
            <input 
              type="number"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              className="w-full bg-admin-surface border border-admin-border focus:border-brand rounded-lg px-4 py-3 text-lg font-bold text-admin-text outline-none transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-admin-border bg-admin-surface/50 shrink-0">
          <button 
            disabled={loading}
            onClick={handlePayment}
            className="w-full py-3.5 px-4 rounded-xl font-bold bg-brand text-white hover:bg-brand-dark transition-colors shadow-lg shadow-brand/25 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2"
          >
            {loading ? <span className="animate-spin text-2xl">⏳</span> : `Collect ${formatCurrency(amountReceived || totalAmount)}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
