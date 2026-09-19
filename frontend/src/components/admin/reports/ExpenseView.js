'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { RiWallet3Line, RiReceiptLine, RiFileList3Line } from 'react-icons/ri';

export default function ExpenseView({ startDate, endDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/expenses', { params: { start_date: startDate, end_date: endDate } });
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load expense report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-admin-card rounded-2xl"></div>)}
        </div>
        <div className="h-64 bg-admin-card rounded-2xl"></div>
      </div>
    );
  }

  if (error) return <div className="text-accent-red p-4 bg-accent-red/10 rounded-xl">{error}</div>;
  if (!data || !data.summary || data.summary.length === 0) return <div className="text-admin-text-muted">No data available.</div>;

  const summary = data.summary[0] || {};
  const categories = data.by_category || [];

  return (
    <div className="space-y-6">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Expenses */}
        <div className="bg-[#FF7A7A] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#FF7A7A]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Total Expenses</p>
            <h3 className="text-3xl font-bold">{formatCurrency(summary.total || 0)}</h3>
          </div>
          <RiWallet3Line className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>

        {/* Total Tax Paid */}
        <div className="bg-[#FFA726] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#FFA726]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Input Tax Paid</p>
            <h3 className="text-3xl font-bold">{formatCurrency(summary.tax || 0)}</h3>
          </div>
          <RiReceiptLine className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>

        {/* Expense Transactions */}
        <div className="bg-[#3B82F6] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#3B82F6]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Total Transactions</p>
            <h3 className="text-3xl font-bold">{summary.count || 0}</h3>
          </div>
          <RiFileList3Line className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-admin-border bg-admin-surface/30">
          <h3 className="font-bold text-lg">Expense Breakdown by Category</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[500px] text-left border-collapse">
            <thead>
              <tr className="bg-admin-surface/70 text-admin-text-secondary border-b border-admin-border text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold text-center">Transactions</th>
                <th className="p-4 font-semibold text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-sm">
              {categories.map((cat, idx) => (
                <tr key={idx} className="hover:bg-admin-surface-light transition-colors">
                  <td className="p-4 text-admin-text-secondary font-medium capitalize">
                    {cat.category || 'Uncategorized'}
                  </td>
                  <td className="p-4 text-center">{cat.count}</td>
                  <td className="p-4 text-right font-bold text-accent-red">{formatCurrency(cat.total)}</td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-admin-text-muted">No expense categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
