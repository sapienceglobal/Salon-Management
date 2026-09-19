'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { RiScissorsLine, RiMoneyDollarCircleLine, RiShoppingBag3Line } from 'react-icons/ri';

export default function ServiceView({ startDate, endDate }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/services', { params: { start_date: startDate, end_date: endDate } });
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load services report');
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-admin-card rounded-2xl"></div>)}
        </div>
        <div className="h-64 bg-admin-card rounded-2xl"></div>
      </div>
    );
  }

  if (error) return <div className="text-accent-red p-4 bg-accent-red/10 rounded-xl">{error}</div>;

  const totalQuantity = data.reduce((sum, item) => sum + (Number(item.quantity_sold) || 0), 0);
  const totalRevenue = data.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);
  const totalDiscounts = data.reduce((sum, item) => sum + (Number(item.discounts) || 0), 0);
  const topItem = data.length > 0 ? data[0] : null;

  return (
    <div className="space-y-6">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Quantity */}
        <div className="bg-[#6B46C1] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#6B46C1]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Items Sold</p>
            <h3 className="text-3xl font-bold">{totalQuantity}</h3>
          </div>
          <RiShoppingBag3Line className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>

        {/* Total Revenue */}
        <div className="bg-[#24B29B] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#24B29B]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Service Revenue</p>
            <h3 className="text-3xl font-bold">{formatCurrency(totalRevenue)}</h3>
          </div>
          <RiMoneyDollarCircleLine className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>

        {/* Discounts Given */}
        <div className="bg-[#C89B3C] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#C89B3C]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Total Discounts</p>
            <h3 className="text-3xl font-bold">{formatCurrency(totalDiscounts)}</h3>
          </div>
        </div>

        {/* Top Selling Service */}
        <div className="bg-[#3B82F6] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#3B82F6]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Top Service</p>
            <h3 className="text-xl font-bold truncate pr-4" title={topItem?.item_name}>{topItem?.item_name || 'N/A'}</h3>
          </div>
          <RiScissorsLine className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-admin-border bg-admin-surface/30">
          <h3 className="font-bold text-lg">Top Selling Items</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-admin-surface/70 text-admin-text-secondary border-b border-admin-border text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Rank</th>
                <th className="p-4 font-semibold">Item Name</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold text-center">Quantity Sold</th>
                <th className="p-4 font-semibold text-right">Discounts</th>
                <th className="p-4 font-semibold text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-sm">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-admin-surface-light transition-colors">
                  <td className="p-4 font-bold text-admin-text-muted">#{idx + 1}</td>
                  <td className="p-4 text-admin-text-secondary font-medium">
                    {item.item_name}
                  </td>
                  <td className="p-4 capitalize">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${item.item_type === 'service' ? 'bg-brand/10 text-brand' : 'bg-accent-green/10 text-accent-green'}`}>
                      {item.item_type}
                    </span>
                  </td>
                  <td className="p-4 text-center">{item.quantity_sold}</td>
                  <td className="p-4 text-right text-accent-red">{formatCurrency(item.discounts)}</td>
                  <td className="p-4 text-right font-bold text-accent-green">{formatCurrency(item.revenue)}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-admin-text-muted">No services sold in this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
