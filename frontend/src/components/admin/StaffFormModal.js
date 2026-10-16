'use client';
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  RiCloseLine,
  RiFileCopyLine,
  RiCheckLine,
  RiInformationLine,
  RiImageAddLine,
  RiImageLine,
  RiUserStarLine,
  RiUserAddLine,
  RiPhoneLine,
  RiMailLine,
  RiSettings4Line,
  RiSaveLine,
  RiScissors2Line,
  RiBrushLine,
  RiMagicLine,
  RiSparklingLine,
  RiStarSmileLine,
  RiCalendarLine,
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
  RiPaletteLine,
  RiUserSettingsLine,
  RiExternalLinkLine,
  RiShieldStarLine,
} from 'react-icons/ri';
import { MdFace2, MdFace6 } from 'react-icons/md';
import api from '@/lib/api';
import { parseSpecializations, getImageUrl } from '@/lib/utils';
import { staffSchema, formatZodErrors } from '@/lib/validations';
import toast from 'react-hot-toast';

// Curated high-resolution salon staff avatar presets (deprecated in favor of clean stylized avatars)
export const PRESET_STAFF_AVATARS = [];

// Industry-standard Salon Designation Presets for quick selection
export const DESIGNATION_PRESETS = [
  'Senior Hair Stylist',
  'Hair Stylist',
  'Color Specialist',
  'Makeup Artist',
  'Nail Technician',
  'Beautician',
  'Spa Therapist',
  'Barber',
  'Salon Assistant',
];

// Curated Calendar Schedule Highlights
export const CALENDAR_COLORS = [
  { label: 'Signature Pink', hex: '#E91E63' },
  { label: 'Rose Red', hex: '#F43F5E' },
  { label: 'Vibrant Purple', hex: '#8B5CF6' },
  { label: 'Indigo Blue', hex: '#6366F1' },
  { label: 'Ocean Sky', hex: '#0EA5E9' },
  { label: 'Teal Mint', hex: '#14B8A6' },
  { label: 'Emerald Green', hex: '#10B981' },
  { label: 'Warm Amber', hex: '#F59E0B' },
];

// Specialist icon badges for fallback visual representation
export const PRESET_STAFF_ICONS = [
  { id: 'icon_female', name: 'Female (DP)', icon: MdFace2, color: '#EC4899' },
  { id: 'icon_male', name: 'Male (DP)', icon: MdFace6, color: '#3B82F6' },
  { id: 'icon_scissors', name: 'Hair Specialist', icon: RiScissors2Line, color: '#E91E63' },
  { id: 'icon_brush', name: 'Makeup Artist', icon: RiBrushLine, color: '#9C27B0' },
  { id: 'icon_magic', name: 'Color Expert', icon: RiMagicLine, color: '#3F51B5' },
  { id: 'icon_spa', name: 'Spa Therapist', icon: RiSparklingLine, color: '#009688' },
  { id: 'icon_star', name: 'Top Stylist', icon: RiStarSmileLine, color: '#F59E0B' },
  { id: 'icon_manager', name: 'Manager / Front Desk', icon: RiUserStarLine, color: '#10B981' },
];

