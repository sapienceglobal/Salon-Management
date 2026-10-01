'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  RiCloseLine, 
  RiEdit2Line, 
  RiPriceTag3Line, 
  RiStockLine, 
  RiAlarmWarningLine, 
  RiAddLine, 
  RiSubtractLine, 
  RiArchiveLine, 
  RiShoppingBag3Line 
} from 'react-icons/ri';
import { formatCurrency } from '@/lib/utils';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useConfirm } from '@/context/ConfirmContext';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function ProductProfilePanel({ isOpen, onClose, product, onEdit, onUpdateSuccess }) {
  const { confirm } = useConfirm();
  const [mounted, setMounted] = useState(false);
  
  // Stock Adjustment State
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  const [adjustType, setAdjustType] = useState('add');
  const [adjustQty, setAdjustQty] = useState('');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [stockError, setStockError] = useState(null);

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsAdjustingStock(false);
      setAdjustQty('');
      setStockError(null);
    }
  }, [isOpen, product]);

  if (!isOpen || !mounted || !product) return null;

  const submitStockAdjustment = async () => {
    if (!adjustQty || isNaN(adjustQty) || parseInt(adjustQty) <= 0) {
      setStockError('Enter a valid quantity');
      return;
    }
    
    setIsUpdatingStock(true);
    setStockError(null);
    try {
      const diff = adjustType === 'add' ? parseInt(adjustQty) : -parseInt(adjustQty);
      await api.patch(`/products/${product.id}/stock`, { quantity: diff });
      setIsAdjustingStock(false);
      setAdjustQty('');
      toast.success('Stock adjusted successfully');
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      setStockError(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleToggleActive = async () => {
    const actionStr = product.is_active ? 'mark as inactive' : 'restore';
    const isConfirmed = await confirm({
      title: product.is_active ? 'Mark Inactive' : 'Restore Product',
      message: `Are you sure you want to ${actionStr} ${product.name}?`,
      confirmText: product.is_active ? 'Mark Inactive' : 'Restore'
    });
    if (!isConfirmed) return;
    try {
      if (product.is_active) {
        await api.delete(`/products/${product.id}`);
        toast.success('Product marked as inactive');
      } else {
        await api.put(`/products/${product.id}`, { is_active: true });
        toast.success('Product restored');
      }
      if (onUpdateSuccess) {
        onUpdateSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionStr} product`);
    }
  };

  const isLowStock = product.stock_quantity <= product.min_stock_alert && product.stock_quantity > 0;
  const isOutOfStock = product.stock_quantity === 0;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
              <RiShoppingBag3Line />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white truncate max-w-[280px] sm:max-w-md" title={product.name}>
                {product.name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                <span>{product.brand || 'No Brand'}</span>
                <span>•</span>
                <span>{product.category || 'General'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => {
                onClose();
                setTimeout(() => onEdit(product), 150);
              }} 
              className="text-gray-400 hover:text-[#E91E63] dark:hover:text-[#E91E63] p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer" 
              title="Edit Product"
            >
              <RiEdit2Line className="text-xl" />
            </button>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <RiCloseLine className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 sm:px-8 py-6 space-y-5 custom-scrollbar">
          
          {/* Status Alert */}
          {isOutOfStock ? (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex items-start gap-3 text-red-600 dark:text-red-400">
              <RiAlarmWarningLine className="text-xl shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Out of Stock</p>
                <p className="text-xs mt-0.5 opacity-90">This product is completely out of stock and cannot be sold.</p>
              </div>
            </div>
          ) : isLowStock ? (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-amber-600 dark:text-amber-400">
              <RiAlarmWarningLine className="text-xl shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Low Stock Alert</p>
                <p className="text-xs mt-0.5 opacity-90">Only {product.stock_quantity} left in stock (Alert threshold: {product.min_stock_alert}).</p>
              </div>
            </div>
          ) : null}

          {/* Pricing Info */}
          <div className="bg-gray-50 dark:bg-white/[0.03] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <RiPriceTag3Line className="text-[#E91E63]" /> Pricing Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Selling Price</p>
                <p className="text-2xl font-bold text-[#E91E63]">{formatCurrency(product.selling_price)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Purchase Price</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(product.purchase_price || 0)}</p>
              </div>
            </div>
            
            {product.purchase_price > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-500 dark:text-gray-400">Est. Profit Margin</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(product.selling_price - product.purchase_price)} 
                  <span className="ml-1 opacity-80 font-normal">({Math.round(((product.selling_price - product.purchase_price) / product.selling_price) * 100)}%)</span>
                </span>
              </div>
            )}
          </div>

          {/* Stock Info */}
          <div className="bg-gray-50 dark:bg-white/[0.03] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <RiStockLine className="text-[#E91E63]" /> Inventory Status
              </h3>
              {!isAdjustingStock && (
                <button 
                  onClick={() => setIsAdjustingStock(true)} 
                  className="text-xs font-bold text-[#E91E63] hover:text-[#d81557] transition-colors cursor-pointer"
                >
                  Adjust Stock
                </button>
              )}
            </div>
            
            {isAdjustingStock ? (
              <div className="border border-gray-200 dark:border-white/10 rounded-2xl p-4 bg-white dark:bg-[#1a1a2e] shadow-sm">
                <div className="flex gap-2 mb-3">
                  <button 
                    onClick={() => setAdjustType('add')} 
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${adjustType === 'add' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'}`}
                  >
                    + Add Stock
                  </button>
                  <button 
                    onClick={() => setAdjustType('remove')} 
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${adjustType === 'remove' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'}`}
                  >
                    - Deduct Stock
                  </button>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    value={adjustQty} 
                    onChange={e => setAdjustQty(e.target.value)} 
                    placeholder="Enter quantity" 
                    className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-[#E91E63]" 
                  />
                  <button 
                    onClick={submitStockAdjustment} 
                    disabled={isUpdatingStock} 
                    className="bg-[#E91E63] text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-[#d81557] transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-[#E91E63]/20"
                  >
                    {isUpdatingStock ? 'Saving...' : 'Apply'}
                  </button>
                  <button 
                    onClick={() => setIsAdjustingStock(false)} 
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <RiCloseLine className="text-xl" />
                  </button>
                </div>
                {stockError && <p className="text-xs text-rose-500 mt-2">{stockError}</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Stock Level</p>
                  <p className={`text-2xl font-bold ${isOutOfStock ? 'text-rose-500' : isLowStock ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {product.stock_quantity} <span className="text-sm font-medium opacity-70 ml-1">{product.unit}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Retail Value</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(product.selling_price * product.stock_quantity)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="bg-gray-50 dark:bg-white/[0.03] rounded-2xl p-5 border border-gray-100 dark:border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Product Specifications
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <span className="block text-gray-400 mb-0.5">SKU</span>
                <span className="font-semibold text-gray-900 dark:text-white font-mono">{product.sku || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-0.5">Barcode / UPC</span>
                <span className="font-semibold text-gray-900 dark:text-white font-mono">{product.barcode || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-0.5">Alert Threshold</span>
                <span className="font-semibold text-gray-900 dark:text-white">{product.min_stock_alert} {product.unit}</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-0.5">Created Date</span>
                <span className="font-semibold text-gray-900 dark:text-white">{new Date(product.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            {product.description && (
              <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                <span className="block text-gray-400 mb-1 text-xs">Description / Notes</span>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
          <button 
            type="button"
            onClick={handleToggleActive}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors flex items-center gap-2 cursor-pointer ${
              product.is_active 
                ? 'text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/20 hover:bg-rose-100'
                : 'text-[#E91E63] border-[#E91E63]/20 bg-[#E91E63]/10 hover:bg-[#E91E63]/20'
            }`}
          >
            <RiArchiveLine className="text-base" />
            {product.is_active ? 'Mark Inactive' : 'Restore Product'}
          </button>

          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
