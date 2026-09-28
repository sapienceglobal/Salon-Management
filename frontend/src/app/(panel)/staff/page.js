'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  RiAddLine, RiSearchLine, RiMoreFill, RiEdit2Line, RiDeleteBinLine,
  RiStarFill, RiPhoneLine, RiMailLine, RiUserAddLine 
} from 'react-icons/ri';
import api from '@/lib/api';
import StaffFormModal from '@/components/admin/StaffFormModal';
import StaffDetailsModal from '@/components/admin/StaffDetailsModal';
import { formatCurrency, parseSpecializations } from '@/lib/utils';
import { useConfirm } from '@/context/ConfirmContext';
import toast from 'react-hot-toast';

export default function StaffPage() {
  const confirm = useConfirm();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff');
      setStaffList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Deep Link Handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const staffId = params.get('staff_id');
    if (staffId && staffList.length > 0 && !isDetailsOpen) {
      setSelectedStaffId(staffId);
      setIsDetailsOpen(true);
    }
  }, [staffList, isDetailsOpen]);

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    const url = new URL(window.location);
    if (url.searchParams.has('staff_id')) {
      url.searchParams.delete('staff_id');
      window.history.replaceState({}, '', url);
    }
  };

  const handleToggleStaffStatus = async (staff, e) => {
    e.stopPropagation();
    const newStatus = !staff.is_active;
    // Optimistic UI update
    setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, is_active: newStatus } : s));
    try {
      await api.patch(`/staff/${staff.id}/toggle-active`);
      toast.success(`Staff member marked as ${newStatus ? 'Active' : 'Inactive'}`);
    } catch (err) {
      // Revert on error
      setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, is_active: staff.is_active } : s));
      toast.error(err.response?.data?.message || 'Failed to update staff status');
    }
  };

  const allStaffCount = staffList.length;
  const activeStaffCount = staffList.filter(s => s.is_active).length;
  const inactiveStaffCount = staffList.filter(s => !s.is_active).length;

  const filteredStaff = staffList.filter(s => {
    const matchesStatus = 
      statusFilter === 'active' ? s.is_active :
      statusFilter === 'inactive' ? !s.is_active : true;
    const matchesSearch = 
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.designation || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const openAddForm = () => {
    setStaffToEdit(null);
    setIsFormOpen(true);
  };

  const openEditForm = (e, staff) => {
    e.stopPropagation();
    setStaffToEdit(staff);
    setIsFormOpen(true);
  };

  const openDetails = (id) => {
    setSelectedStaffId(id);
    setIsDetailsOpen(true);
  };

  const deleteStaff = async (e, id) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: 'Delete Staff',
      message: 'Are you sure you want to delete this staff member? This cannot be undone.',
      confirmText: 'Delete'
    });
    if (!isConfirmed) return;
    
    try {
      await api.delete(`/staff/${id}`);
      toast.success('Staff member deleted');
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete staff member');
    }
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease_forwards] flex flex-col h-full">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-[1.75rem] font-bold">Staff Directory</h1>
          <p className="text-sm text-admin-text-secondary mt-1">Manage your team, roles, and view performance.</p>
        </div>
        <button 
          onClick={openAddForm}
          className="bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors shadow-lg shadow-brand/20 flex items-center gap-2"
        >
          <RiUserAddLine className="text-lg" /> Onboard Staff
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-admin-card border border-admin-border p-3 rounded-xl">
        {/* Search */}
        <div className="flex items-center gap-2 bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2 focus-within:border-brand transition-colors w-full max-w-md">
          <RiSearchLine className="text-admin-text-muted shrink-0" />
          <input 
            type="text" 
            placeholder="Search by name, email, or designation..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-sm w-full outline-none" 
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-admin-surface-light border border-admin-border rounded-lg p-1 text-xs font-medium">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${statusFilter === 'all' ? 'bg-brand text-white shadow-sm' : 'text-admin-text-secondary hover:text-admin-text'}`}
          >
            All ({allStaffCount})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md transition-colors ${statusFilter === 'active' ? 'bg-accent-green text-white shadow-sm' : 'text-admin-text-secondary hover:text-admin-text'}`}
          >
            Active ({activeStaffCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-md transition-colors ${statusFilter === 'inactive' ? 'bg-accent-red text-white shadow-sm' : 'text-admin-text-secondary hover:text-admin-text'}`}
          >
            Inactive ({inactiveStaffCount})
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-admin-card rounded-2xl border border-admin-border animate-pulse p-6 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-admin-surface-light mb-4"></div>
              <div className="h-5 w-32 bg-admin-surface-light rounded mb-2"></div>
              <div className="h-4 w-24 bg-admin-surface-light rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-admin-text-muted bg-admin-card border border-admin-border rounded-2xl p-10 text-center">
          <RiUserAddLine className="text-5xl mb-4 opacity-20" />
          <p className="text-lg font-medium">No staff members found.</p>
          <p className="text-sm mb-6 mt-1">
            {statusFilter !== 'all' || searchQuery 
              ? 'Try adjusting your search or status filter.' 
              : 'Start by onboarding your first team member.'}
          </p>
          {statusFilter !== 'all' || searchQuery ? (
            <button 
              onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
              className="text-brand font-semibold hover:underline"
            >
              Clear filters
            </button>
          ) : (
            <button onClick={openAddForm} className="text-brand font-semibold hover:underline">
              Onboard New Staff
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
          {filteredStaff.map(staff => {
            const specs = parseSpecializations(staff.specializations);
            
            return (
              <div 
                key={staff.id} 
                onClick={() => openDetails(staff.id)}
                className={`rounded-2xl p-6 transition-all cursor-pointer group relative flex flex-col items-center text-center border ${
                  !staff.is_active 
                    ? 'bg-admin-surface/20 border-dashed border-accent-red/40 opacity-80 hover:opacity-100' 
                    : 'bg-admin-card border-admin-border hover:shadow-lg hover:border-brand/30'
                }`}
              >
                {/* Top Quick Toggle Switch */}
                <div 
                  className="absolute top-4 left-4" 
                  onClick={e => e.stopPropagation()}
                  title={staff.is_active ? 'Active — Click to deactivate' : 'Inactive — Click to activate'}
                >
                  <button
                    type="button"
                    role="switch"
                    aria-checked={staff.is_active}
                    onClick={(e) => handleToggleStaffStatus(staff, e)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      staff.is_active ? 'bg-accent-green' : 'bg-admin-surface border border-admin-border'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        staff.is_active ? 'translate-x-4' : 'translate-x-0 bg-admin-text-muted'
                      }`}
                    />
                  </button>
                </div>

                {/* Actions Menu */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button 
                    onClick={(e) => openEditForm(e, staff)}
                    className="p-2 text-admin-text-secondary hover:text-brand bg-admin-surface-light hover:bg-brand/10 rounded-lg transition-colors"
                    title="Edit Profile"
                  >
                    <RiEdit2Line />
                  </button>
                  <button 
                    onClick={(e) => deleteStaff(e, staff.id)}
                    className="p-2 text-admin-text-secondary hover:text-accent-red bg-admin-surface-light hover:bg-accent-red/10 rounded-lg transition-colors"
                    title="Delete Staff"
                  >
                    <RiDeleteBinLine />
                  </button>
                </div>

                {/* Avatar */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 border transition-colors ${
                  staff.is_active 
                    ? 'bg-brand/10 text-brand border-brand/20' 
                    : 'bg-admin-surface-light text-admin-text-muted border-admin-border'
                }`}>
                  {staff.first_name.charAt(0)}{staff.last_name.charAt(0)}
                </div>

                {/* Info */}
                <h3 className={`font-bold text-lg ${!staff.is_active ? 'text-admin-text-secondary line-through decoration-admin-text-muted/40' : 'text-admin-text'}`}>
                  {staff.first_name} {staff.last_name}
                </h3>
                <p className="text-sm text-brand font-medium mt-0.5">{staff.designation || 'Staff'}</p>
                
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={(e) => handleToggleStaffStatus(staff, e)}
                    className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      staff.is_active 
                        ? 'bg-accent-green/10 text-accent-green hover:bg-accent-green/20 border border-accent-green/20' 
                        : 'bg-accent-red/10 text-accent-red hover:bg-accent-red/20 border border-accent-red/20'
                    }`}
                    title={`Click to ${staff.is_active ? 'deactivate' : 'activate'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${staff.is_active ? 'bg-accent-green animate-pulse' : 'bg-accent-red'}`}></span>
                    {staff.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-admin-surface border border-admin-border text-admin-text-secondary">
                    {staff.role}
                  </span>
                </div>

                {/* Contact Icons */}
                <div className="flex items-center gap-4 mt-6 text-admin-text-secondary w-full justify-center border-t border-admin-border pt-4">
                  <a 
                    href={`tel:${staff.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs hover:text-admin-text transition-colors" 
                    title={staff.phone}
                  >
                    <RiPhoneLine className="text-sm" /> Call
                  </a>
                  <div className="w-[1px] h-3 bg-admin-border"></div>
                  <a 
                    href={`mailto:${staff.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs hover:text-admin-text transition-colors" 
                    title={staff.email}
                  >
                    <RiMailLine className="text-sm" /> Email
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <StaffFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={staffToEdit}
        onSuccess={() => {
          setIsFormOpen(false);
          fetchStaff();
        }}
      />

      <StaffDetailsModal 
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        staffId={selectedStaffId}
        onEdit={(staffObj) => {
          handleCloseDetails();
          setTimeout(() => {
            setStaffToEdit(staffObj);
            setIsFormOpen(true);
          }, 250);
        }}
        onDelete={async (id) => {
          try {
            await api.delete(`/staff/${id}`);
            toast.success('Staff member deleted');
            fetchStaff();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete staff member');
          }
        }}
        onStatusChange={() => fetchStaff()}
      />

    </div>
  );
}
