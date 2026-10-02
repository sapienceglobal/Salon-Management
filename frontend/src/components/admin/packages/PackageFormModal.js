'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { 
  RiCloseLine, 
  RiAddLine, 
  RiDeleteBin7Line, 
  RiGiftLine, 
  RiInformationLine,
  RiUploadCloud2Line,
  RiImageLine,
  RiSparklingLine,
  RiCheckLine,
  RiTimeLine,
  RiPercentLine,
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
    items: [], // { service_id, quantity }
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

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
          tax_percentage: initialData.tax_percentage !== undefined ? String(initialData.tax_percentage) : '18',
          items: initialData.items?.map(i => ({ service_id: i.service_id, quantity: i.quantity })) || [],
        });
        setImageFile(null);
        const existingImg = initialData.image_url || initialData.image;
        if (existingImg) {
          const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
          setImagePreview(existingImg.startsWith('http') || existingImg.startsWith('data:') ? existingImg : `${apiBase}${existingImg.startsWith('/') ? '' : '/'}${existingImg}`);
        } else {
          setImagePreview(null);
        }
      } else {
        setFormData({
          name: '',
          description: '',
          total_price: '',
          validity_days: '',
          max_uses: '',
          tax_percentage: '18',
          items: [],
        });
        setImageFile(null);
        setImagePreview(null);
      }
      setError('');
      setFieldErrors({});
    }
  }, [isOpen, initialData]);

  // Calculate total standard value of bundled services
  const bundleOriginalTotal = useMemo(() => {
    return formData.items.reduce((sum, item) => {
      const svc = services.find((s) => String(s.id) === String(item.service_id));
      const price = Number(svc?.price || 0);
      const qty = Number(item.quantity || 1);
      return sum + (price * qty);
    }, 0);
  }, [formData.items, services]);

  const customerDiscountPercent = useMemo(() => {
    const pkgPrice = Number(formData.total_price || 0);
    if (bundleOriginalTotal > 0 && pkgPrice > 0 && pkgPrice < bundleOriginalTotal) {
      return Math.round(((bundleOriginalTotal - pkgPrice) / bundleOriginalTotal) * 100);
    }
    return 0;
  }, [bundleOriginalTotal, formData.total_price]);

  if (!isOpen || !mounted) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size cannot exceed 5MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        name: formData.name.trim(),
        description: formData.description.trim(),
        total_price: formData.total_price ? parseFloat(formData.total_price) : undefined,
        validity_days: formData.validity_days ? parseInt(formData.validity_days, 10) : undefined,
        max_uses: formData.max_uses ? parseInt(formData.max_uses, 10) : undefined,
        tax_percentage: formData.tax_percentage ? parseFloat(formData.tax_percentage) : undefined,
        items: formData.items.filter(i => i.service_id).map(i => ({
          service_id: parseInt(i.service_id, 10),
          quantity: parseInt(i.quantity, 10) || 1
        }))
      };

      const result = packageSchema.safeParse(payload);
      if (!result.success) {
        setFieldErrors(formatZodErrors(result.error));
        setLoading(false);
        return;
      }

      // Build FormData for multipart upload
      const submitData = new FormData();
      submitData.append('name', payload.name);
      if (payload.description) submitData.append('description', payload.description);
      if (payload.total_price !== undefined) submitData.append('total_price', payload.total_price);
      if (payload.validity_days !== undefined) submitData.append('validity_days', payload.validity_days);
      if (payload.max_uses !== undefined) submitData.append('max_uses', payload.max_uses);
      if (payload.tax_percentage !== undefined) submitData.append('tax_percentage', payload.tax_percentage);
      submitData.append('items', JSON.stringify(payload.items));

      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (imagePreview === null && initialData?.image_url) {
        submitData.append('image_url', '');
      }

      const headers = { 'Content-Type': 'multipart/form-data' };

      if (initialData) {
        await api.put(`/catalog/packages/${initialData.id}`, submitData, { headers });
        toast.success('Package updated successfully');
      } else {
        await api.post('/catalog/packages', submitData, { headers });
        toast.success('Package created successfully');
      }
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save package';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName) =>
    `w-full bg-gray-50 dark:bg-white/5 border ${fieldErrors[fieldName] ? 'border-red-400 dark:border-red-400/60 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-[#E91E63]'} rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors`;

  const labelClass = 'block text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

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
                Configure bundled salon service packages with custom pricing and redemption rules.
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
            
            {/* Package Cover Image Upload Section */}
            <div>
              <label className={labelClass}>
                <span>Package Banner / Cover Photo</span>
                <span className="text-[11px] text-gray-400 font-normal ml-1.5">(Displayed on client packages card)</span>
              </label>

              {imagePreview ? (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 group shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Package Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-white text-gray-800 rounded-xl text-xs font-bold shadow-md hover:bg-gray-100 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RiImageLine /> Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3.5 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-600 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RiDeleteBin7Line /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-[#E91E63] dark:hover:border-[#E91E63] rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] hover:bg-[#E91E63]/5 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center justify-center pt-3 pb-3 text-center px-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 group-hover:bg-[#E91E63]/10 text-gray-400 group-hover:text-[#E91E63] flex items-center justify-center mb-1.5 transition-colors">
                      <RiUploadCloud2Line className="text-2xl" />
                    </div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      <span className="text-[#E91E63] font-bold">Click to upload photo</span> or drag and drop
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Package Name */}
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

            {/* Description */}
            <div>
              <label className={labelClass}>Description / Highlights</label>
              <textarea
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                rows={2}
                placeholder="Describe what services are included, terms, or customer benefits..."
                className={`${inputClass('description')} resize-none`}
              />
              {fieldErrors.description && <p className="text-red-500 text-xs mt-1">{fieldErrors.description}</p>}
            </div>

            {/* Pricing & Tax */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <span>Package Bundle Price (₹)</span> <span className="text-[#E91E63]">*</span>
                </label>
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

            {/* Validity Days & Max Uses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                    Validity Period (Days)
                  </label>
                  <span className="text-[10px] text-gray-400">Optional</span>
                </div>
                <input
                  type="number" 
                  name="validity_days" 
                  value={formData.validity_days} 
                  onChange={handleChange} 
                  min="1"
                  placeholder="e.g. 90 (Empty for lifetime)"
                  className={inputClass('validity_days')}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Customer will have this many days to redeem sessions after purchase.
                </p>
                {fieldErrors.validity_days && <p className="text-red-500 text-xs mt-1">{fieldErrors.validity_days}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
                    Max Redemptions / Uses
                  </label>
                  <span className="text-[10px] text-gray-400">Optional</span>
                </div>
                <input
                  type="number" 
                  name="max_uses" 
                  value={formData.max_uses} 
                  onChange={handleChange} 
                  min="1"
                  placeholder="e.g. 4 (Empty for unlimited)"
                  className={inputClass('max_uses')}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Total times customer can visit to redeem services under this package.
                </p>
                {fieldErrors.max_uses && <p className="text-red-500 text-xs mt-1">{fieldErrors.max_uses}</p>}
              </div>
            </div>

            {/* Value Savings Banner if customer discount exists */}
            {bundleOriginalTotal > 0 && Number(formData.total_price || 0) > 0 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-pink-500/10 to-purple-500/10 border border-emerald-300/40 dark:border-emerald-700/40 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <RiSparklingLine className="text-base text-emerald-600 dark:text-emerald-400" />
                  <span>Standard Total Value: ₹{bundleOriginalTotal.toLocaleString()}</span>
                </div>
                {customerDiscountPercent > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] shadow-xs">
                    Client Saves {customerDiscountPercent}% (₹{(bundleOriginalTotal - Number(formData.total_price)).toLocaleString()})
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">Bundle pricing configured</span>
                )}
              </div>
            )}

            {/* Included Services Section */}
            <div className="pt-3 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-[13px] font-bold text-gray-800 dark:text-white">Included Services</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Choose the specific salon services bundled into this package.</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleAddItem} 
                  className="text-xs font-bold text-[#E91E63] hover:text-[#d81557] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E91E63]/10 hover:bg-[#E91E63]/20 transition-all cursor-pointer"
                >
                  <RiAddLine className="text-base" /> Add Service
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-gray-400 text-xs">
                  No services bundled yet. Click <strong>Add Service</strong> to bundle services for this package.
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
                        title="Remove service"
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
            className="px-6 py-2.5 bg-[#E91E63] text-white rounded-xl text-sm font-semibold hover:bg-[#d81557] transition-all disabled:opacity-50 shadow-md shadow-[#E91E63]/25 cursor-pointer flex items-center justify-center min-w-[140px]"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : initialData ? 'Save Changes' : 'Create Package'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
