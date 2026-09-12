import {  useState, useEffect, useRef  } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { RiCloseLine, RiSearchLine, RiAddLine } from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { walletTopupSchema, formatZodErrors } from '@/lib/validations';

export default function AddMoneyModal({ isOpen, onClose, onSuccess, preSelectedCustomer }) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'upi', // upi, card, cash
    notes: ''
  });

  const searchTimeout = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={handleClose}>
      <div 
        className={`bg-admin-card text-admin-text w-full max-w-md h-full border-l border-admin-border shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-admin-border bg-admin-surface/50 shrink-0">
          <h2 className="text-xl font-bold">Add Money to Wallet</h2>
          <button onClick={handleClose} className="text-admin-text-secondary hover:text-admin-text p-2 rounded-md hover:bg-admin-surface-light transition-colors">
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-6">
          {/* Customer Search */}
          <div className="relative z-20">
            <label className="text-sm font-bold text-admin-text mb-1.5 block">Customer</label>
            <div className="relative">
              <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-brand text-lg" />
              <input
                type="text"
                placeholder="Search by name or mobile"
                value={customerSearch}
                onChange={(e) => {
                  handleSearch(e.target.value);
                  if (selectedCustomer) setSelectedCustomer(null);
                }}
                className="w-full bg-admin-surface border border-admin-border focus:border-brand rounded-xl pl-12 pr-4 py-3 text-sm text-admin-text outline-none transition-colors"
              />
            </div>
            
            {showDropdown && customers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-admin-card border border-admin-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                {customers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className="w-full px-4 py-3 text-left hover:bg-admin-surface flex flex-col transition-colors border-b border-admin-border/50 last:border-0"
                  >
                    <span className="text-sm font-bold text-admin-text">{c.first_name} {c.last_name}</span>
                    <span className="text-xs text-admin-text-secondary">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <p className="text-xs text-accent-green mt-2 font-medium flex items-center gap-1">
                ✓ Customer selected
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="mt-6">
              <label className="text-sm font-bold text-admin-text mb-1.5 block">Amount to Add (₹)</label>
              <input
                type="number"
                name="amount"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className={`w-full bg-admin-surface border rounded-xl px-4 py-3 text-2xl font-bold text-admin-text outline-none transition-colors ${fieldErrors.amount ? 'border-accent-red focus:border-accent-red' : 'border-admin-border focus:border-brand'}`}
              />
              {fieldErrors.amount && <p className="text-accent-red text-xs mt-1">{fieldErrors.amount}</p>}
            </div>

            <div className="mt-4">
              <label className="text-sm font-bold text-admin-text mb-1.5 block">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {['upi', 'card', 'cash'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({...formData, payment_method: method})}
                    className={`py-2 px-3 rounded-lg border text-sm font-semibold capitalize transition-all ${
                      formData.payment_method === method 
                        ? 'border-brand bg-brand/5 text-brand' 
                        : 'border-admin-border text-admin-text-secondary hover:border-admin-text-muted hover:text-admin-text'
                    }`}
                  >
                    {method.toUpperCase()}
                  </button>
                ))}
              </div>
              {fieldErrors.payment_method && <p className="text-accent-red text-xs mt-1">{fieldErrors.payment_method}</p>}
            </div>

            <div className="mt-4">
              <label className="text-sm font-bold text-admin-text mb-1.5 block">Notes (Optional)</label>
              <textarea
                name="notes"
                placeholder="e.g. Added as promotional offer"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className={`w-full bg-admin-surface border rounded-xl px-4 py-3 text-sm text-admin-text outline-none transition-colors h-24 resize-none ${fieldErrors.notes ? 'border-accent-red focus:border-accent-red' : 'border-admin-border focus:border-brand'}`}
              />
              {fieldErrors.notes && <p className="text-accent-red text-xs mt-1">{fieldErrors.notes}</p>}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-admin-border bg-admin-surface/50 shrink-0">
          <button 
            disabled={loading}
            onClick={handleSubmit}
            className="w-full py-3.5 px-4 rounded-xl font-bold bg-brand text-white hover:bg-brand-dark transition-colors shadow-lg shadow-brand/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <span className="animate-spin text-xl">⏳</span> : <><RiAddLine className="text-xl" /> Add Money to Wallet</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
