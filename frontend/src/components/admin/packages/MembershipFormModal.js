import { useState, useEffect } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { RiCloseLine, RiImageAddLine, RiAddLine, RiDeleteBin7Line, RiVipCrownLine } from 'react-icons/ri';
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
  const [isClosing, setIsClosing] = useState(false);
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

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
        toast.success('Membership updated');
      } else {
        await api.post('/catalog/memberships', payload);
        toast.success('Membership created');
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save membership');
      toast.error(err.response?.data?.message || 'Failed to save membership');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={handleClose}>
      
      <div 
        className={`dark bg-gradient-to-br from-[#1E1E2C] to-[#12121A] text-white w-full max-w-xl h-full border-l border-[#D4AF37]/30 shadow-2xl flex flex-col relative ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        
        {/* Subtle Gold Gradient Overlay */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#D4AF37]/10 to-transparent pointer-events-none"></div>

        <div className="flex items-center justify-between p-6 border-b border-[#D4AF37]/20 bg-white/5 backdrop-blur-sm shrink-0 z-10">
          <div>
            <h2 className="text-xl font-bold font-heading flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B38B22] bg-clip-text text-transparent">
              <RiVipCrownLine className="text-[#D4AF37]" />
              {initialData ? 'Edit VIP Membership' : 'Create VIP Membership'}
            </h2>
            <p className="text-sm text-[#5C4A1D] dark:text-[#E8D19F]/80 mt-1">Manage luxury memberships and perks.</p>
          </div>
          <button onClick={handleClose} className="p-2 text-admin-text-muted hover:text-admin-text transition-colors rounded-lg hover:bg-black/5">
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        <form id="membershipForm" onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col overflow-hidden relative z-10">
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar [&::-webkit-scrollbar-thumb]:bg-[#D4AF37]/50 [&::-webkit-scrollbar-track]:bg-transparent">
            <div className="space-y-6">
            
            {error && <div className="text-sm text-accent-red font-medium p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg">{error}</div>}
            
            {/* VIP Image Upload Area */}
            <div className="flex justify-center mb-6">
              <div className="w-40 h-28 rounded-2xl border-2 border-dashed border-[#E8D19F] bg-white/50 flex flex-col items-center justify-center text-[#B38B22] hover:bg-[#FDFBF7] hover:border-[#D4AF37] hover:shadow-lg transition-all cursor-pointer group">
                <RiImageAddLine className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs font-bold uppercase tracking-wider">Cover Image</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-[#B38B22] dark:text-[#D4AF37] mb-1.5">Membership Name <span className="text-accent-red">*</span></label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange} required
                  placeholder="e.g. Gold Platinum Tier"
                  className={`w-full px-4 py-2.5 bg-white dark:bg-[#1A1A24] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 shadow-sm border ${fieldErrors.name ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-[#E8D19F] dark:border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20'}`}
                />
                {fieldErrors.name && <p className="text-accent-red text-xs mt-1">{fieldErrors.name}</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-[#B38B22] dark:text-[#D4AF37] mb-1.5">Description</label>
                <textarea
                  name="description" value={formData.description} onChange={handleChange} rows={2}
                  placeholder="Short engaging description of this membership..."
                  className={`w-full px-4 py-2.5 bg-white dark:bg-[#1A1A24] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 shadow-sm resize-none border ${fieldErrors.description ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-[#E8D19F] dark:border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20'}`}
                />
                {fieldErrors.description && <p className="text-accent-red text-xs mt-1">{fieldErrors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-[#B38B22] dark:text-[#D4AF37] mb-1.5">Price (₹) <span className="text-accent-red">*</span></label>
                <input
                  type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01"
                  className={`w-full px-4 py-2.5 bg-white dark:bg-[#1A1A24] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 shadow-sm border ${fieldErrors.price ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-[#E8D19F] dark:border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20'}`}
                />
                {fieldErrors.price && <p className="text-accent-red text-xs mt-1">{fieldErrors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-[#B38B22] dark:text-[#D4AF37] mb-1.5">Duration (Months) <span className="text-accent-red">*</span></label>
                <input
                  type="number" name="duration_months" value={formData.duration_months} onChange={handleChange} required min="1"
                  className={`w-full px-4 py-2.5 bg-white dark:bg-[#1A1A24] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 shadow-sm border ${fieldErrors.duration_months ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-[#E8D19F] dark:border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20'}`}
                />
                {fieldErrors.duration_months && <p className="text-accent-red text-xs mt-1">{fieldErrors.duration_months}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-[#B38B22] dark:text-[#D4AF37] mb-1.5">Global Discount (%)</label>
                <input
                  type="number" name="discount_percentage" value={formData.discount_percentage} onChange={handleChange} min="0" max="100"
                  placeholder="e.g. 10"
                  className={`w-full px-4 py-2.5 bg-white dark:bg-[#1A1A24] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 shadow-sm border ${fieldErrors.discount_percentage ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-[#E8D19F] dark:border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20'}`}
                />
                {fieldErrors.discount_percentage && <p className="text-accent-red text-xs mt-1">{fieldErrors.discount_percentage}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-[#B38B22] dark:text-[#D4AF37] mb-1.5">Max Members</label>
                <input
                  type="number" name="max_members" value={formData.max_members} onChange={handleChange} min="1"
                  placeholder="Unlimited if empty"
                  className={`w-full px-4 py-2.5 bg-white dark:bg-[#1A1A24] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 shadow-sm border ${fieldErrors.max_members ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-[#E8D19F] dark:border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20'}`}
                />
                {fieldErrors.max_members && <p className="text-accent-red text-xs mt-1">{fieldErrors.max_members}</p>}
              </div>
            </div>

            <hr className="border-[#E8D19F]/50" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-[#B38B22] dark:text-[#D4AF37]">Membership Benefits</label>
                <button type="button" onClick={handleAddBenefit} className="text-xs font-bold text-[#B38B22] flex items-center gap-1 hover:underline">
                  <RiAddLine /> Add Perk
                </button>
              </div>

              <div className="space-y-3">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#E8D19F]/30 dark:bg-[#D4AF37]/20 flex items-center justify-center text-[#B38B22] dark:text-[#E8D19F] text-xs font-bold shrink-0">
                      {index + 1}
                    </div>
                    <input
                      type="text" value={benefit} onChange={(e) => handleBenefitChange(index, e.target.value)}
                      placeholder="e.g. Free haircut once a month"
                      className="flex-1 px-4 py-2 bg-white dark:bg-[#1A1A24] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-[#E8D19F] dark:border-[#D4AF37]/30 rounded-xl focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 shadow-sm"
                    />
                    <button type="button" onClick={() => handleRemoveBenefit(index)} className="p-2 text-admin-text-muted hover:text-accent-red transition-colors">
                      <RiDeleteBin7Line />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            </div>
          </div>

          <div className="p-6 border-t border-[#D4AF37]/20 bg-[#1A1A24]/90 backdrop-blur-sm flex gap-3 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-[#1A1A24] text-[#E8D19F] border border-[#D4AF37]/30 hover:bg-white/5 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#D4AF37] to-[#B38B22] text-white hover:from-[#E8C245] hover:to-[#CC9F27] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/30"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <RiVipCrownLine className="text-lg" />}
              {initialData ? 'Save Changes' : 'Create Membership'}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
