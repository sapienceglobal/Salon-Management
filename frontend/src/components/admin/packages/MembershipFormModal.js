'use client';

import { useState, useEffect } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { 
  RiCloseLine, 
  RiAddLine, 
  RiDeleteBin7Line, 
  RiVipCrownLine,
  RiInformationLine
} from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { membershipSchema, formatZodErrors } from '@/lib/validations';

export default function MembershipFormModal({ isOpen, onClose, initialData, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_months: '1',
    discount_percentage: '',
    max_members: '',
    image: null,
    benefits: [''],
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          price: initialData.price || '',
          duration_months: initialData.duration_months || '1',
          discount_percentage: initialData.discount_percentage || '',
          max_members: initialData.max_members || '',
          image: initialData.image || null,
          benefits: (initialData.benefits && initialData.benefits.length > 0) ? initialData.benefits : [''],
        });
      } else {
        setFormData({
          name: '', description: '', price: '', duration_months: '1', discount_percentage: '', max_members: '', image: null, benefits: [''],
        });
      }
      setError('');
      setFieldErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen || !mounted) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBenefitChange = (index, value) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData(prev => ({ ...prev, benefits: newBenefits }));
  };

  const handleAddBenefit = () => {
    setFormData(prev => ({ ...prev, benefits: [...prev.benefits, ''] }));
  };

  const handleRemoveBenefit = (index) => {
    const newBenefits = [...formData.benefits];
    newBenefits.splice(index, 1);
    setFormData(prev => ({ ...prev, benefits: newBenefits }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});
    
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : undefined,
        duration_months: formData.duration_months ? parseInt(formData.duration_months) : undefined,
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : undefined,
        max_members: formData.max_members ? parseInt(formData.max_members) : undefined,
        benefits: formData.benefits.filter(b => b.trim() !== '')
      };

      const result = membershipSchema.safeParse(payload);
      if (!result.success) {
        setFieldErrors(formatZodErrors(result.error));
        setLoading(false);
        return;
      }

      if (initialData) {
        await api.put(`/catalog/memberships/${initialData.id}`, payload);
        toast.success('Membership updated successfully');
      } else {
        await api.post('/catalog/memberships', payload);
        toast.success('Membership created successfully');
      }
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save membership');
      toast.error(err.response?.data?.message || 'Failed to save membership');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName) =>
    `w-full bg-gray-50 dark:bg-white/5 border ${fieldErrors[fieldName] ? 'border-red-400 dark:border-red-400/60 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-[#D4AF37]'} rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors`;

  const labelClass = 'block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5';

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B38B22] text-white flex items-center justify-center text-xl shadow-md shadow-[#D4AF37]/30 shrink-0">
              <RiVipCrownLine />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                {initialData ? 'Edit VIP Membership' : 'Create VIP Membership'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Manage luxury salon club tiers, discount rates and member benefits.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 sm:px-8 py-6 custom-scrollbar">
          {error && (
            <div className="flex items-center gap-2 p-3.5 mb-5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[13px] font-medium">
              <RiInformationLine className="shrink-0 text-base" />
              {error}
            </div>
          )}

          <form id="membershipForm" onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className={labelClass}>Membership Name <span className="text-rose-500">*</span></label>
              <input
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required
                placeholder="e.g. Gold VIP Tier"
                className={inputClass('name')}
              />
              {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className={labelClass}>Description / Summary</label>
              <textarea
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                rows={2}
                placeholder="Brief summary of who this membership is for and key privileges..."
                className={`${inputClass('description')} resize-none`}
              />
              {fieldErrors.description && <p className="text-red-500 text-xs mt-1">{fieldErrors.description}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Membership Price (₹) <span className="text-rose-500">*</span></label>
                <input
                  type="number" 
                  name="price" 
                  value={formData.price} 
                  onChange={handleChange} 
                  required 
                  min="0" 
                  step="0.01"
                  placeholder="0.00"
                  className={inputClass('price')}
                />
                {fieldErrors.price && <p className="text-red-500 text-xs mt-1">{fieldErrors.price}</p>}
              </div>

              <div>
                <label className={labelClass}>Duration (Months) <span className="text-rose-500">*</span></label>
                <input
                  type="number" 
                  name="duration_months" 
                  value={formData.duration_months} 
                  onChange={handleChange} 
                  required 
                  min="1"
                  placeholder="12"
                  className={inputClass('duration_months')}
                />
                {fieldErrors.duration_months && <p className="text-red-500 text-xs mt-1">{fieldErrors.duration_months}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Global Service Discount (%)</label>
                <input
                  type="number" 
                  name="discount_percentage" 
                  value={formData.discount_percentage} 
                  onChange={handleChange} 
                  min="0" 
                  max="100"
                  placeholder="e.g. 15"
                  className={inputClass('discount_percentage')}
                />
                {fieldErrors.discount_percentage && <p className="text-red-500 text-xs mt-1">{fieldErrors.discount_percentage}</p>}
              </div>

              <div>
                <label className={labelClass}>Member Capacity Limit</label>
                <input
                  type="number" 
                  name="max_members" 
                  value={formData.max_members} 
                  onChange={handleChange} 
                  min="1"
                  placeholder="Leave empty for unlimited"
                  className={inputClass('max_members')}
                />
                {fieldErrors.max_members && <p className="text-red-500 text-xs mt-1">{fieldErrors.max_members}</p>}
              </div>
            </div>

            {/* Membership Benefits List */}
            <div className="pt-3 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-[13px] font-bold text-gray-800 dark:text-white">VIP Perks & Privileges</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">List specific perks included for members.</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleAddBenefit} 
                  className="text-xs font-semibold text-[#B38B22] dark:text-[#D4AF37] hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 transition-all cursor-pointer"
                >
                  <RiAddLine className="text-base" /> Add Perk
                </button>
              </div>

              <div className="space-y-3">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/10 text-[#B38B22] dark:text-[#D4AF37] flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </div>
                    <input
                      type="text" 
                      value={benefit} 
                      onChange={(e) => handleBenefitChange(index, e.target.value)}
                      placeholder="e.g. 1 Free blowout hair treatment per month"
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs sm:text-sm"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveBenefit(index)} 
                      className="p-2 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <RiDeleteBin7Line className="text-base" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="membershipForm"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#D4AF37] to-[#B38B22] text-white hover:from-[#E8C245] hover:to-[#CC9F27] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#D4AF37]/25 cursor-pointer min-w-[140px]"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <RiVipCrownLine className="text-base" />}
            {initialData ? 'Save Changes' : 'Create Membership'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
