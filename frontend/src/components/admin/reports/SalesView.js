'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { RiArrowRightSLine, RiShoppingBag3Line, RiMoneyDollarCircleLine, RiBankCardLine } from 'react-icons/ri';

export default function SalesView({ startDate, endDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/sales', { params: { start_date: startDate, end_date: endDate } });
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load sales report');
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
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-admin-card rounded-2xl"></div>)}
        </div>
        <div className="h-64 bg-admin-card rounded-2xl"></div>
      </div>
    );
  }

  if (error) return <div className="text-accent-red p-4 bg-accent-red/10 rounded-xl">{error}</div>;
  if (!data || !data.summary || data.summary.length === 0) return <div className="text-admin-text-muted">No data available for this period.</div>;

  const summary = data.summary[0] || {};
  const daily = data.daily || [];
  const paymentMethods = data.by_payment_method || [];

  return (
    <div className="space-y-6">
      
      {/* Colorful Metric Cards - Matching UI Reference */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* No. of Bills (Purple) */}
        <div className="bg-[#4D3DF7] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#4D3DF7]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">No.of Bills</p>
            <h3 className="text-3xl font-bold">{summary.total_invoices || 0}</h3>
          </div>
          <RiShoppingBag3Line className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>

        {/* Total Sale (Teal) */}
        <div className="bg-[#24B29B] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#24B29B]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Total Sale</p>
            <h3 className="text-2xl font-bold">{formatCurrency(summary.gross_sales || 0)}</h3>
          </div>
          <RiMoneyDollarCircleLine className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>

        {/* Total Collection (Purple with arrow) */}
        <div className="bg-[#6B46C1] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#6B46C1]/20 relative overflow-hidden group cursor-pointer hover:bg-[#5A3AA6] transition-colors">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Total Collection</p>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              {formatCurrency(summary.collected || 0)} 
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-sm"><RiArrowRightSLine /></span>
            </h3>
          </div>
        </div>

        {/* Tips Value (Gold) */}
        <div className="bg-[#C89B3C] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#C89B3C]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Tips Value</p>
            <h3 className="text-2xl font-bold">{formatCurrency(summary.total_tips || 0)}</h3>
          </div>
        </div>

        {/* Unpaid (Blue) */}
        <div className="bg-[#3B82F6] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#3B82F6]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Unpaid</p>
            <h3 className="text-2xl font-bold">{formatCurrency(summary.outstanding || 0)}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Sales Table */}
        <div className="lg:col-span-2 bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-admin-border bg-admin-surface/30">
            <h3 className="font-bold text-lg">Daily Revenue Breakdown</h3>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[500px] text-left border-collapse">
              <thead>
                <tr className="bg-admin-surface/70 text-admin-text-secondary border-b border-admin-border text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Invoices</th>
                  <th className="p-4 font-semibold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border text-sm">
                {daily.map((day, idx) => (
                  <tr key={idx} className="hover:bg-admin-surface-light transition-colors">
                    <td className="p-4 text-admin-text-secondary font-medium">
                      {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4">{day.invoices}</td>
                    <td className="p-4 text-right font-bold text-accent-green">{formatCurrency(day.revenue)}</td>
                  </tr>
                ))}
                {daily.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-admin-text-muted">No daily data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods Table */}
        <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-admin-border bg-admin-surface/30">
            <h3 className="font-bold text-lg">Collections by Mode</h3>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {paymentMethods.map((pm, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-admin-border bg-admin-surface-light">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center text-xl">
                      <RiBankCardLine />
                    </div>
                    <div>
                      <p className="font-bold capitalize">{pm.payment_method}</p>
                      <p className="text-xs text-admin-text-secondary">{pm.count} transactions</p>
                    </div>
                  </div>
                  <div className="font-bold text-admin-text">
                    {formatCurrency(pm.total)}
                  </div>
                </div>
              ))}
              {paymentMethods.length === 0 && (
                <div className="text-center text-admin-text-muted py-6">No collections data.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
