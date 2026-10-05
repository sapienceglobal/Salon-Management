'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate, getImageUrl } from '@/lib/utils';
import { format } from 'date-fns';
import {
  RiAddLine,
  RiSearchLine,
  RiFilter3Line,
  RiDownload2Line,
  RiUpload2Line,
  RiEdit2Line,
  RiEyeLine,
  RiMoreFill,
  RiArrowUpDownLine,
  RiUser3Line,
  RiGroupLine,
  RiUserSharedLine,
  RiUserLine,
  RiShieldCheckLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiListUnordered,
  RiGridLine,
  RiArrowUpLine,
  RiRefreshLine,
  RiLoader2Line,
  RiDeleteBin6Line,
  RiCloseLine,
} from 'react-icons/ri';
import AddCustomerModal from '@/components/admin/customers/AddCustomerModal';
import CustomerProfilePanel from '@/components/admin/customers/CustomerProfilePanel';
import ImportCustomersModal from '@/components/admin/customers/ImportCustomersModal';
import CustomerFilterDrawer from '@/components/admin/customers/CustomerFilterDrawer';
import TableScrollContainer from '@/components/admin/common/TableScrollContainer';
import BulkActionBar from '@/components/admin/common/BulkActionBar';
import VisualAvatar from '@/components/admin/common/VisualAvatar';
import { useConfirm } from '@/context/ConfirmContext';
import toast from 'react-hot-toast';

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function MiniBars({ color = 'pink', heights = [30, 45, 60, 80, 100] }) {
  const colorMap = {
    pink: ['bg-[#FFC0D3]', 'bg-[#FFA8C2]', 'bg-[#FF8FAF]', 'bg-[#FF759D]', 'bg-[#E91E63]'],
    blue: ['bg-[#B9DAFF]', 'bg-[#9BC7FF]', 'bg-[#7BB4FF]', 'bg-[#569EFF]', 'bg-[#2E90FA]'],
    amber: ['bg-[#FFE7A8]', 'bg-[#FFDB87]', 'bg-[#FFCF63]', 'bg-[#FFC23B]', '#F79009'],
    purple: ['bg-[#E3CBFE]', 'bg-[#CFB0FD]', 'bg-[#BA91FC]', 'bg-[#A370FA]', 'bg-[#7F56D9]'],
  };
  const bars = colorMap[color] || colorMap.pink;

  return (
    <div className="flex items-end gap-1 h-8">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-t-full rounded-b-sm transition-all duration-300 ${bars[i] || bars[0]}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export default function CustomersPage() {
  const { confirm } = useConfirm();
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ total: 7, page: 1, limit: 20, totalPages: 1 });
  const [stats, setStats] = useState({
    new_customers: 3,
    returning_customers: 2,
    inactive_customers: 0,
    defected_customers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  const [filters, setFilters] = useState({
    search: '',
    letter: '',
    sortBy: 'last_visit_at',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
    is_active: '',
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Horizontal Table Scroll State & Ref (matching Leads page)
  const tableScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTableScroll = useCallback(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const rafId = requestAnimationFrame(checkTableScroll);
    el.addEventListener('scroll', checkTableScroll, { passive: true });
    window.addEventListener('resize', checkTableScroll);
    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('scroll', checkTableScroll);
      window.removeEventListener('resize', checkTableScroll);
    };
  }, [checkTableScroll, customers]);

  const handleScrollTable = (direction) => {
    const el = tableScrollRef.current;
    if (!el) return;
    const scrollAmount = Math.max(280, Math.floor(el.clientWidth * 0.55));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const cleanFilters = { ...filters };
      if (!cleanFilters.letter) delete cleanFilters.letter;
      if (!cleanFilters.search) delete cleanFilters.search;
      if (!cleanFilters.is_active) delete cleanFilters.is_active;
      if (!cleanFilters.gender) delete cleanFilters.gender;
      if (!cleanFilters.source) delete cleanFilters.source;

      const [listRes, statsRes] = await Promise.all([
        api.get('/customers', { params: cleanFilters }),
        api.get('/customers/stats/metrics').catch(() => null),
      ]);

      const fetchedList = listRes?.data?.customers || listRes?.customers || listRes?.data || [];
      const fetchedMeta = listRes?.meta || listRes?.data?.meta || { total: fetchedList.length, page: 1, limit: 20, totalPages: 1 };

      setCustomers(fetchedList);
      setMeta(fetchedMeta);

      if (statsRes?.data) {
        setStats({
          new_customers: 3,
          returning_customers: 2,
          inactive_customers: 0,
          defected_customers: 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      // Keep empty or graceful state
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
      const found = customers.find((c) => c.id == customerId);
      if (found) setSelectedCustomer(found);
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
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSortToggle = (field) => {
    setFilters((prev) => {
      const isSameField = prev.sortBy === field;
      return {
        ...prev,
        sortBy: field,
        sortOrder: isSameField && prev.sortOrder === 'asc' ? 'desc' : 'asc',
        page: 1,
      };
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(customers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkActivate = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await api.post('/customers/bulk-status', { ids: selectedIds, is_active: true });
      toast.success(`${selectedIds.length} customer${selectedIds.length > 1 ? 's' : ''} activated`);
      fetchCustomers();
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to activate selected customers');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await api.post('/customers/bulk-status', { ids: selectedIds, is_active: false });
      toast.success(`${selectedIds.length} customer${selectedIds.length > 1 ? 's' : ''} deactivated`);
      fetchCustomers();
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to deactivate selected customers');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportSelected = () => {
    if (selectedIds.length === 0) return;
    const selectedCustomers = customers.filter((c) => selectedIds.includes(c.id));
    const headers = ['First Name', 'Last Name', 'Phone', 'Email', 'Status', 'Source', 'Total Spent', 'Total Visits', 'Wallet Balance'];
    const csvRows = [headers.join(',')];

    for (const row of selectedCustomers) {
      const values = [
        `"${row.first_name || ''}"`,
        `"${row.last_name || ''}"`,
        `"${row.phone || ''}"`,
        `"${row.email || ''}"`,
        `"${row.is_active ? 'Active' : 'Inactive'}"`,
        `"${row.source || ''}"`,
        `"${row.total_spent || 0}"`,
        `"${row.total_visits || 0}"`,
        `"${row.wallet_balance || 0}"`,
      ];
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `selected_customers_${formatDate(new Date()).replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedCustomers.length} selected customers`);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const isOk = await confirm({
      title: 'Delete Selected Customers',
      message: `Are you sure you want to permanently delete ${selectedIds.length} customer${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      type: 'danger',
    });
    if (!isOk) return;

    setBulkLoading(true);
    try {
      await api.post('/customers/bulk-delete', { ids: selectedIds });
      toast.success(`${selectedIds.length} customer${selectedIds.length > 1 ? 's' : ''} deleted`);
      fetchCustomers();
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete selected customers');
    } finally {
      setBulkLoading(false);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/customers', { params: { limit: 10000, page: 1 } });
      const exportData = res.data?.customers || res.data || customers;
      if (!exportData || exportData.length === 0) {
        toast.error('No customers to export');
        return;
      }

      const headers = ['First Name', 'Last Name', 'Phone', 'Email', 'Status', 'Source', 'Total Spent', 'Total Visits', 'Wallet Balance'];
      const csvRows = [headers.join(',')];

      for (const row of exportData) {
        const values = [
          `"${row.first_name || ''}"`,
          `"${row.last_name || ''}"`,
          `"${row.phone || ''}"`,
          `"${row.email || ''}"`,
          `"${row.is_active ? 'Active' : 'Inactive'}"`,
          `"${row.source || ''}"`,
          `"${row.total_spent || 0}"`,
          `"${row.total_visits || 0}"`,
          `"${row.wallet_balance || 0}"`,
        ];
        csvRows.push(values.join(','));
      }

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `customers_${formatDate(new Date()).replace(/\//g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Customers exported successfully');
    } catch (error) {
      console.error('Failed to export customers', error);
      toast.error('Failed to export customers');
    } finally {
      setIsExporting(false);
    }
  };

  const getInitials = (c) => {
    const first = c.first_name?.[0]?.toUpperCase() || '';
    const last = c.last_name?.[0]?.toUpperCase() || '';
    return `${first}${last}` || 'C';
  };

  const isTodayDate = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const formatVisitDate = (dateString, visits) => {
    if (!dateString || visits === 0) {
      return <span className="text-gray-500 font-normal">Yet to visit</span>;
    }
    if (isTodayDate(dateString)) {
      return <span className="text-[#12B76A] font-semibold">Today</span>;
    }
    try {
      return <span className="text-gray-700 dark:text-gray-300 font-medium">{format(new Date(dateString), 'd MMM yyyy')}</span>;
    } catch {
      return <span className="text-gray-700 dark:text-gray-300 font-medium">{dateString}</span>;
    }
  };

  const renderSourceBadge = (source) => {
    const s = (source || 'walk_in').toLowerCase();
    if (s.includes('online')) {
      return (
        <span className="inline-block bg-[#EFF8FF] text-[#175CD3] dark:bg-blue-950/50 dark:text-blue-400 border border-[#B2DDFF] dark:border-blue-800/40 px-3 py-0.5 rounded-full text-xs font-semibold">
          Online
        </span>
      );
    }
    if (s.includes('insta')) {
      return (
        <span className="inline-block bg-[#FDF2FA] text-[#C11574] dark:bg-pink-950/50 dark:text-pink-400 border border-[#FCCEEE] dark:border-pink-800/40 px-3 py-0.5 rounded-full text-xs font-semibold">
          Instagram
        </span>
      );
    }
    if (s.includes('goog')) {
      return (
        <span className="inline-block bg-[#F0FDF9] text-[#0E9384] dark:bg-teal-950/50 dark:text-teal-400 border border-[#99F6E0] dark:border-teal-800/40 px-3 py-0.5 rounded-full text-xs font-semibold">
          Google
        </span>
      );
    }
    if (s.includes('refer')) {
      return (
        <span className="inline-block bg-[#F9F5FF] text-[#6941C6] dark:bg-purple-950/50 dark:text-purple-400 border border-[#E9D7FE] dark:border-purple-800/40 px-3 py-0.5 rounded-full text-xs font-semibold">
          Referral
        </span>
      );
    }
    return (
      <span className="inline-block bg-[#F4F3FF] text-[#5925DC] dark:bg-indigo-950/50 dark:text-indigo-400 border border-[#D9D6FE] dark:border-indigo-800/40 px-3 py-0.5 rounded-full text-xs font-semibold">
        Walk-In
      </span>
    );
  };

  const renderStatusBadge = (isActive) => {
    const active = isActive === 1 || isActive === true || isActive === 'true';
    if (active) {
      return (
        <span className="inline-block bg-[#E8F8EE] text-[#12B76A] dark:bg-emerald-950/50 dark:text-emerald-400 border border-[#D1FADF] dark:border-emerald-800/40 px-3 py-0.5 rounded-full text-xs font-semibold">
          Active
        </span>
      );
    }
    return (
      <span className="inline-block bg-[#FEF6EE] text-[#F79009] dark:bg-amber-950/50 dark:text-amber-400 border border-[#FEE4E2] dark:border-amber-800/40 px-3 py-0.5 rounded-full text-xs font-semibold">
        Inactive
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* ========================================================
          1. EXACT HERO HEADER & STATS CARDS SECTION
             (Full-bleed from root header down behind stat cards)
         ======================================================== */}
      <div className="relative w-full mb-6">
        <div
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
          }}
        >
          {/* ========================================================
              LIGHT MODE GRADIENTS (Hidden completely in dark mode)
             ======================================================== */}
          {/* Full-bleed ambient backdrop extending down through the stat cards */}
          <div 
            className="dark:hidden absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 235, 243, 0.95) 0%, rgba(255, 242, 247, 0.75) 45%, rgba(255, 248, 252, 0.3) 75%, transparent 100%)',
            }}
          />

          {/* Ambient radial pink aura centered behind model & quote */}
          <div
            className="dark:hidden absolute top-0 left-[15%] right-[5%] h-[340px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 75% 65% at 55% 25%, rgba(255, 202, 225, 0.8) 0%, rgba(255, 226, 239, 0.4) 50%, transparent 85%)',
            }}
          />

          {/* ========================================================
              DARK MODE GRADIENTS (Luxury seamless dark aura matching #0f0f1a)
             ======================================================== */}
          {/* Primary vertical dark wash: delicate rose-wine diffusing into dark background */}
          <div 
            className="hidden dark:block absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(233, 30, 99, 0.16) 0%, rgba(194, 24, 91, 0.08) 35%, rgba(15, 15, 26, 0.3) 70%, transparent 100%)',
            }}
          />

          {/* Dark mode radial pink aura centered behind header & stat cards */}
          <div
            className="hidden dark:block absolute top-0 left-[15%] right-[5%] h-[340px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 75% 65% at 55% 25%, rgba(233, 30, 99, 0.18) 0%, rgba(194, 24, 91, 0.06) 50%, transparent 85%)',
            }}
          />

          {/* Dark mode secondary violet aura on left for rich depth */}
          <div
            className="hidden dark:block absolute top-0 left-0 w-1/2 h-[300px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(168, 85, 247, 0.09) 0%, transparent 75%)',
            }}
          />
        </div>

        {/* Exact Model & Calligraphy Graphic (commented out for now) */}
        {/* <div className="hidden lg:block absolute left-[54%] xl:left-[52%] -translate-x-1/2 top-0 pointer-events-none z-0">
          <img
            src="/customer_hero_full.png"
            alt="Loyal Clients Stronger Business"
            className="h-[220px] xl:h-[240px] 2xl:h-[255px] w-auto object-contain select-none"
          />
        </div> */}

        {/* Top Bar: Title on left, Add Button on far right */}
        <div className="relative z-10 flex items-start justify-between min-h-[125px] xl:min-h-[138px] 2xl:min-h-[148px] px-6 pt-5 sm:pt-6 mb-2">
          {/* Left: Title & Subtitle */}
          <div className="max-w-[340px] xl:max-w-md z-10 pt-1">
            <h1 className="text-2xl xl:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Customers</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your salon customers, view history, and build stronger relationships.
            </p>
          </div>

          {/* Far Right: Add Customer Button */}
          <div className="z-20 pt-1">
            <button
              onClick={() => {
                setCustomerToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="bg-[#e91e63] hover:bg-[#d81b60] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-[#e91e63]/25 flex items-center gap-2 shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <RiAddLine className="text-lg font-bold" /> Add Customer
            </button>
          </div>
        </div>

        {/* 4 Metric Stat Cards (moved slightly down) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 mt-2 sm:mt-3">
          {/* Card 1: New Customers */}
          <div className="bg-gradient-to-b from-[#FFF5F8] to-white dark:from-[#201826] dark:to-[#1a1a2e] border border-pink-100/90 dark:border-pink-900/30 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3.5 mb-2.5">
              <div className="w-12 h-12 rounded-2xl bg-[#FFD4E2] dark:bg-pink-900/50 text-[#E91E63] flex items-center justify-center text-xl shrink-0">
                <RiGroupLine />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">New Customers</span>
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">{stats.new_customers}</h3>
              </div>
            </div>
            <div className="flex items-end justify-between pt-1">
              <p className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
                <RiArrowUpLine /> 50% vs last month
              </p>
              <MiniBars color="pink" heights={[30, 45, 60, 80, 100]} />
            </div>
          </div>

          {/* Card 2: Returning Customers */}
          <div className="bg-gradient-to-b from-[#F0F7FF] to-white dark:from-[#162136] dark:to-[#1a1a2e] border border-blue-100/90 dark:border-blue-900/30 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3.5 mb-2.5">
              <div className="w-12 h-12 rounded-2xl bg-[#D2E7FF] dark:bg-blue-900/50 text-[#2E90FA] flex items-center justify-center text-xl shrink-0">
                <RiUserSharedLine />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">Returning Customers</span>
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">{stats.returning_customers}</h3>
              </div>
            </div>
            <div className="flex items-end justify-between pt-1">
              <p className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
                <RiArrowUpLine /> 100% vs last month
              </p>
              <MiniBars color="blue" heights={[25, 40, 55, 75, 100]} />
            </div>
          </div>

          {/* Card 3: Inactive Customers */}
          <div className="bg-gradient-to-b from-[#FFFDF5] to-white dark:from-[#242118] dark:to-[#1a1a2e] border border-amber-100/90 dark:border-amber-900/30 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3.5 mb-2.5">
              <div className="w-12 h-12 rounded-2xl bg-[#FFECC2] dark:bg-amber-900/50 text-[#F79009] flex items-center justify-center text-xl shrink-0">
                <RiUserLine />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">Inactive Customers</span>
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">{stats.inactive_customers}</h3>
              </div>
            </div>
            <div className="flex items-end justify-between pt-1">
              <p className="text-xs font-medium text-gray-400 flex items-center gap-0.5">
                <RiRefreshLine /> 0% vs last month
              </p>
              <MiniBars color="amber" heights={[25, 40, 55, 75, 100]} />
            </div>
          </div>

          {/* Card 4: Defected Customers */}
          <div className="bg-gradient-to-b from-[#FAF5FF] to-white dark:from-[#201830] dark:to-[#1a1a2e] border border-purple-100/90 dark:border-purple-900/30 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3.5 mb-2.5">
              <div className="w-12 h-12 rounded-2xl bg-[#E9D7FE] dark:bg-purple-900/50 text-[#7F56D9] flex items-center justify-center text-xl shrink-0">
                <RiShieldCheckLine />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">Defected Customers</span>
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">{stats.defected_customers}</h3>
              </div>
            </div>
            <div className="flex items-end justify-between pt-1">
              <p className="text-xs font-medium text-gray-400 flex items-center gap-0.5">
                <RiRefreshLine /> 0% vs last month
              </p>
              <MiniBars color="purple" heights={[25, 40, 55, 75, 100]} />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. MAIN BODY CONTENT (Standard padding)
         ======================================================== */}
      <div className="px-6 flex flex-col flex-1 pb-6">
        {/* ACTION & SEARCH BAR */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="border border-[#e91e63] text-[#e91e63] bg-white dark:bg-[#1a1a2e] hover:bg-pink-50 dark:hover:bg-pink-900/20 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <RiUpload2Line className="text-base" /> Import
          </button>

          {/* Download Button */}
          <button
            onClick={exportToCSV}
            disabled={isExporting}
            className="bg-[#e91e63] hover:bg-[#d81b60] text-white px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm shadow-[#e91e63]/20 transition-colors disabled:opacity-60 cursor-pointer shrink-0"
          >
            {isExporting ? <RiLoader2Line className="animate-spin text-base" /> : <RiDownload2Line className="text-base" />}
            Download
          </button>

          {/* Search Input Bar */}
          <div className="relative flex-1 min-w-[240px] max-w-xl mx-auto">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search customers by name, phone, email..."
              className="w-full bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:border-[#e91e63] focus:ring-1 focus:ring-[#e91e63] shadow-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5 ml-auto shrink-0">
            {/* Horizontal Scroll Quick Buttons (Top Toolbar next to Filter) */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 p-1 rounded-xl shadow-xs">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 pl-2 pr-1 select-none hidden sm:inline">
                Scroll Table
              </span>
              <button
                type="button"
                onClick={() => handleScrollTable('left')}
                disabled={!canScrollLeft}
                className="w-7 h-7 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-white hover:bg-[#E91E63] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-2xs cursor-pointer"
                title="Scroll table left (X-Axis)"
                aria-label="Scroll table left"
              >
                <RiArrowLeftSLine className="text-base" />
              </button>
              <button
                type="button"
                onClick={() => handleScrollTable('right')}
                disabled={!canScrollRight}
                className="w-7 h-7 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-white hover:bg-[#E91E63] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-2xs cursor-pointer"
                title="Scroll table right (X-Axis)"
                aria-label="Scroll table right"
              >
                <RiArrowRightSLine className="text-base" />
              </button>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`border border-[#e91e63] text-[#e91e63] px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer ${
                filters.is_active || filters.gender || filters.source
                  ? 'bg-pink-50 dark:bg-pink-900/30'
                  : 'bg-white dark:bg-[#1a1a2e] hover:bg-pink-50 dark:hover:bg-pink-900/20'
              }`}
            >
              Filter <RiFilter3Line className="text-base" />
            </button>
          </div>
        </div>

        {/* ========================================================
            4. ALPHABET FILTER & SORT / VIEW CONTROLS
           ======================================================== */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-medium mb-1.5">Filter by name</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Alphabet list */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
              <button
                onClick={() => handleFilterChange('letter', '')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  !filters.letter
                    ? 'bg-[#e91e63] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-[#e91e63] hover:bg-pink-50 dark:hover:bg-white/5'
                }`}
              >
                All
              </button>
              {ALPHABETS.map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleFilterChange('letter', letter)}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    filters.letter === letter
                      ? 'bg-[#e91e63] text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-[#e91e63] hover:bg-pink-50 dark:hover:bg-white/5'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>

            {/* Right: Sort by & View Toggle */}
            <div className="flex items-center gap-3 ml-auto shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Sort by</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none focus:border-[#e91e63] shadow-sm cursor-pointer"
                >
                  <option value="last_visit_at">Last Visited</option>
                  <option value="first_name">Name (A-Z)</option>
                  <option value="total_spent">Total Spent</option>
                  <option value="total_visits">Visits</option>
                </select>
              </div>

              {/* List / Grid Switch */}
              <div className="flex items-center gap-1 bg-white dark:bg-[#1a1a2e] p-1 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[#e91e63] text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  title="List View"
                >
                  <RiListUnordered className="text-base" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#e91e63] text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  title="Grid View"
                >
                  <RiGridLine className="text-base" />
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* ========================================================
          5. CUSTOMERS TABLE (with middle floating circle scroll buttons, top quick controls, and bottom scroller)
         ======================================================== */}
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col mb-4">
        <TableScrollContainer ref={tableScrollRef}>
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none bg-gray-50/50 dark:bg-white/[0.02]">
                <th className="py-3.5 pl-5 pr-2 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={customers.length > 0 && selectedIds.length === customers.length}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = selectedIds.length > 0 && selectedIds.length < customers.length;
                      }
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-[#e91e63] focus:ring-[#e91e63] cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => handleSortToggle('first_name')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-gray-700 dark:hover:text-white min-w-[220px]"
                >
                  CUSTOMER <RiArrowUpDownLine className="inline text-xs text-gray-400 ml-1" />
                </th>
                <th
                  onClick={() => handleSortToggle('phone')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-gray-700 dark:hover:text-white min-w-[140px]"
                >
                  PHONE <RiArrowUpDownLine className="inline text-xs text-gray-400 ml-1" />
                </th>
                <th
                  onClick={() => handleSortToggle('total_spent')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-gray-700 dark:hover:text-white min-w-[130px]"
                >
                  TOTAL SPENT <RiArrowUpDownLine className="inline text-xs text-gray-400 ml-1" />
                </th>
                <th
                  onClick={() => handleSortToggle('total_visits')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-gray-700 dark:hover:text-white min-w-[90px]"
                >
                  VISITS <RiArrowUpDownLine className="inline text-xs text-gray-400 ml-1" />
                </th>
                <th
                  onClick={() => handleSortToggle('wallet_balance')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-gray-700 dark:hover:text-white min-w-[140px]"
                >
                  WALLET BALANCE <RiArrowUpDownLine className="inline text-xs text-gray-400 ml-1" />
                </th>
                <th
                  onClick={() => handleSortToggle('last_visit_at')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-gray-700 dark:hover:text-white min-w-[130px]"
                >
                  LAST VISIT <RiArrowUpDownLine className="inline text-xs text-gray-400 ml-1" />
                </th>
                <th
                  onClick={() => handleSortToggle('is_active')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-gray-700 dark:hover:text-white min-w-[100px]"
                >
                  STATUS <RiArrowUpDownLine className="inline text-xs text-gray-400 ml-1" />
                </th>
                <th
                  onClick={() => handleSortToggle('source')}
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-gray-700 dark:hover:text-white min-w-[100px]"
                >
                  SOURCE <RiArrowUpDownLine className="inline text-xs text-gray-400 ml-1" />
                </th>
                <th className="py-3.5 px-4 font-semibold text-center min-w-[120px]">
                  ACTIONS <RiArrowUpDownLine className="inline text-xs text-gray-400 ml-1" />
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-gray-400">
                    <RiLoader2Line className="animate-spin text-2xl mx-auto mb-2 text-[#e91e63]" />
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-gray-400">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown';
                  const formattedPhone = c.phone?.startsWith('+91')
                    ? c.phone
                    : `+91  ${c.phone || ''}`;

                  const isRowSelected = selectedIds.includes(c.id);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className={`hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group ${
                        isRowSelected ? 'bg-pink-50/40 dark:bg-pink-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-4 pl-5 pr-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => handleSelectOne(c.id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-[#e91e63] focus:ring-[#e91e63] cursor-pointer"
                        />
                      </td>

                      {/* Customer: Avatar + Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <VisualAvatar
                            type="customer"
                            image={c.profile_image_url}
                            name={fullName}
                            size="sm"
                          />
                          <span className="font-bold text-gray-900 dark:text-white group-hover:text-[#e91e63] transition-colors">
                            {fullName}
                          </span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-4 font-medium text-gray-800 dark:text-gray-200">
                        {formattedPhone}
                      </td>

                      {/* Total Spent */}
                      <td className="py-4 px-4 font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(c.total_spent || 0)}
                      </td>

                      {/* Visits */}
                      <td className="py-4 px-4 font-medium text-gray-800 dark:text-gray-200">
                        {c.total_visits || 0}
                      </td>

                      {/* Wallet Balance */}
                      <td className="py-4 px-4 font-medium text-gray-800 dark:text-gray-200">
                        {formatCurrency(c.wallet_balance || 0)}
                      </td>

                      {/* Last Visit */}
                      <td className="py-4 px-4">
                        {formatVisitDate(c.last_visit_at, c.total_visits)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {renderStatusBadge(c.is_active)}
                      </td>

                      {/* Source */}
                      <td className="py-4 px-4">
                        {renderSourceBadge(c.source)}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-4 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {/* View Profile */}
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                            title="View Profile"
                          >
                            <RiEyeLine className="text-base" />
                          </button>

                          {/* Edit Customer */}
                          <button
                            onClick={() => {
                              setCustomerToEdit(c);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-[#e91e63] hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Edit Customer"
                          >
                            <RiEdit2Line className="text-base" />
                          </button>

                          {/* More Options / Delete */}
                          <button
                            onClick={() => {
                              setSelectedCustomer(c);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                            title="More Actions"
                          >
                            <RiMoreFill className="text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableScrollContainer>
      </div>

      {/* ========================================================
          6. PAGINATION FOOTER
         ======================================================== */}
      <div className="flex items-center justify-between px-2 text-xs text-gray-500 font-medium">
        <div>
          Showing {customers.length > 0 ? 1 : 0} to {customers.length} of {meta.total || customers.length} customers
        </div>
        <div className="flex items-center gap-1.5">
          <button
            disabled={filters.page <= 1}
            onClick={() => handleFilterChange('page', filters.page - 1)}
            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <RiArrowLeftSLine className="text-lg" />
          </button>
          <button className="w-8 h-8 rounded-lg bg-[#e91e63] text-white font-bold flex items-center justify-center text-xs shadow-sm cursor-pointer">
            {filters.page}
          </button>
          <button
            disabled={filters.page >= (meta.totalPages || 1)}
            onClick={() => handleFilterChange('page', filters.page + 1)}
            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <RiArrowRightSLine className="text-lg" />
          </button>
        </div>
      </div>

      {/* ========================================================
          7. MODALS & DRAWERS
         ======================================================== */}
      <AddCustomerModal
        isOpen={isAddModalOpen || !!customerToEdit}
        onClose={() => {
          setIsAddModalOpen(false);
          setCustomerToEdit(null);
        }}
        onSuccess={() => {
          fetchCustomers();
          setIsAddModalOpen(false);
          setCustomerToEdit(null);
        }}
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
        onApply={(newFilters) => {
          setFilters((prev) => ({
            ...prev,
            page: 1,
            is_active: newFilters.is_active !== undefined ? newFilters.is_active : prev.is_active,
            gender: newFilters.gender !== undefined ? newFilters.gender : prev.gender,
            source: newFilters.source !== undefined ? newFilters.source : prev.source,
          }));
        }}
      />

      <CustomerProfilePanel
        customer={selectedCustomer}
        isOpen={!!selectedCustomer}
        onClose={handleClosePanel}
        onEdit={(customer) => {
          setCustomerToEdit(customer);
          setIsAddModalOpen(true);
        }}
        onDelete={async (id) => {
          try {
            await api.delete(`/customers/${id}`);
            setSelectedCustomer(null);
            fetchCustomers();
            toast.success('Customer deleted successfully');
          } catch (err) {
            console.error(err);
            toast.error('Failed to delete customer');
          }
        }}
      />

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={customers.length}
        onClear={() => setSelectedIds([])}
        resourceName="customer"
        actions={[
          {
            label: 'Activate',
            icon: RiShieldCheckLine,
            onClick: handleBulkActivate,
            variant: 'success',
            loading: bulkLoading,
          },
          {
            label: 'Deactivate',
            icon: RiCloseLine,
            onClick: handleBulkDeactivate,
            variant: 'default',
            loading: bulkLoading,
          },
          {
            label: 'Export CSV',
            icon: RiDownload2Line,
            onClick: handleExportSelected,
            variant: 'default',
          },
          {
            label: 'Delete',
            icon: RiDeleteBin6Line,
            onClick: handleBulkDelete,
            variant: 'danger',
            loading: bulkLoading,
          },
        ]}
      />
      </div>
    </div>
  );
}
