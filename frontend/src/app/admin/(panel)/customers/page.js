'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RiAddLine, RiSearchLine, RiFilter3Line, RiDownload2Line, RiUpload2Line, RiEdit2Line, RiLoader2Line } from 'react-icons/ri';
import AddCustomerModal from '@/components/admin/customers/AddCustomerModal';
import CustomerProfilePanel from '@/components/admin/customers/CustomerProfilePanel';
import ImportCustomersModal from '@/components/admin/customers/ImportCustomersModal';
import CustomerFilterDrawer from '@/components/admin/customers/CustomerFilterDrawer';
import toast from 'react-hot-toast';

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    search: '',
    letter: '',
    page: 1,
    limit: 20,
    is_active: 'true'
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      // Clean up empty filters
      const cleanFilters = { ...filters };
      if (!cleanFilters.letter) delete cleanFilters.letter;
      if (!cleanFilters.search) delete cleanFilters.search;
      if (!cleanFilters.is_active) delete cleanFilters.is_active;
      if (!cleanFilters.gender) delete cleanFilters.gender;
      if (!cleanFilters.source) delete cleanFilters.source;

      const [listRes, statsRes] = await Promise.all([
        api.get('/customers', { params: cleanFilters }),
        api.get('/customers/stats/metrics')
      ]);
      setCustomers(listRes.data?.customers || listRes.data || []);
      setStats(statsRes?.data || { new_customers: 0, returning_customers: 0, defected_customers: 0, churn: 0 }); 
    } catch (err) {
      console.error(err);
      if(err.response?.config?.url?.includes('/customers?')) {
        setCustomers([]);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Deep Link Handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const customerId = params.get('customer_id');
    if (customerId && customers.length > 0 && !selectedCustomer) {
      const found = customers.find(c => c.id == customerId);
      if (found) {
        setSelectedCustomer(found);
      }
    }
  }, [customers, selectedCustomer]);

  const handleClosePanel = () => {
    setSelectedCustomer(null);
    const url = new URL(window.location);
    if (url.searchParams.has('customer_id')) {
      url.searchParams.delete('customer_id');
      window.history.replaceState({}, '', url);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleApplyAdvancedFilters = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      page: 1,
      is_active: newFilters.is_active !== undefined ? newFilters.is_active : prev.is_active,
      gender: newFilters.gender !== undefined ? newFilters.gender : prev.gender,
      source: newFilters.source !== undefined ? newFilters.source : prev.source
    }));
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const cleanFilters = { ...filters };
      if (!cleanFilters.letter) delete cleanFilters.letter;
      if (!cleanFilters.search) delete cleanFilters.search;
      if (!cleanFilters.is_active) delete cleanFilters.is_active;
      if (!cleanFilters.gender) delete cleanFilters.gender;
      if (!cleanFilters.source) delete cleanFilters.source;

      // Fetch all customers for export
      const res = await api.get('/customers', { params: { ...cleanFilters, limit: 10000, page: 1 } });
      const exportData = res.data?.customers || res.data || [];
      if (exportData.length === 0) {
        toast.error('No customers to export');
        return;
      }

      // Convert to CSV
      const headers = ['First Name', 'Last Name', 'Phone', 'Email', 'Gender', 'Status', 'Source', 'Total Spent', 'Total Visits', 'Notes'];
      const csvRows = [headers.join(',')];

      for (const row of exportData) {
        const values = [
          `"${row.first_name || ''}"`,
          `"${row.last_name || ''}"`,
          `"${row.phone || ''}"`,
          `"${row.email || ''}"`,
          `"${row.gender || ''}"`,
          `"${row.is_active ? 'Active' : 'Inactive'}"`,
          `"${row.source || ''}"`,
          `"${row.total_spent || 0}"`,
          `"${row.total_visits || 0}"`,
          `"${row.notes || ''}"`
        ];
        csvRows.push(values.join(','));
      }

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `customers_export_${formatDate(new Date()).replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export customers', error);
      toast.error('Failed to export customers');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors shadow-lg shadow-brand/20 flex items-center gap-2 shrink-0"
        >
          <RiAddLine className="text-lg" /> Add New
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
        <div className="bg-[#4638A0] text-white p-5 rounded-2xl flex items-center justify-between shadow-lg shadow-[#4638A0]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1 flex items-center gap-1">New Customers <span className="w-3 h-3 rounded-full border border-white/50 flex items-center justify-center text-[8px]">i</span></p>
            <h3 className="text-4xl font-bold">{stats?.new_customers || 0}</h3>
          </div>
          <div className="absolute right-4 text-3xl opacity-80">
            👩‍💼
          </div>
        </div>

        <div className="bg-[#2B8B8B] text-white p-5 rounded-2xl flex items-center justify-between shadow-lg shadow-[#2B8B8B]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1 flex items-center gap-1">Returning Customers <span className="w-3 h-3 rounded-full border border-white/50 flex items-center justify-center text-[8px]">i</span></p>
            <h3 className="text-4xl font-bold">{stats?.returning_customers || 0}</h3>
          </div>
          <div className="absolute right-4 text-3xl opacity-80">
            👩‍💼
          </div>
        </div>

        <div className="bg-[#A06132] text-white p-5 rounded-2xl flex items-center justify-between shadow-lg shadow-[#A06132]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1 flex items-center gap-1">Churn Customers <span className="w-3 h-3 rounded-full border border-white/50 flex items-center justify-center text-[8px]">i</span></p>
            <h3 className="text-4xl font-bold">{stats?.churn || 0}</h3>
          </div>
          <div className="absolute right-4 text-3xl opacity-80">
            👩‍💼
          </div>
        </div>

        <div className="bg-[#A02B6D] text-white p-5 rounded-2xl flex items-center justify-between shadow-lg shadow-[#A02B6D]/20 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-semibold opacity-90 mb-1 flex items-center gap-1">Defected Customers <span className="w-3 h-3 rounded-full border border-white/50 flex items-center justify-center text-[8px]">i</span></p>
            <h3 className="text-4xl font-bold">{stats?.defected_customers || 0}</h3>
          </div>
          <div className="absolute right-4 text-3xl opacity-80">
            👩‍💼
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-4 mb-6 shrink-0 items-center">
        <button 
          onClick={() => setIsImportModalOpen(true)}
          className="px-10 py-2.5 rounded-xl border border-brand text-brand font-bold text-sm hover:bg-brand/10 transition-colors bg-admin-card flex items-center gap-2"
        >
          <RiUpload2Line /> Import
        </button>
        <button 
          onClick={exportToCSV}
          disabled={isExporting}
          className="px-10 py-2.5 rounded-xl bg-brand hover:bg-brand-light text-white font-bold text-sm transition-colors shadow-lg shadow-brand/20 disabled:opacity-70 flex items-center gap-2"
        >
          {isExporting ? <RiLoader2Line className="animate-spin" /> : <RiDownload2Line />} 
          Download
        </button>

        <div className="flex-1 min-w-[200px] ml-auto flex gap-4">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-secondary text-lg" />
            <input 
              type="text" 
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search Customers"
              className="w-full bg-admin-surface border border-transparent rounded-xl pl-12 pr-4 py-3 text-sm text-admin-text outline-none focus:border-brand transition-colors"
            />
          </div>
          <button 
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`px-6 py-2.5 rounded-xl border text-sm font-bold transition-colors flex items-center gap-2 ${
              (filters.is_active || filters.gender || filters.source) 
                ? 'bg-brand/10 border-brand text-brand'
                : 'bg-admin-card border-transparent hover:border-admin-border text-admin-text-secondary hover:text-admin-text'
            }`}
          >
            Filter <RiFilter3Line />
          </button>
        </div>
      </div>

      {/* Alphabet Filter */}
      <div className="mb-6 shrink-0">
        <p className="text-xs font-semibold text-admin-text-secondary mb-3">Name filter by</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <button 
            onClick={() => handleFilterChange('letter', '')}
            className={`text-sm font-bold transition-colors ${!filters.letter ? 'text-brand' : 'text-admin-text-secondary hover:text-admin-text'}`}
          >
            All
          </button>
          {ALPHABETS.map(letter => (
            <button 
              key={letter}
              onClick={() => handleFilterChange('letter', letter)}
              className={`text-sm font-bold transition-colors ${filters.letter === letter ? 'text-brand' : 'text-admin-text-secondary hover:text-admin-text'}`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 bg-transparent overflow-hidden flex flex-col min-h-0 border-t border-admin-border pt-4">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-admin-border text-[11px] uppercase tracking-wider text-admin-text-secondary">
                <th className="py-4 pr-6 font-semibold">First name</th>
                <th className="py-4 pr-6 font-semibold">Last name</th>
                <th className="py-4 pr-6 font-semibold">Phone Code</th>
                <th className="py-4 pr-6 font-semibold">Mobile number</th>
                <th className="py-4 pr-6 font-semibold">Total purchase value</th>
                <th className="py-4 pr-6 font-semibold">Wallet Balance</th>
                <th className="py-4 pr-6 font-semibold">Lifetime visit count</th>
                <th className="py-4 pr-6 font-semibold">Last visited date</th>
                <th className="py-4 pr-6 font-semibold">Source</th>
                <th className="py-4 font-semibold text-center">Edit</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-admin-text-secondary">Loading...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-admin-text-secondary">No customers found.</td>
                </tr>
              ) : (
                customers.map((c, idx) => (
                  <tr 
                    key={c.id || idx} 
                    className="border-b border-admin-border/50 hover:bg-admin-surface/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedCustomer(c)}
                  >
                    <td className="py-4 pr-6 font-bold text-admin-text">{c.first_name}</td>
                    <td className="py-4 pr-6 font-bold text-admin-text">{c.last_name}</td>
                    <td className="py-4 pr-6 font-medium text-admin-text">+91</td>
                    <td className="py-4 pr-6 font-medium text-admin-text">{c.phone}</td>
                    <td className="py-4 pr-6 font-medium text-admin-text">{formatCurrency(c.total_spent || 0)}</td>
                    <td className="py-4 pr-6 font-medium text-admin-text">{formatCurrency(c.wallet_balance || 0)}</td>
                    <td className="py-4 pr-6 font-medium text-admin-text">{c.total_visits || 0}</td>
                    <td className="py-4 pr-6 font-medium text-admin-text">{c.last_visit_at ? formatDate(c.last_visit_at) : 'Yet to visit'}</td>
                    <td className="py-4 pr-6 font-medium text-admin-text capitalize">{c.source || 'NA'}</td>
                    <td className="py-4 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCustomerToEdit(c); }}
                        className="p-2 text-brand hover:bg-brand/10 rounded-lg transition-colors inline-block"
                      >
                        <RiEdit2Line />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Drawers */}
      <AddCustomerModal 
        isOpen={isAddModalOpen || !!customerToEdit} 
        onClose={() => {
          setIsAddModalOpen(false);
          setCustomerToEdit(null);
        }}
        onSuccess={() => { fetchCustomers(); setIsAddModalOpen(false); setCustomerToEdit(null); }}
        initialData={customerToEdit}
      />

      <ImportCustomersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          fetchCustomers();
        }}
      />

      <CustomerFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        currentFilters={filters}
        onApply={handleApplyAdvancedFilters}
      />

      <CustomerProfilePanel 
        customer={selectedCustomer}
        isOpen={!!selectedCustomer}
        onClose={() => {
          setSelectedCustomer(null);
          // Remove customer_id from URL
          const url = new URL(window.location);
          if (url.searchParams.has('customer_id')) {
            url.searchParams.delete('customer_id');
            window.history.replaceState({}, '', url);
          }
        }}
        onEdit={(customer) => {
          setCustomerToEdit(customer);
          setIsAddModalOpen(true);
        }}
        onDelete={async (id) => {
          try {
            await api.delete(`/customers/${id}`);
            setSelectedCustomer(null);
            fetchCustomers();
          } catch (err) {
            console.error(err);
            toast.error('Failed to delete customer');
          }
        }}
      />
    </div>
  );
}
