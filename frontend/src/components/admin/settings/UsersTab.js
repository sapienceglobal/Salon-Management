import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { RiAddLine, RiUserSettingsLine, RiShieldStarLine, RiUserLine, RiCloseLine, RiLockPasswordLine, RiMailLine, RiPhoneLine } from 'react-icons/ri';
import { createPortal } from 'react-dom';
import TableScrollContainer from '@/components/admin/common/TableScrollContainer';

const emptySubscribe = () => () => {};

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add User Form State
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ 
    first_name: '', 
    last_name: '', 
    email: '', 
    phone: '', 
    password: '', 
    role: 'receptionist' 
  });
  const [submitting, setSubmitting] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const closeModal = () => {
    setIsAdding(false);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/settings/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    api.get('/settings/users')
      .then((res) => {
        if (!ignore) setUsers(res.data || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load users');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/settings/users', formData);
      toast.success('User created successfully');
      setFormData({ first_name: '', last_name: '', email: '', phone: '', password: '', role: 'receptionist' });
      closeModal();
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    const newStatus = targetUser.is_active === false;
    try {
      await api.put(`/settings/users/${targetUser.id}`, { is_active: newStatus });
      toast.success(`User ${newStatus ? 'activated' : 'disabled'} successfully`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <RiShieldStarLine className="text-purple-500" />;
      case 'manager': return <RiUserSettingsLine className="text-blue-500" />;
      default: return <RiUserLine className="text-gray-500" />;
    }
  };

  const inputClass = "w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#E91E63] rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors";
  const labelClass = "block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5";

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage staff access, roles, and login credentials.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#E91E63] text-white rounded-xl hover:bg-[#d81557] transition-all text-sm font-medium shadow-md shadow-[#E91E63]/25 cursor-pointer"
          >
            <RiAddLine className="text-lg" /> Add User
          </button>
        )}
      </div>

      {/* Add User Modal Popup */}
      {isAdding && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
          onMouseDown={closeModal}
        >
          <div 
            className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
                  <RiUserSettingsLine />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Add System User
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Create login access for Admins, Managers, or Receptionists.
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <RiCloseLine className="text-2xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 sm:px-8 py-6 custom-scrollbar">
              <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3.5 rounded-xl text-xs border border-blue-100 dark:border-blue-900/30">
                  <strong>Notice:</strong> To add Service Providers (Stylists, Therapists), please use the <strong>Staff</strong> page. This form is only for system administrators and front-desk users.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>First Name <span className="text-[#E91E63]">*</span></label>
                    <input 
                      type="text" 
                      required 
                      value={formData.first_name} 
                      onChange={e => setFormData({...formData, first_name: e.target.value})}
                      placeholder="e.g., Rohit"
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input 
                      type="text" 
                      value={formData.last_name} 
                      onChange={e => setFormData({...formData, last_name: e.target.value})}
                      placeholder="e.g., Sharma"
                      className={inputClass} 
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Email (Login Username) <span className="text-[#E91E63]">*</span></label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="user@salondomain.com"
                    className={inputClass} 
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="10-digit mobile number"
                    className={inputClass} 
                  />
                </div>

                <div>
                  <label className={labelClass}>System Role <span className="text-[#E91E63]">*</span></label>
                  <select 
                    required 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className={inputClass} 
                  >
                    <option value="admin">Admin (Full System Access)</option>
                    <option value="manager">Manager (Operations Access)</option>
                    <option value="receptionist">Receptionist (Front Desk / Appointments)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Temporary Password <span className="text-[#E91E63]">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    className={inputClass} 
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
              <button 
                type="button" 
                onClick={closeModal} 
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="user-form" 
                disabled={submitting} 
                className="px-6 py-2.5 text-sm font-semibold bg-[#E91E63] text-white rounded-xl hover:bg-[#d81557] transition-all disabled:opacity-50 shadow-md shadow-[#E91E63]/25 cursor-pointer"
              >
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Users Table */}
      <TableScrollContainer className="border border-gray-100 dark:border-white/10 rounded-2xl bg-white dark:bg-[#1a1a2e] shadow-sm overflow-hidden">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/10">
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {users.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">No users found.</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#E91E63]/10 text-[#E91E63] flex items-center justify-center font-bold text-sm">
                        {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {user.first_name} {user.last_name || ''}
                        </div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-gray-600 dark:text-gray-400">
                    {user.phone || 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      user.is_active !== false 
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                    }`}>
                      {user.is_active !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleUserStatus(user)}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors cursor-pointer ${
                        user.is_active !== false
                          ? 'text-red-600 hover:bg-red-50 border-red-200 dark:border-red-900/40'
                          : 'text-green-600 hover:bg-green-50 border-green-200 dark:border-green-900/40'
                      }`}
                    >
                      {user.is_active !== false ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableScrollContainer>
    </div>
  );
}
