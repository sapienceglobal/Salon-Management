import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { RiAddLine, RiPercentLine, RiMoneyRupeeCircleLine, RiBarChartHorizontalLine, RiCloseLine } from 'react-icons/ri';
import { formatCurrency } from '@/lib/utils';
import { createPortal } from 'react-dom';

export default function CommissionsTab() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Profile Form State
  const [isAdding, setIsAdding] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    type: 'percentage', 
    value: 0,
    rules: {} // For tiered or advanced logic
  });
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const closeDrawer = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsAdding(false);
      setIsClosing(false);
    }, 200);
  };

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
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
    fetchProfiles();
  }, [fetchProfiles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/settings/commission-profiles', formData);
      toast.success('Commission profile created');
      setFormData({ name: '', type: 'percentage', value: 0, rules: {} });
      closeDrawer();
      fetchProfiles();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create profile');
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading commissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Commission Profiles</h3>
          <p className="text-sm text-gray-500">Manage how staff members earn commissions on services and products.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            <RiAddLine /> Create Profile
          </button>
        )}
      </div>

      {/* Add Profile Drawer */}
      {isAdding && mounted && createPortal(
        <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={closeDrawer}>
          <div 
            className={`bg-white dark:bg-gray-900 w-full max-w-md h-full border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Commission Profile</h2>
                <p className="text-xs text-gray-500 mt-1">Define how staff members earn commissions.</p>
              </div>
              <button onClick={closeDrawer} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <RiCloseLine className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="commissions-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Name *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Senior Stylist 20%"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Commission Type *</label>
                  <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {formData.type === 'percentage' ? 'Percentage Value (%) *' : 'Flat Amount (₹) *'}
                  </label>
                  <input type="number" required value={formData.value} onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                    min="0" step={formData.type === 'percentage' ? "1" : "0.01"}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 flex justify-end gap-3">
              <button type="button" onClick={closeDrawer} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" form="commissions-form" disabled={submitting} className="px-5 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-70 shadow-sm">
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
          <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/30">
            No commission profiles created yet.
          </div>
        ) : (
          profiles.map(profile => (
            <div key={profile.id} className="relative group p-5 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all hover:border-primary/30">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
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
              </div>
              
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Commission Rate</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {profile.type === 'percentage' ? `${profile.value}%` : formatCurrency(profile.value)}
                  </p>
                </div>
                <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
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
