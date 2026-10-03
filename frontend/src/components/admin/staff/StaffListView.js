'use client';

import { useState, useMemo } from 'react';
import {
  RiUserAddLine,
  RiSearchLine,
  RiArrowDownSLine,
  RiRefreshLine,
  RiEyeLine,
  RiEdit2Line,
  RiDeleteBinLine,
  RiDeleteBin6Line,
  RiMore2Fill,
  RiGroupLine,
  RiUser3Line,
  RiPauseCircleLine,
  RiUserUnfollowLine,
  RiCheckLine,
  RiCloseLine,
  RiShieldCheckLine,
  RiDownload2Line,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowRightLine
} from 'react-icons/ri';
import { getImageUrl } from '@/lib/utils';
import BulkActionBar from '@/components/admin/common/BulkActionBar';
import { useConfirm } from '@/context/ConfirmContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Helper to determine styling for role pill badges exactly matching the image
export const getRoleBadgeStyle = (roleName = '') => {
  const normalized = (roleName || '').toLowerCase();
  if (normalized.includes('hair') || normalized.includes('stylist')) {
    return 'bg-pink-50 text-pink-600 border border-pink-200/80 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/20';
  }
  if (normalized.includes('barber')) {
    return 'bg-blue-50 text-blue-600 border border-blue-200/80 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/20';
  }
  if (normalized.includes('makeup')) {
    return 'bg-purple-50 text-purple-600 border border-purple-200/80 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/20';
  }
  if (normalized.includes('nail')) {
    return 'bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/20';
  }
  if (normalized.includes('spa') || normalized.includes('therapist')) {
    return 'bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20';
  }
  if (normalized.includes('receptionist') || normalized.includes('front')) {
    return 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/20';
  }
  if (normalized.includes('manager')) {
    return 'bg-indigo-50 text-indigo-600 border border-indigo-200/80 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/20';
  }
  if (normalized.includes('assistant')) {
    return 'bg-sky-50 text-sky-600 border border-sky-200/80 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/20';
  }
  return 'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10';
};

