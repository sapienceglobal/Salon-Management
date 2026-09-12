'use client';

import {  useState, useEffect  } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { RiCloseLine } from 'react-icons/ri';
import api from '@/lib/api';

export default function CategoryFormModal({ isOpen, onClose, onSuccess, initialData }) {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [error, setError] = useState('');

  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
        });
      } else {
        setFormData({ name: '', description: '' });
      }
      setError('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        await api.put(`/services/categories/${initialData.id}`, formData);
      } else {
        await api.post('/services/categories', formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={handleClose}>
      <div className="bg-admin-card w-full max-w-md rounded-2xl border border-admin-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border bg-admin-surface/50">
          <h2 className="text-lg font-bold">{isEditing ? 'Edit Category' : 'Add Category'}</h2>
          <button onClick={handleClose} className="text-admin-text-secondary hover:text-admin-text p-1 rounded-md hover:bg-admin-surface-light transition-colors">
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Category Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors"
                placeholder="e.g., Haircut & Styling"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors resize-none"
                placeholder="Brief description of services in this category"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface-light transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors shadow-lg shadow-brand/20 disabled:opacity-50 min-w-[120px]"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </form>
            </div>
    </div>,
    document.body
  );
}
