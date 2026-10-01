'use client';

import { useState, useEffect } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { 
  RiCloseLine, RiTimeLine, RiFileList3Line, RiLoader2Line, 
  RiSearchLine, RiCheckDoubleLine, RiArrowRightSLine, RiUserLine 
} from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

export default function ViewInvoicesDrawer({ isOpen, onClose, onSelectInvoice }) {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [mounted, setMounted] = useState(false);
  
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchInvoices();
    }
  }, [isOpen, filterStatus]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const res = await api.get('/invoices', { params });
      const data = res.data?.invoices || res.data?.data || res.data || [];
      // Filter out pure drafts if we only want invoices
      const invoiceList = Array.isArray(data) ? data.filter(i => i.status !== 'draft') : [];
      setInvoices(invoiceList);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceClick = async (inv) => {
    try {
      const toastId = toast.loading('Loading invoice details...');
      const res = await api.get(`/invoices/${inv.id}`);
      toast.dismiss(toastId);
      
      const fullInvoice = res.data?.data || res.data || inv;
      onSelectInvoice(fullInvoice);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to load invoice');
      onSelectInvoice(inv);
      onClose();
    }
  };

  if (!mounted || !isOpen) return null;

  const filteredInvoices = invoices.filter(inv => {
    const custName = `${inv.customer_first_name || inv.customer?.first_name || ''} ${inv.customer_last_name || inv.customer?.last_name || ''}`.toLowerCase();
    const invNum = String(inv.invoice_number || inv.id).toLowerCase();
    const phone = String(inv.customer_phone || inv.customer?.phone || '');
    const q = search.toLowerCase();
    return custName.includes(q) || invNum.includes(q) || phone.includes(q);
  });

  return createPortal(
    <div className="fixed inset-0 z-[105] flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#1a1a2e] text-slate-800 dark:text-slate-100 h-full shadow-2xl flex flex-col z-10 animate-[slideLeft_0.3s_ease_forwards]"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] flex items-center justify-center">
              <RiFileList3Line className="text-lg" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Invoices History</h2>
              <p className="text-[11px] text-slate-400">View and print past customer receipts</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-white/10 flex flex-col gap-3">
          <div className="relative">
            <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input 
              type="text"
              placeholder="Search by invoice #, customer or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-[#E91E63] text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            {['all', 'paid', 'unpaid'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterStatus === status 
                    ? 'bg-[#E91E63] text-white shadow-sm shadow-[#E91E63]/25' 
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
              <RiLoader2Line className="text-3xl animate-spin text-[#E91E63]" />
              <span className="text-xs">Loading invoices...</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
              <RiFileList3Line className="text-4xl text-slate-300 dark:text-white/20" />
              <span className="text-sm font-medium">No invoices found</span>
            </div>
          ) : (
            filteredInvoices.map((inv) => {
              const isPaid = inv.status === 'paid';
              const custName = `${inv.customer_first_name || inv.customer?.first_name || 'Walk-in'} ${inv.customer_last_name || inv.customer?.last_name || ''}`.trim();
              const dateStr = inv.created_at ? format(new Date(inv.created_at), 'dd MMM yyyy, hh:mm a') : 'N/A';
              const invNum = inv.invoice_number || `INV-${inv.id}`;

              return (
                <div 
                  key={inv.id}
                  onClick={() => handleInvoiceClick(inv)}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:border-[#E91E63]/40 hover:shadow-md transition-all cursor-pointer flex flex-col gap-2.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#E91E63] transition-colors">
                      #{invNum}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isPaid 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      {inv.status || 'UNPAID'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <RiUserLine className="text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-700 dark:text-slate-200">{custName}</span>
                    </div>
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      {formatCurrency(inv.total_amount || inv.paid_amount || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-50 dark:border-white/5">
                    <div className="flex items-center gap-1">
                      <RiTimeLine />
                      <span>{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#E91E63] font-bold group-hover:translate-x-0.5 transition-transform">
                      <span>View Receipt</span>
                      <RiArrowRightSLine />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
