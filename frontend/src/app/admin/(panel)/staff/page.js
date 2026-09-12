'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  RiAddLine, RiSearchLine, RiMoreFill, RiEdit2Line, RiDeleteBinLine,
  RiStarFill, RiPhoneLine, RiMailLine, RiUserAddLine 
} from 'react-icons/ri';
import api from '@/lib/api';
import StaffFormModal from '@/components/admin/StaffFormModal';
import StaffDetailsModal from '@/components/admin/StaffDetailsModal';

export default function StaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const filteredStaff = staffList.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.designation || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    if (!window.confirm("Are you sure you want to delete this staff member? This cannot be undone.")) return;
    try {
      await api.delete(`/staff/${id}`);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete staff member');
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
      <div className="flex items-center justify-between mb-6 bg-admin-card border border-admin-border p-2 rounded-xl">
        <div className="flex items-center gap-2 bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2 focus-within:border-brand transition-colors w-full max-w-md">
          <RiSearchLine className="text-admin-text-muted" />
          <input 
            type="text" 
            placeholder="Search by name, email, or designation..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-sm w-full outline-none" 
          />
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
        <div className="flex-1 flex flex-col items-center justify-center text-admin-text-muted bg-admin-card border border-admin-border rounded-2xl p-10">
          <RiUserAddLine className="text-5xl mb-4 opacity-20" />
          <p className="text-lg font-medium">No staff members found.</p>
          <p className="text-sm mb-6 mt-1">Start by onboarding your first team member.</p>
          <button onClick={openAddForm} className="text-brand font-semibold hover:underline">
            Onboard New Staff
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
          {filteredStaff.map(staff => {
            const specs = staff.specializations ? (typeof staff.specializations === 'string' ? JSON.parse(staff.specializations) : staff.specializations) : [];
            
            return (
              <div 
                key={staff.id} 
                onClick={() => openDetails(staff.id)}
                className="bg-admin-card border border-admin-border rounded-2xl p-6 hover:shadow-lg hover:border-brand/30 transition-all cursor-pointer group relative flex flex-col items-center text-center"
              >
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
                <div className="w-20 h-20 rounded-full bg-brand/10 text-brand flex items-center justify-center text-2xl font-bold mb-4 border border-brand/20">
                  {staff.first_name.charAt(0)}{staff.last_name.charAt(0)}
                </div>

                {/* Info */}
                <h3 className="font-bold text-lg">{staff.first_name} {staff.last_name}</h3>
                <p className="text-sm text-brand font-medium mt-0.5">{staff.designation || 'Staff'}</p>
                
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${staff.is_active ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                    {staff.is_active ? 'Active' : 'Inactive'}
                  </span>
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
        onDelete={(id) => {
          api.delete(`/staff/${id}`).then(() => fetchStaff()).catch(err => alert(err.response?.data?.message || 'Failed to delete staff member'));
        }}
      />

    </div>
  );
}
