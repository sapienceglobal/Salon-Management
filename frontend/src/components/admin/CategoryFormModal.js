'use client';

import { useState, useEffect } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import {
  RiCloseLine,
  RiAddLine,
  RiGridLine,
  RiHandbagLine,
  RiArrowUpDownLine,
  RiScissorsCutLine,
  RiLeafLine,
  RiBrushLine,
  RiPaintBrushLine,
  RiWaterFlashLine,
  RiSparklingLine,
  RiSparkling2Line,
  RiUserSmileLine,
  RiPlantLine,
  RiDropLine,
  RiUserHeartLine,
  RiGlassesLine,
  RiWindyLine,
  RiMenu2Line,
  RiMedicineBottleLine,
  RiHandHeartLine,
  RiFootprintLine,
  RiEyeLine,
  RiMoreFill,
} from 'react-icons/ri';
import api from '@/lib/api';
import { categorySchema, formatZodErrors } from '@/lib/validations';
import toast from 'react-hot-toast';

// 20 Category Icons matching exact reference UI (2 rows of 10)
export const AVAILABLE_CATEGORY_ICONS = [
  // Row 1 (10 icons)
  { id: 'scissors', label: 'Scissors', icon: RiScissorsCutLine },
  { id: 'leaf', label: 'Skin Care', icon: RiLeafLine },
  { id: 'makeup', label: 'Makeup', icon: RiBrushLine },
  { id: 'nail', label: 'Nails', icon: RiPaintBrushLine },
  { id: 'texture', label: 'Hair Texture', icon: RiWaterFlashLine },
  { id: 'lotus', label: 'Spa & Wellness', icon: RiSparklingLine },
  { id: 'facial', label: 'Facial & Skin', icon: RiUserSmileLine },
  { id: 'rose', label: 'Massage / Rose', icon: RiPlantLine },
  { id: 'drop', label: 'Hair Treatment', icon: RiDropLine },
  { id: 'grid', label: 'Other Services', icon: RiGridLine },
  // Row 2 (10 icons)
  { id: 'beauty', label: 'Beauty Care', icon: RiUserHeartLine },
  { id: 'grooming', label: 'Beard / Men', icon: RiGlassesLine },
  { id: 'dryer', label: 'Blow Dry / Styling', icon: RiWindyLine },
  { id: 'comb', label: 'Hair Styling', icon: RiMenu2Line },
  { id: 'bottles', label: 'Cosmetic Products', icon: RiMedicineBottleLine },
  { id: 'sparkles', label: 'Sparkles', icon: RiSparkling2Line },
  { id: 'wellness', label: 'Hands / Care', icon: RiHandHeartLine },
  { id: 'pedicure', label: 'Pedicure', icon: RiFootprintLine },
  { id: 'lashes', label: 'Eyes & Brows', icon: RiEyeLine },
  { id: 'other', label: 'More', icon: RiMoreFill },
];

export const CATEGORY_ICONS_MAP = AVAILABLE_CATEGORY_ICONS.reduce((acc, curr) => {
  acc[curr.id] = curr.icon;
  return acc;
}, {});

