import { useState, useEffect } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { RiCloseLine, RiImageAddLine, RiAddLine, RiDeleteBin7Line } from 'react-icons/ri';
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
    image: null,
    items: [], // { service_id, quantity }
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');

  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          total_price: initialData.total_price || '',
          validity_days: initialData.validity_days || '',
          max_uses: initialData.max_uses || '',
          tax_percentage: initialData.tax_percentage || '18',
          image: initialData.image || null,
          items: initialData.items?.map(i => ({ service_id: i.service_id, quantity: i.quantity })) || [],
        });
      } else {
        setFormData({
          name: '', description: '', total_price: '', validity_days: '', max_uses: '', tax_percentage: '18', image: null, items: [],
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
    }, 200);
  };

  if (!isOpen || !mounted) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        name: formData.name,
        description: formData.description,
        total_price: formData.total_price ? parseFloat(formData.total_price) : undefined,
        validity_days: formData.validity_days ? parseInt(formData.validity_days) : undefined,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined,
        tax_percentage: formData.tax_percentage ? parseFloat(formData.tax_percentage) : undefined,
        items: formData.items.filter(i => i.service_id).map(i => ({
          service_id: parseInt(i.service_id),
          quantity: parseInt(i.quantity) || 1
        }))
      };

      const result = packageSchema.safeParse(payload);
      if (!result.success) {
        setFieldErrors(formatZodErrors(result.error));
        setLoading(false);
        return;
      }

      if (initialData) {
        await api.put(`/catalog/packages/${initialData.id}`, payload);
        toast.success('Package updated');
      } else {
        await api.post('/catalog/packages', payload);
        toast.success('Package created');
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save package');
      toast.error(err.response?.data?.message || 'Failed to save package');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={handleClose}>
      <div 
        className={`bg-admin-card text-admin-text w-full max-w-xl h-full border-l border-admin-border shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        
        <div className="flex items-center justify-between p-6 border-b border-admin-border bg-admin-surface/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold font-heading">{initialData ? 'Edit Package' : 'New Package'}</h2>
            <p className="text-sm text-admin-text-secondary mt-1">Configure your bundled service package.</p>
          </div>
          <button onClick={handleClose} className="p-2 text-admin-text-muted hover:text-admin-text transition-colors rounded-lg hover:bg-admin-surface-light">
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        <form id="packageForm" onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="space-y-6">
            
            {error && <div className="text-sm text-accent-red font-medium p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg">{error}</div>}
            
            {/* Image Upload Area */}
            <div className="flex justify-center mb-4">
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-admin-border-light flex flex-col items-center justify-center text-admin-text-muted hover:bg-admin-surface-light hover:border-brand/50 transition-all cursor-pointer group">
                <RiImageAddLine className="text-3xl mb-2 group-hover:text-brand transition-colors" />
                <span className="text-xs font-semibold">Upload Image</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1.5">Package Name <span className="text-accent-red">*</span></label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange} required
                  placeholder="e.g. Bridal Glow Package"
                  className={`w-full px-4 py-2.5 bg-admin-surface-light border rounded-xl focus:outline-none focus:ring-1 ${fieldErrors.name ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-admin-border focus:border-brand focus:ring-brand'}`}
                />
                {fieldErrors.name && <p className="text-accent-red text-xs mt-1">{fieldErrors.name}</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1.5">Description</label>
                <textarea
                  name="description" value={formData.description} onChange={handleChange} rows={3}
                  placeholder="Describe what's included..."
                  className={`w-full px-4 py-2.5 bg-admin-surface-light border rounded-xl focus:outline-none focus:ring-1 resize-none ${fieldErrors.description ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-admin-border focus:border-brand focus:ring-brand'}`}
                />
                {fieldErrors.description && <p className="text-accent-red text-xs mt-1">{fieldErrors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Total Price (₹) <span className="text-accent-red">*</span></label>
                <input
                  type="number" name="total_price" value={formData.total_price} onChange={handleChange} required min="0" step="0.01"
                  className={`w-full px-4 py-2.5 bg-admin-surface-light border rounded-xl focus:outline-none focus:ring-1 ${fieldErrors.total_price ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-admin-border focus:border-brand focus:ring-brand'}`}
                />
                {fieldErrors.total_price && <p className="text-accent-red text-xs mt-1">{fieldErrors.total_price}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Tax (%)</label>
                <input
                  type="number" name="tax_percentage" value={formData.tax_percentage} onChange={handleChange} min="0" max="100"
                  className={`w-full px-4 py-2.5 bg-admin-surface-light border rounded-xl focus:outline-none focus:ring-1 ${fieldErrors.tax_percentage ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-admin-border focus:border-brand focus:ring-brand'}`}
                />
                {fieldErrors.tax_percentage && <p className="text-accent-red text-xs mt-1">{fieldErrors.tax_percentage}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Validity (Days)</label>
                <input
                  type="number" name="validity_days" value={formData.validity_days} onChange={handleChange} min="1"
                  placeholder="Leave empty for lifetime"
                  className={`w-full px-4 py-2.5 bg-admin-surface-light border rounded-xl focus:outline-none focus:ring-1 ${fieldErrors.validity_days ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-admin-border focus:border-brand focus:ring-brand'}`}
                />
                {fieldErrors.validity_days && <p className="text-accent-red text-xs mt-1">{fieldErrors.validity_days}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Max Uses</label>
                <input
                  type="number" name="max_uses" value={formData.max_uses} onChange={handleChange} min="1"
                  placeholder="Leave empty for unlimited"
                  className={`w-full px-4 py-2.5 bg-admin-surface-light border rounded-xl focus:outline-none focus:ring-1 ${fieldErrors.max_uses ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/20' : 'border-admin-border focus:border-brand focus:ring-brand'}`}
                />
                {fieldErrors.max_uses && <p className="text-accent-red text-xs mt-1">{fieldErrors.max_uses}</p>}
              </div>
            </div>

            <hr className="border-admin-border" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold">Included Services</label>
                <button type="button" onClick={handleAddItem} className="text-xs font-semibold text-brand flex items-center gap-1 hover:underline">
                  <RiAddLine /> Add Service
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center p-4 border border-dashed border-admin-border-light rounded-xl text-admin-text-muted text-sm">
                  No services added. Click 'Add Service' to include items.
                </div>
              ) : (
                <div className="space-y-3">
                  {fieldErrors.items && <p className="text-accent-red text-xs mb-2 font-medium">{fieldErrors.items}</p>}
                  {formData.items.map((item, index) => (
                    <div key={index}>
                      <div className={`flex items-center gap-3 bg-admin-surface-light p-3 rounded-xl border ${fieldErrors[`items.${index}.service_id`] || fieldErrors[`items.${index}.quantity`] ? 'border-accent-red' : 'border-admin-border'}`}>
                        <div className="flex-1">
                          <select
                            value={item.service_id}
                            onChange={(e) => handleItemChange(index, 'service_id', e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 font-medium"
                          >
                            <option value="" className="bg-admin-surface text-admin-text">Select Service...</option>
                            {services.map(s => (
                              <option key={s.id} value={s.id} className="bg-admin-surface text-admin-text">{s.name} (₹{s.price})</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <input
                            type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} min="1"
                            placeholder="Qty"
                            className="w-full px-3 py-1.5 bg-admin-card border border-admin-border rounded-lg text-sm text-admin-text focus:outline-none focus:border-brand text-center"
                          />
                        </div>
                        <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-admin-text-muted hover:text-accent-red transition-colors">
                          <RiDeleteBin7Line />
                        </button>
                      </div>
                      {(fieldErrors[`items.${index}.service_id`] || fieldErrors[`items.${index}.quantity`]) && 
                        <p className="text-accent-red text-xs mt-1">{fieldErrors[`items.${index}.service_id`] || fieldErrors[`items.${index}.quantity`]}</p>
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>

            </div>
          </div>

          <div className="p-6 border-t border-admin-border bg-admin-surface/90 backdrop-blur-sm flex gap-3 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-admin-card text-admin-text border border-admin-border hover:bg-admin-surface-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-brand text-white hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm shadow-brand/20"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
              {initialData ? 'Save Changes' : 'Create Package'}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
