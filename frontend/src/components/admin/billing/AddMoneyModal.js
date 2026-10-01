'use client';

import { useState, useEffect, useRef } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { 
  RiCloseLine, 
  RiSearchLine, 
  RiAddLine, 
  RiWallet3Line,
  RiCheckLine,
  RiInformationLine
} from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { walletTopupSchema, formatZodErrors } from '@/lib/validations';

export default function AddMoneyModal({ isOpen, onClose, onSuccess, preSelectedCustomer }) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'upi',
    notes: ''
  });

  const searchTimeout = useRef(null);
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (preSelectedCustomer) {
        setSelectedCustomer(preSelectedCustomer);
        setCustomerSearch(preSelectedCustomer.first_name + ' ' + (preSelectedCustomer.last_name || ''));
      } else {
        setSelectedCustomer(null);
        setCustomerSearch('');
      }
      setFormData({
        amount: '',
        payment_method: 'upi',
        notes: ''
      });
      setFieldErrors({});
    }
  }, [isOpen, preSelectedCustomer]);

  const handleSearch = (query) => {
    setCustomerSearch(query);
    if (!query) {
      setCustomers([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get('/customers', { params: { search: query, limit: 5, is_active: 'true' } });
        setCustomers(res.data || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Failed to search customers', error);
      }
    }, 300);
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.first_name + ' ' + (customer.last_name || ''));
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    const payload = {
      amount: parseFloat(formData.amount) || 0,
      payment_method: formData.payment_method,
      notes: formData.notes
    };

    const result = walletTopupSchema.safeParse(payload);
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      return;
    }

    setLoading(true);
    try {
      await api.post('/wallet-rewards/wallet/topup', {
        customer_id: selectedCustomer.id,
        amount: payload.amount,
        description: payload.notes || `Top-up via ${payload.payment_method}`
      });
      toast.success('Money added to wallet successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to add money');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const inputClass = (fieldName) =>
    `w-full bg-gray-50 dark:bg-white/5 border ${fieldErrors[fieldName] ? 'border-red-400 dark:border-red-400/60 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-[#E91E63]'} rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors`;

  const labelClass = 'block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5';

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
              <RiWallet3Line />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Add Money to Wallet
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Top-up customer prepaid balance for future visits.
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
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 sm:px-8 py-6 space-y-5 custom-scrollbar">
          {/* Customer Search */}
          <div className="relative">
            <label className={labelClass}>Customer <span className="text-[#E91E63]">*</span></label>
            <div className="relative">
              <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base" />
              <input
                type="text"
                placeholder="Search customer by name or mobile number"
                value={customerSearch}
                onChange={(e) => {
                  handleSearch(e.target.value);
                  if (selectedCustomer) setSelectedCustomer(null);
                }}
                className={`${inputClass('customer')} pl-10`}
              />
            </div>
            
            {showDropdown && customers.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-[#1e1e36] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                {customers.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 flex flex-col transition-colors border-b border-gray-100 dark:border-white/5 last:border-0 cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.first_name} {c.last_name || ''}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium flex items-center gap-1">
                <RiCheckLine className="text-sm font-bold" /> Selected: {selectedCustomer.first_name} {selectedCustomer.last_name || ''}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Amount to Add (₹) <span className="text-[#E91E63]">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
              <input
                type="number"
                name="amount"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className={`w-full bg-gray-50 dark:bg-white/5 border rounded-2xl py-3 pl-10 pr-4 text-2xl font-bold text-gray-900 dark:text-white outline-none transition-colors ${fieldErrors.amount ? 'border-red-400 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-[#E91E63]'}`}
              />
            </div>
            {fieldErrors.amount && <p className="text-red-500 text-xs mt-1">{fieldErrors.amount}</p>}
          </div>

          <div>
            <label className={labelClass}>Payment Method <span className="text-[#E91E63]">*</span></label>
            <div className="grid grid-cols-3 gap-3">
              {['upi', 'card', 'cash'].map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setFormData({...formData, payment_method: method})}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                    formData.payment_method === method 
                      ? 'border-[#E91E63] bg-[#E91E63]/10 text-[#E91E63] shadow-md shadow-[#E91E63]/15' 
                      : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            {fieldErrors.payment_method && <p className="text-red-500 text-xs mt-1">{fieldErrors.payment_method}</p>}
          </div>

          <div>
            <label className={labelClass}>Notes / Remarks (Optional)</label>
            <textarea
              name="notes"
              placeholder="e.g. Added as promotional offer, advance deposit"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className={`${inputClass('notes')} resize-none`}
            />
            {fieldErrors.notes && <p className="text-red-500 text-xs mt-1">{fieldErrors.notes}</p>}
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
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#E91E63] text-white hover:bg-[#d81557] transition-all shadow-md shadow-[#E91E63]/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[150px]"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <><RiAddLine className="text-lg" /> Add to Wallet</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
