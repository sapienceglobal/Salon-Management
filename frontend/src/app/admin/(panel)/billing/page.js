'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  RiSearchLine, RiAddLine, RiUserLine, RiDiscountPercentLine, 
  RiDeleteBinLine, RiMore2Fill, RiTimeLine, RiMoreFill, RiEdit2Line, RiSubtractLine, RiFileList3Line,
  RiCloseLine
} from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import AddMoneyModal from '@/components/admin/billing/AddMoneyModal';
import AddExpenseModal from '@/components/admin/billing/AddExpenseModal';
import AddCustomerModal from '@/components/admin/customers/AddCustomerModal';
import CheckoutModal from '@/components/admin/billing/CheckoutModal';
import ReceiptModal from '@/components/admin/billing/ReceiptModal';
import ViewDraftsDrawer from '@/components/admin/billing/ViewDraftsDrawer';
import { formatCurrency } from '@/lib/utils';

export default function POSPage() {
  const [activeTab, setActiveTab] = useState('Services');
  const [staffList, setStaffList] = useState([]);
  const [draftCount, setDraftCount] = useState(0);
  const [items, setItems] = useState({ services: [], products: [], packages: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGlobalStaff, setSelectedGlobalStaff] = useState('');
  
  // Cart state
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editPriceValue, setEditPriceValue] = useState('');
  
  // Customer Search
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerSearchTimeout = useRef(null);

  // Modals
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isViewDraftsOpen, setIsViewDraftsOpen] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [completedInvoice, setCompletedInvoice] = useState(null);

  const [appointmentId, setAppointmentId] = useState(null);

  useEffect(() => {
    fetchItems();
    fetchStaff();
    fetchDraftCount();
    
    // Check if coming from appointment checkout
    const params = new URLSearchParams(window.location.search);
    const appId = params.get('appointment_id');
    const custId = params.get('customer_id');
    if (appId) {
      setAppointmentId(appId);
      loadAppointmentData(appId);
    } else if (custId) {
      loadCustomerData(custId);
    }
  }, []);

  
  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff');
      console.log('STAFF API RESPONSE:', res.data);
      setStaffList(res.data || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const fetchDraftCount = async () => {
    try {
      const res = await api.get('/invoices', { params: { status: 'draft' } });
      setDraftCount(res.data?.length || 0);
    } catch (error) {
      console.error('Failed to fetch draft count:', error);
    }
  };

  const loadAppointmentData = async (id) => {
    try {
      const res = await api.get(`/appointments/${id}`);
      const appt = res.data;
      if (!appt) return;

      // Auto-select customer
      if (appt.customer_id) {
        setSelectedCustomer({
          id: appt.customer_id,
          first_name: appt.customer_first_name,
          last_name: appt.customer_last_name,
          phone: appt.customer_phone
        });
        setCustomerQuery(`${appt.customer_first_name} ${appt.customer_last_name || ''}`);
      }

      // Add service to cart
      if (appt.service_id) {
        setCart([{
          id: appt.service_id,
          type: 'service',
          name: appt.service_name,
          qty: 1,
          cart_price: appt.service_price || 0,
          staff_member_id: appt.staff_member_id
        }]);
      }
    } catch (error) {
      console.error('Failed to load appointment for checkout:', error);
      toast.error('Failed to load appointment details');
    }
  };

  const loadCustomerData = async (id) => {
    try {
      const res = await api.get(`/customers/${id}`);
      const cust = res.data?.data || res.data?.customer || res.data;
      if (cust) {
        setSelectedCustomer({
          id: cust.id,
          first_name: cust.first_name,
          last_name: cust.last_name,
          phone: cust.phone
        });
        setCustomerQuery(`${cust.first_name} ${cust.last_name || ''}`);
        
        // Clean URL
        const url = new URL(window.location);
        url.searchParams.delete('customer_id');
        window.history.replaceState({}, '', url);
      }
    } catch (error) {
      console.error('Failed to load customer for billing:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const [servicesRes, productsRes, packagesRes, membershipsRes] = await Promise.all([
        api.get('/services', { params: { limit: 100 } }),
        api.get('/products', { params: { limit: 100 } }),
        api.get('/catalog/packages'),
        api.get('/catalog/memberships')
      ]);
      setItems({
        services: servicesRes.data || [],
        products: productsRes.data || [],
        packages: packagesRes.data || [],
        memberships: membershipsRes.data || [],
        'prepaid plan': [] // No endpoint for prepaid plans yet
      });
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const handleCustomerSearch = (query) => {
    setCustomerQuery(query);
    if (!query) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current);
    customerSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get('/customers', { params: { search: query, limit: 5 } });
        setCustomerResults(res.data || []);
        setShowCustomerDropdown(true);
      } catch (error) {
        console.error('Customer search failed', error);
      }
    }, 300);
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery(customer.first_name + ' ' + (customer.last_name || ''));
    setShowCustomerDropdown(false);
  };

  const addToCart = (item, type) => {
    const existing = cart.find(c => c.id === item.id && c.type === type);
    if (existing) {
      setCart(cart.map(c => c.id === item.id && c.type === type ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { 
        ...item, 
        type, 
        qty: 1,
        cart_price: item.price || item.selling_price || 0,
        staff_member_id: selectedGlobalStaff ? parseInt(selectedGlobalStaff) : null
      }]);
    }
  };

  const updateCartQty = (id, type, delta) => {
    setCart(cart.map(c => {
      if (c.id === id && c.type === type) {
        const newQty = Math.max(1, c.qty + delta);
        return { ...c, qty: newQty };
      }
      return c;
    }));
  };

  const removeFromCart = (id, type) => {
    setCart(cart.filter(c => !(c.id === id && c.type === type)));
  };

  const handleEditPriceSave = (id, type) => {
    const newPrice = parseFloat(editPriceValue);
    if (!isNaN(newPrice) && newPrice >= 0) {
      setCart(cart.map(c => c.id === id && c.type === type ? { ...c, cart_price: newPrice } : c));
    }
    setEditingItemId(null);
  };

  
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setCustomerQuery('');
    setAppointmentId(null);
    setCurrentDraftId(null);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.cart_price * item.qty), 0);

  
  const handleSaveDraft = async () => {
    if (!selectedCustomer) return toast.error('Please select a customer');
    if (cart.length === 0) return toast.error('Cart is empty');
    
    setIsSavingDraft(true);
    try {
      const payload = {
        customer_id: selectedCustomer.id,
        appointment_id: appointmentId ? parseInt(appointmentId) : undefined,
        items: cart.map(c => ({
          item_type: c.type ? (c.type.endsWith('s') && c.type !== 'services' ? c.type.slice(0, -1) : (c.type === 'services' ? 'service' : c.type)) : 'service',
          item_id: c.id,
          quantity: c.qty,
          unit_price: parseFloat(c.cart_price),
          staff_member_id: c.staff_member_id || undefined
        })),
        status: 'draft'
      };
      
      if (currentDraftId) {
        await api.put(`/invoices/${currentDraftId}`, payload);
      } else {
        await api.post('/invoices', payload);
      }
      toast.success('Draft saved');
      fetchDraftCount();
      clearCart();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSelectDraft = (draft) => {
    setCurrentDraftId(draft.id);
    setSelectedCustomer({
      id: draft.customer_id,
      first_name: draft.customer_first_name,
      last_name: draft.customer_last_name,
      phone: draft.customer_phone
    });
    setCustomerQuery(`${draft.customer_first_name} ${draft.customer_last_name || ''}`);
    setAppointmentId(draft.appointment_id);
    
    const loadedCart = (draft.items || []).map(i => ({
      id: i.item_id,
      type: i.item_type,
      name: i.item_name,
      qty: i.quantity,
      cart_price: i.unit_price,
      staff_member_id: i.staff_member_id
    }));
    setCart(loadedCart);
  };

  const handleCheckout = () => {
    if (!selectedCustomer) return toast.error('Please select a customer first');
    if (cart.length === 0) return toast.error('Cart is empty');
    setIsCheckoutOpen(true);
  };

  const onCheckoutSuccess = (invoiceData) => {
    setCart([]);
    setSelectedCustomer(null);
    setCustomerQuery('');
    setAppointmentId(null);
    setCompletedInvoice(invoiceData);
    setIsReceiptOpen(true);
  };

  // Filter items by search query
  const displayedItems = (items[activeTab.toLowerCase()] || []).filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-130px)] gap-4">
      {/* LEFT PANEL: CATALOGUE */}
      <div className="flex-1 flex flex-col min-w-0 bg-admin-surface rounded-2xl border border-admin-border overflow-hidden relative">
        
        {/* Top Bar */}
        <div className="p-4 border-b border-admin-border flex justify-between items-center gap-4">
          <div className="relative w-full max-w-sm z-20">
            <label className="block text-[10px] uppercase tracking-wider text-admin-text-secondary font-bold mb-1">Add/change customer</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Write name or mobile number"
                value={customerQuery}
                onChange={e => {
                  handleCustomerSearch(e.target.value);
                  if (selectedCustomer) setSelectedCustomer(null);
                }}
                className="w-full bg-admin-surface border border-admin-border/50 focus:border-brand rounded-lg px-4 py-2.5 text-sm text-admin-text outline-none transition-colors"
              />
              {selectedCustomer && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <RiCloseLine 
                    className="text-admin-text-secondary cursor-pointer hover:text-admin-text" 
                    onClick={() => { setSelectedCustomer(null); setCustomerQuery(''); }}
                  />
                </div>
              )}
            </div>
            
            {showCustomerDropdown && customerResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-admin-card border border-admin-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                {customerResults.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className="w-full px-4 py-3 text-left hover:bg-admin-surface flex flex-col transition-colors border-b border-admin-border/50 last:border-0"
                  >
                    <span className="text-sm font-bold text-admin-text">{c.first_name} {c.last_name}</span>
                    <span className="text-xs text-admin-text-secondary">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setIsAddCustomerOpen(true)}
              className="px-4 py-2.5 bg-brand/10 text-brand rounded-lg text-sm font-bold hover:bg-brand hover:text-white transition-colors flex items-center gap-2"
            >
              <RiAddLine /> Add New
            </button>
            <button 
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="p-2.5 bg-admin-surface rounded-lg text-admin-text-secondary hover:text-admin-text transition-colors"
            >
              <RiMoreFill className="text-lg" />
            </button>
            
            {showQuickActions && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-admin-card border border-admin-border rounded-xl shadow-xl overflow-hidden z-30">
                <button 
                  onClick={() => { setIsAddExpenseOpen(true); setShowQuickActions(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-admin-text hover:bg-admin-surface transition-colors border-b border-admin-border/50 font-medium"
                >
                  Add Expense
                </button>
                <button 
                  onClick={() => { setIsAddMoneyOpen(true); setShowQuickActions(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-admin-text hover:bg-admin-surface transition-colors font-medium"
                >
                  Add Money to Wallet
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="px-4 pt-4">
          <div className="flex gap-6 border-b border-admin-border/50 mb-4 overflow-x-auto custom-scrollbar">
            {['Services', 'Products', 'Packages', 'Prepaid Plan', 'Memberships'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-bold whitespace-nowrap transition-colors relative ${
                  activeTab === tab ? 'text-admin-text' : 'text-admin-text-secondary hover:text-admin-text'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full shadow-[0_0_8px_rgba(231,74,138,0.8)]" />
                )}
              </button>
            ))}
          </div>
          
          <div className="flex gap-4 mb-4">
            <select 
              value={selectedGlobalStaff}
              onChange={(e) => setSelectedGlobalStaff(e.target.value)}
              className="bg-admin-card border border-admin-border/50 rounded-lg px-4 py-2 text-sm text-admin-text outline-none w-48"
            >
              <option value="">All staff</option>
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.first_name} {staff.last_name}
                </option>
              ))}
            </select>
            <div className="relative flex-1">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-secondary" />
              <input 
                type="text" 
                placeholder={`Search ${activeTab.toLowerCase()} here`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-admin-card border border-transparent focus:border-brand rounded-lg pl-10 pr-4 py-2 text-sm text-admin-text outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Item Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {displayedItems.length === 0 ? (
            <div className="h-full flex items-center justify-center text-admin-text-secondary text-sm">
              No {activeTab.toLowerCase()} found.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
              {displayedItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => addToCart(item, activeTab.toLowerCase())}
                  className="bg-admin-card rounded-xl p-4 border border-admin-border/30 hover:border-brand cursor-pointer transition-all hover:shadow-[0_4px_20px_rgba(231,74,138,0.15)] flex flex-col justify-between min-h-[110px]"
                >
                  <h3 className="text-sm font-bold text-admin-text mb-2 line-clamp-2">{item.name}</h3>
                  <div className="flex justify-between items-end mt-auto">
                    <span className="font-bold text-admin-text text-lg">₹{(item.price || item.selling_price || 0).toLocaleString()}</span>
                    {item.duration && (
                      <span className="text-[10px] font-medium text-admin-text-secondary flex items-center gap-1 border border-admin-border/50 rounded-full px-2 py-0.5">
                        <RiTimeLine /> {item.duration} min
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        
        {/* View Draft Button */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-admin-card border border-brand/50 rounded-full overflow-hidden shadow-xl">
          <div 
            onClick={() => setIsViewDraftsOpen(true)}
            className="px-4 py-2 text-sm font-bold text-admin-text flex items-center gap-2 hover:bg-admin-surface transition-colors cursor-pointer"
          >
            <RiFileList3Line /> View draft ({String(draftCount).padStart(2, '0')})
          </div>
          <div 
            onClick={(e) => { 
              e.stopPropagation();
              if (window.confirm("Are you sure you want to clear the current cart and start a new sale?")) {
                clearCart();
              }
            }}
            className="bg-brand px-4 py-3 text-white hover:bg-brand-dark transition-colors cursor-pointer flex items-center justify-center h-full border-l border-brand-dark/20"
            title="New Sale (Clear Cart)"
          >
            <RiAddLine />
          </div>
        </div>

      </div>

      {/* RIGHT PANEL: CART */}
      <div className="w-full lg:w-[350px] xl:w-[400px] flex flex-col bg-admin-surface rounded-2xl border border-admin-border shrink-0">
          <div className="p-4 border-b border-admin-border flex justify-between items-center">
            <h2 className="font-bold text-admin-text text-lg">Cart</h2>
            {mounted && <span className="text-xs font-semibold text-admin-text-secondary">Today | {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
          </div>

        <div className="p-4 border-b border-admin-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-admin-text-secondary">Quick assign:</span>
            <select className="bg-admin-card border border-admin-border/50 rounded-lg px-3 py-1.5 text-xs text-admin-text outline-none font-bold">
              <option>Discount</option>
            </select>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
          {cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-admin-text-secondary text-sm">
              Cart is empty
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="bg-admin-card rounded-xl p-4 border border-admin-border/50 relative group">
                <div className="flex justify-between items-start mb-3">
                  
                  <h4 className="text-sm font-bold text-admin-text pr-4 flex flex-col gap-1">
                    {item.name}
                    {item.staff_member_id && (
                      <span className="text-[10px] bg-brand/10 text-brand px-1.5 py-0.5 rounded w-fit">
                        {staffList.find(s => s.id === item.staff_member_id)?.first_name || 'Staff'}
                      </span>
                    )}
                  </h4>

                  <div className="flex items-center gap-2 shrink-0">
                    {editingItemId === `${item.id}-${item.type}` ? (
                      <input 
                        type="number"
                        className="w-20 bg-admin-surface border border-brand/50 rounded px-2 py-1 text-sm text-admin-text outline-none focus:border-brand"
                        value={editPriceValue}
                        onChange={e => setEditPriceValue(e.target.value)}
                        onBlur={() => handleEditPriceSave(item.id, item.type)}
                        onKeyDown={e => e.key === 'Enter' && handleEditPriceSave(item.id, item.type)}
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className="text-sm font-bold text-admin-text">₹{item.cart_price.toLocaleString()}</span>
                        <RiEdit2Line 
                          className="text-admin-text-secondary hover:text-brand cursor-pointer" 
                          onClick={() => {
                            setEditingItemId(`${item.id}-${item.type}`);
                            setEditPriceValue(item.cart_price.toString());
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    
                    <div className="relative group/staff">
                      <button className="w-7 h-7 rounded-full bg-admin-surface flex items-center justify-center text-admin-text-secondary hover:text-admin-text hover:bg-brand/20 transition-colors">
                        <RiUserLine className="text-xs" />
                      </button>
                      <div className="absolute top-full left-0 mt-1 w-40 bg-admin-card border border-admin-border rounded-xl shadow-xl overflow-hidden z-30 hidden group-hover/staff:block max-h-48 overflow-y-auto">
                        <div className="px-3 py-2 text-xs font-bold text-admin-text-secondary border-b border-admin-border bg-admin-surface sticky top-0">Assign Staff</div>
                        <button 
                          onClick={() => setCart(cart.map(c => c.id === item.id && c.type === item.type ? {...c, staff_member_id: null} : c))}
                          className="w-full text-left px-3 py-2 text-sm text-admin-text hover:bg-admin-surface"
                        >
                          None
                        </button>
                        {staffList.map(staff => (
                          <button 
                            key={staff.id}
                            onClick={() => setCart(cart.map(c => c.id === item.id && c.type === item.type ? {...c, staff_member_id: staff.id} : c))}
                            className="w-full text-left px-3 py-2 text-sm text-admin-text hover:bg-admin-surface truncate"
                          >
                            {staff.first_name} {staff.last_name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => toast('Overall discount is applied at Checkout.', { icon: '💡' })}
                      className="w-7 h-7 rounded-full bg-admin-surface flex items-center justify-center text-admin-text-secondary hover:text-admin-text hover:bg-brand/20 transition-colors"
                      title="Discount (At Checkout)"
                    >
                      <RiDiscountPercentLine className="text-xs" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-admin-surface rounded-full overflow-hidden border border-admin-border/50">
                      <button onClick={() => updateCartQty(item.id, item.type, -1)} className="px-2 py-1 text-admin-text-secondary hover:text-admin-text"><RiSubtractLine className="text-xs"/></button>
                      <span className="text-xs font-bold text-admin-text min-w-[1.5rem] text-center">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, item.type, 1)} className="px-2 py-1 text-admin-text-secondary hover:text-admin-text"><RiAddLine className="text-xs"/></button>
                    </div>
                    <span className="text-sm font-bold text-admin-text w-20 text-right">₹{(item.cart_price * item.qty).toLocaleString()}</span>
                    <button 
                      onClick={() => removeFromCart(item.id, item.type)}
                      className="w-7 h-7 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-admin-text transition-colors"
                    >
                      <RiDeleteBinLine className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-admin-border/50 bg-admin-surface rounded-b-2xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-semibold text-admin-text-secondary">Subtotal</span>
            <span className="text-lg font-bold text-admin-text">₹{cartTotal.toLocaleString()}</span>
          </div>
          
          
          <div className="flex gap-3">

            <button 
              onClick={handleSaveDraft}
              disabled={isSavingDraft || cart.length === 0}
              className="flex-1 py-3 bg-admin-surface border border-admin-border rounded-xl text-sm font-bold text-admin-text hover:bg-admin-card transition-colors disabled:opacity-50"
            >
              {isSavingDraft ? 'Saving...' : 'Save as draft'}
            </button>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="flex-[2] py-3 bg-[#9B6BFF] hover:bg-[#8552F2] rounded-xl text-sm font-bold text-white transition-colors shadow-[0_4px_15px_rgba(155,107,255,0.3)] disabled:opacity-50"
            >
              Collect ₹{cartTotal.toLocaleString()}
            </button>
          </div>

        </div>
      </div>

      {/* Modals */}
      <AddExpenseModal 
        isOpen={isAddExpenseOpen} 
        onClose={() => setIsAddExpenseOpen(false)} 
      />
      <AddMoneyModal 
        isOpen={isAddMoneyOpen} 
        onClose={() => setIsAddMoneyOpen(false)}
        preSelectedCustomer={selectedCustomer}
      />
      <AddCustomerModal 
        isOpen={isAddCustomerOpen} 
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={() => {
          setIsAddCustomerOpen(false);
          toast.success("Customer created successfully. Please search for them.");
        }}
      />
      
      <ViewDraftsDrawer
        isOpen={isViewDraftsOpen}
        onClose={() => setIsViewDraftsOpen(false)}
        onSelectDraft={(draft) => {
          setIsViewDraftsOpen(false);
          // Restore the draft to cart
          setSelectedCustomer({
            id: draft.customer_id,
            first_name: draft.customer_first_name,
            last_name: draft.customer_last_name,
            phone: draft.customer_phone
          });
          setCustomerQuery(draft.customer_first_name + ' ' + (draft.customer_last_name || ''));
          setCurrentDraftId(draft.id);
          setCart(draft.items.map(item => ({
            id: item.item_id,
            type: item.item_type,
            name: item.item_name,
            cart_price: parseFloat(item.unit_price),
            qty: item.quantity,
            staff_member_id: item.staff_member_id
          })));
        }}
      />
      
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={onCheckoutSuccess}
        cart={cart}
        customer={selectedCustomer}
        appointmentId={appointmentId}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        invoice={completedInvoice}
      />
    </div>
  );
}
