'use client';

import { useState, useEffect, useRef } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
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
} from 'react-icons/ri';
import api from '@/lib/api';
import { parseSpecializations, getImageUrl } from '@/lib/utils';
import { staffSchema, formatZodErrors } from '@/lib/validations';
import toast from 'react-hot-toast';

// Curated high-resolution salon staff avatar presets
export const PRESET_STAFF_AVATARS = [
  { id: 'staff_1', name: 'Female Stylist', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face' },
  { id: 'staff_2', name: 'Male Groomer', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face' },
  { id: 'staff_3', name: 'Hair Specialist', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face' },
  { id: 'staff_4', name: 'Master Barber', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face' },
  { id: 'staff_5', name: 'Makeup Artist', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face' },
  { id: 'staff_6', name: 'Color Specialist', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&fit=crop&crop=face' },
  { id: 'staff_7', name: 'Spa Therapist', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face' },
  { id: 'staff_8', name: 'Senior Stylist', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face' },
];

// Specialist icon badges for fallback visual representation
export const PRESET_STAFF_ICONS = [
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

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
    fetchCommissionProfiles();
  }, []);

  const fetchCommissionProfiles = async () => {
    try {
      const res = await api.get('/settings/commission-profiles');
      setCommissionProfiles(res.data || []);
    } catch (err) {
      console.error('Failed to load commission profiles', err);
    }
  };

  // Generate a random secure password for new users
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData((prev) => ({ ...prev, password: pass }));
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          first_name: initialData.first_name || '',
          last_name: initialData.last_name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          role: initialData.role || 'staff',
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
          icon: '',
          staff_color: initialData.color_code || '#E91E63',
          shift_schedule: 'full_time',
        });
        setImagePreview(initialData.avatar_url || '');
        if (initialData.avatar_url?.startsWith('https://images.unsplash.com')) {
          setVisualTab('preset');
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

  const handleSelectPreset = (url) => {
    setSelectedFile(null);
    setImagePreview(url);
    setFormData((prev) => ({ ...prev, avatar_url: url, icon: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectIcon = (iconId, color) => {
    setSelectedFile(null);
    setImagePreview('');
    setFormData((prev) => ({
      ...prev,
      icon: iconId,
      avatar_url: '',
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

    try {
      let userId = initialData?.user_id;

      if (!isEditing) {
        // Step 1: Create the User Account with credentials & optional avatar_url
        const userPayload = {
          email: formData.email.trim(),
          password: formData.password,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone.trim() || undefined,
          role: formData.role,
          avatar_url: formData.avatar_url || undefined,
        };
        const userRes = await api.post('/settings/users', userPayload);
        userId = userRes.data.id;
      }

      // Step 2: Create or Update the Staff Profile
      const specializationsArray = formData.specializations
        ? formData.specializations.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;

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
          await api.put(`/settings/users/${initialData.user_id}`, {
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            phone: formData.phone.trim() || undefined,
            role: formData.role,
            is_active: formData.is_active,
          });
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

          await api.put(`/settings/users/${initialData.user_id}`, {
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            phone: formData.phone.trim() || undefined,
            role: formData.role,
            is_active: formData.is_active,
            avatar_url: formData.avatar_url || null,
          });
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

  const SelectedIconComp = PRESET_STAFF_ICONS.find((i) => i.id === formData.icon)?.icon;

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
              <RiUserStarLine />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {isEditing ? 'Edit Staff Profile' : 'Onboard New Staff'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {isEditing
                  ? 'Update employment details, profile photo, and role permissions.'
                  : 'Add a new salon team member with photo, role, and employment details.'}
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
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Email Address <span className="text-[#E91E63]">*</span>
                    </label>
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

                {/* Row 3: System Role & Designation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      System Role <span className="text-[#E91E63]">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className={`w-full bg-white dark:bg-[#121224] border rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all cursor-pointer font-medium ${
                        fieldErrors.role ? 'border-red-500' : 'border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <option value="staff">Staff (Service Provider)</option>
                      <option value="receptionist">Receptionist (Front Desk)</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                    {fieldErrors.role && (
                      <p className="text-red-500 text-xs font-medium mt-1">{fieldErrors.role}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Senior Hair Stylist, Esthetician"
                      className="w-full bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all font-medium"
                    />
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

                {/* Row 5: Specializations & Commission Profile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Specializations
                    </label>
                    <input
                      type="text"
                      value={formData.specializations}
                      onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                      placeholder="Hair Cut, Keratin, Makeup"
                      className="w-full bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#E91E63] font-medium"
                    />
                    <p className="text-xs text-gray-400 mt-1">Separate by commas</p>
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
                  </div>
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

                {/* Row 7: Temporary Password (New Staff Only) */}
                {!isEditing && (
                  <div className="bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Generated Temporary Password
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
                      <input
                        type="text"
                        readOnly
                        value={formData.password}
                        className="flex-1 bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-gray-900 dark:text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="border border-[#E91E63] text-[#E91E63] hover:bg-pink-50 dark:hover:bg-pink-950/40 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {copied ? <RiCheckLine className="text-base text-emerald-600" /> : <RiFileCopyLine className="text-base" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                      <RiInformationLine className="text-sm shrink-0" />
                      Staff will use this password for their initial login.
                    </p>
                  </div>
                )}

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

                    {/* Mode Selector Tabs (Upload / Presets / Avatars) */}
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
                        onClick={() => setVisualTab('avatar')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          visualTab === 'avatar'
                            ? 'bg-white dark:bg-[#121224] text-gray-900 dark:text-white shadow-xs'
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                        }`}
                      >
                        Avatars
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
                  ) : formData.icon ? (
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
                            {PRESET_STAFF_ICONS.find((i) => i.id === formData.icon)?.name || 'Role Avatar'}
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

                  {/* Preset Stylist Photos Grid */}
                  {visualTab === 'preset' && (
                    <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-2">
                        Select a curated staff portrait:
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {PRESET_STAFF_AVATARS.map((preset) => {
                          const isSelected = formData.avatar_url === preset.url;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleSelectPreset(preset.url)}
                              className={`relative rounded-2xl overflow-hidden border-2 p-0.5 transition-all cursor-pointer group ${
                                isSelected
                                  ? 'border-[#E91E63] shadow-md shadow-[#E91E63]/25 scale-105'
                                  : 'border-gray-200 dark:border-white/10 hover:border-pink-300'
                              }`}
                              title={preset.name}
                            >
                              <img
                                src={preset.url}
                                alt={preset.name}
                                className="w-full h-14 object-cover rounded-xl"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-[#E91E63]/40 flex items-center justify-center text-white rounded-xl">
                                  <RiCheckLine className="text-lg font-bold" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Stylized Avatars Grid */}
                  {visualTab === 'avatar' && (
                    <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-2">
                        Select a specialist role avatar:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {PRESET_STAFF_ICONS.map((item) => {
                          const IconC = item.icon;
                          const isSelected = formData.icon === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectIcon(item.id, item.color)}
                              className={`h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-[#E91E63] text-white border-[#E91E63] shadow-md shadow-[#E91E63]/25 scale-105'
                                  : 'bg-white dark:bg-[#121224] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-pink-300 hover:text-[#E91E63]'
                              }`}
                              title={item.name}
                            >
                              <IconC className="text-xl" />
                              <span className="text-[10px] font-semibold truncate px-1">{item.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card 2: Additional Preferences & Calendar Badge */}
                <div className="bg-gray-50/70 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950/50 text-[#E91E63] flex items-center justify-center text-lg shrink-0">
                      <RiSettings4Line />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">Additional Preferences</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Calendar badge & scheduling preferences.</p>
                    </div>
                  </div>

                  {/* Calendar Badge Color */}
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Calendar Color</label>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1.5 bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-2.5 py-1">
                        <input
                          type="color"
                          value={formData.staff_color}
                          onChange={(e) => setFormData({ ...formData, staff_color: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={formData.staff_color}
                          onChange={(e) => setFormData({ ...formData, staff_color: e.target.value })}
                          className="w-18 bg-transparent border-0 text-sm font-mono font-semibold text-gray-800 dark:text-gray-200 outline-none uppercase"
                        />
                      </div>
                      <RiInformationLine className="text-gray-400 text-sm" title="Color badge in appointment schedule grid" />
                    </div>
                  </div>

                  {/* Shift Schedule */}
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Working Shift</label>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={formData.shift_schedule}
                        onChange={(e) => setFormData({ ...formData, shift_schedule: e.target.value })}
                        className="bg-white dark:bg-[#121224] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[#E91E63] cursor-pointer font-medium"
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
          </div>

          {/* ========================================================
              MODAL FOOTER (Action Buttons)
             ======================================================== */}
          <div className="px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-3">
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
