'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { RiUserStarLine, RiScissorsLine, RiMoneyDollarCircleLine } from 'react-icons/ri';

export default function StaffView({ startDate, endDate }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/staff', { params: { start_date: startDate, end_date: endDate } });
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load staff report');
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

  const totalRevenue = data.reduce((sum, item) => sum + (Number(item.revenue_generated) || 0), 0);
  const totalServices = data.reduce((sum, item) => sum + (Number(item.services_done) || 0), 0);
  const topStaff = data.length > 0 ? data[0] : null;

  return (
    <div className="space-y-6">
      
      {/* Colorful Metric Cards - Adapted for Staff Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Revenue Generated (Coral style from Attendance image) */}
        <div className="bg-[#FF7A7A] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#FF7A7A]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Total Team Revenue</p>
            <h3 className="text-3xl font-bold">{formatCurrency(totalRevenue)}</h3>
          </div>
          <RiMoneyDollarCircleLine className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>

        {/* Total Services Done (Orange) */}
        <div className="bg-[#FFA726] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#FFA726]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Services Delivered</p>
            <h3 className="text-3xl font-bold">{totalServices}</h3>
          </div>
          <RiScissorsLine className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>

        {/* Top Performer (Pink/Magenta) */}
        <div className="bg-[#F06292] text-white p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#F06292]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1">Top Performer</p>
            <h3 className="text-2xl font-bold truncate pr-4">{topStaff ? `${topStaff.first_name} ${topStaff.last_name}` : 'N/A'}</h3>
          </div>
          <RiUserStarLine className="text-5xl absolute -right-2 -bottom-2 opacity-20 transform group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* Staff Performance Table - Matching dark UI */}
      <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="bg-admin-surface/70 text-admin-text-secondary border-b border-admin-border text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Staff Name</th>
                <th className="p-4 font-semibold text-center">Invoices Handled</th>
                <th className="p-4 font-semibold text-center">Services Done</th>
                <th className="p-4 font-semibold text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-sm">
              {data.map((staff, idx) => (
                <tr key={idx} className="hover:bg-admin-surface-light transition-colors">
                  <td className="p-4 text-admin-text-secondary font-medium">
                    {staff.first_name} {staff.last_name}
                  </td>
                  <td className="p-4 text-center">{staff.invoices_handled}</td>
                  <td className="p-4 text-center">{staff.services_done}</td>
                  <td className="p-4 text-right font-bold text-accent-green">{formatCurrency(staff.revenue_generated)}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-admin-text-muted">No staff performance data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
