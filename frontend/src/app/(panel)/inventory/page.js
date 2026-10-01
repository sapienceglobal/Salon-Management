'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  RiAddLine, RiSearchLine, RiFilter3Line, RiMore2Fill, RiArchiveLine,
  RiInboxLine, RiAlertLine, RiCheckDoubleLine, RiMoneyDollarCircleLine,
  RiShieldCheckLine, RiCloseLine, RiDownload2Line, RiDeleteBin6Line
} from 'react-icons/ri';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import AddProductModal from '@/components/admin/inventory/AddProductModal';
import ProductProfilePanel from '@/components/admin/inventory/ProductProfilePanel';
import PageHeaderGradient from '@/components/admin/common/PageHeaderGradient';
import TableScrollContainer from '@/components/admin/common/TableScrollContainer';
import BulkActionBar from '@/components/admin/common/BulkActionBar';
import { useConfirm } from '@/context/ConfirmContext';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const { confirm } = useConfirm();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Filtering and Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');
  
  // UI State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Metrics State
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    lowStockAlerts: 0,
    outOfStock: 0,
    totalValue: 0
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = `/products?limit=100`;
      if (searchTerm) query += `&search=${encodeURIComponent(searchTerm)}`;
      if (category) query += `&category=${encodeURIComponent(category)}`;
      if (lowStockOnly) query += `&low_stock=true`;
      
      const res = await api.get(query);
      const data = res.data?.products || res.data || [];
      setProducts(data);

      // Check if coming from dashboard with a specific product
      const params = new URLSearchParams(window.location.search);
      const prodId = params.get('product_id');
      if (prodId) {
        const prod = data.find(p => p.id === parseInt(prodId));
        if (prod) {
          setSelectedProduct(prod);
          // Clean URL
          const url = new URL(window.location);
          url.searchParams.delete('product_id');
          window.history.replaceState({}, '', url);
        }
      }
      
      // Calculate metrics on client side for now (or fetch from summary endpoint if exists)
      const activeProducts = data.filter(p => p.is_active);
      let low = 0, out = 0, value = 0;
      activeProducts.forEach(p => {
        if (p.stock_quantity === 0) out++;
        else if (p.stock_quantity <= p.min_stock_alert) low++;
        value += (p.selling_price * p.stock_quantity);
      });
      
      setMetrics({
        totalProducts: activeProducts.length,
        lowStockAlerts: low,
        outOfStock: out,
        totalValue: value
      });
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, category, lowStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleEdit = (prod) => {
    setProductToEdit(prod);
    setIsAddModalOpen(true);
  };

  const handleAdd = () => {
    setProductToEdit(null);
    setIsAddModalOpen(true);
  };

  const displayedProducts = products.filter(p => {
    if (statusFilter === 'active' && !p.is_active) return false;
    if (statusFilter === 'inactive' && p.is_active) return false;
    return true;
  });
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const getStockStatus = (qty, minAlert, isActive) => {
    if (!isActive) return { label: 'Inactive', color: 'bg-admin-surface-light text-admin-text-muted border-admin-border' };
    if (qty === 0) return { label: 'Out of Stock', color: 'bg-accent-red/10 text-accent-red border-accent-red/20' };
    if (qty <= minAlert) return { label: 'Low Stock', color: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20' };
    return { label: 'In Stock', color: 'bg-accent-green/10 text-accent-green border-accent-green/20' };
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(displayedProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkActivate = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await api.post('/products/bulk-status', { ids: selectedIds, is_active: true });
      toast.success(`${selectedIds.length} product${selectedIds.length > 1 ? 's' : ''} activated`);
      fetchProducts();
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to activate selected products');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await api.post('/products/bulk-status', { ids: selectedIds, is_active: false });
      toast.success(`${selectedIds.length} product${selectedIds.length > 1 ? 's' : ''} deactivated`);
      fetchProducts();
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to deactivate selected products');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportSelected = () => {
    if (selectedIds.length === 0) return;
    const selectedProds = products.filter(p => selectedIds.includes(p.id));
    const headers = ['Product Name', 'SKU', 'Brand', 'Category', 'Selling Price', 'Stock Quantity', 'Status'];
    const csvRows = [headers.join(',')];

    for (const row of selectedProds) {
      const values = [
        `"${row.name || ''}"`,
        `"${row.sku || ''}"`,
        `"${row.brand || ''}"`,
        `"${row.category || ''}"`,
        `"${row.selling_price || 0}"`,
        `"${row.stock_quantity || 0}"`,
        `"${row.is_active ? 'Active' : 'Inactive'}"`,
      ];
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `selected_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedProds.length} selected products`);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const ok = await confirm({
      title: 'Delete Selected Products',
      message: `Are you sure you want to permanently delete ${selectedIds.length} product${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      type: 'danger',
    });
    if (!ok) return;

    setBulkLoading(true);
    try {
      await api.post('/products/bulk-delete', { ids: selectedIds });
      toast.success(`${selectedIds.length} product${selectedIds.length > 1 ? 's' : ''} deleted`);
      fetchProducts();
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete selected products');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Hero & Metrics Section with Ambient Pink-White Gradient */}
      <div className="relative -mx-6 -mt-6 px-6 pt-6 pb-2 mb-6 overflow-hidden">
        <PageHeaderGradient height="h-[300px]" />

        {/* Page Header */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white font-heading tracking-tight">Inventory Management</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage retail products, backbar supplies, and track stock levels.</p>
          </div>
          <button 
            onClick={handleAdd}
            className="bg-[#E91E63] hover:bg-[#D81B60] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-[#E91E63]/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <RiAddLine className="text-lg" />
            Add Product
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/80 dark:bg-admin-card/80 backdrop-blur-sm border border-pink-100/80 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                <RiInboxLine className="text-2xl" />
              </div>
              <div>
                <p className="text-admin-text-muted text-sm font-medium mb-0.5">Total Products</p>
                <h3 className="text-2xl font-bold text-admin-text">{metrics.totalProducts}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-admin-card/80 backdrop-blur-sm border border-pink-100/80 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-yellow/10 flex items-center justify-center text-accent-yellow">
                <RiAlertLine className="text-2xl" />
              </div>
              <div>
                <p className="text-admin-text-muted text-sm font-medium mb-0.5">Low Stock</p>
                <h3 className="text-2xl font-bold text-admin-text">{metrics.lowStockAlerts}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-admin-card/80 backdrop-blur-sm border border-pink-100/80 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-red/10 flex items-center justify-center text-accent-red">
                <RiArchiveLine className="text-2xl" />
              </div>
              <div>
                <p className="text-admin-text-muted text-sm font-medium mb-0.5">Out of Stock</p>
                <h3 className="text-2xl font-bold text-admin-text">{metrics.outOfStock}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-admin-card/80 backdrop-blur-sm border border-pink-100/80 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center text-accent-green">
                <RiMoneyDollarCircleLine className="text-2xl" />
              </div>
              <div>
                <p className="text-admin-text-muted text-sm font-medium mb-0.5">Total Value</p>
                <h3 className="text-xl font-bold text-admin-text">{formatCurrency(metrics.totalValue)}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-admin-card border border-admin-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
            <input 
              type="text" 
              placeholder="Search by name, brand or SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-admin-surface border border-admin-border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
            />
          </div>

          {/* Category Filter */}
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-admin-surface border border-admin-border rounded-xl text-sm focus:outline-none focus:border-brand transition-colors appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36 px-3 py-2 bg-admin-surface border border-admin-border rounded-xl text-sm focus:outline-none focus:border-brand transition-colors appearance-none"
          >
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="all">All Products</option>
          </select>
        </div>

        {/* Low Stock Toggle */}
        <label className="flex items-center gap-2 cursor-pointer w-full sm:w-auto">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${lowStockOnly ? 'bg-brand' : 'bg-admin-surface-light border border-admin-border'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${lowStockOnly ? 'translate-x-4' : 'translate-x-0'}`}></div>
          </div>
          <span className="text-sm font-medium text-admin-text-secondary select-none">Low Stock Only</span>
        </label>
      </div>

      {/* Inventory Table */}
      <div className="bg-admin-card border border-admin-border rounded-2xl shadow-sm overflow-hidden">
        <TableScrollContainer
          innerClassName="min-h-[400px]"
          leftGradientClass="bg-gradient-to-r from-white via-white/85 to-transparent dark:from-[#1e1e35] dark:via-[#1e1e35]/85 dark:to-transparent"
          rightGradientClass="bg-gradient-to-l from-white via-white/85 to-transparent dark:from-[#1e1e35] dark:via-[#1e1e35]/85 dark:to-transparent"
        >
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="bg-admin-surface/50">
                <th className="py-4 pl-5 pr-2 w-10 text-center border-b border-admin-border">
                  <input
                    type="checkbox"
                    checked={displayedProducts.length > 0 && selectedIds.length === displayedProducts.length}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = selectedIds.length > 0 && selectedIds.length < displayedProducts.length;
                      }
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-[#e91e63] focus:ring-[#e91e63] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider border-b border-admin-border">Product Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider border-b border-admin-border">SKU</th>
                <th className="px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider border-b border-admin-border">Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider border-b border-admin-border">Stock Level</th>
                <th className="px-6 py-4 text-xs font-semibold text-admin-text-muted uppercase tracking-wider border-b border-admin-border">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-admin-text-muted">
                    No products found.
                  </td>
                </tr>
              ) : (
                displayedProducts.map(product => {
                  const status = getStockStatus(product.stock_quantity, product.min_stock_alert, product.is_active);
                  const isSelected = selectedIds.includes(product.id);
                  return (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-admin-surface-light/50 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-pink-50/40 dark:bg-pink-950/20' : ''
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <td className="py-4 pl-5 pr-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(product.id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-[#e91e63] focus:ring-[#e91e63] cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-admin-surface flex items-center justify-center border border-admin-border shrink-0">
                            <RiInboxLine className="text-admin-text-secondary text-lg" />
                          </div>
                          <div>
                            <p className="font-semibold text-admin-text text-sm group-hover:text-brand transition-colors">{product.name}</p>
                            <p className="text-xs text-admin-text-muted mt-0.5">{product.brand || 'No Brand'} • {product.category || 'Uncategorized'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-admin-text-secondary">
                        {product.sku || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-admin-text">
                        {formatCurrency(product.selling_price)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${product.stock_quantity === 0 ? 'text-accent-red' : product.stock_quantity <= product.min_stock_alert ? 'text-accent-yellow' : 'text-admin-text'}`}>
                            {product.stock_quantity}
                          </span>
                          <span className="text-xs text-admin-text-muted">{product.unit}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableScrollContainer>
      </div>

      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        productToEdit={productToEdit}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchProducts();
        }} 
      />

      <ProductProfilePanel 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        product={selectedProduct} 
        onEdit={(prod) => {
          setProductToEdit(prod);
          setIsAddModalOpen(true);
        }}
        onUpdateSuccess={fetchProducts}
      />

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={displayedProducts.length}
        onClear={() => setSelectedIds([])}
        resourceName="product"
        actions={[
          {
            label: 'Activate',
            icon: RiShieldCheckLine,
            onClick: handleBulkActivate,
            variant: 'success',
            loading: bulkLoading,
          },
          {
            label: 'Deactivate',
            icon: RiCloseLine,
            onClick: handleBulkDeactivate,
            variant: 'default',
            loading: bulkLoading,
          },
          {
            label: 'Export CSV',
            icon: RiDownload2Line,
            onClick: handleExportSelected,
            variant: 'default',
          },
          {
            label: 'Delete',
            icon: RiDeleteBin6Line,
            onClick: handleBulkDelete,
            variant: 'danger',
            loading: bulkLoading,
          },
        ]}
      />
    </div>
  );
}
