import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { RiAddLine, RiPercentLine, RiMoneyRupeeCircleLine, RiBarChartHorizontalLine, RiCloseLine, RiDeleteBin6Line } from 'react-icons/ri';
import { formatCurrency } from '@/lib/utils';
import { createPortal } from 'react-dom';

const emptySubscribe = () => () => {};

export default function CommissionsTab() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Profile Form State
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    type: 'percentage', 
    value: 0,
    rules: {}
  });
  const [submitting, setSubmitting] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const closeModal = () => {
    setIsAdding(false);
  };

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await api.get('/settings/commission-profiles');
      setProfiles(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load commission profiles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    api.get('/settings/commission-profiles')
      .then((res) => {
        if (!ignore) setProfiles(res.data || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load commission profiles');
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
      await api.post('/settings/commission-profiles', formData);
      toast.success('Commission profile created');
      setFormData({ name: '', type: 'percentage', value: 0, rules: {} });
      closeModal();
      fetchProfiles();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProfile = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete commission profile "${name}"?`)) return;
    try {
      await api.delete(`/settings/commission-profiles/${id}`);
      toast.success('Commission profile deleted');
      fetchProfiles();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete commission profile');
    }
  };

  const getProfileIcon = (type) => {
    switch (type) {
      case 'percentage': return <RiPercentLine className="text-blue-500" />;
      case 'flat': return <RiMoneyRupeeCircleLine className="text-green-500" />;
      case 'tiered': return <RiBarChartHorizontalLine className="text-purple-500" />;
      default: return <RiPercentLine className="text-gray-500" />;
    }
  };

  const inputClass = "w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#E91E63] rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors";
  const labelClass = "block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5";

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading commissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Commission Profiles</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage how staff members earn commissions on services and products.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#E91E63] text-white rounded-xl hover:bg-[#d81557] transition-all text-sm font-medium shadow-md shadow-[#E91E63]/25 cursor-pointer"
          >
            <RiAddLine className="text-lg" /> Create Profile
          </button>
        )}
      </div>

      {/* Add Profile Modal Popup */}
      {isAdding && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
          onMouseDown={closeModal}
        >
          <div 
            className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
                  <RiPercentLine />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    New Commission Profile
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Define how staff members earn commissions.
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
              <form id="commissions-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelClass}>Profile Name <span className="text-[#E91E63]">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Senior Stylist 20%"
                    className={inputClass} 
                  />
                </div>

                <div>
                  <label className={labelClass}>Commission Type <span className="text-[#E91E63]">*</span></label>
                  <select 
                    required 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className={inputClass} 
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    {formData.type === 'percentage' ? 'Percentage Value (%) *' : 'Flat Amount (₹) *'}
                  </label>
                  <input 
                    type="number" 
                    required 
                    value={formData.value} 
                    onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                    min="0" 
                    step={formData.type === 'percentage' ? "1" : "0.01"}
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
                form="commissions-form" 
                disabled={submitting} 
                className="px-6 py-2.5 text-sm font-semibold bg-[#E91E63] text-white rounded-xl hover:bg-[#d81557] transition-all disabled:opacity-50 shadow-md shadow-[#E91E63]/25 cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02]">
            No commission profiles created yet.
          </div>
        ) : (
          profiles.map(profile => (
            <div key={profile.id} className="relative group p-5 border border-gray-100 dark:border-white/10 rounded-2xl bg-white dark:bg-[#1a1a2e] shadow-sm hover:shadow-md transition-all hover:border-[#E91E63]/30">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-lg">
                    {getProfileIcon(profile.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{profile.name}</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize mt-1
                      ${profile.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}
                    `}>
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteProfile(profile.id, profile.name)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                  title={`Delete ${profile.name}`}
                >
                  <RiDeleteBin6Line className="text-base" />
                </button>
              </div>
              
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Commission Rate</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {profile.type === 'percentage' ? `${profile.value}%` : formatCurrency(profile.value)}
                  </p>
                </div>
                <div className="text-xs text-gray-400 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                  {profile.type === 'percentage' ? 'of service price' : 'per service'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
