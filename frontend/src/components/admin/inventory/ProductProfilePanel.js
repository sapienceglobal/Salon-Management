'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RiCloseLine, RiEdit2Line, RiDeleteBinLine, RiPriceTag3Line, RiStockLine, RiAlarmWarningLine, RiAddLine, RiSubtractLine, RiArchiveLine } from 'react-icons/ri';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useScrollLock } from '@/hooks/useScrollLock';
import api from '@/lib/api';

export default function ProductProfilePanel({ isOpen, onClose, product, onEdit, onUpdateSuccess }) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
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
      setIsClosing(false);
      setIsAdjustingStock(false);
      setAdjustQty('');
      setStockError(null);
    }
  }, [isOpen, product]);

  if (!isOpen || !mounted || !product) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const submitStockAdjustment = async () => {
    if (!adjustQty || isNaN(adjustQty) || parseInt(adjustQty) <= 0) {
      setStockError('Enter a valid quantity');
      return;
    }
    
    setIsUpdatingStock(true);
    setStockError(null);
    try {
      const diff = adjustType === 'add' ? parseInt(adjustQty) : -parseInt(adjustQty);
      await api.patch(`/products/${product.id}/stock`, { quantity_change: diff });
      setIsAdjustingStock(false);
      setAdjustQty('');
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      setStockError(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleMarkInactive = async () => {
    if (!confirm(`Are you sure you want to mark ${product.name} as inactive?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      if (onUpdateSuccess) {
        onUpdateSuccess();
        handleClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as inactive');
    }
  };

  const isLowStock = product.stock_quantity <= product.min_stock_alert;
  const isOutOfStock = product.stock_quantity === 0;

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex justify-end ${isClosing ? 'animate-[fadeOut_0.3s_ease_forwards]' : 'animate-[fadeIn_0.3s_ease_forwards]'}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      
      <div 
        className={`bg-admin-card text-admin-text w-full max-w-md h-full border-l border-admin-border shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-admin-border bg-admin-surface/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold truncate max-w-[250px]" title={product.name}>{product.name}</h2>
            <p className="text-sm text-admin-text-secondary mt-1 flex items-center gap-2">
              <span className="font-medium">{product.brand || 'No Brand'}</span>
              <span>•</span>
              <span>{product.category || 'Uncategorized'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(product)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-admin-surface-light text-admin-text-secondary hover:text-brand transition-colors" title="Edit Product">
              <RiEdit2Line className="text-lg" />
            </button>
            <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-admin-surface-light text-admin-text-secondary hover:text-admin-text transition-colors">
              <RiCloseLine className="text-xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-6">
          
          {/* Status Alert */}
          {isOutOfStock ? (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-xl p-4 flex items-start gap-3 text-accent-red">
              <RiAlarmWarningLine className="text-xl shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Out of Stock</p>
                <p className="text-xs mt-0.5 opacity-80">This product is completely out of stock and cannot be sold.</p>
              </div>
            </div>
          ) : isLowStock ? (
            <div className="bg-accent-yellow/10 border border-accent-yellow/20 rounded-xl p-4 flex items-start gap-3 text-accent-yellow">
              <RiAlarmWarningLine className="text-xl shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Low Stock Alert</p>
                <p className="text-xs mt-0.5 opacity-80">Only {product.stock_quantity} left (Min alert: {product.min_stock_alert})</p>
              </div>
            </div>
          ) : null}

          {/* Pricing Info */}
          <div className="bg-admin-surface rounded-xl p-5 border border-admin-border shadow-sm">
            <h3 className="text-xs font-bold text-admin-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
              <RiPriceTag3Line /> Pricing Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-admin-text-muted mb-1">Selling Price</p>
                <p className="text-xl font-bold text-brand">{formatCurrency(product.selling_price)}</p>
              </div>
              <div>
                <p className="text-sm text-admin-text-muted mb-1">Purchase Price</p>
                <p className="text-lg font-semibold">{formatCurrency(product.purchase_price || 0)}</p>
              </div>
            </div>
            
            {product.purchase_price > 0 && (
              <div className="mt-4 pt-4 border-t border-admin-border flex justify-between items-center text-sm">
                <span className="text-admin-text-muted">Est. Margin</span>
                <span className="font-medium text-accent-green">
                  {formatCurrency(product.selling_price - product.purchase_price)} 
                  <span className="ml-1 opacity-70">({Math.round(((product.selling_price - product.purchase_price) / product.selling_price) * 100)}%)</span>
                </span>
              </div>
            )}
          </div>

          {/* Stock Info */}
          <div className="bg-admin-surface rounded-xl p-5 border border-admin-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-admin-text-secondary uppercase tracking-wider flex items-center gap-2">
                <RiStockLine /> Inventory Status
              </h3>
              {!isAdjustingStock && (
                <button onClick={() => setIsAdjustingStock(true)} className="text-xs font-bold text-brand hover:text-brand-hover transition-colors">
                  Adjust Stock
                </button>
              )}
            </div>
            
            {isAdjustingStock ? (
              <div className="animate-[fadeIn_0.2s_ease_forwards] border border-admin-border rounded-lg p-3 bg-admin-card mt-2">
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setAdjustType('add')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${adjustType === 'add' ? 'bg-accent-green/15 text-accent-green' : 'bg-admin-surface-light text-admin-text-secondary'}`}>+ Add</button>
                  <button onClick={() => setAdjustType('remove')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${adjustType === 'remove' ? 'bg-accent-red/15 text-accent-red' : 'bg-admin-surface-light text-admin-text-secondary'}`}>- Remove</button>
                </div>
                <div className="flex gap-2">
                  <input type="number" min="1" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="Qty" className="flex-1 bg-admin-surface border border-admin-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-brand" />
                  <button onClick={submitStockAdjustment} disabled={isUpdatingStock} className="bg-brand text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-brand-hover transition-colors disabled:opacity-50">
                    {isUpdatingStock ? '...' : 'Save'}
                  </button>
                  <button onClick={() => setIsAdjustingStock(false)} className="text-admin-text-secondary hover:bg-admin-surface-light px-2 rounded-md transition-colors">
                    <RiCloseLine className="text-lg" />
                  </button>
                </div>
                {stockError && <p className="text-xs text-accent-red mt-2">{stockError}</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-admin-text-muted mb-1">Current Stock</p>
                  <p className={`text-2xl font-bold ${isOutOfStock ? 'text-accent-red' : isLowStock ? 'text-accent-yellow' : 'text-accent-green'}`}>
                    {product.stock_quantity} <span className="text-sm font-medium opacity-60 ml-1">{product.unit}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-admin-text-muted mb-1">Total Value</p>
                  <p className="text-lg font-semibold">{formatCurrency(product.selling_price * product.stock_quantity)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Specs */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-admin-text-secondary uppercase tracking-wider flex items-center gap-2">
              Specifications
            </h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <span className="block text-admin-text-muted mb-0.5">SKU</span>
                <span className="font-medium">{product.sku || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-admin-text-muted mb-0.5">Barcode</span>
                <span className="font-medium">{product.barcode || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-admin-text-muted mb-0.5">Min Alert</span>
                <span className="font-medium">{product.min_stock_alert} {product.unit}</span>
              </div>
              <div>
                <span className="block text-admin-text-muted mb-0.5">Added On</span>
                <span className="font-medium">{new Date(product.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            {product.description && (
              <div className="mt-4 pt-4 border-t border-admin-border">
                <span className="block text-admin-text-muted mb-1 text-sm">Description</span>
                <p className="text-sm leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-admin-border bg-admin-surface/50 shrink-0">
          <button 
            onClick={handleMarkInactive}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-accent-red border border-accent-red/20 bg-accent-red/5 hover:bg-accent-red/10 transition-colors flex items-center justify-center gap-2"
          >
            <RiArchiveLine className="text-lg" />
            Mark Inactive
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
