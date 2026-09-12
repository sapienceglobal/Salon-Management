'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RiCloseLine, RiImageAddLine } from 'react-icons/ri';
import api from '@/lib/api';
import { useScrollLock } from '@/hooks/useScrollLock';
import { inventorySchema, formatZodErrors } from '@/lib/validations';

export default function AddProductModal({ isOpen, onClose, onSuccess, productToEdit = null }) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useScrollLock(isOpen);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    sku: '',
    barcode: '',
    purchase_price: '',
    selling_price: '',
    stock_quantity: '0',
    min_stock_alert: '5',
    unit: 'piece',
    description: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setFormData({
          name: productToEdit.name || '',
          category: productToEdit.category || '',
          brand: productToEdit.brand || '',
          sku: productToEdit.sku || '',
          barcode: productToEdit.barcode || '',
          purchase_price: productToEdit.purchase_price?.toString() || '',
          selling_price: productToEdit.selling_price?.toString() || '',
          stock_quantity: productToEdit.stock_quantity?.toString() || '0',
          min_stock_alert: productToEdit.min_stock_alert?.toString() || '5',
          unit: productToEdit.unit || 'piece',
          description: productToEdit.description || ''
        });
      } else {
        setFormData({
          name: '', category: '', brand: '', sku: '', barcode: '',
          purchase_price: '', selling_price: '', stock_quantity: '0',
          min_stock_alert: '5', unit: 'piece', description: ''
        });
      }
      setIsClosing(false);
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen, productToEdit]);

  if (!isOpen || !mounted) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const payload = {
      ...formData,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : 0,
      selling_price: parseFloat(formData.selling_price),
      stock_quantity: parseInt(formData.stock_quantity, 10),
      min_stock_alert: parseInt(formData.min_stock_alert, 10)
    };

    // Prepare formData string representation for validation
    const validationPayload = {
      ...formData,
      purchase_price: formData.purchase_price.toString(),
      selling_price: formData.selling_price.toString(),
      stock_quantity: formData.stock_quantity.toString(),
      min_stock_alert: formData.min_stock_alert.toString(),
    };

    const result = inventorySchema.safeParse(validationPayload);
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      setLoading(false);
      return;
    }

    try {

      if (productToEdit) {
        await api.put(`/products/${productToEdit.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to save product:', err);
      setError(err.response?.data?.message || 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className={`fixed inset-0 z-[110] flex justify-end ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div 
        className={`bg-admin-card text-admin-text w-full max-w-lg h-full border-l border-admin-border shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-admin-border bg-admin-surface/50 shrink-0">
          <h2 className="text-xl font-bold">{productToEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={handleClose} className="p-2 hover:bg-admin-surface rounded-full transition-colors text-admin-text-secondary hover:text-admin-text">
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 p-6">
          {error && <div className="p-3 mb-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm">{error}</div>}
          
          <form id="productForm" onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-admin-text-secondary mb-1">Product Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2 bg-admin-surface border rounded-xl focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors ${fieldErrors.name ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`} placeholder="L\'Oréal Professionnel Shampoo" />
              {fieldErrors.name && <p className="text-accent-red text-xs mt-1">{fieldErrors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Category</label>
                <input type="text" name="category" value={formData.category} onChange={handleChange} className={`w-full px-4 py-2 bg-admin-surface border rounded-xl focus:outline-none focus:border-brand transition-colors ${fieldErrors.category ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`} placeholder="e.g. Hair Care" />
                {fieldErrors.category && <p className="text-accent-red text-xs mt-1">{fieldErrors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Brand</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleChange} className={`w-full px-4 py-2 bg-admin-surface border rounded-xl focus:outline-none focus:border-brand transition-colors ${fieldErrors.brand ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`} placeholder="e.g. L\'Oréal" />
                {fieldErrors.brand && <p className="text-accent-red text-xs mt-1">{fieldErrors.brand}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">SKU *</label>
                <input type="text" name="sku" value={formData.sku} onChange={handleChange} className={`w-full px-4 py-2 bg-admin-surface border rounded-xl focus:outline-none focus:border-brand transition-colors ${fieldErrors.sku ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`} placeholder="Stock Keeping Unit" />
                {fieldErrors.sku && <p className="text-accent-red text-xs mt-1">{fieldErrors.sku}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Barcode</label>
                <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className={`w-full px-4 py-2 bg-admin-surface border rounded-xl focus:outline-none focus:border-brand transition-colors ${fieldErrors.barcode ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`} placeholder="Barcode number" />
                {fieldErrors.barcode && <p className="text-accent-red text-xs mt-1">{fieldErrors.barcode}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-admin-border">
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Purchase Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted">₹</span>
                  <input type="number" step="0.01" min="0" name="purchase_price" value={formData.purchase_price} onChange={handleChange} className={`w-full pl-8 pr-4 py-2 bg-admin-surface border rounded-xl focus:outline-none focus:border-brand transition-colors ${fieldErrors.purchase_price ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`} placeholder="0.00" />
                </div>
                {fieldErrors.purchase_price && <p className="text-accent-red text-xs mt-1">{fieldErrors.purchase_price}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Selling Price *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted">₹</span>
                  <input type="number" step="0.01" min="0" name="selling_price" value={formData.selling_price} onChange={handleChange} className={`w-full pl-8 pr-4 py-2 bg-admin-surface border rounded-xl focus:outline-none focus:border-brand transition-colors ${fieldErrors.selling_price ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`} placeholder="0.00" />
                </div>
                {fieldErrors.selling_price && <p className="text-accent-red text-xs mt-1">{fieldErrors.selling_price}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-admin-border">
              {!productToEdit && (
                <div>
                  <label className="block text-sm font-medium text-admin-text-secondary mb-1">Initial Stock</label>
                  <input type="number" min="0" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} className={`w-full px-4 py-2 bg-admin-surface border rounded-xl focus:outline-none focus:border-brand transition-colors ${fieldErrors.stock_quantity ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`} />
                  {fieldErrors.stock_quantity && <p className="text-accent-red text-xs mt-1">{fieldErrors.stock_quantity}</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Min Alert</label>
                <input type="number" min="0" name="min_stock_alert" value={formData.min_stock_alert} onChange={handleChange} className={`w-full px-4 py-2 bg-admin-surface border rounded-xl focus:outline-none focus:border-brand transition-colors ${fieldErrors.min_stock_alert ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`} />
                {fieldErrors.min_stock_alert && <p className="text-accent-red text-xs mt-1">{fieldErrors.min_stock_alert}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1">Unit</label>
                <select name="unit" value={formData.unit} onChange={handleChange} className={`w-full px-4 py-2 bg-admin-surface border rounded-xl focus:outline-none focus:border-brand transition-colors appearance-none ${fieldErrors.unit ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`}>
                  <option value="piece">Piece</option>
                  <option value="ml">ml</option>
                  <option value="gm">gm</option>
                  <option value="liter">Liter</option>
                  <option value="box">Box</option>
                </select>
                {fieldErrors.unit && <p className="text-accent-red text-xs mt-1">{fieldErrors.unit}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-admin-text-secondary mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-2 bg-admin-surface border border-admin-border rounded-xl focus:outline-none focus:border-brand transition-colors resize-none" placeholder="Add some notes about this product..."></textarea>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-admin-border bg-admin-surface/50 shrink-0">
          <div className="flex gap-3">
            <button type="button" onClick={handleClose} disabled={loading} className="flex-1 px-4 py-2.5 border border-admin-border text-admin-text font-medium rounded-xl hover:bg-admin-surface transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" form="productForm" disabled={loading} className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : productToEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
