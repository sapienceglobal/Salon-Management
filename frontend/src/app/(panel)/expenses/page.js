'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  RiWallet3Line, RiAddLine, RiSearchLine, RiDeleteBinLine, 
  RiFileList3Line
} from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import AddExpenseModal from '@/components/admin/billing/AddExpenseModal';
import { useConfirm } from '@/context/ConfirmContext';

export default function ExpensesPage() {
  const { confirm } = useConfirm();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total_expenses: 0, total_tax: 0 });
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Modal
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses', {
        params: { page, limit: 10, search: debouncedQuery }
      });
      setExpenses(res.data || []);
      setSummary(res.meta?.summary || { total_expenses: 0, total_tax: 0 });
      setTotalPages(res.meta?.totalPages || 1);
    } catch (error) {
      console.error('Fetch expenses error:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense?',
      confirmText: 'Delete'
    });
    if (!isConfirmed) return;
    
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Failed to delete expense', error);
      toast.error('Failed to delete expense');
    }
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease_forwards]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-[1.75rem] font-bold text-admin-text">Expenses</h1>
          <p className="text-sm text-admin-text-secondary mt-1">Manage and track your salon expenses.</p>
        </div>
        <button 
          onClick={() => setIsAddExpenseOpen(true)}
          className="bg-brand hover:bg-brand-light text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20 active:scale-95"
        >
          <RiAddLine className="text-lg" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="bg-admin-card border border-admin-border p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-red/10 text-accent-red rounded-xl flex items-center justify-center text-2xl shrink-0">
            <RiWallet3Line />
          </div>
          <div>
            <p className="text-sm font-semibold text-admin-text-secondary mb-1">Total Expenses</p>
            <h3 className="text-2xl font-bold font-heading">{formatCurrency(summary.total_expenses)}</h3>
          </div>
        </div>
        <div className="bg-admin-card border border-admin-border p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-orange/10 text-accent-orange rounded-xl flex items-center justify-center text-2xl shrink-0">
            <RiFileList3Line />
          </div>
          <div>
            <p className="text-sm font-semibold text-admin-text-secondary mb-1">Total Tax Paid</p>
            <h3 className="text-2xl font-bold font-heading">{formatCurrency(summary.total_tax)}</h3>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-admin-border flex flex-col md:flex-row gap-4 justify-between items-center bg-admin-surface/30">
          <div className="relative w-full md:w-80">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted text-lg" />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-admin-surface border border-admin-border focus:border-brand rounded-xl pl-10 pr-4 py-2 text-sm text-admin-text outline-none transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-admin-card/50 backdrop-blur-sm z-10 min-h-[300px]">
              <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="min-h-[300px] flex flex-col items-center justify-center text-admin-text-muted p-8 text-center">
              <RiWallet3Line className="text-6xl mb-4 opacity-20" />
              <p className="text-lg font-semibold text-admin-text mb-1">No expenses found</p>
              <p className="text-sm">Add a new expense to track your spending.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-admin-surface/70 z-10">
                <tr className="text-admin-text-secondary text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold whitespace-nowrap">Date</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Category</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Amount</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Tax</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Method</th>
                  <th className="p-4 font-semibold whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border text-sm">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-admin-surface-light transition-colors group">
                    <td className="p-4 whitespace-nowrap font-medium">{formatDate(expense.expense_date)}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="bg-admin-surface border border-admin-border px-2.5 py-1 rounded-md text-xs font-semibold capitalize">
                        {expense.category_name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap font-bold text-accent-red">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="p-4 whitespace-nowrap text-admin-text-secondary">
                      {formatCurrency(expense.tax_amount || 0)}
                    </td>
                    <td className="p-4 whitespace-nowrap capitalize text-admin-text-secondary">
                      {expense.payment_method?.replace("_", " ") || "Cash"}
                    </td>
                    <td className="p-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDelete(expense.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-accent-red hover:bg-accent-red/10 transition-colors"
                          title="Delete"
                        >
                          <RiDeleteBinLine />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-admin-border bg-admin-surface/30 flex justify-between items-center">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 bg-admin-surface border border-admin-border rounded-lg text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-admin-text-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-4 py-2 bg-admin-surface border border-admin-border rounded-lg text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <AddExpenseModal 
        isOpen={isAddExpenseOpen} 
        onClose={() => setIsAddExpenseOpen(false)} 
        onSuccess={() => {
          setIsAddExpenseOpen(false);
          fetchExpenses();
        }}
      />
    </div>
  );
}