export default function StaffFormModal({ isOpen, onClose, onSuccess, initialData }) {
  const isEditing = !!initialData;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    // User Account
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'staff',
    password: '',
    enable_login: false,

    // Staff Profile
    designation: '',
    salary: '',
    joining_date: new Date().toISOString().split('T')[0],
    specializations: '',
    commission_profile_id: '',
    bio: '',
    is_active: true,
    online_booking: true,
    can_take_walkins: true,
    display_on_team: true,

    // Visuals & Settings
    avatar_url: '',
    icon: '',
    staff_color: '#E91E63',
    shift_schedule: 'full_time',
  });

  const [visualTab, setVisualTab] = useState('upload'); // 'upload' | 'preset' | 'avatar'
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [commissionProfiles, setCommissionProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useScrollLock(isOpen);

  const fetchCommissionProfiles = useCallback(async () => {
    try {
      const res = await api.get('/settings/commission-profiles');
      setCommissionProfiles(res.data || []);
    } catch (err) {
      console.error('Failed to load commission profiles', err);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchCommissionProfiles();
  }, [fetchCommissionProfiles]);

  // Generate a random secure password for staff accounts
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let pass = 'Stf@';
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData((prev) => ({ ...prev, password: pass }));
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const hasLogin = !!(initialData.role && ['admin', 'manager', 'receptionist'].includes(initialData.role)) || 
          (!!initialData.email && !initialData.email.includes('@internal.salon'));

        setFormData({
          first_name: initialData.first_name || '',
          last_name: initialData.last_name || '',
          email: initialData.email && !initialData.email.includes('@internal.salon') ? initialData.email : '',
          phone: initialData.phone || '',
          role: initialData.role || 'staff',
          enable_login: hasLogin,
          designation: initialData.designation || '',
          salary: initialData.salary ? String(initialData.salary) : '',
          joining_date: initialData.joining_date ? initialData.joining_date.split('T')[0] : '',
          specializations: initialData.specializations ? parseSpecializations(initialData.specializations).join(', ') : '',
          commission_profile_id: initialData.commission_profile_id ? String(initialData.commission_profile_id) : '',
          bio: initialData.bio || '',
          password: '',
          is_active: initialData.is_active !== false,
          online_booking: true,
          can_take_walkins: true,
          display_on_team: true,
          avatar_url: initialData.avatar_url || '',
          icon: initialData.avatar_url?.startsWith('icon:') ? initialData.avatar_url.replace('icon:', '') : '',
          staff_color: initialData.color_code || '#E91E63',
          shift_schedule: 'full_time',
        });
        setShowPassword(false);
        const av = initialData.avatar_url || '';
        const isIcon = av.startsWith('icon:');
        setImagePreview(isIcon ? '' : av);
        if (isIcon) {
          setVisualTab('avatar');
        } else {
          setVisualTab('upload');
        }
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          role: 'staff',
          password: '',
          enable_login: false,
          designation: '',
          salary: '',
          joining_date: new Date().toISOString().split('T')[0],
          specializations: '',
          commission_profile_id: '',
          bio: '',
          is_active: true,
          online_booking: true,
          can_take_walkins: true,
          display_on_team: true,
          avatar_url: '',
          icon: '',
          staff_color: '#E91E63',
          shift_schedule: 'full_time',
        });
        generatePassword();
        setShowPassword(false);
        setImagePreview('');
        setVisualTab('upload');
      }
      setSelectedFile(null);
      setError('');
      setFieldErrors({});
      setCopied(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen || !mounted) return null;

  const copyToClipboard = () => {
    if (!formData.password) return;
    navigator.clipboard.writeText(formData.password);
    setCopied(true);
    toast.success('Temporary password copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Image Upload Handlers
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, JPEG)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be under 2 MB');
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, avatar_url: '', icon: '' }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, JPEG)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be under 2 MB');
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, avatar_url: '', icon: '' }));
  };



  const handleSelectIcon = (iconId, color) => {
    setSelectedFile(null);
    setImagePreview('');
    setFormData((prev) => ({
      ...prev,
      icon: iconId,
      avatar_url: `icon:${iconId}`,
      staff_color: color || prev.staff_color,
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveVisual = () => {
    setSelectedFile(null);
    setImagePreview('');
    setFormData((prev) => ({ ...prev, avatar_url: '', icon: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    const validationData = {
      ...formData,
      salary: formData.salary ? String(formData.salary) : '',
      commission_profile_id: formData.commission_profile_id ? String(formData.commission_profile_id) : '',
    };

    const result = staffSchema.safeParse(validationData);
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      setLoading(false);
      return;
    }

    // If login is enabled, email is required
    if (formData.enable_login && !formData.email?.trim()) {
      setFieldErrors({ email: 'Email address is required for salon software login access' });
      setLoading(false);
      return;
    }

    try {
      let userId = initialData?.user_id;

      if (!isEditing) {
        // Step 1: Create the User Account with credentials & optional avatar_url
        // If no email entered for pure service provider, create a unique internal dummy email
        const userEmail = formData.email?.trim() || `staff.${Date.now()}.${Math.floor(Math.random() * 1000)}@internal.salon`;
        const userPassword = (formData.enable_login && formData.password?.trim()) 
          ? formData.password.trim() 
          : ('Stf@' + Math.random().toString(36).slice(-8) + '9!');
        const userRole = formData.enable_login ? (formData.role || 'staff') : 'staff';

        const userPayload = {
          email: userEmail,
          password: userPassword,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone?.trim() || undefined,
          role: userRole,
          avatar_url: formData.avatar_url || undefined,
        };
        const userRes = await api.post('/settings/users', userPayload);
        userId = userRes.data.id;
      }

      // Step 2: Create or Update the Staff Profile
      const specializationsArray = formData.specializations
        ? formData.specializations.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;

      const userRole = formData.enable_login ? (formData.role || 'staff') : 'staff';

      if (selectedFile) {
        // If an image file was selected from computer, send via FormData
        const formDataPayload = new FormData();
        if (!isEditing) {
          formDataPayload.append('user_id', String(userId));
        }
        if (formData.designation) formDataPayload.append('designation', formData.designation.trim());
        if (formData.joining_date) formDataPayload.append('joining_date', formData.joining_date);
        if (formData.salary) formDataPayload.append('salary', String(formData.salary));
        if (formData.commission_profile_id) {
          formDataPayload.append('commission_profile_id', String(formData.commission_profile_id));
        }
        if (specializationsArray && specializationsArray.length > 0) {
          formDataPayload.append('specializations', JSON.stringify(specializationsArray));
        }
        if (formData.bio) formDataPayload.append('bio', formData.bio.trim());
        formDataPayload.append('is_active', String(formData.is_active));
        if (formData.staff_color) formDataPayload.append('color_code', formData.staff_color);
        if (formData.shift_schedule) formDataPayload.append('shift_schedule', formData.shift_schedule);
        formDataPayload.append('image', selectedFile);

        if (isEditing) {
          await api.put(`/staff/${initialData.id}`, formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          // Also update base user profile
          const userUpdate = {
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            phone: formData.phone?.trim() || undefined,
            role: userRole,
            is_active: formData.is_active,
          };
          if (formData.enable_login && formData.password?.trim() && formData.password.trim().length >= 8) {
            userUpdate.password = formData.password.trim();
          }
          await api.put(`/settings/users/${initialData.user_id}`, userUpdate);
        } else {
          await api.post('/staff', formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      } else {
        // JSON payload when using preset URL, avatar icon, or existing image
        const staffPayload = {
          user_id: userId,
          designation: formData.designation.trim() || undefined,
          joining_date: formData.joining_date || undefined,
          salary: formData.salary ? parseFloat(formData.salary) : undefined,
          commission_profile_id: formData.commission_profile_id ? parseInt(formData.commission_profile_id, 10) : undefined,
          specializations: specializationsArray,
          bio: formData.bio.trim() || undefined,
          is_active: formData.is_active,
          avatar_url: formData.avatar_url || null,
          color_code: formData.staff_color || '#E91E63',
          shift_schedule: formData.shift_schedule || 'full_time',
        };

        if (isEditing) {
          await api.put(`/staff/${initialData.id}`, staffPayload);

          const userUpdate = {
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            phone: formData.phone?.trim() || undefined,
            role: userRole,
            is_active: formData.is_active,
            avatar_url: formData.avatar_url || null,
          };
          if (formData.enable_login && formData.password?.trim() && formData.password.trim().length >= 8) {
            userUpdate.password = formData.password.trim();
          }
          await api.put(`/settings/users/${initialData.user_id}`, userUpdate);
        } else {
          await api.post('/staff', staffPayload);
        }
      }

      toast.success(isEditing ? 'Staff profile updated successfully!' : 'Staff member onboarded successfully!');
      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const effectiveStaffIcon = formData.icon || (formData.avatar_url?.startsWith('icon:') ? formData.avatar_url.replace('icon:', '') : '');
  const SelectedIconComp = PRESET_STAFF_ICONS.find((i) => i.id === effectiveStaffIcon)?.icon;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 md:p-6 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-auto overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ========================================================
            MODAL HEADER
           ======================================================== */}
        <div className="flex items-center justify-between shrink-0 px-5 sm:px-8 py-4 sm:py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
              <RiUserStarLine />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white truncate">
                {isEditing ? 'Edit Staff Profile' : 'Onboard New Staff'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {isEditing
                  ? 'Update employment details, profile photo, and role permissions.'
                  : 'Add a new salon team member with photo, role, and employment details.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        {/* ========================================================
            MODAL BODY (2-COLUMN GRID)
           ======================================================== */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-5 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-sm rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Main Form Inputs */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Row 1: First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      First Name <span className="text-[#E91E63]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="e.g. Sarah"
                      className={`w-full bg-white dark:bg-[#121224] border rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all font-medium ${
                        fieldErrors.first_name ? 'border-red-500' : 'border-gray-200 dark:border-white/10'
                      }`}
                    />
                    {fieldErrors.first_name && (
                      <p className="text-red-500 text-xs font-medium mt-1">{fieldErrors.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Last Name <span className="text-[#E91E63]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="e.g. Jenkins"
                      className={`w-full bg-white dark:bg-[#121224] border rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all font-medium ${
                        fieldErrors.last_name ? 'border-red-500' : 'border-gray-200 dark:border-white/10'
                      }`}
                    />
                    {fieldErrors.last_name && (
                      <p className="text-red-500 text-xs font-medium mt-1">{fieldErrors.last_name}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: Email Address & Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Email Address {formData.enable_login && <span className="text-[#E91E63]">*</span>}
                      </label>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {formData.enable_login ? 'Required for login' : 'Optional for service providers'}
                      </span>
                    </div>
                    <div className="relative">
                      <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                      <input
                        type="email"
                        disabled={isEditing}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="sarah@example.com"
                        className={`w-full bg-white dark:bg-[#121224] border rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all font-medium disabled:opacity-60 ${
                          fieldErrors.email ? 'border-red-500' : 'border-gray-200 dark:border-white/10'
                        }`}
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-red-500 text-xs font-medium mt-1">{fieldErrors.email}</p>
                    )}
                    {isEditing && (
                      <p className="text-xs text-gray-400 mt-1">Email cannot be changed after creation.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <RiPhoneLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className={`w-full bg-white dark:bg-[#121224] border rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all font-medium ${
                          fieldErrors.phone ? 'border-red-500' : 'border-gray-200 dark:border-white/10'
                        }`}
                      />
                    </div>
                    {fieldErrors.phone && (
                      <p className="text-red-500 text-xs font-medium mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Row 3: Salon Role & Commission Profile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Salon Role / Designation <span className="text-[#E91E63]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Senior Hair Stylist, Makeup Artist"
                      className={`w-full bg-white dark:bg-[#121224] border rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all font-medium ${
                        fieldErrors.designation ? 'border-red-500' : 'border-gray-200 dark:border-white/10'
                      }`}
                    />
                    {fieldErrors.designation && (
                      <p className="text-red-500 text-xs font-medium mt-1">{fieldErrors.designation}</p>
                    )}
                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {DESIGNATION_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, designation: preset }))}
                          className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                            formData.designation === preset
                              ? 'bg-[#E91E63]/10 text-[#E91E63] border-[#E91E63]/30 font-semibold'
                              : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200/60 dark:border-white/5 hover:border-gray-300'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Commission Profile
                    </label>
                    <select
                      value={formData.commission_profile_id}
                      onChange={(e) => setFormData({ ...formData, commission_profile_id: e.target.value })}
                      className="w-full bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#E91E63] cursor-pointer font-medium"
                    >
                      <option value="">No Commission</option>
                      {commissionProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name} ({profile.type === 'percentage' ? `${profile.value}%` : `₹${profile.value}`})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-400 mt-2">
                      Automatic earnings calculation on completed services.
                    </p>
                  </div>
                </div>

                {/* Row 4: Base Salary & Joining Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Base Salary (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="e.g. 25000"
                      className="w-full bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Joining Date
                    </label>
                    <div className="relative">
                      <RiCalendarLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                      <input
                        type="date"
                        value={formData.joining_date}
                        onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                        className="w-full bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#E91E63] font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 5: Specializations / Skills */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Specializations &amp; Skills
                  </label>
                  <input
                    type="text"
                    value={formData.specializations}
                    onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                    placeholder="e.g. Hair Cut, Keratin, Balayage, Bridal Makeup, Facials"
                    className="w-full bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] font-medium"
                  />
                  <p className="text-xs text-gray-400 mt-1">Separate skills by commas</p>
                </div>

                {/* Row 6: Bio / Notes */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Bio / Notes</label>
                    <span className="text-xs text-gray-400 font-medium">{formData.bio.length}/500</span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Short bio or internal performance notes..."
                    className="w-full bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all resize-none"
                  />
                </div>

                {/* Row 7: Salon Software & App Access (Login Credentials) */}
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-gray-50/80 to-white dark:from-white/[0.03] dark:to-white/[0.01] p-4 sm:p-5 transition-all">
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-colors ${
                        formData.enable_login 
                          ? 'bg-[#E91E63] text-white shadow-md shadow-[#E91E63]/25' 
                          : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                      }`}>
                        <RiLockPasswordLine />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            Salon Software &amp; App Login Access
                          </h4>
                          {formData.enable_login ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold">
                              Login Enabled
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400 font-semibold">
                              Service Provider Only
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {formData.enable_login
                            ? 'Allows this employee to log in to the salon software or staff app with their credentials.'
                            : 'Service Provider only. Onboard staff for booking & commission without software login credentials.'}
                        </p>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.enable_login}
                      onClick={() => {
                        const next = !formData.enable_login;
                        setFormData((prev) => ({
                          ...prev,
                          enable_login: next,
                          password: next && !prev.password ? generatePassword() : prev.password,
                        }));
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData.enable_login ? 'bg-[#E91E63]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          formData.enable_login ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Expanded Login Details when Toggle is ON */}
                  {formData.enable_login && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/5 space-y-4 animate-[fadeIn_0.2s_ease_forwards]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            Software Role <span className="text-[#E91E63]">*</span>
                          </label>
                          <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#E91E63] font-medium cursor-pointer"
                          >
                            <option value="staff">Staff (Service Provider - My Bookings &amp; Commission)</option>
                            <option value="receptionist">Receptionist (Front Desk - Billing, Appointments &amp; Clients)</option>
                            <option value="manager">Manager (Full Salon Operations &amp; Reports)</option>
                          </select>
                          <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                            <RiInformationLine className="text-xs shrink-0" />
                            Manage full permissions &amp; account locks in{' '}
                            <Link href="/users" className="text-[#E91E63] hover:underline font-semibold" target="_blank">
                              User Management ↗
                            </Link>
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {isEditing ? 'New Password (optional)' : 'Temporary Login Password'}
                              {!isEditing && <span className="text-[#E91E63]"> *</span>}
                            </label>
                            <button
                              type="button"
                              onClick={generatePassword}
                              className="text-xs text-[#E91E63] hover:underline font-semibold cursor-pointer"
                            >
                              Regenerate
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={isEditing ? 'Keep existing password' : 'Password'}
                                className="w-full bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl pl-3.5 pr-9 py-2.5 text-sm font-mono font-bold text-gray-900 dark:text-white outline-none focus:border-[#E91E63]"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                              >
                                {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                              </button>
                            </div>
                            {formData.password && (
                              <button
                                type="button"
                                onClick={copyToClipboard}
                                className="border border-[#E91E63] text-[#E91E63] hover:bg-pink-50 dark:hover:bg-pink-950/40 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                              >
                                {copied ? <RiCheckLine className="text-base text-emerald-600" /> : <RiFileCopyLine className="text-base" />}
                                {copied ? 'Copied' : 'Copy'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 8: 2x2 Toggle Switches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Active Staff */}
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
                      <span className="text-sm font-semibold text-gray-900 dark:text-white block">Active Staff</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block leading-normal mt-0.5">
                        Active staff can log in and take appointments.
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
                        Allow customers to select this staff member online.
                      </span>
                    </div>
                  </div>

                  {/* Walk-in Available */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.can_take_walkins}
                      onClick={() => setFormData({ ...formData, can_take_walkins: !formData.can_take_walkins })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                        formData.can_take_walkins ? 'bg-[#12B76A]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          formData.can_take_walkins ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white block">Walk-in Ready</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block leading-normal mt-0.5">
                        Can be assigned instant walk-in clients at POS.
                      </span>
                    </div>
                  </div>

                  {/* Display on Team Page */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.display_on_team}
                      onClick={() => setFormData({ ...formData, display_on_team: !formData.display_on_team })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                        formData.display_on_team ? 'bg-[#12B76A]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          formData.display_on_team ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white block">Display on Team</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block leading-normal mt-0.5">
                        Showcase on website team and booking showcase.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Staff Photo & Additional Settings */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Card 1: Staff Photo Selection */}
                <div className="bg-gray-50/70 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-[#7F56D9] flex items-center justify-center text-lg shrink-0">
                        <RiImageLine />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Staff Photo</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Upload or select a photo.</p>
                      </div>
                    </div>

                    {/* Mode Selector Tabs (Upload Photo / Avatars) */}
                    <div className="flex items-center bg-gray-200/70 dark:bg-white/10 p-1 rounded-xl text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setVisualTab('upload')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          visualTab === 'upload'
                            ? 'bg-white dark:bg-[#121224] text-gray-900 dark:text-white shadow-xs'
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                        }`}
                      >
                        Upload Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisualTab('avatar')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          visualTab === 'avatar'
                            ? 'bg-white dark:bg-[#121224] text-gray-900 dark:text-white shadow-xs'
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                        }`}
                      >
                        Stylized Avatars
                      </button>
                    </div>
                  </div>

                  {/* Active Visual Preview OR Drag & Drop Zone */}
                  {imagePreview ? (
                    <div className="border border-gray-200 dark:border-white/10 rounded-xl p-3.5 bg-white dark:bg-[#121224] flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getImageUrl(imagePreview)}
                          alt="Staff Preview"
                          className="w-14 h-14 rounded-full object-cover border border-gray-100 dark:border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {selectedFile ? selectedFile.name : 'Selected Staff Photo'}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            Ready for staff profile
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
                  ) : (formData.icon || formData.avatar_url?.startsWith('icon:')) ? (
                    <div className="border border-gray-200 dark:border-white/10 rounded-xl p-3.5 bg-white dark:bg-[#121224] flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          style={{
                            backgroundColor: `${formData.staff_color || '#E91E63'}20`,
                            color: formData.staff_color || '#E91E63',
                            borderColor: `${formData.staff_color || '#E91E63'}40`,
                          }}
                          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 border"
                        >
                          {SelectedIconComp && <SelectedIconComp />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                            {PRESET_STAFF_ICONS.find((i) => i.id === effectiveStaffIcon)?.name || 'Role Avatar'}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">Stylized Avatar Icon</p>
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
                    /* Default Dropzone matching Service Form Modal */
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl py-6 px-4 text-center transition-all bg-white dark:bg-[#121224] flex flex-col items-center justify-center gap-2 relative ${
                        isDragging ? 'border-[#E91E63] bg-pink-50/20' : 'border-blue-200 dark:border-blue-900/40'
                      }`}
                    >
                      <RiImageAddLine className="text-3xl text-blue-400 dark:text-blue-500/70" />
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                        Drag & drop a photo here
                      </p>
                      <span className="text-xs text-gray-400">or</span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-[#E91E63] text-[#E91E63] hover:bg-pink-50 dark:hover:bg-pink-950/30 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Choose Photo
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
                      Recommended: Square portrait (JPG, PNG) &bull; Max file size: 2 MB
                    </p>
                  )}



                  {/* Stylized Avatars Grid */}
                  {visualTab === 'avatar' && (
                    <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-2">
                        Select a staff avatar or specialist role icon:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {PRESET_STAFF_ICONS.map((item) => {
                          const IconC = item.icon;
                          const isSelected = (formData.icon === item.id) || (formData.avatar_url === `icon:${item.id}`);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectIcon(item.id, item.color)}
                              className={`h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-[#E91E63] text-white border-[#E91E63] shadow-md shadow-[#E91E63]/25 scale-105'
                                  : 'bg-white dark:bg-[#121224] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-pink-300 hover:text-[#E91E63]'
                              }`}
                              title={item.name}
                            >
                              <IconC className="text-2xl" />
                              <span className="text-[10px] font-semibold truncate px-1 text-center w-full">{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card 2: Calendar & Shift Settings */}
                <div className="bg-gray-50/70 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950/50 text-[#E91E63] flex items-center justify-center text-lg shrink-0">
                      <RiSettings4Line />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">Calendar &amp; Shift Settings</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Appointment color tag &amp; work schedule.</p>
                    </div>
                  </div>

                  {/* Calendar Badge Color */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Calendar Schedule Color
                      </label>
                      <div className="flex items-center gap-1.5 bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-lg px-2 py-0.5">
                        <input
                          type="color"
                          value={formData.staff_color}
                          onChange={(e) => setFormData({ ...formData, staff_color: e.target.value })}
                          className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span className="text-[11px] font-mono font-bold text-gray-700 dark:text-gray-300 uppercase">
                          {formData.staff_color}
                        </span>
                      </div>
                    </div>
                    {/* Quick Swatches */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {CALENDAR_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          title={c.label}
                          onClick={() => setFormData((prev) => ({ ...prev, staff_color: c.hex }))}
                          className={`w-6 h-6 rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                            formData.staff_color.toLowerCase() === c.hex.toLowerCase()
                              ? 'scale-110 ring-2 ring-offset-2 ring-[#E91E63]'
                              : 'opacity-70 hover:opacity-100 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {formData.staff_color.toLowerCase() === c.hex.toLowerCase() && (
                            <RiCheckLine className="text-white text-xs drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Used to identify this staff member on the booking schedule grid.
                    </p>
                  </div>

                  {/* Shift Schedule */}
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100 dark:border-white/5">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Working Shift</label>
                    <select
                      value={formData.shift_schedule}
                      onChange={(e) => setFormData({ ...formData, shift_schedule: e.target.value })}
                      className="bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-[#E91E63] cursor-pointer font-medium"
                    >
                      <option value="full_time">Full-time (10 AM - 8 PM)</option>
                      <option value="morning">Morning (9 AM - 4 PM)</option>
                      <option value="evening">Evening (1 PM - 9 PM)</option>
                      <option value="flexible">Part-time / Flexible</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              MODAL FOOTER (Action Buttons)
             ======================================================== */}
          <div className="px-5 sm:px-8 py-3.5 sm:py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#E91E63] hover:bg-[#D81B60] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#E91E63]/25 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RiSaveLine className="text-lg" />
              {loading ? 'Processing...' : isEditing ? 'Update Staff' : 'Onboard Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
