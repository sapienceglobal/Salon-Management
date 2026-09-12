'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  RiAddLine, RiSearchLine, RiFilter3Line, RiMore2Fill, RiArchiveLine,
  RiInboxLine, RiAlertLine, RiCheckDoubleLine, RiMoneyDollarCircleLine
} from 'react-icons/ri';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import AddProductModal from '@/components/admin/inventory/AddProductModal';
import ProductProfilePanel from '@/components/admin/inventory/ProductProfilePanel';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering and Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  
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

  const activeProducts = products.filter(p => p.is_active);
  const categories = [...new Set(activeProducts.map(p => p.category).filter(Boolean))];

  const getStockStatus = (qty, minAlert) => {
    if (qty === 0) return { label: 'Out of Stock', color: 'bg-accent-red/10 text-accent-red border-accent-red/20' };
    if (qty <= minAlert) return { label: 'Low Stock', color: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20' };
    return { label: 'In Stock', color: 'bg-accent-green/10 text-accent-green border-accent-green/20' };
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-admin-text font-heading">Inventory Management</h1>
          <p className="text-admin-text-secondary text-sm mt-1">Manage retail products, backbar supplies, and track stock levels.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shadow-brand/20"
        >
          <RiAddLine className="text-lg" />
          Add Product
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-admin-card border border-admin-border rounded-2xl p-5 shadow-sm">
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

        <div className="bg-admin-card border border-admin-border rounded-2xl p-5 shadow-sm">
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

        <div className="bg-admin-card border border-admin-border rounded-2xl p-5 shadow-sm">
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

        <div className="bg-admin-card border border-admin-border rounded-2xl p-5 shadow-sm">
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
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-admin-surface/50">
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
                  <td colSpan="5" className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : activeProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-admin-text-muted">
                    No products found.
                  </td>
                </tr>
              ) : (
                activeProducts.map(product => {
                  const status = getStockStatus(product.stock_quantity, product.min_stock_alert);
                  return (
                    <tr 
                      key={product.id} 
                      className="hover:bg-admin-surface-light/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedProduct(product)}
                    >
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
        </div>
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
    </div>
  );
}
