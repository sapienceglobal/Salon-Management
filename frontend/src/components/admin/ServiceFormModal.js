'use client';

import {  useState, useEffect  } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { RiCloseLine } from 'react-icons/ri';
import api from '@/lib/api';

export default function ServiceFormModal({ isOpen, onClose, onSuccess, initialData, categories }) {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    duration_minutes: 30,
    price: '',
    cost_price: '',
    tax_percentage: 0,
    gender_target: 'unisex',
    is_active: true
  });
  
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
          category_id: initialData.category_id || '',
          description: initialData.description || '',
          duration_minutes: initialData.duration_minutes || 30,
          price: initialData.price || '',
          cost_price: initialData.cost_price || '',
          tax_percentage: initialData.tax_percentage || 0,
          gender_target: initialData.gender_target || 'unisex',
          is_active: initialData.is_active !== false,
        });
      } else {
        setFormData({
          name: '',
          category_id: categories.length > 0 ? categories[0].id : '',
          description: '',
          duration_minutes: 30,
          price: '',
          cost_price: '',
          tax_percentage: 0,
          gender_target: 'unisex',
          is_active: true
        });
      }
      setError('');
    }
  }, [isOpen, initialData, categories]);

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
      const payload = {
        ...formData,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        duration_minutes: Number(formData.duration_minutes),
        price: Number(formData.price),
        cost_price: formData.cost_price ? Number(formData.cost_price) : undefined,
        tax_percentage: formData.tax_percentage ? Number(formData.tax_percentage) : 0,
      };

      if (isEditing) {
        await api.put(`/services/${initialData.id}`, payload);
      } else {
        await api.post('/services', payload);
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
      <div 
        className={`bg-admin-card text-admin-text w-full max-w-lg h-full border-l border-admin-border shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-admin-border bg-admin-surface/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold">{isEditing ? 'Edit Service' : 'Add New Service'}</h2>
            <p className="text-sm text-admin-text-secondary mt-1">
              {isEditing ? 'Update existing service details.' : 'Create a new service offering for your salon.'}
            </p>
          </div>
          <button onClick={handleClose} className="text-admin-text-secondary hover:text-admin-text p-2 rounded-md hover:bg-admin-surface-light transition-colors">
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6">
          <form id="service-form" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm rounded-lg">
                {error}
              </div>
            )}

            {/* Row: Name & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Service Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors"
                  placeholder="e.g., Premium Haircut"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Category *</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors"
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row: Price & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Duration (Mins) *</label>
                <select
                  required
                  value={formData.duration_minutes}
                  onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                  className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={90}>1.5 Hours</option>
                  <option value={120}>2 Hours</option>
                  <option value={150}>2.5 Hours</option>
                  <option value={180}>3 Hours</option>
                </select>
              </div>
            </div>

            {/* Row: Cost Price & Tax */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Cost Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                  className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors"
                  placeholder="Internal cost"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Tax (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.tax_percentage}
                  onChange={e => setFormData({ ...formData, tax_percentage: e.target.value })}
                  className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Row: Gender Target */}
            <div>
              <label className="block text-sm font-medium text-admin-text-secondary mb-2">Gender Target</label>
              <div className="flex items-center gap-4">
                {['unisex', 'female', 'male'].map((target) => (
                  <label key={target} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="gender_target"
                      value={target}
                      checked={formData.gender_target === target}
                      onChange={(e) => setFormData({ ...formData, gender_target: e.target.value })}
                      className="hidden"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      formData.gender_target === target ? 'border-brand bg-brand' : 'border-admin-border-light group-hover:border-brand'
                    }`}>
                      {formData.gender_target === target && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                    <span className="text-sm capitalize">{target}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors resize-none"
                placeholder="What does this service include?"
              />
            </div>

            {/* Active Status Toggle (Edit only) */}
            {isEditing && (
              <div className="flex items-center justify-between p-4 bg-admin-surface-light rounded-lg border border-admin-border">
                <div>
                  <div className="text-sm font-medium">Active Status</div>
                  <div className="text-xs text-admin-text-muted mt-0.5">Inactive services won't appear in bookings.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-admin-surface rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-green"></div>
                </label>
              </div>
            )}
            {/* Footer Buttons attached directly inside the form to avoid excessive empty space */}
            <div className="pt-4 mt-2 border-t border-admin-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface-light transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-brand text-white px-8 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors shadow-lg shadow-brand/20 disabled:opacity-50"
              >
                {loading ? 'Saving...' : isEditing ? 'Update Service' : 'Save Service'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
