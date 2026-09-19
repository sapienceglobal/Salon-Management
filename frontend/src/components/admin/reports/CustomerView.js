'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { RiUserHeartLine, RiUserStarLine, RiUserFollowLine, RiUserUnfollowLine } from 'react-icons/ri';

export default function CustomerView({ startDate, endDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/customers', { params: { start_date: startDate, end_date: endDate } });
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load customer report');
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
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-admin-card rounded-2xl"></div>)}
        </div>
        <div className="h-64 bg-admin-card rounded-2xl"></div>
      </div>
    );
  }

  if (error) return <div className="text-accent-red p-4 bg-accent-red/10 rounded-xl">{error}</div>;
  if (!data) return <div className="text-admin-text-muted">No data available.</div>;

  const { retention, top_customers } = data;

  return (
    <div className="space-y-6">
      
      {/* Retention Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Loyal (>5 visits) */}
        <div className="bg-[#6B46C1] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#6B46C1]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Loyal Customers</p>
            <h3 className="text-3xl font-bold">{retention.loyal || 0}</h3>
          </div>
          <RiUserStarLine className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>

        {/* Regular (2-5 visits) */}
        <div className="bg-[#24B29B] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#24B29B]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Regulars</p>
            <h3 className="text-3xl font-bold">{retention.regular || 0}</h3>
          </div>
          <RiUserHeartLine className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>

        {/* One Time */}
        <div className="bg-[#3B82F6] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#3B82F6]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">One-time Visitors</p>
            <h3 className="text-3xl font-bold">{retention.one_visit || 0}</h3>
          </div>
          <RiUserFollowLine className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>

        {/* Defected / Lost */}
        <div className="bg-[#FF7A7A] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#FF7A7A]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">At Risk / Defected</p>
            <h3 className="text-3xl font-bold">{retention.defected || 0}</h3>
          </div>
          <RiUserUnfollowLine className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-admin-border bg-admin-surface/30 flex justify-between items-center">
          <h3 className="font-bold text-lg">Top 50 Customers by Spend</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-admin-surface/70 text-admin-text-secondary border-b border-admin-border text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Rank</th>
                <th className="p-4 font-semibold">Customer Name</th>
                <th className="p-4 font-semibold">Phone Number</th>
                <th className="p-4 font-semibold text-center">Visit Count</th>
                <th className="p-4 font-semibold text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-sm">
              {top_customers.map((c, idx) => (
                <tr key={c.id} className="hover:bg-admin-surface-light transition-colors">
                  <td className="p-4 font-bold text-admin-text-muted">#{idx + 1}</td>
                  <td className="p-4 text-admin-text-secondary font-medium">
                    {c.first_name} {c.last_name}
                  </td>
                  <td className="p-4 font-mono text-xs">{c.phone}</td>
                  <td className="p-4 text-center">{c.visit_count}</td>
                  <td className="p-4 text-right font-bold text-accent-green">{formatCurrency(c.total_spent)}</td>
                </tr>
              ))}
              {top_customers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-admin-text-muted">No customer data available for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
