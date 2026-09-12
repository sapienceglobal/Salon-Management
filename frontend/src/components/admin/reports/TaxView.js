'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { RiPercentLine, RiArrowDownLine, RiArrowUpLine, RiScales3Line } from 'react-icons/ri';

export default function TaxView({ startDate, endDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/gst', { params: { start_date: startDate, end_date: endDate } });
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load GST report');
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-admin-card rounded-2xl"></div>)}
        </div>
        <div className="h-64 bg-admin-card rounded-2xl"></div>
      </div>
    );
  }

  if (error) return <div className="text-accent-red p-4 bg-accent-red/10 rounded-xl">{error}</div>;
  if (!data) return <div className="text-admin-text-muted">No data available.</div>;

  const { output_tax, input_tax, net_tax_liability } = data;

  return (
    <div className="space-y-6">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Output Tax (Collected) */}
        <div className="bg-[#24B29B] text-white p-6 rounded-xl shadow-lg shadow-[#24B29B]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/90 mb-2">
              <RiArrowUpLine className="text-xl" />
              <p className="text-sm font-semibold uppercase tracking-wider">Output Tax (Collected)</p>
            </div>
            <h3 className="text-4xl font-bold">{formatCurrency(output_tax?.total_tax || 0)}</h3>
            <p className="text-xs text-white/80 mt-2">Taxable Sales: {formatCurrency(output_tax?.taxable_amount || 0)}</p>
          </div>
          <RiPercentLine className="text-7xl absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform" />
        </div>

        {/* Input Tax (Paid) */}
        <div className="bg-[#FFA726] text-white p-6 rounded-xl shadow-lg shadow-[#FFA726]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/90 mb-2">
              <RiArrowDownLine className="text-xl" />
              <p className="text-sm font-semibold uppercase tracking-wider">Input Tax (Paid)</p>
            </div>
            <h3 className="text-4xl font-bold">{formatCurrency(input_tax?.input_tax || 0)}</h3>
            <p className="text-xs text-white/80 mt-2">From recorded expenses</p>
          </div>
          <RiPercentLine className="text-7xl absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform" />
        </div>

        {/* Net Liability */}
        <div className="bg-[#6B46C1] text-white p-6 rounded-xl shadow-lg shadow-[#6B46C1]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/90 mb-2">
              <RiScales3Line className="text-xl" />
              <p className="text-sm font-semibold uppercase tracking-wider">Net Tax Liability</p>
            </div>
            <h3 className="text-4xl font-bold">{formatCurrency(net_tax_liability || 0)}</h3>
            <p className="text-xs text-white/80 mt-2">Amount payable to Gov.</p>
          </div>
        </div>
      </div>

      {/* GST Breakdown Table */}
      <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden mt-6">
        <div className="p-5 border-b border-admin-border bg-admin-surface/30">
          <h3 className="font-bold text-lg">Sales GST Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-admin-surface/70 text-admin-text-secondary border-b border-admin-border text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold text-right">CGST</th>
                <th className="p-4 font-semibold text-right">SGST</th>
                <th className="p-4 font-semibold text-right">Total GST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-sm">
              <tr className="hover:bg-admin-surface-light transition-colors">
                <td className="p-4 text-admin-text-secondary font-medium">
                  Tax on Sales (Output)
                </td>
                <td className="p-4 text-right">{formatCurrency(output_tax?.cgst || 0)}</td>
                <td className="p-4 text-right">{formatCurrency(output_tax?.sgst || 0)}</td>
                <td className="p-4 text-right font-bold text-brand">{formatCurrency(output_tax?.total_tax || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
