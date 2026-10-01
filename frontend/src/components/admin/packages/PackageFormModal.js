'use client';

import { useState, useEffect } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { 
  RiCloseLine, 
  RiAddLine, 
  RiDeleteBin7Line, 
  RiGiftLine, 
  RiInformationLine,
  RiScissorsLine
} from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { packageSchema, formatZodErrors } from '@/lib/validations';

export default function PackageFormModal({ isOpen, onClose, initialData, services = [], onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    total_price: '',
    validity_days: '',
    max_uses: '',
    tax_percentage: '18',
    image: null,
    items: [], // { service_id, quantity }
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
          total_price: initialData.total_price || '',
          validity_days: initialData.validity_days || '',
          max_uses: initialData.max_uses || '',
          tax_percentage: initialData.tax_percentage || '18',
          image: initialData.image || null,
          items: initialData.items?.map(i => ({ service_id: i.service_id, quantity: i.quantity })) || [],
        });
      } else {
        setFormData({
          name: '', description: '', total_price: '', validity_days: '', max_uses: '', tax_percentage: '18', image: null, items: [],
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

  const handleAddItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { service_id: '', quantity: 1 }] }));
  };

  const handleRemoveItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
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
        total_price: formData.total_price ? parseFloat(formData.total_price) : undefined,
        validity_days: formData.validity_days ? parseInt(formData.validity_days) : undefined,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined,
        tax_percentage: formData.tax_percentage ? parseFloat(formData.tax_percentage) : undefined,
        items: formData.items.filter(i => i.service_id).map(i => ({
          service_id: parseInt(i.service_id),
          quantity: parseInt(i.quantity) || 1
        }))
      };

      const result = packageSchema.safeParse(payload);
      if (!result.success) {
        setFieldErrors(formatZodErrors(result.error));
        setLoading(false);
        return;
      }

      if (initialData) {
        await api.put(`/catalog/packages/${initialData.id}`, payload);
        toast.success('Package updated successfully');
      } else {
        await api.post('/catalog/packages', payload);
        toast.success('Package created successfully');
      }
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save package');
      toast.error(err.response?.data?.message || 'Failed to save package');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName) =>
    `w-full bg-gray-50 dark:bg-white/5 border ${fieldErrors[fieldName] ? 'border-red-400 dark:border-red-400/60 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-[#E91E63]'} rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors`;

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
            <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
              <RiGiftLine />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {initialData ? 'Edit Package' : 'Create New Package'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Configure your bundled service packages with discounted combo pricing.
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

          <form id="packageForm" onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className={labelClass}>Package Name <span className="text-[#E91E63]">*</span></label>
              <input
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required
                placeholder="e.g. Bridal Glow Deluxe Package"
                className={inputClass('name')}
              />
              {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className={labelClass}>Description / Highlights</label>
              <textarea
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                rows={3}
                placeholder="Describe what services are included, terms, or customer benefits..."
                className={`${inputClass('description')} resize-none`}
              />
              {fieldErrors.description && <p className="text-red-500 text-xs mt-1">{fieldErrors.description}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Package Price (₹) <span className="text-[#E91E63]">*</span></label>
                <input
                  type="number" 
                  name="total_price" 
                  value={formData.total_price} 
                  onChange={handleChange} 
                  required 
                  min="0" 
                  step="0.01"
                  placeholder="0.00"
                  className={inputClass('total_price')}
                />
                {fieldErrors.total_price && <p className="text-red-500 text-xs mt-1">{fieldErrors.total_price}</p>}
              </div>

              <div>
                <label className={labelClass}>Applicable Tax (%)</label>
                <input
                  type="number" 
                  name="tax_percentage" 
                  value={formData.tax_percentage} 
                  onChange={handleChange} 
                  min="0" 
                  max="100"
                  placeholder="18"
                  className={inputClass('tax_percentage')}
                />
                {fieldErrors.tax_percentage && <p className="text-red-500 text-xs mt-1">{fieldErrors.tax_percentage}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Validity Period (Days)</label>
                <input
                  type="number" 
                  name="validity_days" 
                  value={formData.validity_days} 
                  onChange={handleChange} 
                  min="1"
                  placeholder="Leave empty for lifetime"
                  className={inputClass('validity_days')}
                />
                {fieldErrors.validity_days && <p className="text-red-500 text-xs mt-1">{fieldErrors.validity_days}</p>}
              </div>

              <div>
                <label className={labelClass}>Max Redemptions / Uses</label>
                <input
                  type="number" 
                  name="max_uses" 
                  value={formData.max_uses} 
                  onChange={handleChange} 
                  min="1"
                  placeholder="Leave empty for unlimited"
                  className={inputClass('max_uses')}
                />
                {fieldErrors.max_uses && <p className="text-red-500 text-xs mt-1">{fieldErrors.max_uses}</p>}
              </div>
            </div>

            {/* Included Services Section */}
            <div className="pt-3 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-[13px] font-bold text-gray-800 dark:text-white">Included Services</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Add the services bundled into this package.</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleAddItem} 
                  className="text-xs font-semibold text-[#E91E63] hover:text-[#d81557] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E91E63]/10 hover:bg-[#E91E63]/20 transition-all cursor-pointer"
                >
                  <RiAddLine className="text-base" /> Add Service
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-gray-400 text-xs">
                  No services bundled yet. Click <strong>Add Service</strong> to select services for this package.
                </div>
              ) : (
                <div className="space-y-3">
                  {fieldErrors.items && <p className="text-red-500 text-xs mb-2 font-medium">{fieldErrors.items}</p>}
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gray-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                      <div className="flex-1">
                        <select
                          value={item.service_id}
                          onChange={(e) => handleItemChange(index, 'service_id', e.target.value)}
                          className="w-full bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#E91E63]"
                        >
                          <option value="">Select Service...</option>
                          {services.map(s => (
                            <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                          min="1"
                          placeholder="Qty"
                          className="w-full px-3 py-2 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#E91E63] text-center"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(index)} 
                        className="p-2 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <RiDeleteBin7Line className="text-base" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
            form="packageForm"
            disabled={loading}
            className="px-6 py-2.5 bg-[#E91E63] text-white rounded-xl text-sm font-semibold hover:bg-[#d81557] transition-all disabled:opacity-50 shadow-md shadow-[#E91E63]/25 cursor-pointer flex items-center justify-center min-w-[130px]"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : initialData ? 'Save Changes' : 'Create Package'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