export default function StaffListView({
  staffList = [],
  loading = false,
  onAddStaff,
  onViewProfile,
  onEditStaff,
  onDeleteStaff,
  onToggleStatus,
  onRefresh,
}) {
  const { confirm } = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Compute KPI Counts
  const totalCount = staffList.length;
  const activeCount = staffList.filter(s => s.is_active && (s.status || 'Active') === 'Active').length;
  const onLeaveCount = staffList.filter(s => s.status === 'On Leave' || s.is_on_leave).length;
  const inactiveCount = staffList.filter(s => !s.is_active || s.status === 'Inactive').length;

  // Filter staff list
  const filteredList = useMemo(() => {
    return staffList.filter(staff => {
      const fullName = `${staff.first_name || ''} ${staff.last_name || ''}`.trim().toLowerCase();
      const roleName = (staff.designation || staff.role || '').toLowerCase();
      const email = (staff.email || '').toLowerCase();
      const phone = (staff.phone || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || fullName.includes(q) || roleName.includes(q) || email.includes(q) || phone.includes(q);

      const matchesRole = roleFilter === 'All Roles' || roleName.includes(roleFilter.toLowerCase());

      let currentStatus = staff.is_active ? 'Active' : 'Inactive';
      if (staff.is_on_leave || staff.status === 'On Leave') currentStatus = 'On Leave';

      const matchesStatus = statusFilter === 'All Status' || currentStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffList, searchQuery, roleFilter, statusFilter]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredList.length);
  const paginatedStaff = filteredList.slice(startIndex, endIndex);

  // Handle select all checkbox (across filtered staff list)
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredList.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkActivate = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await api.post('/staff/bulk-status', { ids: selectedIds, is_active: true });
      toast.success(`${selectedIds.length} staff member${selectedIds.length > 1 ? 's' : ''} activated`);
      setSelectedIds([]);
      if (onRefresh) onRefresh(true);
    } catch (err) {
      console.error('Failed to activate selected staff', err);
      toast.error(err.response?.data?.message || 'Failed to activate selected staff');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await api.post('/staff/bulk-status', { ids: selectedIds, is_active: false });
      toast.success(`${selectedIds.length} staff member${selectedIds.length > 1 ? 's' : ''} deactivated`);
      setSelectedIds([]);
      if (onRefresh) onRefresh(true);
    } catch (err) {
      console.error('Failed to deactivate selected staff', err);
      toast.error(err.response?.data?.message || 'Failed to deactivate selected staff');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportSelected = () => {
    if (selectedIds.length === 0) return;
    const selectedStaff = staffList.filter((s) => selectedIds.includes(s.id));
    const headers = ['Staff Name', 'Role', 'Phone', 'Email', 'Status', 'Join Date'];
    const csvRows = [headers.join(',')];

    for (const s of selectedStaff) {
      const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Staff Member';
      const role = s.designation || s.role || 'Staff Member';
      const phone = s.phone ? (s.phone.startsWith('+') ? s.phone : `+91 ${s.phone}`) : '-';
      const email = s.email || '-';
      const status = s.is_active ? 'Active' : 'Inactive';
      const joinDate = s.joining_date
        ? new Date(s.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : s.created_at
        ? new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-';

      const values = [
        `"${fullName}"`,
        `"${role}"`,
        `"${phone}"`,
        `"${email}"`,
        `"${status}"`,
        `"${joinDate}"`,
      ];
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `selected_staff_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedStaff.length} selected staff member${selectedStaff.length > 1 ? 's' : ''}`);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const isOk = await confirm({
      title: 'Delete Selected Staff Members',
      message: `Are you sure you want to delete ${selectedIds.length} staff member${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      type: 'danger',
    });
    if (!isOk) return;

    setBulkLoading(true);
    try {
      await api.post('/staff/bulk-delete', { ids: selectedIds });
      toast.success(`${selectedIds.length} staff member${selectedIds.length > 1 ? 's' : ''} deleted`);
      setSelectedIds([]);
      if (onRefresh) onRefresh(true);
    } catch (err) {
      console.error('Failed to delete selected staff', err);
      toast.error(err.response?.data?.message || 'Failed to delete selected staff');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('All Roles');
    setStatusFilter('All Status');
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease_forwards]">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-400 mb-1">
            <span className="hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">Staff Management</span>
            <span>&gt;</span>
            <span className="text-[#FA2D65] font-semibold">Staff List</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Staff List</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your salon staff, roles, schedules and permissions.
          </p>
        </div>

        <button
          onClick={onAddStaff}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FA2D65] hover:bg-[#E02456] text-white text-sm font-semibold shadow-md shadow-[#FA2D65]/20 hover:shadow-lg hover:shadow-[#FA2D65]/30 active:scale-95 transition-all self-start sm:self-auto"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add Staff</span>
        </button>
      </div>

      {/* 2. 4 Stat KPI Cards matching Image 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-500/10 text-[#FA2D65] flex items-center justify-center text-2xl shrink-0">
            <RiGroupLine />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {totalCount}
            </div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
              Total Staff
            </div>
          </div>
        </div>

        {/* Active Staff */}
        <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shrink-0">
            <RiUser3Line />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {activeCount}
            </div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
              Active Staff
            </div>
          </div>
        </div>

        {/* On Leave */}
        <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shrink-0">
            <RiPauseCircleLine />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {onLeaveCount}
            </div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
              On Leave
            </div>
          </div>
        </div>

        {/* Inactive Staff */}
        <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl shrink-0">
            <RiUserUnfollowLine />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {inactiveCount}
            </div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
              Inactive Staff
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search staff by name, role, phone or email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#FA2D65] dark:focus:border-[#FA2D65] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter Dropdown */}
          <div className="relative min-w-[140px]">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#FA2D65] cursor-pointer"
            >
              <option value="All Roles">All Roles</option>
              <option value="Hair Stylist">Hair Stylist</option>
              <option value="Barber">Barber</option>
              <option value="Makeup Artist">Makeup Artist</option>
              <option value="Nail Technician">Nail Technician</option>
              <option value="Spa Therapist">Spa Therapist</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Manager">Manager</option>
              <option value="Assistant">Assistant</option>
            </select>
            <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base" />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative min-w-[130px]">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#FA2D65] cursor-pointer"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
            <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base" />
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <RiRefreshLine className="text-base" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* 4. Staff Table matching Image 1 */}
      <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-white/[0.02]">
                <th className="py-4 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredList.length > 0 && selectedIds.length === filteredList.length}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = selectedIds.length > 0 && selectedIds.length < filteredList.length;
                      }
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#FA2D65] focus:ring-[#FA2D65] cursor-pointer"
                  />
                </th>
                <th className="py-4 px-3 w-12 text-gray-400 font-semibold">#</th>
                <th className="py-4 px-4 font-bold text-gray-700 dark:text-gray-300">Staff Name</th>
                <th className="py-4 px-4 font-bold text-gray-700 dark:text-gray-300">Role</th>
                <th className="py-4 px-4 font-bold text-gray-700 dark:text-gray-300">Phone</th>
                <th className="py-4 px-4 font-bold text-gray-700 dark:text-gray-300">Email</th>
                <th className="py-4 px-4 font-bold text-gray-700 dark:text-gray-300">Join Date</th>
                <th className="py-4 px-4 font-bold text-gray-700 dark:text-gray-300">Status</th>
                <th className="py-4 px-4 text-center font-bold text-gray-700 dark:text-gray-300 w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4 text-center"><div className="w-4 h-4 bg-gray-200 dark:bg-white/10 rounded mx-auto"></div></td>
                    <td className="py-4 px-3"><div className="w-6 h-4 bg-gray-200 dark:bg-white/10 rounded"></div></td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/10 shrink-0"></div>
                        <div className="w-28 h-4 bg-gray-200 dark:bg-white/10 rounded"></div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="w-20 h-6 bg-gray-200 dark:bg-white/10 rounded-full"></div></td>
                    <td className="py-4 px-4"><div className="w-24 h-4 bg-gray-200 dark:bg-white/10 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-32 h-4 bg-gray-200 dark:bg-white/10 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-20 h-4 bg-gray-200 dark:bg-white/10 rounded"></div></td>
                    <td className="py-4 px-4"><div className="w-16 h-6 bg-gray-200 dark:bg-white/10 rounded-full"></div></td>
                    <td className="py-4 px-4"><div className="w-20 h-6 bg-gray-200 dark:bg-white/10 rounded mx-auto"></div></td>
                  </tr>
                ))
              ) : paginatedStaff.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <div className="text-4xl mb-2 opacity-30">👥</div>
                    <p className="font-medium text-base">No staff members match the selected filters.</p>
                    <button
                      onClick={handleClearFilters}
                      className="mt-3 text-sm text-[#FA2D65] font-semibold hover:underline"
                    >
                      Reset filters
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedStaff.map((staff, idx) => {
                  const rowNumber = startIndex + idx + 1;
                  const fullName = `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Staff Member';
                  const designation = staff.designation || staff.role || 'Staff';
                  const phone = staff.phone ? (staff.phone.startsWith('+') ? staff.phone : `+91 ${staff.phone}`) : '-';
                  const email = staff.email || '-';
                  const joinDate = staff.joining_date 
                    ? new Date(staff.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : staff.created_at
                    ? new Date(staff.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '-';
                  
                  let status = staff.is_active ? 'Active' : 'Inactive';
                  if (staff.is_on_leave || staff.status === 'On Leave') status = 'On Leave';

                  const isSelected = selectedIds.includes(staff.id);

                  return (
                    <tr
                      key={staff.id || idx}
                      onClick={() => onViewProfile(staff)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-rose-50/70 dark:bg-rose-500/15'
                          : 'hover:bg-pink-50/30 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(staff.id)}
                          onChange={() => handleSelectOne(staff.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#FA2D65] focus:ring-[#FA2D65] cursor-pointer"
                        />
                      </td>

                      {/* Row Index */}
                      <td className="py-3.5 px-3 text-gray-400 text-xs font-medium">
                        {rowNumber}
                      </td>

                      {/* Staff Avatar + Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {staff.avatar_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={getImageUrl(staff.avatar_url)}
                              alt={fullName}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-400 to-[#FA2D65] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                              {staff.first_name?.[0] || 'S'}
                            </div>
                          )}
                          <span className="font-bold text-gray-900 dark:text-white group-hover:text-[#FA2D65] transition-colors">
                            {fullName}
                          </span>
                        </div>
                      </td>

                      {/* Role Pill with custom pastel styles */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getRoleBadgeStyle(designation)}`}>
                          {designation}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {phone}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                        {email}
                      </td>

                      {/* Join Date */}
                      <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {joinDate}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {status === 'Active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : status === 'On Leave' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            On Leave
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5 text-gray-400">
                          {/* Eye / View Profile Button */}
                          <button
                            type="button"
                            title="View Staff Profile"
                            onClick={() => onViewProfile(staff)}
                            className="p-1.5 hover:text-[#FA2D65] hover:bg-pink-50 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                          >
                            <RiEyeLine className="text-base" />
                          </button>

                          {/* Pencil / Edit Button */}
                          <button
                            type="button"
                            title="Edit Staff"
                            onClick={(e) => onEditStaff(e, staff)}
                            className="p-1.5 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                          >
                            <RiEdit2Line className="text-base" />
                          </button>

                          {/* Trash / Delete Button */}
                          <button
                            type="button"
                            title="Delete Staff"
                            onClick={(e) => onDeleteStaff(e, staff.id)}
                            className="p-1.5 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                          >
                            <RiDeleteBinLine className="text-base" />
                          </button>

                          {/* 3-dots Menu */}
                          <div className="relative">
                            <button
                              type="button"
                              title="More Options"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === staff.id ? null : staff.id);
                              }}
                              className="p-1.5 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                            >
                              <RiMore2Fill className="text-base" />
                            </button>

                            {activeMenuId === staff.id && (
                              <div 
                                className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1f2238] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-30 py-1.5 text-xs text-gray-700 dark:text-gray-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => { setActiveMenuId(null); onViewProfile(staff); }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                                >
                                  <RiEyeLine className="text-sm text-gray-400" />
                                  <span>View Profile</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { setActiveMenuId(null); onEditStaff(e, staff); }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                                >
                                  <RiEdit2Line className="text-sm text-gray-400" />
                                  <span>Edit Details</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { setActiveMenuId(null); onToggleStatus(staff, e); }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                                >
                                  <span className={`w-2 h-2 rounded-full ${staff.is_active ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                  <span>{staff.is_active ? 'Mark Inactive' : 'Mark Active'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Bottom Bar matching Image 1 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.01] text-xs text-gray-500 dark:text-gray-400">
          <div>
            Showing <strong className="text-gray-900 dark:text-white">{filteredList.length === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-gray-900 dark:text-white">{endIndex}</strong> of <strong className="text-gray-900 dark:text-white">{filteredList.length}</strong> staff members
          </div>

          {/* Page numbers: << [1] 2 3 >> */}
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <RiArrowLeftSLine className="text-base" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  currentPage === pageNum
                    ? 'bg-[#FA2D65] text-white shadow-sm shadow-[#FA2D65]/30'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <RiArrowRightSLine className="text-base" />
            </button>
          </div>

          {/* Per Page Selector */}
          <div className="flex items-center gap-2">
            <span>Show</span>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="appearance-none pl-2.5 pr-6 py-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#FA2D65]"
              >
                <option value={8}>8</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <RiArrowDownSLine className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
            </div>
            <span>per page</span>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={staffList.length}
        onClear={() => setSelectedIds([])}
        resourceName="staff member"
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
  );
}
