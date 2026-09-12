'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import { RiCloseLine, RiFilter3Line } from 'react-icons/ri';

export default function CustomerFilterDrawer({ isOpen, onClose, currentFilters, onApply }) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const [filters, setFilters] = useState({
    is_active: '',
    gender: '',
    source: ''
  });

  useScrollLock(show);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      setIsClosing(false);
      // Only update filters if we're just opening the drawer
      if (!show) {
        setFilters({
          is_active: currentFilters?.is_active || '',
          gender: currentFilters?.gender || '',
          source: currentFilters?.source || ''
        });
      }
    } else if (show) {
      setIsClosing(true);
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, show, currentFilters]);

  if (!show || !mounted) return null;

  const handleClose = () => {
    onClose();
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({ is_active: '', gender: '', source: '' });
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex justify-end ${isClosing ? 'animate-[fadeOut_0.3s_ease_forwards]' : 'animate-[fadeIn_0.3s_ease_forwards]'}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      
      <div className={`relative w-full max-w-md bg-admin-surface h-full shadow-2xl flex flex-col ${isClosing ? 'animate-[slideRight_0.3s_ease_forwards]' : 'animate-[slideLeft_0.3s_ease_forwards]'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-admin-border bg-admin-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-xl">
              <RiFilter3Line />
            </div>
            <div>
              <h2 className="text-xl font-bold text-admin-text">Filters</h2>
              <p className="text-xs text-admin-text-secondary">Narrow down your customers list</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-admin-surface-light text-admin-text-secondary hover:text-admin-text transition-colors"
          >
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-admin-surface-light">
          
          {/* Status */}
          <div className="bg-admin-card p-5 rounded-2xl border border-admin-border shadow-sm">
            <label className="block text-sm font-bold text-admin-text mb-3">Status</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'All Statuses', value: '' },
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters(prev => ({ ...prev, is_active: opt.value }))}
                  className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border ${
                    filters.is_active === opt.value 
                      ? 'border-brand bg-brand/5 text-brand' 
                      : 'border-admin-border bg-admin-surface-light text-admin-text-secondary hover:border-brand/30 hover:text-admin-text'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div className="bg-admin-card p-5 rounded-2xl border border-admin-border shadow-sm">
            <label className="block text-sm font-bold text-admin-text mb-3">Gender</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'All Genders', value: '' },
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters(prev => ({ ...prev, gender: opt.value }))}
                  className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border ${
                    filters.gender === opt.value 
                      ? 'border-brand bg-brand/5 text-brand' 
                      : 'border-admin-border bg-admin-surface-light text-admin-text-secondary hover:border-brand/30 hover:text-admin-text'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div className="bg-admin-card p-5 rounded-2xl border border-admin-border shadow-sm">
            <label className="block text-sm font-bold text-admin-text mb-3">Acquisition Source</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'All Sources', value: '' },
                { label: 'Walk-in', value: 'walk_in' },
                { label: 'Referral', value: 'referral' },
                { label: 'Online', value: 'online' },
                { label: 'Campaign', value: 'campaign' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters(prev => ({ ...prev, source: opt.value }))}
                  className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border ${
                    filters.source === opt.value 
                      ? 'border-brand bg-brand/5 text-brand' 
                      : 'border-admin-border bg-admin-surface-light text-admin-text-secondary hover:border-brand/30 hover:text-admin-text'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-admin-border bg-admin-card flex gap-4 shrink-0">
          <button 
            onClick={handleReset}
            className="flex-1 py-3 rounded-xl border border-admin-border bg-admin-surface-light hover:bg-admin-surface text-admin-text-secondary hover:text-admin-text font-bold text-sm transition-colors"
          >
            Reset
          </button>
          <button 
            onClick={handleApply}
            className="flex-[2] py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-sm transition-colors shadow-lg shadow-brand/20"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
