'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  RiCloseLine,
  RiInformationLine,
  RiShoppingBag3Line,
  RiImageAddLine,
  RiDeleteBinLine,
  RiUpload2Line,
} from 'react-icons/ri';
import api from '@/lib/api';
import { useScrollLock } from '@/hooks/useScrollLock';
import { inventorySchema, formatZodErrors } from '@/lib/validations';
import { getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AddProductModal({ isOpen, onClose, onSuccess, productToEdit = null }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);

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
    description: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
          description: productToEdit.description || '',
        });
        setImagePreview(productToEdit.image_url ? getImageUrl(productToEdit.image_url) : null);
      } else {
        setFormData({
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
          description: '',
        });
        setImagePreview(null);
      }
      setSelectedFile(null);
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen, productToEdit]);

  if (!isOpen || !mounted) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5 MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (PNG, JPG, WebP)');
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const validationPayload = {
      ...formData,
      purchase_price: (formData.purchase_price ?? '').toString().trim(),
      selling_price: (formData.selling_price ?? '').toString().trim(),
      stock_quantity: (formData.stock_quantity ?? '').toString().trim(),
      min_stock_alert: (formData.min_stock_alert ?? '').toString().trim(),
    };

    const result = inventorySchema.safeParse(validationPayload);
    if (!result.success) {
      setFieldErrors(formatZodErrors(result.error));
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : 0,
      selling_price: parseFloat(formData.selling_price),
      stock_quantity: parseInt(formData.stock_quantity, 10),
      min_stock_alert: parseInt(formData.min_stock_alert, 10),
    };

    try {
      if (selectedFile) {
        const formDataPayload = new FormData();
        Object.keys(payload).forEach((key) => {
          if (payload[key] !== undefined && payload[key] !== null) {
            formDataPayload.append(key, payload[key]);
          }
        });
        formDataPayload.append('image', selectedFile);

        if (productToEdit) {
          await api.put(`/products/${productToEdit.id}`, formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          toast.success('Product updated successfully!');
        } else {
          await api.post('/products', formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          toast.success('Product created successfully!');
        }
      } else {
        // No new file selected
        if (productToEdit && !imagePreview && productToEdit.image_url) {
          // User removed the existing image
          payload.image_url = null;
        }

        if (productToEdit) {
          await api.put(`/products/${productToEdit.id}`, payload);
          toast.success('Product updated successfully!');
        } else {
          await api.post('/products', payload);
          toast.success('Product created successfully!');
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save product:', err);
      setError(err.response?.data?.message || 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName) =>
    `w-full bg-gray-50 dark:bg-white/5 border ${
      fieldErrors[fieldName]
        ? 'border-red-400 dark:border-red-400/60 focus:border-red-500'
        : 'border-gray-200 dark:border-white/10 focus:border-[#E91E63]'
    } rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors`;

  const labelClass = 'block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
              <RiShoppingBag3Line />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {productToEdit ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {productToEdit
                  ? 'Update product details, photo, pricing and stock thresholds.'
                  : 'Add a retail or salon consumable product to inventory.'}
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

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 px-6 sm:px-8 py-6 custom-scrollbar">
          {error && (
            <div className="flex items-center gap-2 p-3.5 mb-5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[13px] font-medium">
              <RiInformationLine className="shrink-0 text-base" />
              {error}
            </div>
          )}

          <form id="productForm" onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Image Upload Area */}
            <div>
              <label className={labelClass}>Product Image</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleImageChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="p-3 rounded-2xl border border-pink-100 dark:border-pink-900/30 bg-pink-50/40 dark:bg-pink-950/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-pink-200/80 dark:border-pink-900/50 bg-white dark:bg-black/20 shrink-0 relative shadow-xs">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white truncate">
                        {selectedFile ? selectedFile.name : 'Current Product Image'}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {selectedFile
                          ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                          : 'Uploaded photo'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RiUpload2Line className="text-sm" />
                      <span>Change</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <RiDeleteBinLine className="text-base" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-[#E91E63] dark:hover:border-[#E91E63] rounded-2xl p-4 transition-colors cursor-pointer bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-[#E91E63] flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                      <RiImageAddLine />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200">
                        Upload Product Photo
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        PNG, JPG, or WebP up to 5 MB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:border-[#E91E63] group-hover:text-[#E91E63] transition-colors shrink-0 pointer-events-none"
                  >
                    Browse File
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>
                Product Name <span className="text-[#E91E63]">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputClass('name')}
                placeholder="e.g. L'Oréal Professionnel Shampoo"
              />
              {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={inputClass('category')}
                  placeholder="e.g. Hair Care, Skin Care"
                />
                {fieldErrors.category && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.category}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className={inputClass('brand')}
                  placeholder="e.g. L'Oréal, Moroccanoil"
                />
                {fieldErrors.brand && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.brand}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  SKU (Stock Keeping Unit) <span className="text-[#E91E63]">*</span>
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={inputClass('sku')}
                  placeholder="e.g. LOR-SHP-250"
                />
                {fieldErrors.sku && <p className="text-red-500 text-xs mt-1">{fieldErrors.sku}</p>}
              </div>
              <div>
                <label className={labelClass}>Barcode / UPC</label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className={inputClass('barcode')}
                  placeholder="Barcode number"
                />
                {fieldErrors.barcode && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.barcode}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-white/5">
              <div>
                <label className={labelClass}>Purchase Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  className={inputClass('purchase_price')}
                  placeholder="0.00"
                />
                {fieldErrors.purchase_price && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.purchase_price}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>
                  Selling Price (₹) <span className="text-[#E91E63]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleChange}
                  className={inputClass('selling_price')}
                  placeholder="0.00"
                />
                {fieldErrors.selling_price && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.selling_price}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100 dark:border-white/5">
              {!productToEdit && (
                <div>
                  <label className={labelClass}>Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    className={inputClass('stock_quantity')}
                  />
                  {fieldErrors.stock_quantity && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.stock_quantity}</p>
                  )}
                </div>
              )}
              <div>
                <label className={labelClass}>Min Alert Threshold</label>
                <input
                  type="number"
                  min="0"
                  name="min_stock_alert"
                  value={formData.min_stock_alert}
                  onChange={handleChange}
                  className={inputClass('min_stock_alert')}
                />
                {fieldErrors.min_stock_alert && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.min_stock_alert}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className={`${inputClass('unit')} cursor-pointer`}
                >
                  <option value="piece" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Piece</option>
                  <option value="ml" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">ml</option>
                  <option value="gm" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">gm</option>
                  <option value="bottle" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Bottle</option>
                  <option value="box" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Box</option>
                </select>
                {fieldErrors.unit && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.unit}</p>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass}>Description / Notes</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`${inputClass('description')} resize-none`}
                placeholder="Product instructions, ingredients, or supplier notes..."
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01] shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="productForm"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold bg-[#E91E63] text-white rounded-xl hover:bg-[#d81557] transition-all disabled:opacity-50 shadow-md shadow-[#E91E63]/25 cursor-pointer flex items-center justify-center min-w-[120px]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : productToEdit ? (
              'Save Changes'
            ) : (
              'Create Product'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
