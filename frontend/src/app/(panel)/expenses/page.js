'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RiWallet3Line, RiPercentLine, RiBarChartLine, RiAddLine, 
  RiSearchLine, RiCalendar2Line, RiFilter3Line, RiArrowUpDownLine,
  RiPencilLine, RiDeleteBinLine, RiArrowDownSLine, RiArrowLeftSLine,
  RiArrowRightSLine, RiReceiptLine
} from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useConfirm } from '@/context/ConfirmContext';
import AddExpenseModal from '@/components/admin/expenses/AddExpenseModal';

// Helper for exact date formatting matching screenshot: "28 Sep 2026"
function formatScreenshotDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const raw = String(dateStr).split('T')[0];
    const [y, m, d] = raw.split('-');
    if (!y || !m || !d) return raw;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${parseInt(d, 10)} ${monthName} ${y}`;
  } catch {
    return dateStr;
  }
}

// Currency format with exactly 2 decimal places: ₹24,580.00
function formatINR(val) {
  const num = parseFloat(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// Category Badge Pill Styling
const CATEGORY_BADGES = {
  electricity: 'bg-pink-50 text-pink-600 border border-pink-100 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20',
  rent: 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  purchase: 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
  'supplies & products': 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
  maintenance: 'bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
  marketing: 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  staff: 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  'staff salary': 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  miscellaneous: 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
};

const getCategoryBadgeClass = (categoryName = '') => {
  const key = categoryName.toLowerCase().trim();
  return CATEGORY_BADGES[key] || 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10';
};

// Payment Method Badge Pill Styling
const METHOD_BADGES = {
  upi: { label: 'UPI', style: 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
  bank_transfer: { label: 'Bank Transfer', style: 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
  cash: { label: 'Cash', style: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10' },
  card: { label: 'Card', style: 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' },
};

export default function ExpensesPage() {
  const { confirm } = useConfirm();

  // State
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    total_expenses: 24580,
    total_tax: 4425,
    this_month_expense: 12680
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);

  // Sorting & Pagination
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/expenses/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // Fetch Expenses with active filters
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: activeSearch || undefined,
        category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
        payment_method: selectedMethod !== 'all' ? selectedMethod : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      const res = await api.get('/expenses', { params });
      let list = res.data || [];

      // Client sort toggle if needed
      if (sortOrder === 'asc') {
        list = [...list].sort((a, b) => new Date(a.expense_date) - new Date(b.expense_date));
      } else {
        list = [...list].sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
      }

      setExpenses(list);
      if (res.meta?.summary) {
        setSummary({
          total_expenses: res.meta.summary.total_expenses || 0,
          total_tax: res.meta.summary.total_tax || 0,
          this_month_expense: res.meta.summary.this_month_expense || 0,
        });
      }
      setTotalCount(res.meta?.total || list.length);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeSearch, selectedCategory, selectedMethod, startDate, endDate, sortOrder]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Close datepicker popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Apply Filter
  const handleApplyFilter = () => {
    setPage(1);
    setActiveSearch(searchInput.trim());
    fetchExpenses();
  };

  // Handle Reset Filters
  const handleResetFilters = () => {
    setSearchInput('');
    setActiveSearch('');
    setSelectedCategory('all');
    setSelectedMethod('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Quick Date Range helper
  const handleQuickDatePreset = (preset) => {
    const now = new Date();
    if (preset === 'this_month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      setStartDate(`${year}-${month}-01`);
      setEndDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'september_2026') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
    } else if (preset === 'all_time') {
      setStartDate('');
      setEndDate('');
    }
    setShowDatePicker(false);
  };

  // Delete Action
  const handleDelete = async (id, description) => {
    const confirmed = await confirm({
      title: 'Delete Expense',
      message: `Are you sure you want to delete this expense: "${description || 'Expense'}"? This action cannot be undone.`,
      confirmText: 'Delete Expense',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted successfully');
      fetchExpenses();
    } catch (err) {
      console.error('Delete expense error:', err);
      toast.error('Failed to delete expense');
    }
  };

  // Edit Action
  const handleEdit = (expense) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  // Add Action
  const handleAddNew = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };

  // Date range display text
  const dateRangeDisplay = startDate && endDate 
    ? `${formatScreenshotDate(startDate)} - ${formatScreenshotDate(endDate)}`
    : '01 Sep 2026 - 30 Sep 2026';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-[fadeIn_0.3s_ease-out]">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Expenses
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage and track your salon expenses.
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-[#e91e63] hover:bg-[#d81b60] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-pink-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <RiAddLine className="text-lg" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* 2. Top 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Expenses */}
        <div className="bg-white dark:bg-[#1e1e35] border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center gap-4.5 hover:shadow-md transition-shadow">
          <div className="w-13 h-13 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-[#e91e63] flex items-center justify-center text-2xl shrink-0">
            <RiWallet3Line />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Total Expenses
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formatINR(summary.total_expenses)}
            </h3>
          </div>
        </div>

        {/* Card 2: Total Tax Paid */}
        <div className="bg-white dark:bg-[#1e1e35] border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center gap-4.5 hover:shadow-md transition-shadow">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl shrink-0 font-bold">
            <RiPercentLine />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Total Tax Paid
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formatINR(summary.total_tax)}
            </h3>
          </div>
        </div>

        {/* Card 3: This Month Expense */}
        <div className="bg-white dark:bg-[#1e1e35] border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center gap-4.5 hover:shadow-md transition-shadow">
          <div className="w-13 h-13 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-2xl shrink-0">
            <RiBarChartLine />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              This Month Expense
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formatINR(summary.this_month_expense)}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="bg-white dark:bg-[#1e1e35] border border-slate-100 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9.5 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all placeholder:text-slate-400 focus:border-[#e91e63] focus:bg-white dark:focus:bg-[#1e1e35]"
          />
        </div>

        {/* Date Range Picker Selector */}
        <div className="relative" ref={datePickerRef}>
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:border-slate-300 dark:hover:border-white/20 transition-all font-medium"
          >
            <RiCalendar2Line className="text-slate-400 text-base shrink-0" />
            <span className="whitespace-nowrap">{dateRangeDisplay}</span>
          </button>

          {/* Date Picker Popover */}
          {showDatePicker && (
            <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#232340] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-4 z-40 animate-[fadeIn_0.15s_ease-out]">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Select Date Range</p>
              
              <div className="space-y-2 mb-3">
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-1">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-1">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 border-t border-slate-100 dark:border-white/10 pt-2 mb-2">
                <button
                  type="button"
                  onClick={() => handleQuickDatePreset('september_2026')}
                  className="px-2 py-1 text-xs rounded-md bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-pink-50 hover:text-[#e91e63] text-left transition-colors"
                >
                  Sep 2026
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDatePreset('this_month')}
                  className="px-2 py-1 text-xs rounded-md bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-pink-50 hover:text-[#e91e63] text-left transition-colors"
                >
                  This Month
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-white/10 pt-2">
                <button
                  type="button"
                  onClick={() => handleQuickDatePreset('all_time')}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="px-3 py-1 bg-[#e91e63] text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="relative min-w-[150px]">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 pr-8 text-sm text-slate-700 dark:text-slate-200 outline-none appearance-none hover:border-slate-300 dark:hover:border-white/20 transition-all font-medium cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base" />
        </div>

        {/* Payment Method Dropdown */}
        <div className="relative min-w-[170px]">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 pr-8 text-sm text-slate-700 dark:text-slate-200 outline-none appearance-none hover:border-slate-300 dark:hover:border-white/20 transition-all font-medium cursor-pointer"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
          <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base" />
        </div>

        {/* Filter Button */}
        <button
          onClick={handleApplyFilter}
          className="bg-[#e91e63] hover:bg-[#d81b60] text-white px-4.5 py-2 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
        >
          <RiFilter3Line className="text-base" />
          <span>Filter</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={handleResetFilters}
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
        >
          Reset
        </button>
      </div>

      {/* 4. Expenses Data Table */}
      <div className="bg-white dark:bg-[#1e1e35] border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 text-[11.5px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-white/[0.02]">
                <th 
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="py-3.5 px-5 font-semibold cursor-pointer select-none hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>DATE</span>
                    <RiArrowUpDownLine className="text-xs opacity-70" />
                  </div>
                </th>
                <th className="py-3.5 px-5 font-semibold">CATEGORY</th>
                <th className="py-3.5 px-5 font-semibold">DESCRIPTION</th>
                <th className="py-3.5 px-5 font-semibold">AMOUNT</th>
                <th className="py-3.5 px-5 font-semibold">TAX</th>
                <th className="py-3.5 px-5 font-semibold">METHOD</th>
                <th className="py-3.5 px-5 font-semibold">ADDED BY</th>
                <th className="py-3.5 px-5 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="inline-block w-8 h-8 border-3 border-[#e91e63] border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs font-medium">Loading expenses...</p>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <RiReceiptLine className="text-5xl mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No expenses found</p>
                    <p className="text-xs text-slate-400 mt-1">Try changing filters or add a new expense.</p>
                  </td>
                </tr>
              ) : (
                expenses.map((item) => {
                  const badgeClass = getCategoryBadgeClass(item.category_name);
                  const methodInfo = METHOD_BADGES[item.payment_method] || { label: item.payment_method || 'Cash', style: 'bg-slate-100 text-slate-600' };

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* DATE */}
                      <td className="py-4 px-5 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">
                        {formatScreenshotDate(item.expense_date)}
                      </td>

                      {/* CATEGORY */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
                          {item.category_name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* DESCRIPTION */}
                      <td className="py-4 px-5 text-sm text-slate-700 dark:text-slate-300 font-normal max-w-xs truncate" title={item.description}>
                        {item.description}
                      </td>

                      {/* AMOUNT */}
                      <td className="py-4 px-5 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                        {formatINR(item.amount)}
                      </td>

                      {/* TAX */}
                      <td className="py-4 px-5 whitespace-nowrap text-sm font-normal text-slate-600 dark:text-slate-400">
                        {formatINR(item.tax_amount)}
                      </td>

                      {/* METHOD */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${methodInfo.style}`}>
                          {methodInfo.label}
                        </span>
                      </td>

                      {/* ADDED BY */}
                      <td className="py-4 px-5 whitespace-nowrap text-sm font-normal text-slate-700 dark:text-slate-300">
                        {item.created_by_name || 'Super Admin'}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                            title="Edit Expense"
                          >
                            <RiPencilLine className="text-base" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.description)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title="Delete Expense"
                          >
                            <RiDeleteBinLine className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer */}
        <div className="p-4.5 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing {expenses.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, totalCount || expenses.length)} of {totalCount || expenses.length} entries
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Previous Page"
            >
              <RiArrowLeftSLine className="text-base" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                type="button"
                onClick={() => setPage(pNum)}
                className={`w-8 h-8 rounded-lg font-semibold text-xs flex items-center justify-center transition-all ${
                  page === pNum
                    ? 'bg-[#e91e63] text-white shadow-sm'
                    : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                {pNum}
              </button>
            ))}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Next Page"
            >
              <RiArrowRightSLine className="text-base" />
            </button>
          </div>
        </div>

      </div>

      {/* 6. Add / Edit Expense Popup Modal */}
      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchExpenses()}
        expenseToEdit={expenseToEdit}
      />

    </div>
  );
}