export default function CategoryFormModal({ isOpen, onClose, onSuccess, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'scissors',
    display_order: 1,
  });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          icon: initialData.icon || 'scissors',
          display_order: initialData.sort_order ?? initialData.display_order ?? 1,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          icon: 'scissors',
          display_order: 1,
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
    }, 180);
  };

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    const result = categorySchema.safeParse(formData);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0] || 'Please check the required fields.';
      setError(firstError);
      toast.error(firstError);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        icon: formData.icon || 'scissors',
        display_order: Number(formData.display_order) || 1,
        sort_order: Number(formData.display_order) || 1,
      };

      if (isEditing) {
        await api.put(`/services/categories/${initialData.id}`, payload);
        toast.success('Category updated successfully');
      } else {
        await api.post('/services/categories', payload);
        toast.success('Category created successfully');
      }
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save category';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const SelectedIcon = CATEGORY_ICONS_MAP[formData.icon] || RiScissorsCutLine;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-200 ${
        isClosing ? 'animate-[fadeOut_0.18s_ease_forwards]' : 'animate-[fadeIn_0.18s_ease_forwards]'
      }`}
      onMouseDown={handleClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a2e] w-full max-w-[590px] rounded-3xl border border-gray-100 dark:border-white/10 shadow-2xl p-6 sm:p-7 relative animate-[scaleUp_0.2s_ease_forwards]"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Circular Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-5 top-5 w-7 h-7 rounded-full bg-pink-50/80 dark:bg-pink-950/40 text-[#E91E63] hover:bg-pink-100 dark:hover:bg-pink-900/60 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
          aria-label="Close"
        >
          <RiCloseLine className="text-base font-bold" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-[#E91E63] flex items-center justify-center text-2xl shrink-0 shadow-2xs">
            <RiGridLine />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              {isEditing ? 'Edit Service Category' : 'Add Service Category'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Create a new service category to organize your services.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Row 1: Category Name & Icon Select */}
          <div className="flex items-start gap-4 mb-4">
            {/* Left: Category Name */}
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Category Name <span className="text-[#E91E63]">*</span>
              </label>
              <div
                className={`rounded-xl border bg-white dark:bg-white/5 flex items-center px-3.5 py-2.5 transition-colors shadow-2xs ${
                  fieldErrors.name
                    ? 'border-red-400 focus-within:border-red-500'
                    : 'border-gray-200 dark:border-white/10 focus-within:border-[#E91E63]'
                }`}
              >
                <RiHandbagLine className="text-gray-400 text-base mr-2.5 shrink-0" />
                <input
                  type="text"
                  name="name"
                  maxLength={50}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm text-gray-900 dark:text-white placeholder-gray-400 bg-transparent outline-none font-medium"
                  placeholder="e.g. Hair Care, Skin Care, Makeup"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-between mt-1 px-1">
                {fieldErrors.name ? (
                  <span className="text-xs text-red-500 font-medium">{fieldErrors.name}</span>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400 font-medium">
                  {formData.name?.length || 0}/50
                </span>
              </div>
            </div>

            {/* Right: Selected Icon Display */}
            <div className="w-[125px] sm:w-[135px] shrink-0">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Icon <span className="text-[#E91E63]">*</span>
              </label>
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 flex items-center justify-center px-3.5 py-1.5 shadow-2xs h-[44px] select-none">
                <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-[#E91E63] flex items-center justify-center text-lg shadow-2xs">
                  <SelectedIcon />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Description & Display Order */}
          <div className="flex items-start gap-4 mb-4">
            {/* Left: Description */}
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Description
              </label>
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-3 shadow-2xs focus-within:border-[#E91E63] transition-colors">
                <textarea
                  maxLength={200}
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-sm text-gray-900 dark:text-white placeholder-gray-400 bg-transparent outline-none resize-none h-[58px] font-normal"
                  placeholder="Enter category description (optional)..."
                />
              </div>
              <div className="text-xs text-gray-400 text-right mt-1 px-1 font-medium">
                {formData.description?.length || 0}/200
              </div>
            </div>

            {/* Right: Display Order */}
            <div className="w-[125px] sm:w-[135px] shrink-0">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Display Order
              </label>
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 flex items-center justify-between px-3 shadow-2xs h-[44px] focus-within:border-[#E91E63] transition-colors">
                <RiArrowUpDownLine className="text-gray-400 text-sm shrink-0" />
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-12 text-center text-sm font-bold text-gray-800 dark:text-gray-200 bg-transparent outline-none"
                />
                <div className="flex flex-col gap-0.5 text-gray-400">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        display_order: (prev.display_order || 1) + 1,
                      }))
                    }
                    className="hover:text-gray-700 dark:hover:text-gray-200 text-xs leading-none cursor-pointer"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        display_order: Math.max(1, (prev.display_order || 1) - 1),
                      }))
                    }
                    className="hover:text-gray-700 dark:hover:text-gray-200 text-xs leading-none cursor-pointer"
                  >
                    ▼
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-tight px-0.5">
                Set order in list.
              </p>
            </div>
          </div>

          {/* Row 3: "Choose an Icon" (Grid of 20 icons matching exact UI) */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Choose an Icon
            </label>
            <div className="grid grid-cols-10 gap-2">
              {AVAILABLE_CATEGORY_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = formData.icon === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setFormData({ ...formData, icon: item.id })}
                    title={item.label}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer text-lg ${
                      isSelected
                        ? 'border-2 border-[#E91E63] bg-pink-50/70 dark:bg-pink-950/50 text-[#E91E63] shadow-xs scale-105'
                        : 'bg-[#FFF5F8] dark:bg-white/5 border border-pink-100/60 dark:border-white/5 text-[#E91E63] hover:bg-pink-100/60 dark:hover:bg-white/10 hover:scale-105'
                    }`}
                  >
                    <IconComp />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer (Actions) */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#E91E63] hover:bg-[#D81B60] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#E91E63]/25 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <RiAddLine className="text-base font-bold" />{' '}
              {loading ? 'Saving...' : isEditing ? 'Update Category' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
