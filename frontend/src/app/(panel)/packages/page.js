'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import {
  RiAddLine, RiEdit2Line, RiDeleteBin7Line, RiSearchLine, 
  RiAlertLine, RiVipCrownLine, RiCheckboxCircleLine, RiBox3Line, RiImageAddLine
} from 'react-icons/ri';
import PackageFormModal from '@/components/admin/packages/PackageFormModal';
import MembershipFormModal from '@/components/admin/packages/MembershipFormModal';
import { useConfirm } from '@/context/ConfirmContext';
import toast from 'react-hot-toast';

export default function PackagesMembershipsPage() {
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' or 'memberships'
  
  const [packages, setPackages] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [services, setServices] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [pkgToEdit, setPkgToEdit] = useState(null);

  const [isMemModalOpen, setIsMemModalOpen] = useState(false);
  const [memToEdit, setMemToEdit] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgRes, memRes, svcRes] = await Promise.all([
        api.get('/catalog/packages'),
        api.get('/catalog/memberships'),
        api.get('/services') // Assuming this endpoint returns flat list of all services
      ]);
      setPackages(pkgRes.data || []);
      setMemberships(memRes.data || []);
      
      // If /services doesn't exist, we might need to fetch categories then map services. 
      // Assuming a generic /services exists or we handle it gracefully if it fails.
      setServices(svcRes.data || []);
    } catch (err) {
      console.error(err);
      // Fallback if /services flat endpoint fails but others succeed
      if (err.response?.status === 404) {
         try {
            const cats = await api.get('/services/categories');
            let allSvcs = [];
            for (const cat of cats.data) {
                const sRes = await api.get(`/services/category/${cat.id}`);
                allSvcs = [...allSvcs, ...(sRes.data || [])];
            }
            setServices(allSvcs);
         } catch(e) {
             setError('Failed to load services for dropdown.');
         }
      } else {
         setError('Failed to load data.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // DELETE Handlers (Assuming endpoints exist; adapt if not)
  const handleDeletePackage = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Package',
      message: 'Are you sure you want to delete this package?',
      confirmText: 'Delete'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/catalog/packages/${id}`);
      toast.success('Package deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete package');
    }
  };

  const handleDeleteMembership = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Membership',
      message: 'Are you sure you want to delete this VIP membership?',
      confirmText: 'Delete'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/catalog/memberships/${id}`);
      toast.success('Membership deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete membership');
    }
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease_forwards] flex flex-col h-[calc(100vh-var(--spacing-header)-48px)]">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="font-heading text-[1.75rem] font-bold">Packages & Memberships</h1>
          <p className="text-sm text-admin-text-secondary mt-1">Manage bundled services and VIP membership tiers.</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'packages' ? (
            <button 
              onClick={() => { setPkgToEdit(null); setIsPkgModalOpen(true); }}
              className="bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors shadow-lg shadow-brand/20 flex items-center gap-2"
            >
              <RiAddLine className="text-lg" /> New Package
            </button>
          ) : (
            <button 
              onClick={() => { setMemToEdit(null); setIsMemModalOpen(true); }}
              className="bg-gradient-to-r from-[#D4AF37] to-[#B38B22] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:from-[#E8C245] hover:to-[#CC9F27] transition-all shadow-lg shadow-[#D4AF37]/30 flex items-center gap-2"
            >
              <RiVipCrownLine className="text-lg" /> New VIP Tier
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm rounded-lg flex items-center gap-2 shrink-0">
          <RiAlertLine /> {error}
        </div>
      )}

      {/* Segmented Tabs */}
      <div className="flex justify-center mb-6 shrink-0">
        <div className="bg-admin-surface-light border border-admin-border p-1 rounded-xl inline-flex shadow-inner">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'packages'
                ? 'bg-admin-card text-brand shadow-sm border border-admin-border'
                : 'text-admin-text-muted hover:text-admin-text'
            }`}
          >
            <RiBox3Line className="text-lg" /> Packages
          </button>
          <button
            onClick={() => setActiveTab('memberships')}
            className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'memberships'
                ? 'bg-admin-card text-brand shadow-sm border border-admin-border'
                : 'text-admin-text-muted hover:text-admin-text'
            }`}
          >
            <RiVipCrownLine className="text-lg" /> VIP Memberships
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-admin-surface-light rounded-2xl animate-pulse"></div>)}
          </div>
        ) : activeTab === 'packages' ? (
          /* PACKAGES GRID */
          packages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-admin-text-muted">
              <RiBox3Line className="text-5xl mb-4 opacity-20" />
              <p>No packages found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
              {packages.map(pkg => (
                <div key={pkg.id} className="bg-admin-card border border-admin-border rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                  
                  {/* Image Placeholder (for future) */}
                  <div className="w-full h-32 bg-admin-surface-light rounded-xl mb-4 flex items-center justify-center border border-admin-border-light text-admin-text-muted text-xs font-semibold overflow-hidden">
                    {pkg.image ? (
                      <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-50">
                        <RiImageAddLine className="text-2xl" />
                        <span>No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg leading-tight">{pkg.name}</h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setPkgToEdit(pkg); setIsPkgModalOpen(true); }} className="p-1.5 text-admin-text-secondary hover:text-brand bg-admin-surface-light rounded transition-colors" title="Edit"><RiEdit2Line /></button>
                      <button onClick={() => handleDeletePackage(pkg.id)} className="p-1.5 text-admin-text-secondary hover:text-accent-red bg-admin-surface-light rounded transition-colors" title="Delete"><RiDeleteBin7Line /></button>
                    </div>
                  </div>
                  
                  {pkg.description && <p className="text-sm text-admin-text-secondary mb-4 line-clamp-2">{pkg.description}</p>}
                  
                  <div className="mt-auto space-y-3">
                    <div className="text-2xl font-bold text-brand">{formatCurrency(pkg.total_price)}</div>
                    
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-admin-text-secondary">
                      {pkg.validity_days && <span className="bg-admin-surface-light px-2 py-1 rounded-md border border-admin-border">Valid {pkg.validity_days} Days</span>}
                      {pkg.max_uses && <span className="bg-admin-surface-light px-2 py-1 rounded-md border border-admin-border">Max {pkg.max_uses} Uses</span>}
                    </div>

                    <div className="pt-3 border-t border-admin-border-light">
                      <p className="text-xs font-semibold text-admin-text-secondary mb-2 uppercase tracking-wider">Includes:</p>
                      <ul className="text-sm space-y-1">
                        {pkg.items?.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-admin-text">
                            <span className="text-brand font-bold text-xs">{item.quantity}x</span> {item.service_name}
                          </li>
                        ))}
                        {pkg.items?.length > 3 && (
                          <li className="text-xs text-admin-text-muted italic">+{pkg.items.length - 3} more items</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* MEMBERSHIPS GRID */
          memberships.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-admin-text-muted">
              <RiVipCrownLine className="text-5xl mb-4 opacity-20" />
              <p>No VIP memberships found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
              {memberships.map(mem => (
                <div key={mem.id} className="relative bg-admin-card border border-admin-border rounded-2xl p-6 hover:shadow-xl hover:border-brand/30 hover:-translate-y-1 transition-all duration-300 group flex flex-col overflow-hidden">
                  
                  {/* VIP Image Placeholder */}
                  <div className="w-full h-32 bg-admin-surface-light rounded-2xl mb-5 flex items-center justify-center border border-admin-border-light text-admin-text-muted text-xs font-bold overflow-hidden shadow-sm">
                    {mem.image ? (
                      <img src={mem.image} alt={mem.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-60">
                        <RiVipCrownLine className="text-3xl" />
                        <span className="uppercase tracking-widest">Cover Image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-1 relative z-10">
                    <h3 className="font-bold text-xl leading-tight flex items-center gap-2">
                      <RiVipCrownLine className="text-brand" /> {mem.name}
                    </h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setMemToEdit(mem); setIsMemModalOpen(true); }} className="p-1.5 text-admin-text-secondary hover:text-brand bg-admin-surface-light rounded transition-colors" title="Edit"><RiEdit2Line /></button>
                      <button onClick={() => handleDeleteMembership(mem.id)} className="p-1.5 text-admin-text-secondary hover:text-accent-red bg-admin-surface-light rounded transition-colors" title="Delete"><RiDeleteBin7Line /></button>
                    </div>
                  </div>
                  
                  {mem.description && <p className="text-sm text-admin-text-secondary mb-5 line-clamp-2 relative z-10">{mem.description}</p>}
                  
                  <div className="mt-auto space-y-4 relative z-10">
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold text-brand">{formatCurrency(mem.price)}</div>
                      <div className="text-sm font-bold text-admin-text-secondary mb-1">/ {mem.duration_months} Months</div>
                    </div>
                    
                    <div className="pt-4 border-t border-admin-border-light">
                      <p className="text-xs font-bold text-admin-text-muted mb-3 uppercase tracking-widest">VIP Perks</p>
                      <ul className="text-sm space-y-2">
                        {(() => {
                           let benefits = mem.benefits;
                           if (typeof benefits === 'string') {
                             try { benefits = JSON.parse(benefits); } catch(e) { benefits = []; }
                           }
                           benefits = benefits || [];
                           return benefits.slice(0, 4).map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-admin-text font-medium">
                              <RiCheckboxCircleLine className="text-brand shrink-0 mt-0.5" />
                              <span className="leading-tight">{benefit}</span>
                            </li>
                           ));
                        })()}
                        {(() => {
                           let benefits = mem.benefits;
                           if (typeof benefits === 'string') {
                             try { benefits = JSON.parse(benefits); } catch(e) { benefits = []; }
                           }
                           benefits = benefits || [];
                           if (benefits.length > 4) {
                             return <li className="text-xs text-brand italic font-semibold pt-1">+{benefits.length - 4} more benefits</li>
                           }
                           return null;
                        })()}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modals */}
      <PackageFormModal 
        isOpen={isPkgModalOpen} 
        onClose={() => setIsPkgModalOpen(false)}
        initialData={pkgToEdit}
        services={services}
        onSuccess={() => {
          setIsPkgModalOpen(false);
          fetchData();
        }}
      />

      <MembershipFormModal 
        isOpen={isMemModalOpen}
        onClose={() => setIsMemModalOpen(false)}
        initialData={memToEdit}
        onSuccess={() => {
          setIsMemModalOpen(false);
          fetchData();
        }}
      />

    </div>
  );
}
