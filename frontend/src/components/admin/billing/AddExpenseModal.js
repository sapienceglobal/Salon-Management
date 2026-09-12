import {  useState, useEffect  } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { RiCloseLine } from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AddExpenseModal({ isOpen, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category_id: '',
    amount: '',
    tax_percent: 0,
    payment_method: 'cash',
    reference_number: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      fetchCategories();
      setFormData({
        expense_date: new Date().toISOString().split('T')[0],
        category_id: '',
        amount: '',
        tax_percent: 0,
        payment_method: 'cash',
        reference_number: '',
        description: ''
      });
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/expenses/categories');
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
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

  const grossAmount = parseFloat(formData.amount) || 0;
  const taxPercent = parseFloat(formData.tax_percent) || 0;
  const tax = grossAmount - (grossAmount / (1 + taxPercent / 100));
  const netAmount = grossAmount - tax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.expense_date || !formData.category_id || !formData.payment_method) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        category_id: parseInt(formData.category_id),
        amount: parseFloat(grossAmount.toFixed(2)),
        tax_amount: parseFloat(tax.toFixed(2)),
        payment_method: formData.payment_method,
        expense_date: formData.expense_date,
        description: formData.description + (formData.reference_number ? ` [Ref: ${formData.reference_number}]` : '')
      };

      await api.post('/expenses', payload);
      toast.success('Expense added successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to add expense');
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-admin-border bg-admin-surface/50 shrink-0">
          <h2 className="text-xl font-bold">Add Expense</h2>
          <button onClick={handleClose} className="text-admin-text-secondary hover:text-admin-text p-2 rounded-md hover:bg-admin-surface-light transition-colors">
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-admin-text mb-1.5 block">Date</label>
              <input
                type="date"
                required
                value={formData.expense_date}
                onChange={e => setFormData({...formData, expense_date: e.target.value})}
                className="w-full bg-admin-surface border border-admin-border focus:border-brand rounded-xl px-4 py-3 text-sm text-admin-text outline-none transition-colors [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-admin-text mb-1.5 block">Entry Type</label>
              <select
                required
                value={formData.category_id}
                onChange={e => setFormData({...formData, category_id: e.target.value})}
                className="w-full bg-admin-surface border border-admin-border focus:border-brand rounded-xl px-4 py-3 text-sm text-admin-text outline-none transition-colors appearance-none"
              >
                <option value="" disabled>Select Entry Type</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-admin-text mb-1.5 block">Paid Amount (₹)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className="w-full bg-admin-surface border border-admin-border focus:border-brand rounded-xl px-4 py-3 text-lg font-bold text-admin-text outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-admin-text mb-1.5 block">Tax Applied</label>
              <select
                value={formData.tax_percent}
                onChange={e => setFormData({...formData, tax_percent: e.target.value})}
                className="w-full bg-admin-surface border border-admin-border focus:border-brand rounded-xl px-4 py-3 text-sm text-admin-text outline-none transition-colors appearance-none"
              >
                <option value="0">No Tax</option>
                <option value="5">GST 5%</option>
                <option value="12">GST 12%</option>
                <option value="18">GST 18%</option>
                <option value="28">GST 28%</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-admin-text mb-1.5 block">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {['cash', 'card', 'upi', 'bank_transfer'].map(method => (
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
                    {method.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-admin-surface p-4 rounded-xl border border-admin-border/50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-admin-text-secondary">Net Amount</span>
                <span className="text-sm font-bold text-admin-text">₹{netAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-admin-text-secondary">Tax Amount</span>
                <span className="text-sm font-bold text-admin-text">₹{tax.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-admin-text mb-1.5 block">Reference Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. INV-12345"
                value={formData.reference_number}
                onChange={e => setFormData({...formData, reference_number: e.target.value})}
                className="w-full bg-admin-surface border border-admin-border focus:border-brand rounded-xl px-4 py-3 text-sm text-admin-text outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-admin-text mb-1.5 block">Notes (Optional)</label>
              <textarea
                placeholder="Any additional details"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-admin-surface border border-admin-border focus:border-brand rounded-xl px-4 py-3 text-sm text-admin-text outline-none transition-colors h-24 resize-none"
              />
            </div>
            
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-admin-border bg-admin-surface/50 shrink-0 flex gap-4">
          <button
            onClick={handleClose}
            className="flex-1 py-3.5 px-4 rounded-xl border border-admin-border text-admin-text font-bold hover:bg-admin-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-3.5 px-4 rounded-xl font-bold bg-brand text-white hover:bg-brand-dark transition-colors shadow-lg shadow-brand/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
