'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import { RiCloseLine, RiFilter3Line, RiRefreshLine } from 'react-icons/ri';

export default function CustomerFilterDrawer({ isOpen, onClose, currentFilters, onApply }) {
  const [mounted, setMounted] = useState(false);
  
  const [filters, setFilters] = useState({
    is_active: '',
    gender: '',
    source: ''
  });

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFilters({
        is_active: currentFilters?.is_active || '',
        gender: currentFilters?.gender || '',
        source: currentFilters?.source || ''
      });
    }
  }, [isOpen, currentFilters]);

  if (!isOpen || !mounted) return null;

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({ is_active: '', gender: '', source: '' });
  };

  const filterBtnClass = (active) =>
    `py-2.5 px-4 rounded-xl text-[13px] font-semibold transition-all border cursor-pointer ${
      active
        ? 'border-[#E91E63] bg-[#E91E63]/5 text-[#E91E63] dark:bg-[#E91E63]/10'
        : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-700 dark:hover:text-gray-300'
    }`;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ══════════════════════════════════════════════════════════
            MODAL HEADER
           ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
              <RiFilter3Line />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Filter Customers
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Narrow down your customer list using filters below.
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

        {/* ══════════════════════════════════════════════════════════
            MODAL BODY
           ══════════════════════════════════════════════════════════ */}
        <div className="px-6 sm:px-8 py-6 space-y-5">
          {/* Status */}
          <div className="bg-gray-50/60 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
            <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-3">Status</label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'All', value: '' },
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters(prev => ({ ...prev, is_active: opt.value }))}
                  className={filterBtnClass(filters.is_active === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div className="bg-gray-50/60 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
            <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-3">Gender</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'All', value: '' },
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters(prev => ({ ...prev, gender: opt.value }))}
                  className={filterBtnClass(filters.gender === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div className="bg-gray-50/60 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
            <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-3">Acquisition Source</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { label: 'All', value: '' },
                { label: 'Walk-in', value: 'walk_in' },
                { label: 'Referral', value: 'referral' },
                { label: 'Online', value: 'online' },
                { label: 'Campaign', value: 'campaign' },
                { label: 'Social Media', value: 'social_media' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters(prev => ({ ...prev, source: opt.value }))}
                  className={filterBtnClass(filters.source === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            MODAL FOOTER
           ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <RiRefreshLine className="text-base" /> Reset
          </button>
          <button
            onClick={handleApply}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E91E63] hover:bg-[#D81B60] text-white text-[14px] font-bold shadow-lg shadow-[#E91E63]/25 hover:shadow-[#E91E63]/35 transition-all cursor-pointer"
          >
            <RiFilter3Line className="text-base" /> Apply Filters
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
