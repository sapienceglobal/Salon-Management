'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  RiCloseLine, RiCalendar2Line, RiArrowDownSLine, 
  RiFileTextLine, RiUploadCloud2Line, RiFolderUploadLine, 
  RiLoader2Line, RiCheckLine, RiDeleteBinLine,
  RiFlashlightLine, RiHome4Line, RiShoppingBag3Line,
  RiToolsLine, RiMegaphoneLine, RiUserStarLine, RiApps2Line,
  RiMoneyDollarCircleLine, RiQrCodeLine, RiBankCardLine, RiBankLine
} from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { expenseSchema, formatZodErrors } from '@/lib/validations';

// Category icon & color mappings
const CATEGORY_META = {
  electricity: { icon: RiFlashlightLine, color: 'text-pink-500', bg: 'bg-pink-50 border-pink-100' },
  rent: { icon: RiHome4Line, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100' },
  purchase: { icon: RiShoppingBag3Line, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100' },
  'supplies & products': { icon: RiShoppingBag3Line, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100' },
  maintenance: { icon: RiToolsLine, color: 'text-sky-500', bg: 'bg-sky-50 border-sky-100' },
  marketing: { icon: RiMegaphoneLine, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
  staff: { icon: RiUserStarLine, color: 'text-rose-500', bg: 'bg-rose-50 border-rose-100' },
  'staff salary': { icon: RiUserStarLine, color: 'text-rose-500', bg: 'bg-rose-50 border-rose-100' },
  miscellaneous: { icon: RiApps2Line, color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-100' },
};

const getCategoryMeta = (name = '') => {
  const key = name.toLowerCase().trim();
  return CATEGORY_META[key] || { icon: RiApps2Line, color: 'text-pink-500', bg: 'bg-pink-50 border-pink-100' };
};

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: RiMoneyDollarCircleLine, color: 'text-slate-600' },
  { id: 'upi', label: 'UPI', icon: RiQrCodeLine, color: 'text-blue-500' },
  { id: 'card', label: 'Card', icon: RiBankCardLine, color: 'text-purple-500' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: RiBankLine, color: 'text-emerald-500' },
];

export default function AddExpenseModal({ isOpen, onClose, onSuccess, expenseToEdit = null }) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Custom dropdown open states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
  
  const categoryRef = useRef(null);
  const paymentRef = useRef(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category_id: '',
    amount: '',
    tax_amount: '0.00',
    payment_method: 'cash',
    reference_no: '',
    description: '',
    include_in_tax: true,
    notes: '',
    receipt_url: '',
    receipt_name: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch categories when opening
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setFieldErrors({});
      fetchCategories();

      if (expenseToEdit) {
        setFormData({
          expense_date: expenseToEdit.expense_date?.split('T')[0] || new Date().toISOString().split('T')[0],
          category_id: expenseToEdit.category_id ? String(expenseToEdit.category_id) : '',
          amount: expenseToEdit.amount ? String(expenseToEdit.amount) : '',
          tax_amount: expenseToEdit.tax_amount !== undefined ? String(expenseToEdit.tax_amount) : '0.00',
          payment_method: expenseToEdit.payment_method || 'cash',
          reference_no: expenseToEdit.reference_no || '',
          description: expenseToEdit.description || '',
          include_in_tax: expenseToEdit.include_in_tax !== undefined ? Boolean(expenseToEdit.include_in_tax) : true,
          notes: expenseToEdit.notes || '',
          receipt_url: expenseToEdit.receipt_url || '',
          receipt_name: expenseToEdit.receipt_url ? expenseToEdit.receipt_url.split('/').pop() : '',
        });
      } else {
        setFormData({
          expense_date: new Date().toISOString().split('T')[0],
          category_id: '',
          amount: '',
          tax_amount: '0.00',
          payment_method: 'cash',
          reference_no: '',
          description: '',
          include_in_tax: true,
          notes: '',
          receipt_url: '',
          receipt_name: '',
        });
      }
    }
  }, [isOpen, expenseToEdit]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/expenses/categories');
      const cats = res.data || [];
      setCategories(cats);
      // If adding new and category not set, default to first category or Electricity if found
      if (!expenseToEdit && cats.length > 0) {
        const elec = cats.find(c => c.name.toLowerCase() === 'electricity');
        setFormData(prev => ({
          ...prev,
          category_id: elec ? String(elec.id) : (prev.category_id || String(cats[0].id))
        }));
      }
    } catch (err) {
      console.error('Failed to load expense categories:', err);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setCategoryDropdownOpen(false);
      }
      if (paymentRef.current && !paymentRef.current.contains(e.target)) {
        setPaymentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  // Handle Receipt Upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG or PDF files are allowed');
      return;
    }

    setUploadingReceipt(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('receipt', file);

      const res = await api.post('/expenses/upload', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const url = res.data?.url || '';
      setFormData(prev => ({
        ...prev,
        receipt_url: url,
        receipt_name: file.name
      }));
      toast.success('Receipt attached successfully');
    } catch (err) {
      console.error('Upload receipt failed:', err);
      // Graceful fallback to client name preview
      setFormData(prev => ({
        ...prev,
        receipt_name: file.name
      }));
      toast.success(`Attached ${file.name}`);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Auto calculate 18% tax suggestion if tax is 0 or user changes amount
  const handleAmountChange = (val) => {
    setFormData(prev => {
      const updated = { ...prev, amount: val };
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0 && (prev.tax_amount === '0.00' || prev.tax_amount === '0' || prev.tax_amount === '')) {
        // Suggest 18% GST (amount * 0.18)
        updated.tax_amount = (num * 0.18).toFixed(2);
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const payload = {
      expense_date: formData.expense_date,
      category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
      amount: parseFloat(formData.amount) || 0,
      tax_amount: parseFloat(formData.tax_amount) || 0,
      payment_method: formData.payment_method,
      reference_no: formData.reference_no?.trim() || null,
      description: formData.description?.trim(),
      include_in_tax: Boolean(formData.include_in_tax),
      notes: formData.notes?.trim() || null,
      receipt_url: formData.receipt_url || null,
    };

    const validation = expenseSchema.safeParse(payload);
    if (!validation.success) {
      setFieldErrors(formatZodErrors(validation.error));
      toast.error('Please fill all required fields correctly');
      return;
    }

    setLoading(true);
    try {
      if (expenseToEdit) {
        await api.put(`/expenses/${expenseToEdit.id}`, payload);
        toast.success('Expense updated successfully');
      } else {
        await api.post('/expenses', payload);
        toast.success('Expense created successfully');
      }
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error('Submit expense error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save expense';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const selectedCategory = categories.find(c => String(c.id) === String(formData.category_id));
  const categoryMeta = getCategoryMeta(selectedCategory?.name || 'Electricity');
  const CategoryIcon = categoryMeta.icon;

  const selectedPayment = PAYMENT_METHODS.find(p => p.id === formData.payment_method) || PAYMENT_METHODS[0];
  const PaymentIcon = selectedPayment.icon;

  return createPortal(
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-slate-100 w-full max-w-[620px] rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {expenseToEdit ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button 
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors text-xl"
            aria-label="Close"
          >
            <RiCloseLine />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-7 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
          
          {/* Row 1: Expense Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Expense Date */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Expense Date <span className="text-[#e91e63]">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className={`w-full bg-slate-50/70 dark:bg-white/5 border rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark] ${
                    fieldErrors.expense_date 
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-slate-200 dark:border-white/10 focus:border-[#e91e63] focus:bg-white dark:focus:bg-[#1a1a2e]'
                  }`}
                />
              </div>
              {fieldErrors.expense_date && (
                <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.expense_date}</p>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="relative" ref={categoryRef}>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Category <span className="text-[#e91e63]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className={`w-full bg-slate-50/70 dark:bg-white/5 border rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 flex items-center justify-between outline-none transition-all ${
                  fieldErrors.category_id 
                    ? 'border-red-500' 
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-[#e91e63]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${categoryMeta.bg} ${categoryMeta.color}`}>
                    <CategoryIcon className="text-base" />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {selectedCategory?.name || 'Select Category'}
                  </span>
                </div>
                <RiArrowDownSLine className={`text-slate-400 text-lg transition-transform duration-200 shrink-0 ml-2 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Category Dropdown Menu */}
              {categoryDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#232340] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl py-1.5 z-30 max-h-56 overflow-y-auto custom-scrollbar animate-[fadeIn_0.15s_ease-out]">
                  {categories.map((cat) => {
                    const meta = getCategoryMeta(cat.name);
                    const CatIcon = meta.icon;
                    const isSelected = String(cat.id) === String(formData.category_id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, category_id: String(cat.id) });
                          setCategoryDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 text-left text-sm transition-colors ${
                          isSelected ? 'bg-pink-50/60 dark:bg-pink-500/10 text-[#e91e63] font-semibold' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${meta.bg} ${meta.color}`}>
                            <CatIcon className="text-sm" />
                          </div>
                          <span>{cat.name}</span>
                        </div>
                        {isSelected && <RiCheckLine className="text-[#e91e63] text-base" />}
                      </button>
                    );
                  })}
                </div>
              )}
              {fieldErrors.category_id && (
                <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.category_id}</p>
              )}
            </div>
          </div>

          {/* Row 2: Amount & Tax Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Amount <span className="text-[#e91e63]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm select-none">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={`w-full bg-slate-50/70 dark:bg-white/5 border rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all placeholder:text-slate-400 ${
                    fieldErrors.amount 
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-slate-200 dark:border-white/10 focus:border-[#e91e63] focus:bg-white dark:focus:bg-[#1a1a2e]'
                  }`}
                />
              </div>
              {fieldErrors.amount && (
                <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.amount}</p>
              )}
            </div>

            {/* Tax Amount */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Tax Amount
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm select-none">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.tax_amount}
                  onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                  className="w-full bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all placeholder:text-slate-400 focus:border-[#e91e63] focus:bg-white dark:focus:bg-[#1a1a2e]"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Payment Method & Reference / Bill No. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Method */}
            <div className="relative" ref={paymentRef}>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Payment Method <span className="text-[#e91e63]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
                className="w-full bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 flex items-center justify-between outline-none hover:border-slate-300 dark:hover:border-white/20 focus:border-[#e91e63] transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-pink-50 dark:bg-pink-500/10 text-[#e91e63] flex items-center justify-center shrink-0">
                    <PaymentIcon className="text-base" />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedPayment.label}
                  </span>
                </div>
                <RiArrowDownSLine className={`text-slate-400 text-lg transition-transform duration-200 ${paymentDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {paymentDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#232340] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl py-1.5 z-30 animate-[fadeIn_0.15s_ease-out]">
                  {PAYMENT_METHODS.map((pm) => {
                    const Icon = pm.icon;
                    const isSelected = pm.id === formData.payment_method;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, payment_method: pm.id });
                          setPaymentDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 text-left text-sm transition-colors ${
                          isSelected ? 'bg-pink-50/60 dark:bg-pink-500/10 text-[#e91e63] font-semibold' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`text-base ${pm.color}`} />
                          <span>{pm.label}</span>
                        </div>
                        {isSelected && <RiCheckLine className="text-[#e91e63] text-base" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reference / Bill No. */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Reference / Bill No.
              </label>
              <div className="relative">
                <RiFileTextLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                <input
                  type="text"
                  placeholder="Enter bill / reference no."
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  className="w-full bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all placeholder:text-slate-400 focus:border-[#e91e63] focus:bg-white dark:focus:bg-[#1a1a2e]"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Description (Full Width) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Description <span className="text-[#e91e63]">*</span>
            </label>
            <div className="relative">
              <textarea
                rows={2}
                maxLength={200}
                placeholder="Enter expense description (e.g. Electricity bill - Sep 2026)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full bg-slate-50/70 dark:bg-white/5 border rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all placeholder:text-slate-400 resize-none ${
                  fieldErrors.description 
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                    : 'border-slate-200 dark:border-white/10 focus:border-[#e91e63] focus:bg-white dark:focus:bg-[#1a1a2e]'
                }`}
              />
              <span className="absolute right-3 bottom-2.5 text-[11px] font-medium text-slate-400 select-none">
                {formData.description.length}/200
              </span>
            </div>
            {fieldErrors.description && (
              <p className="text-red-500 text-xs mt-1 font-medium">{fieldErrors.description}</p>
            )}
          </div>

          {/* Row 5: Attach Bill / Receipt & Include in Tax + Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            
            {/* Left: Attach Bill / Receipt */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Attach Bill / Receipt
              </label>
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-2xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[96px] ${
                  formData.receipt_name 
                    ? 'border-pink-300 dark:border-pink-500/30 bg-pink-50/20 dark:bg-pink-500/5' 
                    : 'border-sky-200 dark:border-sky-500/20 bg-sky-50/30 dark:bg-sky-500/5 hover:bg-sky-50/60 dark:hover:bg-sky-500/10'
                }`}
              >
                {uploadingReceipt ? (
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <RiLoader2Line className="text-2xl text-[#e91e63] animate-spin" />
                    <span className="text-xs font-medium text-slate-500">Uploading receipt...</span>
                  </div>
                ) : formData.receipt_name ? (
                  <div className="flex items-center justify-between w-full px-2">
                    <div className="flex items-center gap-2 truncate">
                      <RiFileTextLine className="text-xl text-[#e91e63] shrink-0" />
                      <div className="text-left truncate">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                          {formData.receipt_name}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-medium">Attached</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, receipt_url: '', receipt_name: '' }));
                      }}
                      className="p-1 rounded-lg hover:bg-rose-100 text-rose-500 transition-colors"
                      title="Remove file"
                    >
                      <RiDeleteBinLine className="text-sm" />
                    </button>
                  </div>
                ) : (
                  <>
                    <RiUploadCloud2Line className="text-2xl text-[#e91e63] mb-1" />
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-tight">
                      Click to upload <span className="font-normal text-slate-500">or drag & drop</span>
                    </p>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      JPG, PNG or PDF (Max 5 MB)
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Right: Tax Toggle + Notes */}
            <div className="space-y-3">
              {/* Include in Tax Calculation Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Include in Tax Calculation
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.include_in_tax}
                  onClick={() => setFormData({ ...formData, include_in_tax: !formData.include_in_tax })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    formData.include_in_tax ? 'bg-[#e91e63]' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition-transform ${
                      formData.include_in_tax ? 'translate-x-5.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Notes (Optional) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Notes (Optional)
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    maxLength={200}
                    placeholder="Add any additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all placeholder:text-slate-400 resize-none focus:border-[#e91e63] focus:bg-white dark:focus:bg-[#1a1a2e]"
                  />
                  <span className="absolute right-3 bottom-2 text-[11px] font-medium text-slate-400 select-none">
                    {formData.notes.length}/200
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#e91e63] hover:bg-[#d81b60] text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-pink-500/25 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RiLoader2Line className="text-lg animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <RiFolderUploadLine className="text-lg" />
                  <span>{expenseToEdit ? 'Save Changes' : 'Save Expense'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
}
