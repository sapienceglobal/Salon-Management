'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '@/lib/api';
import StaffListView from '@/components/admin/staff/StaffListView';
import StaffProfileView from '@/components/admin/staff/StaffProfileView';
import StaffFormModal from '@/components/admin/StaffFormModal';
import { useConfirm } from '@/context/ConfirmContext';
import toast from 'react-hot-toast';

// Curated fallback avatars to make sure staff profiles look complete and polished
const FALLBACK_AVATARS = [
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face',
];

export default function StaffPage() {
  const { confirm } = useConfirm();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: 'list' (Image 1) or 'profile' (Images 2, 3, 4)
  const [viewMode, setViewMode] = useState('list');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [initialProfileTab, setInitialProfileTab] = useState('overview');

  // Track if initial deep link from URL params has been handled
  const hasInitializedDeepLink = useRef(false);

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState(null);

  const fetchStaff = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/staff');
      const rawList = res.data || [];

      // Decorate staff with clean fallbacks for any missing attributes
      const decorated = rawList.map((item) => ({
        ...item,
        avatar_url: item.avatar_url || null,
        designation: item.designation || item.role || 'Staff Member',
        status: !item.is_active ? 'Inactive' : (item.is_on_leave ? 'On Leave' : 'Active'),
      }));

      setStaffList(decorated);

      // Keep selected staff in sync if one is currently opened
      setSelectedStaff(prev => {
        if (!prev) return null;
        return decorated.find(s => s.id === prev.id) || prev;
      });
    } catch (err) {
      console.error('Failed to load staff list', err);
      toast.error('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Deep Link Handling (?staff_id=...&tab=...&action=add) - runs only once on initial data load
  useEffect(() => {
    if (typeof window === 'undefined' || staffList.length === 0 || hasInitializedDeepLink.current) return;
    hasInitializedDeepLink.current = true;

    const params = new URLSearchParams(window.location.search);
    const staffId = params.get('staff_id');
    const tab = params.get('tab');
    const action = params.get('action');

    if (action === 'add') {
      setIsFormOpen(true);
      setStaffToEdit(null);
    }

    if (staffId) {
      const match = staffList.find(s => String(s.id) === String(staffId));
      if (match) {
        setSelectedStaff(match);
        setInitialProfileTab(tab || 'overview');
        setViewMode('profile');
      }
    } else if (tab && ['overview', 'services', 'schedule', 'appointments', 'attendance', 'performance', 'documents'].includes(tab)) {
      setSelectedStaff(staffList[0]);
      setInitialProfileTab(tab);
      setViewMode('profile');
    }
  }, [staffList]);

  // Navigate to Staff Profile View
  const handleViewProfile = (staff, tab = 'overview') => {
    setSelectedStaff(staff);
    setInitialProfileTab(tab);
    setViewMode('profile');

    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', `/staff?staff_id=${staff.id}&tab=${tab}`);
    }
  };

  // Back to Staff List View - clean and instant, no screen flicker
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedStaff(null);

    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/staff');
    }
  };

  // Toggle staff active/inactive status
  const handleToggleStaffStatus = async (staff, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const newStatus = !staff.is_active;

    // Optimistic UI update
    setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, is_active: newStatus, status: newStatus ? 'Active' : 'Inactive' } : s));
    if (selectedStaff?.id === staff.id) {
      setSelectedStaff(prev => ({ ...prev, is_active: newStatus, status: newStatus ? 'Active' : 'Inactive' }));
    }

    try {
      await api.patch(`/staff/${staff.id}/toggle-active`);
      toast.success(`Staff member marked as ${newStatus ? 'Active' : 'Inactive'}`);
    } catch (err) {
      // Revert on error
      setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, is_active: staff.is_active } : s));
      toast.error(err.response?.data?.message || 'Failed to update staff status');
    }
  };

  // Add & Edit Handlers
  const openAddForm = () => {
    setStaffToEdit(null);
    setIsFormOpen(true);
  };

  const openEditForm = (e, staff) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setStaffToEdit(staff);
    setIsFormOpen(true);
  };

  // Delete Staff
  const handleDeleteStaff = async (e, id) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const isConfirmed = await confirm({
      title: 'Delete Staff Member',
      message: 'Are you sure you want to permanently delete this staff member? This will remove them completely from the salon staff directory and cannot be undone.',
      confirmText: 'Delete Permanently',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/staff/${id}`);
      toast.success('Staff member permanently deleted');
      if (selectedStaff?.id === id) {
        handleBackToList();
      }
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete staff member');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {viewMode === 'profile' && selectedStaff ? (
        /* Image 2, 3, 4: Complete Staff Profile View */
        <StaffProfileView
          staff={selectedStaff}
          initialTab={initialProfileTab}
          onBack={handleBackToList}
          onEditStaff={openEditForm}
          onToggleStatus={handleToggleStaffStatus}
          onDeleteStaff={handleDeleteStaff}
        />
      ) : (
        /* Image 1: Complete Staff List Table & KPI Cards View */
        <StaffListView
          staffList={staffList}
          loading={loading}
          onAddStaff={openAddForm}
          onViewProfile={(staff) => handleViewProfile(staff, 'overview')}
          onEditStaff={openEditForm}
          onDeleteStaff={handleDeleteStaff}
          onToggleStatus={handleToggleStaffStatus}
          onRefresh={fetchStaff}
        />
      )}

      {/* Add / Edit Staff Modal */}
      {isFormOpen && (
        <StaffFormModal
          isOpen={isFormOpen}
          initialData={staffToEdit}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            fetchStaff();
          }}
        />
      )}
    </div>
  );
}
