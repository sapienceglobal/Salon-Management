'use client';

import { useState, useMemo } from 'react';
import { RiCalendar2Line, RiDownloadLine } from 'react-icons/ri';
import SalesView from '@/components/admin/reports/SalesView';
import ServiceView from '@/components/admin/reports/ServiceView';
import StaffView from '@/components/admin/reports/StaffView';
import CustomerView from '@/components/admin/reports/CustomerView';
import ExpenseView from '@/components/admin/reports/ExpenseView';
import TaxView from '@/components/admin/reports/TaxView';

const TABS = [
  { id: 'sales', label: 'Appointment & Sales' },
  { id: 'services', label: 'Services' },
  { id: 'staff', label: 'Staff Performance' },
  { id: 'customers', label: 'Customers' },
  { id: 'expenses', label: 'Expense' },
  { id: 'tax', label: 'Tax & GST' }
];

const PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');
  
  // Date State
  const [preset, setPreset] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Calculate actual Start and End dates based on preset
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    
    if (preset === 'custom') {
      return { 
        startDate: customStart || today.toISOString().split('T')[0], 
        endDate: customEnd || today.toISOString().split('T')[0] 
      };
    }

    let start = new Date();
    let end = new Date();

    if (preset === 'today') {
      // already today
    } else if (preset === 'yesterday') {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (preset === 'this_week') {
      start.setDate(start.getDate() - start.getDay()); // Sunday
    } else if (preset === 'this_month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset === 'last_month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    }

    // Convert to YYYY-MM-DD local string safely
    const toYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return { startDate: toYMD(start), endDate: toYMD(end) };
  }, [preset, customStart, customEnd]);

  // Format for display: 01 Sep, 2026
  const formatDisplayDate = (ymd) => {
    if (!ymd) return '';
    const date = new Date(ymd);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="animate-[fadeOpacity_0.5s_ease_forwards] flex flex-col h-full overflow-hidden">
      
      {/* Scrollable Tabs - Similar to reference image */}
      <div className="flex items-center gap-6 border-b border-admin-border pb-1 overflow-x-auto no-scrollbar shrink-0 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap pb-2 text-sm font-semibold transition-colors border-b-2 relative top-[2px] ${
              activeTab === tab.id 
                ? 'text-brand border-brand' 
                : 'text-admin-text-secondary border-transparent hover:text-admin-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Global Filters */}
      <div className="bg-admin-card border border-admin-border rounded-2xl p-4 mb-6 shrink-0 flex flex-wrap items-end gap-4">
        
        {/* Preset Selector */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-admin-text-secondary mb-1.5 uppercase tracking-wider">Select Duration</label>
          <div className="relative">
            <RiCalendar2Line className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full bg-admin-surface-light border border-admin-border rounded-lg pl-9 pr-4 py-2 text-sm font-medium text-admin-text outline-none focus:border-brand"
            >
              {PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>

        {/* Custom Dates (Only show if custom) */}
        {preset === 'custom' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary mb-1.5 uppercase tracking-wider">From Date</label>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2 text-sm text-admin-text outline-none [color-scheme:dark] html[data-theme-mode='light']:![color-scheme:light]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary mb-1.5 uppercase tracking-wider">To Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2 text-sm text-admin-text outline-none [color-scheme:dark] html[data-theme-mode='light']:![color-scheme:light]"
              />
            </div>
          </>
        )}

        <div className="ml-auto flex gap-3">
          <button className="px-6 py-2 border border-brand text-brand hover:bg-brand/10 rounded-lg text-sm font-bold transition-colors">
            View
          </button>
          <button className="px-6 py-2 border border-admin-border text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface-light rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
            <RiDownloadLine /> Download
          </button>
        </div>
      </div>

      {/* Filter Status Text */}
      <div className="text-sm font-bold text-admin-text-secondary mb-6 shrink-0 flex items-center gap-2">
        <span className="text-admin-text">Filter:</span> From {formatDisplayDate(startDate)} to {formatDisplayDate(endDate)}
      </div>

      {/* Dynamic Report View - Scrollable Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10 pr-2 relative">
        <div key={activeTab} className="animate-[fadeOpacity_0.3s_ease_forwards]">
          {activeTab === 'sales' && <SalesView startDate={startDate} endDate={endDate} />}
          {activeTab === 'services' && <ServiceView startDate={startDate} endDate={endDate} />}
          {activeTab === 'staff' && <StaffView startDate={startDate} endDate={endDate} />}
          {activeTab === 'customers' && <CustomerView startDate={startDate} endDate={endDate} />}
          {activeTab === 'expenses' && <ExpenseView startDate={startDate} endDate={endDate} />}
          {activeTab === 'tax' && <TaxView startDate={startDate} endDate={endDate} />}
        </div>
      </div>
    </div>
  );
}
