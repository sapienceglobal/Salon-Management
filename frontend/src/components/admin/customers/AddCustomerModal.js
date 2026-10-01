'use client';

import { useEffect, useState, useRef } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { customerSchema, formatZodErrors } from '@/lib/validations';
import { getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  RiCloseLine,
  RiUserLine,
  RiPhoneLine,
  RiMailLine,
  RiMapPinLine,
  RiCalendarEventLine,
  RiSaveLine,
  RiUserAddLine,
  RiInformationLine,
  RiUserSmileLine,
  RiTeamLine,
  RiShieldCheckLine,
  RiMessage3Line,
  RiWhatsappLine,
  RiGlobalLine,
  RiHome4Line,
  RiFileTextLine,
  RiVipCrownLine,
  RiUserHeartLine,
  RiCalendarLine,
  RiHeart3Line,
  RiGiftLine,
  RiCameraLine,
  RiUpload2Line,
  RiDeleteBinLine,
  RiImageAddLine,
} from 'react-icons/ri';

export default function AddCustomerModal({ isOpen, onClose, onSuccess, initialData }) {
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    gender: 'female',
    gst_number: '',
    date_of_birth: '',
    anniversary: '',
    location: '',
    source: '',
    address: '',
    notes: '',
    sms_opt_in: false,
    email_opt_in: false,
    whatsapp_opt_in: false,
  });

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          first_name: initialData.first_name || '',
          last_name: initialData.last_name || '',
          phone: initialData.phone || '',
          email: initialData.email || '',
          gender: initialData.gender || 'female',
          gst_number: initialData.gst_number || '',
          date_of_birth: initialData.date_of_birth ? initialData.date_of_birth.split('T')[0] : '',
          anniversary: initialData.anniversary ? initialData.anniversary.split('T')[0] : '',
          location: initialData.location || '',
          source: initialData.source || '',
          address: initialData.address || '',
          notes: initialData.notes || '',
          sms_opt_in: initialData.sms_opt_in ?? false,
          email_opt_in: initialData.email_opt_in ?? false,
          whatsapp_opt_in: initialData.whatsapp_opt_in ?? false,
        });
        setImagePreview(initialData.profile_image_url ? getImageUrl(initialData.profile_image_url) : '');
      } else {
        setFormData({
          first_name: '', last_name: '', phone: '', email: '', gender: 'female',
          gst_number: '', date_of_birth: '', anniversary: '', location: '', source: '',
          address: '', notes: '', sms_opt_in: false, email_opt_in: false, whatsapp_opt_in: false,
        });
        setImagePreview('');
      }
      setSelectedFile(null);
      setIsDragging(false);
      setError('');
      setFieldErrors({});
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen, initialData]);

  if (!isOpen || !mounted) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5 MB');
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5 MB');
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      // 1. Prepare trimmed validation payload
      const validationPayload = {};
      Object.keys(formData).forEach(key => {
        const val = formData[key];
        validationPayload[key] = typeof val === 'string' ? val.trim() : val;
      });

      // Quick validation for required fields
      if (!validationPayload.first_name) {
        setFieldErrors(prev => ({ ...prev, first_name: 'First name is required' }));
        setError('First name is required');
        toast.error('First name is required');
        setLoading(false);
        return;
      }

      if (!validationPayload.phone) {
        setFieldErrors(prev => ({ ...prev, phone: 'Mobile number is required' }));
        setError('Mobile number is required');
        toast.error('Mobile number is required');
        setLoading(false);
        return;
      }

      // 2. Zod Validation with clean human-readable error messages
      const result = customerSchema.safeParse(validationPayload);
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        setFieldErrors(errors);
        const firstMsg = Object.values(errors)[0] || 'Please fix the errors in the form';
        setError(firstMsg);
        toast.error(firstMsg);
        setLoading(false);
        return;
      }

      // 3. Prepare API payload (remove empty optional fields so backend doesn't receive blank strings)
      const payload = { ...validationPayload };
      Object.keys(payload).forEach(key => {
        if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
      });

      // Safely map location into address if provided
      if (payload.location) {
        if (!payload.address) {
          payload.address = payload.location;
        } else if (!payload.address.includes(payload.location)) {
          payload.address = `${payload.address}, ${payload.location}`;
        }
        delete payload.location;
      }

      let res;
      if (selectedFile) {
        const formDataPayload = new FormData();
        Object.keys(payload).forEach(key => {
          if (payload[key] !== '' && payload[key] !== null && payload[key] !== undefined) {
            formDataPayload.append(key, payload[key]);
          }
        });
        formDataPayload.append('image', selectedFile);

        if (isEditing) {
          res = await api.put(`/customers/${initialData.id}`, formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          res = await api.post('/customers', formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      } else {
        if (isEditing && !imagePreview && initialData?.profile_image_url) {
          payload.profile_image_url = null;
        }
        if (isEditing) {
          res = await api.put(`/customers/${initialData.id}`, payload);
        } else {
          res = await api.post('/customers', payload);
        }
      }

      if (onSuccess) onSuccess(res?.data?.data || res?.data || res);
      toast.success(isEditing ? 'Customer updated successfully!' : 'Customer added successfully!');
      onClose();
    } catch (err) {
      console.error('Error saving customer:', err);
      const errMsg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors && err?.response?.data?.errors[0]?.message) ||
        err?.message ||
        'Failed to save customer';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Field helper
  const inputClass = (fieldName) =>
    `w-full bg-gray-50 dark:bg-white/5 border ${fieldErrors[fieldName] ? 'border-red-400 dark:border-red-400/60 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-[#E91E63]'} rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors`;

  const labelClass = 'block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ══════════════════════════════════════════════════════════
            MODAL HEADER
           ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
              {isEditing ? <RiUserSmileLine /> : <RiUserAddLine />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {isEditing ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {isEditing
                  ? 'Update customer profile details, contact info, and preferences.'
                  : 'Create a new customer record with contact details and preferences.'}
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

        <form id="customerForm" onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
          {/* ══════════════════════════════════════════════════════════
              MODAL BODY
             ══════════════════════════════════════════════════════════ */}
          <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 sm:px-8 py-6">
            {error && (
              <div className="flex items-center gap-2 p-3.5 mb-5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[13px] font-medium">
                <RiInformationLine className="shrink-0 text-base" />
                {error}
              </div>
            )}

            {/* ─── Section: Basic Information ─── */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <RiUserLine className="text-[#E91E63] text-base" />
                <h3 className="text-[14px] font-bold text-gray-800 dark:text-white">Basic Information</h3>
              </div>

              {/* Profile Photo Uploader */}
              <div className="mb-5 p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-dashed border-gray-200 dark:border-white/10">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Avatar Preview */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-full ring-4 ring-pink-100 dark:ring-pink-950/40 overflow-hidden bg-gradient-to-br from-pink-50 to-pink-100 dark:from-white/5 dark:to-white/10 flex items-center justify-center shadow-inner">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Customer Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <RiUserLine className="text-3xl text-gray-400 dark:text-gray-500" />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#E91E63] text-white flex items-center justify-center shadow-md hover:bg-[#D81B60] transition-transform active:scale-95 cursor-pointer"
                      title="Upload photo"
                    >
                      <RiCameraLine className="text-sm" />
                    </button>
                  </div>

                  {/* Details & Action Controls */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`flex-1 w-full flex flex-col justify-center rounded-xl p-2.5 sm:p-3 text-center sm:text-left transition-colors ${
                      isDragging ? 'bg-pink-50/50 dark:bg-pink-900/20 border border-[#E91E63]' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-[13px] font-bold text-gray-800 dark:text-gray-200">Customer Profile Photo</h4>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                          Upload customer photo for quick recognition at reception & invoices. (PNG, JPG up to 5MB)
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-center sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E91E63] text-white hover:bg-[#D81B60] transition-colors shadow-sm cursor-pointer"
                        >
                          <RiUpload2Line className="text-sm" />
                          {imagePreview ? 'Change Photo' : 'Upload Photo'}
                        </button>

                        {imagePreview && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/30 transition-colors cursor-pointer"
                          >
                            <RiDeleteBinLine className="text-sm" />
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className={labelClass}>First Name <span className="text-[#E91E63]">*</span></label>
                  <div className="relative">
                    <RiUserLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base" />
                    <input
                      name="first_name" value={formData.first_name} onChange={handleChange}
                      className={`${inputClass('first_name')} pl-10`}
                      placeholder="Enter first name"
                    />
                  </div>
                  {fieldErrors.first_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.first_name}</p>}
                </div>

                {/* Last Name */}
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    name="last_name" value={formData.last_name} onChange={handleChange}
                    className={inputClass('last_name')}
                    placeholder="Enter last name"
                  />
                  {fieldErrors.last_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.last_name}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className={labelClass}>Mobile Number <span className="text-[#E91E63]">*</span></label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[13px] text-gray-600 dark:text-gray-400 font-semibold shrink-0">
                      +91
                    </div>
                    <div className="relative flex-1">
                      <RiPhoneLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base" />
                      <input
                        name="phone" value={formData.phone} onChange={handleChange}
                        className={`${inputClass('phone')} pl-10`}
                        placeholder="9876543210"
                      />
                    </div>
                  </div>
                  {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>Email</label>
                  <div className="relative">
                    <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base" />
                    <input
                      type="email" name="email" value={formData.email} onChange={handleChange}
                      className={`${inputClass('email')} pl-10`}
                      placeholder="customer@example.com"
                    />
                  </div>
                  {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                </div>
              </div>

              {/* Gender */}
              <div className="mt-4">
                <label className={labelClass}>Gender</label>
                <div className="flex items-center gap-3 mt-1">
                  {['female', 'male', 'other'].map((g) => (
                    <label
                      key={g}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all text-[13px] font-semibold ${
                        formData.gender === g
                          ? 'border-[#E91E63] bg-[#E91E63]/5 text-[#E91E63] dark:bg-[#E91E63]/10'
                          : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio" name="gender" value={g}
                        checked={formData.gender === g} onChange={handleChange}
                        className="hidden"
                      />
                      {g === 'female' ? '👩 Female' : g === 'male' ? '👨 Male' : '🧑 Other'}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── Section: Important Dates & Location ─── */}
            <div className="mb-6 pt-5 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <RiCalendarLine className="text-[#E91E63] text-base" />
                <h3 className="text-[14px] font-bold text-gray-800 dark:text-white">Dates & Location</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* DOB */}
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <div className="relative">
                    <RiCalendarEventLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base pointer-events-none" />
                    <input
                      type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange}
                      className={`${inputClass('date_of_birth')} pl-10 dark:[color-scheme:dark]`}
                    />
                  </div>
                  {fieldErrors.date_of_birth && <p className="text-red-500 text-xs mt-1">{fieldErrors.date_of_birth}</p>}
                </div>

                {/* Anniversary */}
                <div>
                  <label className={labelClass}>Anniversary</label>
                  <div className="relative">
                    <RiHeart3Line className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base pointer-events-none" />
                    <input
                      type="date" name="anniversary" value={formData.anniversary} onChange={handleChange}
                      className={`${inputClass('anniversary')} pl-10 dark:[color-scheme:dark]`}
                    />
                  </div>
                  {fieldErrors.anniversary && <p className="text-red-500 text-xs mt-1">{fieldErrors.anniversary}</p>}
                </div>

                {/* Location */}
                <div>
                  <label className={labelClass}>Location / City</label>
                  <div className="relative">
                    <RiMapPinLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base" />
                    <input
                      name="location" value={formData.location} onChange={handleChange}
                      className={`${inputClass('location')} pl-10`}
                      placeholder="e.g. New Delhi"
                    />
                  </div>
                  {fieldErrors.location && <p className="text-red-500 text-xs mt-1">{fieldErrors.location}</p>}
                </div>
              </div>
            </div>

            {/* ─── Section: Additional Details ─── */}
            <div className="mb-6 pt-5 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <RiFileTextLine className="text-[#E91E63] text-base" />
                <h3 className="text-[14px] font-bold text-gray-800 dark:text-white">Additional Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Source */}
                <div>
                  <label className={labelClass}>Source</label>
                  <select
                    name="source" value={formData.source} onChange={handleChange}
                    className={inputClass('source')}
                  >
                    <option value="">Select source</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="referral">Referral</option>
                    <option value="online">Online</option>
                    <option value="campaign">Campaign</option>
                    <option value="social_media">Social Media</option>
                    <option value="google">Google</option>
                  </select>
                  {fieldErrors.source && <p className="text-red-500 text-xs mt-1">{fieldErrors.source}</p>}
                </div>

                {/* GST Number */}
                <div>
                  <label className={labelClass}>GST Number</label>
                  <input
                    name="gst_number" value={formData.gst_number} onChange={handleChange}
                    className={inputClass('gst_number')}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                  />
                  {fieldErrors.gst_number && <p className="text-red-500 text-xs mt-1">{fieldErrors.gst_number}</p>}
                </div>

                {/* Referred By */}
                <div>
                  <label className={labelClass}>Referred By</label>
                  <div className="relative">
                    <RiUserHeartLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base" />
                    <input
                      className={`${inputClass('referred_by')} pl-10`}
                      placeholder="Customer name / mobile"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {/* Address */}
                <div>
                  <label className={labelClass}>Address</label>
                  <div className="relative">
                    <RiHome4Line className="absolute left-3.5 top-3 text-gray-400 dark:text-gray-500 text-base" />
                    <textarea
                      name="address" value={formData.address} onChange={handleChange}
                      rows={2}
                      className={`${inputClass('address')} pl-10 resize-none`}
                      placeholder="Full address"
                    />
                  </div>
                  {fieldErrors.address && <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>}
                </div>

                {/* Notes */}
                <div>
                  <label className={labelClass}>Customer Note</label>
                  <div className="relative">
                    <RiFileTextLine className="absolute left-3.5 top-3 text-gray-400 dark:text-gray-500 text-base" />
                    <textarea
                      name="notes" value={formData.notes} onChange={handleChange}
                      rows={2}
                      className={`${inputClass('notes')} pl-10 resize-none`}
                      placeholder="Any special notes about this customer"
                    />
                  </div>
                  {fieldErrors.notes && <p className="text-red-500 text-xs mt-1">{fieldErrors.notes}</p>}
                </div>
              </div>
            </div>

            {/* ─── Section: Communication Preferences ─── */}
            <div className="pt-5 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <RiShieldCheckLine className="text-[#E91E63] text-base" />
                <h3 className="text-[14px] font-bold text-gray-800 dark:text-white">Communication Preferences</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Promotional */}
                <div className="bg-gray-50/60 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5 p-4">
                  <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Promotions</p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { name: 'sms_opt_in', label: 'SMS', icon: RiMessage3Line },
                      { name: 'email_opt_in', label: 'Email', icon: RiMailLine },
                      { name: 'whatsapp_opt_in', label: 'WhatsApp', icon: RiWhatsappLine },
                    ].map(({ name, label, icon: Icon }) => (
                      <label
                        key={name}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer transition-all text-[13px] font-semibold ${
                          formData[name]
                            ? 'border-[#E91E63] bg-[#E91E63]/5 text-[#E91E63] dark:bg-[#E91E63]/10'
                            : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                        }`}
                      >
                        <input
                          type="checkbox" name={name} checked={formData[name]} onChange={handleChange}
                          className="hidden"
                        />
                        <Icon className="text-sm" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Transactional */}
                <div className="bg-gray-50/60 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5 p-4">
                  <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Transactional</p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: 'SMS', icon: RiMessage3Line },
                      { label: 'Email', icon: RiMailLine },
                      { label: 'WhatsApp', icon: RiWhatsappLine },
                    ].map(({ label, icon: Icon }) => (
                      <label
                        key={`txn_${label}`}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E91E63] bg-[#E91E63]/5 text-[#E91E63] dark:bg-[#E91E63]/10 text-[13px] font-semibold cursor-pointer"
                      >
                        <input type="checkbox" defaultChecked className="hidden" />
                        <Icon className="text-sm" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              MODAL FOOTER
             ══════════════════════════════════════════════════════════ */}
          <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01] shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-[14px] font-bold shadow-lg shadow-[#E91E63]/25 hover:shadow-[#E91E63]/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RiSaveLine className="text-base" />
              {loading ? 'Saving...' : isEditing ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
