'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import {
  RiCloseLine,
  RiScissorsLine,
  RiImageLine,
  RiImageAddLine,
  RiSettings4Line,
  RiTimeLine,
  RiInformationLine,
  RiSaveLine,
  RiCheckLine,
  RiSparklingLine,
  RiFlowerLine,
  RiUserSmileLine,
  RiPaletteLine,
  RiDropLine,
  RiHandHeartLine,
  RiVipCrownLine,
  RiBrushLine,
  RiMagicLine,
} from 'react-icons/ri';
import api from '@/lib/api';
import { serviceSchema, formatZodErrors } from '@/lib/validations';
import { getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

const PRESET_IMAGES = [
  { id: 'men', name: 'Men Haircut', url: '/service_men_haircut.png' },
  { id: 'women', name: 'Women Haircut', url: '/service_women_haircut.png' },
  { id: 'spa', name: 'Hair Spa', url: '/service_hair_spa.png' },
  { id: 'keratin', name: 'Keratin', url: '/service_keratin.png' },
];

const SALON_ICONS = [
  { id: 'scissors', name: 'Haircut', icon: RiScissorsLine },
  { id: 'sparkles', name: 'Glow / Style', icon: RiSparklingLine },
  { id: 'spa', name: 'Spa / Flora', icon: RiFlowerLine },
  { id: 'facial', name: 'Facial / Skin', icon: RiUserSmileLine },
  { id: 'makeup', name: 'Makeup / Art', icon: RiPaletteLine },
  { id: 'treatment', name: 'Treatment', icon: RiDropLine },
  { id: 'care', name: 'Care / Nails', icon: RiHandHeartLine },
  { id: 'premium', name: 'VIP / Bridal', icon: RiVipCrownLine },
  { id: 'brush', name: 'Color / Dye', icon: RiBrushLine },
  { id: 'magic', name: 'Special', icon: RiMagicLine },
];

export default function ServiceFormModal({ isOpen, onClose, onSuccess, initialData, categories = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    price: '',
    discounted_price: '',
    duration_val: 30,
    duration_unit: 'minutes', // 'minutes' | 'hours'
    service_staff: '',
    is_active: true,
    online_booking: true,
    is_featured: false,
    requires_consultation: false,
    tags: '',
    sort_order: 0,
    tax_applicable: 'yes', // 'yes' | 'no'
    service_color: '#EC4899',
    image_url: '',
    icon: '',
  });

  const [staffList, setStaffList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [visualTab, setVisualTab] = useState('upload'); // 'upload' | 'preset' | 'icon'
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
    // Fetch staff list for dropdown
    api
      .get('/staff')
      .then((res) => {
        const staff = res.data || [];
        setStaffList(staff);
      })
      .catch(() => {});
  }, []);

  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const durMins = initialData.duration_minutes || 30;
        const isHours = durMins >= 60 && durMins % 60 === 0;
        setFormData({
          name: initialData.name || '',
          category_id: initialData.category_id || (categories[0]?.id || ''),
          description: initialData.description || '',
          price: initialData.price || '',
          discounted_price: initialData.discounted_price || '',
          duration_val: isHours ? durMins / 60 : durMins,
          duration_unit: isHours ? 'hours' : 'minutes',
          service_staff: initialData.service_staff || '',
          is_active: initialData.is_active !== false,
          online_booking: initialData.online_booking !== false,
          is_featured: !!initialData.is_featured,
          requires_consultation: !!initialData.requires_consultation,
          tags: initialData.tags || '',
          sort_order: initialData.sort_order || 0,
          tax_applicable: (initialData.tax_percentage > 0 || initialData.tax_percentage === undefined) ? 'yes' : 'no',
          service_color: initialData.service_color || '#EC4899',
          image_url: initialData.image_url?.startsWith('icon:') ? '' : (initialData.image_url || ''),
          icon: initialData.icon || (initialData.image_url?.startsWith('icon:') ? initialData.image_url.replace('icon:', '') : ''),
        });
        const imgVal = initialData.image_url || '';
        const isIconInImg = imgVal.startsWith('icon:');
        const iconVal = initialData.icon || (isIconInImg ? imgVal.replace('icon:', '') : '');
        const finalImg = isIconInImg ? '' : imgVal;
        setImagePreview(finalImg);
        if (iconVal) {
          setVisualTab('icon');
        } else if (finalImg.startsWith('/service_')) {
          setVisualTab('preset');
        } else {
          setVisualTab('upload');
        }
      } else {
        setFormData({
          name: '',
          category_id: categories.length > 0 ? categories[0].id : '',
          description: '',
          price: '',
          discounted_price: '',
          duration_val: 30,
          duration_unit: 'minutes',
          service_staff: '',
          is_active: true,
          online_booking: true,
          is_featured: false,
          requires_consultation: false,
          tags: '',
          sort_order: 0,
          tax_applicable: 'yes',
          service_color: '#EC4899',
          image_url: '',
          icon: '',
        });
        setImagePreview('');
        setVisualTab('upload');
      }
      setSelectedFile(null);
      setError('');
      setFieldErrors({});
    }
  }, [isOpen, initialData, categories]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size exceeds 2 MB limit');
        return;
      }
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFormData((prev) => ({ ...prev, image_url: '', icon: '' }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size exceeds 2 MB limit');
        return;
      }
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFormData((prev) => ({ ...prev, image_url: '', icon: '' }));
    }
  };

  const handleSelectPreset = (url) => {
    setSelectedFile(null);
    setImagePreview(url);
    setFormData((prev) => ({ ...prev, image_url: url, icon: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectIcon = (iconId) => {
    setSelectedFile(null);
    setImagePreview('');
    setFormData((prev) => ({ ...prev, icon: iconId, image_url: `icon:${iconId}` }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveVisual = () => {
    setSelectedFile(null);
    setImagePreview('');
    setFormData((prev) => ({ ...prev, image_url: '', icon: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const durationInMinutes =
        formData.duration_unit === 'hours'
          ? Math.max(1, Number(formData.duration_val) * 60)
          : Math.max(1, Number(formData.duration_val));

      const categoryIdVal = formData.category_id
        ? Number(formData.category_id)
        : (categories.length > 0 ? Number(categories[0].id) : null);

      const effectiveIcon = formData.icon || (formData.image_url?.startsWith('icon:') ? formData.image_url.replace('icon:', '') : null);

      const payload = {
        name: formData.name.trim(),
        category_id: categoryIdVal,
        description: formData.description?.trim() || null,
        price: Number(formData.price) || 0,
        discounted_price: formData.discounted_price ? Number(formData.discounted_price) : null,
        duration_minutes: durationInMinutes,
        tax_percentage: formData.tax_applicable === 'yes' ? 18 : 0,
        is_active: formData.is_active,
        online_booking: formData.online_booking,
        is_featured: formData.is_featured,
        requires_consultation: formData.requires_consultation,
        tags: formData.tags?.trim() || null,
        sort_order: Number(formData.sort_order) || 0,
        service_color: formData.service_color || '#EC4899',
        service_staff: formData.service_staff || null,
        icon: effectiveIcon,
        image_url: effectiveIcon ? `icon:${effectiveIcon}` : (formData.image_url || null),
      };

      const result = serviceSchema.safeParse(payload);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        setFieldErrors(errors);
        const firstError = Object.values(errors)[0] || 'Please check the required fields.';
        setError(firstError);
        toast.error(firstError);
        setLoading(false);
        return;
      }

      // If a physical file was selected, send as multipart/form-data
      if (selectedFile) {
        const formDataPayload = new FormData();
        Object.entries(payload).forEach(([key, val]) => {
          if (val !== null && val !== undefined) {
            formDataPayload.append(key, val);
          }
        });
        formDataPayload.append('images', selectedFile);

        if (isEditing) {
          await api.put(`/services/${initialData.id}`, formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          await api.post('/services', formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      } else {
        // Standard JSON payload
        if (isEditing) {
          await api.put(`/services/${initialData.id}`, payload);
        } else {
          await api.post('/services', payload);
        }
      }

      toast.success(isEditing ? 'Service updated successfully' : 'Service created successfully');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to save service.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const SelectedIconComp = formData.icon
    ? SALON_ICONS.find((i) => i.id === formData.icon)?.icon
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ========================================================
            MODAL HEADER
           ======================================================== */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
              <RiScissorsLine />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {isEditing ? 'Edit Service' : 'Add New Service'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Create a new salon service with pricing, duration and other details.
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

        {/* ========================================================
            MODAL BODY (2-COLUMN GRID)
           ======================================================== */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 sm:p-8 max-h-[calc(88vh-130px)] overflow-y-auto custom-scrollbar">
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-sm rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Main Form Inputs */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Row 1: Service Name & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Service Name <span className="text-[#E91E63]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Hair Cut, Facial, Manicure"
                      className={`w-full bg-white dark:bg-[#121224] border rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all font-medium ${
                        fieldErrors.name ? 'border-red-500' : 'border-gray-200 dark:border-white/10'
                      }`}
                    />
                    {fieldErrors.name && <p className="text-red-500 text-xs font-medium mt-1">{fieldErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Category <span className="text-[#E91E63]">*</span>
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className={`w-full bg-white dark:bg-[#121224] border rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all cursor-pointer font-medium ${
                        fieldErrors.category_id ? 'border-red-500' : 'border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <option value="" disabled>Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.category_id && <p className="text-red-500 text-xs font-medium mt-1">{fieldErrors.category_id}</p>}
                  </div>
                </div>

                {/* Row 2: Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Description</label>
                    <span className="text-xs text-gray-400 font-medium">{formData.description.length}/500</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter a short description of the service..."
                    className="w-full bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all resize-none"
                  />
                </div>

                {/* Row 3: Price & Discounted Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Price (₹) <span className="text-[#E91E63]">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className={`w-full bg-white dark:bg-[#121224] border rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all font-medium ${
                        fieldErrors.price ? 'border-red-500' : 'border-gray-200 dark:border-white/10'
                      }`}
                    />
                    {fieldErrors.price && <p className="text-red-500 text-xs font-medium mt-1">{fieldErrors.price}</p>}
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Discounted Price (₹)</label>
                      <RiInformationLine className="text-gray-400 text-sm" title="Promotional or discounted price shown to customers" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.discounted_price}
                      onChange={(e) => setFormData({ ...formData, discounted_price: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Row 4: Duration & Service Staff */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Duration <span className="text-[#E91E63]">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <RiTimeLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                        <input
                          type="number"
                          min="1"
                          value={formData.duration_val}
                          onChange={(e) => setFormData({ ...formData, duration_val: e.target.value })}
                          className="w-full bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#E91E63] font-medium"
                        />
                      </div>
                      <select
                        value={formData.duration_unit}
                        onChange={(e) => setFormData({ ...formData, duration_unit: e.target.value })}
                        className="bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#E91E63] cursor-pointer font-medium"
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Primary Service Staff</label>
                    <select
                      value={formData.service_staff}
                      onChange={(e) => setFormData({ ...formData, service_staff: e.target.value })}
                      className="w-full bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#E91E63] cursor-pointer font-medium"
                    >
                      <option value="">All Staff (Anyone available)</option>
                      {staffList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.first_name ? `${st.first_name} ${st.last_name || ''}` : st.designation || `Staff #${st.id}`} ({st.designation || 'Specialist'} • {st.shift_schedule ? st.shift_schedule.replace('_', ' ') : 'full time'})
                        </option>
                      ))}
                    </select>

                    {formData.service_staff && (() => {
                      const selectedSt = staffList.find(s => String(s.id) === String(formData.service_staff));
                      if (!selectedSt) return null;
                      return (
                        <div className="mt-2 p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              {selectedSt.avatar_url ? (
                                <img src={selectedSt.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                              ) : (
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                  style={{ backgroundColor: selectedSt.color_code || '#E91E63' }}
                                >
                                  {selectedSt.first_name?.[0]}
                                </div>
                              )}
                              <span
                                className="w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 ring-1 ring-white"
                                style={{ backgroundColor: selectedSt.color_code || '#E91E63' }}
                              />
                            </div>
                            <div className="leading-tight">
                              <span className="text-xs font-bold text-gray-900 dark:text-white block">
                                {selectedSt.first_name} {selectedSt.last_name || ''}
                              </span>
                              <span className="text-[10px] text-gray-400 capitalize">
                                {selectedSt.designation || 'Staff'} • {selectedSt.shift_schedule || 'full time'}
                              </span>
                            </div>
                          </div>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-white"
                            style={{ backgroundColor: selectedSt.color_code || '#E91E63' }}
                          >
                            Assigned
                          </span>
                        </div>
                      );
                    })()}
                    <p className="text-xs text-gray-400 mt-1">Leave empty to allow any staff member</p>
                  </div>
                </div>

                {/* Row 5: 2x2 Toggle Switches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Active Service */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.is_active}
                      onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                        formData.is_active ? 'bg-[#12B76A]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          formData.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white block">Active Service</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block leading-normal mt-0.5">
                        This service will be visible for booking.
                      </span>
                    </div>
                  </div>

                  {/* Online Booking */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.online_booking}
                      onClick={() => setFormData({ ...formData, online_booking: !formData.online_booking })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                        formData.online_booking ? 'bg-[#12B76A]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          formData.online_booking ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white block">Online Booking</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block leading-normal mt-0.5">
                        Allow customers to book this service online.
                      </span>
                    </div>
                  </div>

                  {/* Featured Service */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.is_featured}
                      onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                        formData.is_featured ? 'bg-[#12B76A]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          formData.is_featured ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white block">Featured Service</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block leading-normal mt-0.5">
                        Show this service on homepage or popular list.
                      </span>
                    </div>
                  </div>

                  {/* Requires Consultation */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.requires_consultation}
                      onClick={() => setFormData({ ...formData, requires_consultation: !formData.requires_consultation })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                        formData.requires_consultation ? 'bg-[#12B76A]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          formData.requires_consultation ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white block">Requires Consultation</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block leading-normal mt-0.5">
                        Customer needs consultation before booking.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 6: Tags */}
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g. Trending, Bridal, Premium"
                    className="w-full bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] font-medium"
                  />
                  <p className="text-xs text-gray-400 mt-1">Add tags separated by commas</p>
                </div>
              </div>

              {/* RIGHT COLUMN: Service Image & Additional Settings */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Card 1: Service Image / Icon Selection */}
                <div className="bg-gray-50/70 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-[#7F56D9] flex items-center justify-center text-lg shrink-0">
                        <RiImageLine />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Service Image</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Upload a photo for this service.</p>
                      </div>
                    </div>

                    {/* Mode Selector (Upload / Presets / Icon) */}
                    <div className="flex items-center bg-gray-200/70 dark:bg-white/10 p-1 rounded-xl text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setVisualTab('upload')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          visualTab === 'upload'
                            ? 'bg-white dark:bg-[#121224] text-gray-900 dark:text-white shadow-xs'
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                        }`}
                      >
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisualTab('preset')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          visualTab === 'preset'
                            ? 'bg-white dark:bg-[#121224] text-gray-900 dark:text-white shadow-xs'
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                        }`}
                      >
                        Presets
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisualTab('icon')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          visualTab === 'icon'
                            ? 'bg-white dark:bg-[#121224] text-gray-900 dark:text-white shadow-xs'
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                        }`}
                      >
                        Icons
                      </button>
                    </div>
                  </div>

                  {/* Active Visual Preview OR Drag & Drop Upload Zone */}
                  {imagePreview ? (
                    <div className="border border-gray-200 dark:border-white/10 rounded-xl p-3.5 bg-white dark:bg-[#121224] flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getImageUrl(imagePreview)}
                          alt="Service Preview"
                          className="w-14 h-14 rounded-xl object-cover border border-gray-100 dark:border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {selectedFile ? selectedFile.name : formData.image_url ? 'Preset / Custom Image' : 'Selected Photo'}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            Ready for service display
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-semibold text-[#E91E63] hover:underline px-2.5 py-1 cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveVisual}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <RiCloseLine className="text-lg" />
                        </button>
                      </div>
                    </div>
                  ) : formData.icon ? (
                    <div className="border border-gray-200 dark:border-white/10 rounded-xl p-3.5 bg-white dark:bg-[#121224] flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          style={{
                            backgroundColor: `${formData.service_color || '#EC4899'}20`,
                            color: formData.service_color || '#EC4899',
                            borderColor: `${formData.service_color || '#EC4899'}40`,
                          }}
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 border"
                        >
                          {SelectedIconComp && <SelectedIconComp />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                            {SALON_ICONS.find((i) => i.id === formData.icon)?.name || formData.icon} Icon
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Color matched with Service Color
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveVisual}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <RiCloseLine className="text-lg" />
                      </button>
                    </div>
                  ) : (
                    /* Default Dropzone matching UI screenshot */
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl py-6 px-4 text-center transition-all bg-white dark:bg-[#121224] flex flex-col items-center justify-center gap-2 relative ${
                        isDragging
                          ? 'border-[#E91E63] bg-pink-50/20'
                          : 'border-blue-200 dark:border-blue-900/40'
                      }`}
                    >
                      <RiImageAddLine className="text-3xl text-blue-400 dark:text-blue-500/70" />
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                        Drag & drop an image here
                      </p>
                      <span className="text-xs text-gray-400">or</span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-[#E91E63] text-[#E91E63] hover:bg-pink-50 dark:hover:bg-pink-950/30 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Choose File
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {visualTab === 'upload' && !imagePreview && !formData.icon && (
                    <p className="text-xs text-gray-400 text-center leading-relaxed">
                      Recommended size: 800 x 600 px (JPG, PNG) &bull; Max file size: 2 MB
                    </p>
                  )}

                  {/* Preset Avatars Grid */}
                  {visualTab === 'preset' && (
                    <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-2">
                        Select a preset fallback photo:
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {PRESET_IMAGES.map((preset) => {
                          const isSelected = formData.image_url === preset.url;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleSelectPreset(preset.url)}
                              className={`relative rounded-xl overflow-hidden border-2 p-0.5 transition-all cursor-pointer group ${
                                isSelected
                                  ? 'border-[#E91E63] shadow-md shadow-[#E91E63]/20 scale-105'
                                  : 'border-gray-200 dark:border-white/10 hover:border-pink-300'
                              }`}
                              title={preset.name}
                            >
                              <img
                                src={preset.url}
                                alt={preset.name}
                                className="w-full h-11 object-cover rounded-lg"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-[#E91E63]/30 flex items-center justify-center text-white rounded-lg">
                                  <RiCheckLine className="text-base font-bold" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Salon Icons Grid */}
                  {visualTab === 'icon' && (
                    <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-2">
                        Select a salon icon:
                      </span>
                      <div className="grid grid-cols-5 gap-2">
                        {SALON_ICONS.map((item) => {
                          const IconC = item.icon;
                          const isSelected = formData.icon === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectIcon(item.id)}
                              className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-[#E91E63] text-white border-[#E91E63] shadow-md shadow-[#E91E63]/25 scale-105'
                                  : 'bg-white dark:bg-[#121224] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-pink-300 hover:text-[#E91E63]'
                              }`}
                              title={item.name}
                            >
                              <IconC />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card 2: Additional Settings */}
                <div className="bg-gray-50/70 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950/50 text-[#E91E63] flex items-center justify-center text-lg shrink-0">
                      <RiSettings4Line />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">Additional Settings</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Set additional preferences for this service.</p>
                    </div>
                  </div>

                  {/* Display Order */}
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Display Order</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                        className="w-24 bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#E91E63] text-right font-medium"
                      />
                      <RiInformationLine className="text-gray-400 text-sm" title="Sort order on appointment booking screen" />
                    </div>
                  </div>

                  {/* Tax Applicable */}
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tax Applicable</label>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={formData.tax_applicable}
                        onChange={(e) => setFormData({ ...formData, tax_applicable: e.target.value })}
                        className="w-24 bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#E91E63] cursor-pointer font-medium"
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                      <RiInformationLine className="text-gray-400 text-sm" title="Whether 18% GST applies to this service" />
                    </div>
                  </div>

                  {/* Service Color */}
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Service Color</label>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1.5 bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-2.5 py-1">
                        <input
                          type="color"
                          value={formData.service_color}
                          onChange={(e) => setFormData({ ...formData, service_color: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={formData.service_color}
                          onChange={(e) => setFormData({ ...formData, service_color: e.target.value })}
                          className="w-18 bg-transparent border-0 text-sm font-mono font-semibold text-gray-800 dark:text-gray-200 outline-none uppercase"
                        />
                      </div>
                      <RiInformationLine className="text-gray-400 text-sm" title="Color badge used in appointment calendar" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              MODAL FOOTER (Action Buttons)
             ======================================================== */}
          <div className="px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#E91E63] hover:bg-[#D81B60] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#E91E63]/25 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RiSaveLine className="text-lg" />
              {loading ? 'Saving...' : 'Save Service'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
