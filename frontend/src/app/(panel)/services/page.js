'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import {
  RiAddLine, RiEdit2Line, RiDeleteBin7Line, RiSearchLine, 
  RiTimeLine, RiMenLine, RiWomenLine, RiGroupLine,
  RiAlertLine, RiScissorsLine
} from 'react-icons/ri';
import CategoryFormModal from '@/components/admin/CategoryFormModal';
import ServiceFormModal from '@/components/admin/ServiceFormModal';
import { useConfirm } from '@/context/ConfirmContext';
import toast from 'react-hot-toast';

export default function ServicesPage() {
  const { confirm } = useConfirm();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [highlightedServiceId, setHighlightedServiceId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [svcSearch, setSvcSearch] = useState('');
  
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingSvcs, setLoadingSvcs] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catToEdit, setCatToEdit] = useState(null);

  const [isSvcModalOpen, setIsSvcModalOpen] = useState(false);
  const [svcToEdit, setSvcToEdit] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const res = await api.get('/services/categories');
      setCategories(res.data || []);
      if (res.data?.length > 0 && !activeCategoryId) {
        setActiveCategoryId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load categories.');
    } finally {
      setLoadingCats(false);
    }
  }, [activeCategoryId]);

  const fetchServices = useCallback(async (categoryId) => {
    if (!categoryId) return;
    setLoadingSvcs(true);
    try {
      const res = await api.get(`/services/category/${categoryId}`);
      setServices(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load services.');
    } finally {
      setLoadingSvcs(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Deep Link Handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get('category_id');
    const serviceId = params.get('service_id');
    
    if (categoryId && categories.length > 0 && activeCategoryId != categoryId) {
      setActiveCategoryId(parseInt(categoryId));
    }
    
    if (serviceId && services.length > 0 && activeCategoryId == categoryId) {
      const found = services.find(s => s.id == serviceId);
      if (found) {
        setHighlightedServiceId(found.id);
        setTimeout(() => {
          const el = document.getElementById(`service-${found.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

        const url = new URL(window.location);
        url.searchParams.delete('category_id');
        url.searchParams.delete('service_id');
        window.history.replaceState({}, '', url);

        setTimeout(() => setHighlightedServiceId(null), 3000);
      }
    }
  }, [categories, services, activeCategoryId]);

  useEffect(() => {
    if (activeCategoryId) {
      fetchServices(activeCategoryId);
    }
  }, [activeCategoryId, fetchServices]);

  const handleDeleteCategory = async (id, e) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? All its services will also be deleted.',
      confirmText: 'Delete Category'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/services/categories/${id}`);
      if (activeCategoryId === id) setActiveCategoryId(null);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleDeleteService = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Service',
      message: 'Are you sure you want to delete this service?',
      confirmText: 'Delete Service'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success('Service deleted successfully');
      fetchServices(activeCategoryId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete service');
    }
  };

  const handleToggleServiceStatus = async (svc, e) => {
    e.stopPropagation();
    const newStatus = !svc.is_active;
    // Optimistic UI update
    setServices(prev => prev.map(s => s.id === svc.id ? { ...s, is_active: newStatus } : s));
    try {
      await api.patch(`/services/${svc.id}/toggle-active`);
      toast.success(`Service marked as ${newStatus ? 'Active' : 'Inactive'}`);
    } catch (err) {
      // Revert on error
      setServices(prev => prev.map(s => s.id === svc.id ? { ...s, is_active: svc.is_active } : s));
      toast.error(err.response?.data?.message || 'Failed to update service status');
    }
  };

  const allCount = services.length;
  const activeCount = services.filter(s => s.is_active !== false).length;
  const inactiveCount = services.filter(s => s.is_active === false).length;

  const displayedServices = services.filter(svc => {
    const matchesStatus = 
      statusFilter === 'active' ? (svc.is_active !== false) :
      statusFilter === 'inactive' ? (svc.is_active === false) : true;
    const matchesSearch = !svcSearch || 
      svc.name.toLowerCase().includes(svcSearch.toLowerCase()) || 
      (svc.description || '').toLowerCase().includes(svcSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDuration = (mins) => {
    if (mins < 60) return `${mins} mins`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  const getGenderIcon = (target) => {
    if (target === 'male') return <RiMenLine className="text-accent-blue" title="Male" />;
    if (target === 'female') return <RiWomenLine className="text-accent-brand" title="Female" />;
    return <RiGroupLine className="text-admin-text-secondary" title="Unisex" />;
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease_forwards] flex flex-col h-[calc(100vh-var(--spacing-header)-48px)]">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="font-heading text-[1.75rem] font-bold">Services Menu</h1>
          <p className="text-sm text-admin-text-secondary mt-1">Manage your service categories, pricing, and duration.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setCatToEdit(null); setIsCatModalOpen(true); }}
            className="bg-admin-surface-light border border-admin-border text-admin-text px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-admin-surface-hover transition-colors flex items-center gap-2"
          >
            <RiAddLine className="text-lg" /> Add Category
          </button>
          <button 
            onClick={() => { setSvcToEdit(null); setIsSvcModalOpen(true); }}
            disabled={categories.length === 0}
            className="bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors shadow-lg shadow-brand/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RiAddLine className="text-lg" /> New Service
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm rounded-lg flex items-center gap-2 shrink-0">
          <RiAlertLine /> {error}
        </div>
      )}

      {/* Main Split Layout */}
      <div className="flex gap-6 min-h-0 flex-1">
        
        {/* LEFT: Categories Sidebar */}
        <div className="w-[280px] shrink-0 bg-admin-card border border-admin-border rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-admin-border shrink-0">
            <div className="flex items-center gap-2 bg-admin-surface-light border border-admin-border rounded-lg px-3 py-2 focus-within:border-brand transition-colors">
              <RiSearchLine className="text-admin-text-muted" />
              <input type="text" placeholder="Search categories..." className="bg-transparent border-none text-sm w-full outline-none" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {loadingCats ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-admin-surface-light rounded-lg animate-pulse"></div>)}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center p-6 text-admin-text-muted text-sm">No categories found. Create one first.</div>
            ) : (
              categories.map(cat => (
                <div 
                  key={cat.id} 
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer mb-1 transition-all ${
                    activeCategoryId === cat.id ? 'bg-brand/10 text-brand' : 'hover:bg-admin-surface-light text-admin-text-secondary hover:text-admin-text'
                  }`}
                >
                  <span className="font-semibold text-sm truncate pr-2">{cat.name}</span>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCatToEdit(cat); setIsCatModalOpen(true); }}
                      className="p-1.5 hover:text-brand transition-colors" title="Edit"
                    >
                      <RiEdit2Line />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteCategory(cat.id, e)}
                      className="p-1.5 hover:text-accent-red transition-colors" title="Delete"
                    >
                      <RiDeleteBin7Line />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Services List */}
        <div className="flex-1 bg-admin-card border border-admin-border rounded-2xl flex flex-col overflow-hidden">
          {/* Active Category Header */}
          <div className="px-6 py-4 border-b border-admin-border bg-admin-surface/30 shrink-0 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold">
                  {categories.find(c => c.id === activeCategoryId)?.name || 'Select a Category'}
                </h2>
                {activeCategoryId && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-admin-surface-light text-admin-text-secondary rounded-full border border-admin-border">
                    {allCount} {allCount === 1 ? 'Service' : 'Services'}
                  </span>
                )}
              </div>
              {categories.find(c => c.id === activeCategoryId)?.description && (
                <p className="text-xs text-admin-text-secondary mt-0.5 line-clamp-1">
                  {categories.find(c => c.id === activeCategoryId)?.description}
                </p>
              )}
            </div>

            {/* Filter Controls & Search */}
            {activeCategoryId && allCount > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                {/* Filter Tabs */}
                <div className="flex items-center bg-admin-surface-light border border-admin-border rounded-lg p-1 text-xs font-medium">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-md transition-colors ${statusFilter === 'all' ? 'bg-brand text-white shadow-sm' : 'text-admin-text-secondary hover:text-admin-text'}`}
                  >
                    All ({allCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-3 py-1 rounded-md transition-colors ${statusFilter === 'active' ? 'bg-accent-green text-white shadow-sm' : 'text-admin-text-secondary hover:text-admin-text'}`}
                  >
                    Active ({activeCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('inactive')}
                    className={`px-3 py-1 rounded-md transition-colors ${statusFilter === 'inactive' ? 'bg-accent-red text-white shadow-sm' : 'text-admin-text-secondary hover:text-admin-text'}`}
                  >
                    Inactive ({inactiveCount})
                  </button>
                </div>

                {/* Mini Search */}
                <div className="flex items-center gap-1.5 bg-admin-surface-light border border-admin-border rounded-lg px-2.5 py-1 text-xs focus-within:border-brand transition-colors w-40">
                  <RiSearchLine className="text-admin-text-muted shrink-0" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={svcSearch}
                    onChange={(e) => setSvcSearch(e.target.value)}
                    className="bg-transparent border-none text-xs w-full outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-0">
            {!activeCategoryId ? (
               <div className="h-full flex items-center justify-center text-admin-text-muted">
                 Please select a category from the left.
               </div>
            ) : loadingSvcs ? (
               <div className="p-6 space-y-4">
                 {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-admin-surface-light rounded-xl animate-pulse"></div>)}
               </div>
            ) : services.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-admin-text-muted">
                 <RiScissorsLine className="text-5xl mb-4 opacity-20" />
                 <p>No services in this category.</p>
                 <button 
                  onClick={() => { setSvcToEdit(null); setIsSvcModalOpen(true); }}
                  className="mt-4 text-brand font-semibold text-sm hover:underline"
                 >
                   Add the first service
                 </button>
               </div>
            ) : displayedServices.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-admin-text-muted p-6 text-center">
                 <RiScissorsLine className="text-4xl mb-3 opacity-20" />
                 <p className="font-medium">No services match the current filter.</p>
                 <button 
                  onClick={() => { setStatusFilter('all'); setSvcSearch(''); }}
                  className="mt-3 text-brand font-semibold text-sm hover:underline"
                 >
                   Clear filters
                 </button>
               </div>
            ) : (
               <div className="divide-y divide-admin-border">
                  {displayedServices.map(svc => (
                    <div 
                      key={svc.id} 
                      id={`service-${svc.id}`}
                      className={`p-5 transition-all duration-300 flex items-start gap-4 group border-l-4 ${
                        highlightedServiceId == svc.id 
                          ? 'bg-brand/10 border-brand' 
                          : !svc.is_active 
                            ? 'bg-admin-surface/20 border-accent-red/40 opacity-80 hover:opacity-100' 
                            : 'hover:bg-white/[0.02] border-transparent'
                      }`}
                    >
                     
                     {/* Gender Target Icon */}
                     <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shrink-0 transition-colors ${
                       svc.is_active !== false 
                         ? 'bg-admin-surface-light border-admin-border text-brand' 
                         : 'bg-admin-surface border-admin-border/50 text-admin-text-muted'
                     }`}>
                       {getGenderIcon(svc.gender_target)}
                     </div>

                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-3 mb-1 flex-wrap">
                         <h3 className={`font-bold text-base ${svc.is_active === false ? 'text-admin-text-secondary line-through decoration-admin-text-muted/40' : 'text-admin-text'}`}>
                           {svc.name}
                         </h3>

                         {/* Status Badge (Clickable to toggle) */}
                         <button
                           type="button"
                           onClick={(e) => handleToggleServiceStatus(svc, e)}
                           className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                             svc.is_active !== false
                               ? 'bg-accent-green/10 text-accent-green hover:bg-accent-green/20 border border-accent-green/20' 
                               : 'bg-accent-red/10 text-accent-red hover:bg-accent-red/20 border border-accent-red/20'
                           }`}
                           title={`Click to ${svc.is_active !== false ? 'deactivate' : 'activate'}`}
                         >
                           <span className={`w-1.5 h-1.5 rounded-full ${svc.is_active !== false ? 'bg-accent-green animate-pulse' : 'bg-accent-red'}`}></span>
                           {svc.is_active !== false ? 'Active' : 'Inactive'}
                         </button>
                       </div>
                       
                       {svc.description && (
                         <p className="text-sm text-admin-text-secondary mb-3 line-clamp-2">{svc.description}</p>
                       )}

                       <div className="flex items-center gap-5 text-sm font-medium">
                         <div className="flex items-center gap-1.5 text-brand">
                           <span className="font-bold">{formatCurrency(svc.price)}</span>
                         </div>
                         <div className="flex items-center gap-1.5 text-admin-text-secondary">
                           <RiTimeLine className="text-admin-text-muted" />
                           {formatDuration(svc.duration_minutes)}
                         </div>
                         {svc.tax_percentage > 0 && (
                           <div className="text-xs text-admin-text-muted border border-admin-border-light px-2 py-0.5 rounded-md">
                             {svc.tax_percentage}% Tax
                           </div>
                         )}
                       </div>
                     </div>

                     {/* Quick Toggle Switch & Actions */}
                     <div className="flex items-center gap-3 shrink-0 pt-0.5">
                       {/* Toggle Switch */}
                       <div className="flex items-center" title={svc.is_active !== false ? 'Active — Click to deactivate' : 'Inactive — Click to activate'}>
                         <button
                           type="button"
                           role="switch"
                           aria-checked={svc.is_active !== false}
                           onClick={(e) => handleToggleServiceStatus(svc, e)}
                           className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                             svc.is_active !== false ? 'bg-accent-green' : 'bg-admin-surface border border-admin-border'
                           }`}
                         >
                           <span
                             className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                               svc.is_active !== false ? 'translate-x-5' : 'translate-x-0 bg-admin-text-muted'
                             }`}
                           />
                         </button>
                       </div>

                       {/* Edit & Delete Action Buttons */}
                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => { setSvcToEdit(svc); setIsSvcModalOpen(true); }}
                           className="p-2 text-admin-text-secondary hover:text-brand bg-admin-surface-light hover:bg-brand/10 rounded-lg transition-colors" 
                           title="Edit Service"
                         >
                           <RiEdit2Line />
                         </button>
                         <button 
                           onClick={() => handleDeleteService(svc.id)}
                           className="p-2 text-admin-text-secondary hover:text-accent-red bg-admin-surface-light hover:bg-accent-red/10 rounded-lg transition-colors" 
                           title="Delete Service"
                         >
                           <RiDeleteBin7Line />
                         </button>
                       </div>
                     </div>

                    </div>
                  ))}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CategoryFormModal 
        isOpen={isCatModalOpen} 
        onClose={() => setIsCatModalOpen(false)}
        initialData={catToEdit}
        onSuccess={() => {
          setIsCatModalOpen(false);
          fetchCategories();
        }}
      />

      <ServiceFormModal 
        isOpen={isSvcModalOpen}
        onClose={() => setIsSvcModalOpen(false)}
        initialData={svcToEdit}
        categories={categories}
        onSuccess={() => {
          setIsSvcModalOpen(false);
          if (activeCategoryId) fetchServices(activeCategoryId);
        }}
      />

    </div>
  );
}
