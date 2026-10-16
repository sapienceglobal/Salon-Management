'use client';

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useScrollLock } from '@/hooks/useScrollLock';
import PageHeaderGradient from '@/components/admin/common/PageHeaderGradient';
import TableScrollContainer from '@/components/admin/common/TableScrollContainer';
import AccessDenied from '@/components/admin/common/AccessDenied';
import {
  RiAddLine,
  RiSearchLine,
  RiUserSettingsLine,
  RiShieldStarLine,
  RiShieldCheckLine,
  RiUserLine,
  RiGroupLine,
  RiLockPasswordLine,
  RiMailLine,
  RiPhoneLine,
  RiDeleteBinLine,
  RiCloseLine,
  RiEditLine,
  RiRefreshLine,
  RiEyeLine,
  RiEyeOffLine,
  RiCheckLine,
  RiInformationLine,
  RiKey2Line,
  RiArrowRightSLine,
  RiSparklingLine,
  RiScissorsLine,
  RiTimeLine,
  RiCloseCircleLine,
  RiLockUnlockLine,
  RiFilter3Line,
  RiUserStarLine,
  RiCalendarCheckLine,
} from 'react-icons/ri';

const emptySubscribe = () => () => {};

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const { confirm } = useConfirm();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Data state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'receptionist',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useScrollLock(isModalOpen);

  // Fetch users from API
  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/settings/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load user accounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open modal for Adding new user
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      role: 'receptionist',
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Open modal for Editing existing user
  const handleOpenEditModal = (targetUser) => {
    setEditingUser(targetUser);
    setFormData({
      first_name: targetUser.first_name || '',
      last_name: targetUser.last_name || '',
      email: targetUser.email || '',
      phone: targetUser.phone || '',
      password: '', // Leave blank unless resetting
      role: targetUser.role || 'receptionist',
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Generate strong random password
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: generated }));
    setShowPassword(true);
    toast.success('Generated temporary password');
  };

  // Submit Add or Edit User
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.first_name.trim()) {
      return toast.error('Please enter first name');
    }

    if (!editingUser) {
      if (!formData.email.trim()) return toast.error('Please enter a valid email address');
      if (!formData.password || formData.password.length < 8) {
        return toast.error('Password must be at least 8 characters');
      }
    } else if (formData.password && formData.password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        // Edit Mode
        const payload = {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          role: formData.role,
        };
        if (formData.password && formData.password.trim()) {
          payload.password = formData.password.trim();
        }

        await api.put(`/settings/users/${editingUser.id}`, payload);
        toast.success('User updated successfully');
      } else {
        // Add Mode
        const payload = {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim() || undefined,
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || undefined,
          password: formData.password.trim(),
          role: formData.role,
        };

        await api.post('/settings/users', payload);
        toast.success('User created successfully');
      }

      handleCloseModal();
      fetchUsers(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (targetUser) => {
    if (Number(targetUser.id) === Number(currentUser?.id)) {
      toast.error('You cannot disable your own administrator account');
      return;
    }

    const newStatus = targetUser.is_active === false;
    try {
      await api.put(`/settings/users/${targetUser.id}`, { is_active: newStatus });
      toast.success(`User ${newStatus ? 'activated' : 'disabled'} successfully`);
      fetchUsers(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  // Delete user permanently
  const handleDeleteUser = async (targetUser) => {
    if (Number(targetUser.id) === Number(currentUser?.id)) {
      toast.error('You cannot delete your own account');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Delete System User',
      message: `Are you sure you want to permanently delete "${targetUser.first_name} ${targetUser.last_name || ''}" (${targetUser.email})? This user will immediately lose access to the salon ERP system.`,
      confirmText: 'Delete Permanently',
      danger: true,
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/settings/users/${targetUser.id}`);
      toast.success('User deleted successfully');
      fetchUsers(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      const role = (u.role || '').toLowerCase();

      const matchesSearch = !q || fullName.includes(q) || email.includes(q) || phone.includes(q) || role.includes(q);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.is_active !== false) ||
        (statusFilter === 'disabled' && u.is_active === false);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Compute Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.is_active !== false).length;
    const adminManager = users.filter((u) => ['admin', 'super_admin', 'manager'].includes(u.role)).length;
    const frontDesk = users.filter((u) => ['receptionist', 'staff'].includes(u.role)).length;

    return { total, active, adminManager, frontDesk };
  }, [users]);

  // Role Badge Helper with clean icons and styling
  const renderRoleBadge = (role) => {
    const r = (role || 'staff').toLowerCase();
    switch (r) {
      case 'super_admin':
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
            <RiShieldStarLine className="text-purple-600 dark:text-purple-400 text-sm" />
            <span>Administrator</span>
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
            <RiUserSettingsLine className="text-blue-600 dark:text-blue-400 text-sm" />
            <span>Manager</span>
          </span>
        );
      case 'receptionist':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
            <RiUserLine className="text-amber-600 dark:text-amber-400 text-sm" />
            <span>Receptionist</span>
          </span>
        );
      case 'staff':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
            <RiScissorsLine className="text-emerald-600 dark:text-emerald-400 text-sm" />
            <span>Staff</span>
          </span>
        );
    }
  };

  // Restrict access to Admins only
  if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
    return (
      <AccessDenied
        title="User Management Access Restricted"
        message="Salon system user accounts, login credentials, and permission settings are strictly restricted to Administrator accounts."
      />
    );
  }

  const inputClass =
    'w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all';
  const labelClass = 'block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* ========================================================
          1. TOP HERO SECTION WITH SIGNATURE AMBIENT PINK GRADIENT
         ======================================================== */}
      <div className="relative -mx-6 -mt-6 px-6 pt-6 pb-2 mb-6 overflow-hidden">
        <PageHeaderGradient height="h-[300px]" />

        {/* Top Header Bar */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              <Link href="/" className="hover:text-slate-800 dark:hover:text-white transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300 font-semibold">Salon Operations</span>
              <span>&gt;</span>
              <span className="text-[#E91E63] font-bold">User Management</span>
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
              User Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Manage system login credentials, staff access permissions, and administrative user roles.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
              title="Refresh users list"
            >
              <RiRefreshLine className={`text-base ${refreshing ? 'animate-spin text-[#E91E63]' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#F43F5E] hover:from-[#D81B60] hover:to-[#E11D48] text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(233,30,99,0.35)] transition-all transform active:scale-95 cursor-pointer"
            >
              <RiAddLine className="text-lg" />
              <span>Add System User</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            2. 4 METRIC KPI STAT CARDS (Luxury Pastel + Dark Palette)
           ======================================================== */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Users */}
          <div className="bg-gradient-to-b from-[#FFF5F8] to-white dark:from-[#201826] dark:to-[#1a1a2e] border border-pink-100/90 dark:border-pink-900/30 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFD4E2] dark:bg-pink-900/50 text-[#E91E63] flex items-center justify-center text-2xl shrink-0 shadow-inner">
                <RiGroupLine />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total System Users</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {metrics.total}
                </h3>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-pink-100/60 dark:border-pink-900/20 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <RiCheckLine className="text-emerald-500" />
              <span>Accounts with ERP access</span>
            </div>
          </div>

          {/* Card 2: Active Accounts */}
          <div className="bg-gradient-to-b from-[#F0FDF4] to-white dark:from-[#14231b] dark:to-[#1a1a2e] border border-emerald-100/90 dark:border-emerald-900/30 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                <RiShieldCheckLine />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Active Accounts</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {metrics.active}
                </h3>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-emerald-100/60 dark:border-emerald-900/20 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Can login to system</span>
            </div>
          </div>

          {/* Card 3: Admins & Managers */}
          <div className="bg-gradient-to-b from-[#FAF5FF] to-white dark:from-[#21172e] dark:to-[#1a1a2e] border border-purple-100/90 dark:border-purple-900/30 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                <RiShieldStarLine />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Admins &amp; Managers</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {metrics.adminManager}
                </h3>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-purple-100/60 dark:border-purple-900/20 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <RiKey2Line className="text-purple-500" />
              <span>Full / Operations access</span>
            </div>
          </div>

          {/* Card 4: Front Desk & Staff */}
          <div className="bg-gradient-to-b from-[#FFFBEB] to-white dark:from-[#292215] dark:to-[#1a1a2e] border border-amber-100/90 dark:border-amber-900/30 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                <RiUserStarLine />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Front Desk &amp; Staff</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {metrics.frontDesk}
                </h3>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-amber-100/60 dark:border-amber-900/20 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <RiCalendarCheckLine className="text-amber-500" />
              <span>Bookings &amp; billing access</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. SEARCH, FILTERS & ACTION TOOLBAR
         ======================================================== */}
      <div className="bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Left: Search input */}
          <div className="relative flex-1 min-w-[240px]">
            <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, phone, role..."
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/20 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
              >
                <RiCloseLine className="text-base" />
              </button>
            )}
          </div>

          {/* Right: Role & Status Dropdowns */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden lg:inline">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-[#E91E63] cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="manager">Managers</option>
                <option value="receptionist">Receptionists</option>
                <option value="staff">Staff Members</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden lg:inline">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-[#E91E63] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="disabled">Disabled Only</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="text-xs font-bold text-[#E91E63] hover:underline px-2 py-1 cursor-pointer"
              >
                Reset
              </button>
            )}

            <div className="text-xs font-semibold text-slate-400 ml-auto md:ml-2">
              {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. USERS TABLE
         ======================================================== */}
      <div className="bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <TableScrollContainer>
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">System User</th>
                <th className="py-3.5 px-4">Role &amp; Access</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs sm:text-sm font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full border-3 border-[#E91E63] border-t-transparent animate-spin" />
                      <span className="text-sm font-semibold">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-14 h-14 rounded-2xl bg-pink-50 dark:bg-pink-900/20 text-[#E91E63] flex items-center justify-center text-2xl mb-1">
                        <RiUserSettingsLine />
                      </div>
                      <span className="text-base font-bold text-slate-800 dark:text-white">No system users found</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                          ? 'Try adjusting your search query or filter options.'
                          : 'Click "Add System User" above to create login access for your salon staff.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const isCurrent = Number(u.id) === Number(currentUser?.id);
                  const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'User';
                  const initial = u.first_name ? u.first_name.charAt(0).toUpperCase() : 'U';

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group ${
                        isCurrent ? 'bg-pink-50/20 dark:bg-pink-950/10' : ''
                      }`}
                    >
                      {/* # Number */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-bold text-xs">{idx + 1}</td>

                      {/* User Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt={fullName}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 ring-1 ring-slate-200 dark:ring-white/10"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E91E63] to-[#FB7185] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                              {initial}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                {fullName}
                              </span>
                              {isCurrent && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-[#E91E63]/15 text-[#E91E63] border border-[#E91E63]/30">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <RiMailLine className="text-slate-400 text-xs shrink-0" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Access Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">{renderRoleBadge(u.role)}</td>

                      {/* Contact Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                        {u.phone ? (
                          <div className="flex items-center gap-1.5 font-medium">
                            <RiPhoneLine className="text-slate-400 text-sm" />
                            <span>{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No phone added</span>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            u.is_active !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.is_active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          <span>{u.is_active !== false ? 'Active' : 'Disabled'}</span>
                        </span>
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {u.last_login_at ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {new Date(u.last_login_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(u.last_login_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Never logged in</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        {isCurrent ? (
                          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-pink-50 dark:bg-pink-950/30 text-[#E91E63] border border-pink-200 dark:border-pink-900/40 select-none">
                            Primary Account
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#E91E63] hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                              title="Edit user details"
                            >
                              <RiEditLine className="text-base" />
                            </button>

                            {/* Toggle Enable/Disable Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                                u.is_active !== false
                                  ? 'text-amber-700 hover:bg-amber-50 border-amber-200 dark:border-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-950/30'
                                  : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-950/30'
                              }`}
                            >
                              {u.is_active !== false ? 'Disable' : 'Enable'}
                            </button>

                            {/* Delete User Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
                              title="Delete user account"
                            >
                              <RiDeleteBinLine className="text-base" />
                            </button>
                          </div>
                        )}
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
          5. ROLE PERMISSIONS QUICK REFERENCE ACCORDION / GUIDE
         ======================================================== */}
      <div className="bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center text-lg shrink-0">
            <RiShieldStarLine />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              System Roles &amp; Permissions Overview
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Understanding what each staff account can view and manage inside your salon ERP.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Admin Role */}
          <div className="p-4 rounded-xl border border-purple-100 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-950/20">
            <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold text-xs uppercase tracking-wider mb-2">
              <RiShieldStarLine className="text-base text-purple-600" />
              <span>Administrator</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
              Complete unrestricted access to all aspects of the salon business, including:
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-4">
              <li>Financial invoices, revenue reports &amp; expenses</li>
              <li>Salon settings, tax rates &amp; branches</li>
              <li>User accounts, staff commissions &amp; audit logs</li>
            </ul>
          </div>

          {/* Manager Role */}
          <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-xs uppercase tracking-wider mb-2">
              <RiUserSettingsLine className="text-base text-blue-600" />
              <span>Manager</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
              Operational control for managing floor activities and team workflows:
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-4">
              <li>Manage appointments, calendar &amp; walk-ins</li>
              <li>Staff attendance, roster schedules &amp; leave</li>
              <li>Inventory items, product stock &amp; clients</li>
            </ul>
          </div>

          {/* Receptionist Role */}
          <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
              <RiUserLine className="text-base text-amber-600" />
              <span>Receptionist / Front Desk</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
              Front-of-house operations designed for quick front desk client handling:
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-4">
              <li>Book, reschedule &amp; check-in customer appointments</li>
              <li>Generate customer bills &amp; register payments</li>
              <li>View customer history &amp; service menu</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================
          6. ADD / EDIT USER MODAL POPUP
         ======================================================== */}
      {isModalOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 md:p-6 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
          onMouseDown={handleCloseModal}
        >
          <div
            className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white w-full max-w-xl max-h-[92vh] my-auto flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#E91E63] to-[#FB7185] text-white flex items-center justify-center text-lg sm:text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
                  <RiUserSettingsLine />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
                    {editingUser ? 'Edit System User' : 'Add System User'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {editingUser
                      ? `Updating details for ${editingUser.first_name} (${editingUser.email})`
                      : 'Create login access for Admins, Managers, or Receptionists.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              >
                <RiCloseLine className="text-xl sm:text-2xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 min-h-0 px-5 sm:px-8 py-5 sm:py-6 custom-scrollbar">
              <form id="user-management-form" onSubmit={handleSubmit} className="space-y-4">
                {/* Notice Box */}
                <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 p-3.5 rounded-xl text-xs border border-blue-200 dark:border-blue-900/40 flex items-start gap-2.5">
                  <RiInformationLine className="text-base text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Pro-Tip:</strong> To add Service Providers (Stylists, Hairdressers, Beauticians) who perform
                    salon services, use the{' '}
                    <Link href="/staff" className="underline font-bold hover:text-blue-950 dark:hover:text-white">
                      Staff Management
                    </Link>{' '}
                    page. This form is specifically for system accounts with login credentials.
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>
                      First Name <span className="text-[#E91E63]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="e.g. Adarsh"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="e.g. Sharma"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Email (Username) */}
                <div>
                  <label className={labelClass}>
                    Email Address (Login Username) <span className="text-[#E91E63]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={Boolean(editingUser)}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@salondomain.com"
                    className={`${inputClass} ${editingUser ? 'opacity-70 bg-slate-100 dark:bg-white/10 cursor-not-allowed' : ''}`}
                  />
                  {editingUser && (
                    <p className="text-[11px] text-slate-400 mt-1">Email address cannot be changed once created.</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className={inputClass}
                  />
                </div>

                {/* Role Select */}
                <div>
                  <label className={labelClass}>
                    System Access Role <span className="text-[#E91E63]">*</span>
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={inputClass}
                  >
                    <option value="admin">Administrator (Full System &amp; Financial Control)</option>
                    <option value="manager">Manager (Salon Operations &amp; Inventory)</option>
                    <option value="receptionist">Receptionist (Front Desk &amp; Appointments)</option>
                    <option value="staff">Staff (Basic Service Access)</option>
                  </select>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {editingUser ? 'Reset Password (Optional)' : 'Temporary Password'} {!editingUser && <span className="text-[#E91E63]">*</span>}
                    </label>

                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] font-bold text-[#E91E63] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RiSparklingLine className="text-xs" />
                      <span>Auto-Generate</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      minLength={formData.password ? 8 : undefined}
                      placeholder={editingUser ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
                      className={`${inputClass} pr-10`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {showPassword ? <RiEyeOffLine className="text-base" /> : <RiEyeLine className="text-base" />}
                    </button>
                  </div>
                  {editingUser && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Only fill this field if you want to reset the user&apos;s login password.
                    </p>
                  )}
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2.5 sm:gap-3 px-5 sm:px-8 py-3.5 sm:py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
                className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="user-management-form"
                disabled={submitting}
                className="px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold bg-gradient-to-r from-[#E91E63] to-[#F43F5E] hover:from-[#D81B60] hover:to-[#E11D48] text-white rounded-xl shadow-md shadow-[#E91E63]/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
