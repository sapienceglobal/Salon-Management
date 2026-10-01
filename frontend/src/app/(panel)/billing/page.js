'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { 
  RiSearchLine, RiAddLine, RiUserLine, RiDiscountPercentLine, 
  RiDeleteBinLine, RiMore2Fill, RiTimeLine, RiMoreFill, RiEdit2Line, RiSubtractLine, RiFileList3Line,
  RiCloseLine, RiPhoneLine, RiMessage2Line, RiPriceTag3Line, RiMoneyDollarCircleLine, RiWallet3Line, 
  RiMapPinTimeLine, RiUserShared2Line, RiStarLine, RiPencilLine, RiVipCrown2Line, RiScissors2Line,
  RiSparkling2Line, RiBrushLine, RiDropLine, RiWomenLine, RiMenLine, RiGroupLine, RiCheckboxCircleFill,
  RiArrowRightSLine, RiTicket2Line, RiBankCardLine, RiArrowDownSLine
} from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import AddMoneyModal from '@/components/admin/billing/AddMoneyModal';
import AddExpenseModal from '@/components/admin/billing/AddExpenseModal';
import AddCustomerModal from '@/components/admin/customers/AddCustomerModal';
import CheckoutModal from '@/components/admin/billing/CheckoutModal';
import ReceiptModal from '@/components/admin/billing/ReceiptModal';
import ViewDraftsDrawer from '@/components/admin/billing/ViewDraftsDrawer';
import ViewInvoicesDrawer from '@/components/admin/billing/ViewInvoicesDrawer';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import { useConfirm } from '@/context/ConfirmContext';
import PageHeaderGradient from '@/components/admin/common/PageHeaderGradient';

const getShiftLabel = (shift) => {
  switch (shift) {
    case 'morning':
      return 'Morning (9am - 4pm)';
    case 'evening':
      return 'Evening (1pm - 9pm)';
    case 'flexible':
      return 'Flexible (10am - 6pm)';
    default:
      return 'Full-time (10am - 8pm)';
  }
};

export default function POSPage() {
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState('Services'); // 'Services' | 'Products' | 'Packages'
  const [genderFilter, setGenderFilter] = useState('all'); // 'all' | 'male' | 'female'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Real Backend Data State
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [draftCount, setDraftCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Staff-assigned service IDs for real staff filtering
  const [staffServiceIds, setStaffServiceIds] = useState(null); // null means no staff filter applied

  // Cart state (Real user cart)
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerExpanded, setCustomerExpanded] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editPriceValue, setEditPriceValue] = useState('');
  
  // Quick Assign & Discount in Cart
  const [quickAssignStaffId, setQuickAssignStaffId] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10); // 10% default
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');

  // Customer Search
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerSearchTimeout = useRef(null);

  // Modals & Drawers
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isViewDraftsOpen, setIsViewDraftsOpen] = useState(false);
  const [isInvoicesDrawerOpen, setIsInvoicesDrawerOpen] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [appointmentId, setAppointmentId] = useState(null);
  const [mounted, setMounted] = useState(false);


  const fetchData = async () => {
    setLoading(true);
    try {
      const [svcRes, prodRes, pkgRes, staffRes, draftRes] = await Promise.allSettled([
        api.get('/services', { params: { limit: 100, active_only: true } }),
        api.get('/products', { params: { limit: 100, is_active: true } }),
        api.get('/catalog/packages'),
        api.get('/staff', { params: { active_only: true } }),
        api.get('/invoices', { params: { status: 'draft' } })
      ]);

      if (svcRes.status === 'fulfilled' && Array.isArray(svcRes.value.data)) {
        setServices(svcRes.value.data);
      }
      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value.data)) {
        setProducts(prodRes.value.data);
      }
      if (pkgRes.status === 'fulfilled' && Array.isArray(pkgRes.value.data)) {
        setPackages(pkgRes.value.data);
      }
      if (staffRes.status === 'fulfilled') {
        const activeStaff = Array.isArray(staffRes.value.data) ? staffRes.value.data.filter(s => s.is_active !== false) : [];
        setStaffList(activeStaff);
        if (activeStaff.length > 0 && !quickAssignStaffId) {
          // Pre-select Rahul Sharma or first active staff
          const rahul = activeStaff.find(s => s.first_name?.toLowerCase() === 'rahul');
          setQuickAssignStaffId(rahul ? String(rahul.id) : String(activeStaff[0].id));
        }
      }
      if (draftRes.status === 'fulfilled') {
        setDraftCount(draftRes.value.data?.length || 0);
      }

      // Check URL query parameters for appointment or customer auto-load
      const params = new URLSearchParams(window.location.search);
      const appId = params.get('appointment_id');
      const custId = params.get('customer_id');
      if (appId) {
        setAppointmentId(appId);
        loadAppointmentData(appId);
      } else if (custId) {
        loadCustomerData(custId);
      }
    } catch (err) {
      console.error('Error fetching POS data:', err);
      toast.error('Failed to load catalog data from backend');
    } finally {
      setLoading(false);
    }
  };

  // Staff Filter Handler: Real Backend `/staff/:id/services` integration
  const handleStaffFilterChange = async (staffId) => {
    setSelectedStaffId(staffId);
    if (!staffId) {
      setStaffServiceIds(null);
      return;
    }

    // Also update quickAssignStaff in Cart so any new addition is assigned to this staff
    setQuickAssignStaffId(staffId);

    try {
      const res = await api.get(`/staff/${staffId}/services`);
      const assignedList = (res.data || []).filter(s => s.is_assigned);
      const assignedIds = new Set(assignedList.map(s => s.id || s.service_id));
      setStaffServiceIds(assignedIds);
      
      const staffObj = staffList.find(s => String(s.id) === String(staffId));
      const staffName = staffObj ? `${staffObj.first_name} ${staffObj.last_name || ''}`.trim() : 'Staff';
      toast.success(`Filtered for ${staffName} (${assignedIds.size} services assigned)`, { duration: 2000 });
    } catch (err) {
      console.error('Failed to fetch staff services:', err);
      // Fallback: match by staff designation
      const staffObj = staffList.find(s => String(s.id) === String(staffId));
      if (staffObj && staffObj.designation) {
        const des = staffObj.designation.toLowerCase();
        const matched = services.filter(s => {
          const cat = (s.category_name || s.category || '').toLowerCase();
          if (des.includes('hair')) return cat.includes('hair');
          if (des.includes('skin')) return cat.includes('skin');
          if (des.includes('nail')) return cat.includes('nail');
          if (des.includes('groom')) return cat.includes('groom') || cat.includes('men');
          return true;
        }).map(s => s.id);
        setStaffServiceIds(new Set(matched));
      } else {
        setStaffServiceIds(null);
      }
    }
  };

  // Appointment auto-loader
  const loadAppointmentData = async (id) => {
    try {
      const res = await api.get(`/appointments/${id}`);
      const appt = res.data;
      if (!appt) return;

      if (appt.customer_id) {
        setSelectedCustomer({
          id: appt.customer_id,
          first_name: appt.customer_first_name,
          last_name: appt.customer_last_name,
          phone: appt.customer_phone
        });
        setCustomerQuery(`${appt.customer_first_name} ${appt.customer_last_name || ''}`);
      }

      if (appt.service_id) {
        setCart([{
          id: appt.service_id,
          type: 'service',
          name: appt.service_name,
          subtitle: `${appt.duration_minutes || 45} mins`,
          qty: 1,
          cart_price: parseFloat(appt.service_price) || 500,
          image: appt.image_url || '/pos/svc_women_haircut.png',
          staff_member_id: appt.staff_member_id || (quickAssignStaffId ? parseInt(quickAssignStaffId) : null)
        }]);
      }
    } catch (error) {
      console.error('Failed to load appointment:', error);
    }
  };

  // Customer auto-loader
  const loadCustomerData = async (id) => {
    try {
      const res = await api.get(`/customers/${id}`);
      const cust = res.data?.data || res.data?.customer || res.data;
      if (cust) {
        setSelectedCustomer(cust);
        setCustomerQuery(`${cust.first_name} ${cust.last_name || ''}`);
        const url = new URL(window.location);
        url.searchParams.delete('customer_id');
        window.history.replaceState({}, '', url);
      }
    } catch (error) {
      console.error('Failed to load customer:', error);
    }
  };

  // Load Initial Data from Real Backend
  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  // Dynamic Product Categories calculated from real products
  const productCategories = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      const cat = p.category || 'General';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    const list = [{ id: 'all', name: 'All Products', count: products.length }];
    for (const [name, count] of map.entries()) {
      list.push({ id: name.toLowerCase(), name, count });
    }
    return list;
  }, [products]);

  // Dynamic Package Categories calculated from real packages
  const packageCategories = useMemo(() => {
    const map = new Map();
    packages.forEach(pkg => {
      let cat = 'Hair Packages';
      const nameLower = (pkg.name || '').toLowerCase();
      if (nameLower.includes('skin') || nameLower.includes('facial') || nameLower.includes('glow') || nameLower.includes('nail')) {
        cat = 'Skin Packages';
      } else if (nameLower.includes('makeup') || nameLower.includes('bridal') || nameLower.includes('party')) {
        cat = 'Makeup Packages';
      } else if (nameLower.includes('spa') || nameLower.includes('massage')) {
        cat = 'Spa Packages';
      }
      map.set(cat, (map.get(cat) || 0) + 1);
    });

    const icons = {
      'hair packages': RiScissors2Line,
      'skin packages': RiSparkling2Line,
      'makeup packages': RiBrushLine,
      'spa packages': RiDropLine
    };

    const list = [{ id: 'all', name: 'All Packages', count: packages.length, icon: RiPriceTag3Line }];
    for (const [name, count] of map.entries()) {
      list.push({ 
        id: name.toLowerCase(), 
        name, 
        count,
        icon: icons[name.toLowerCase()] || RiPriceTag3Line
      });
    }
    return list;
  }, [packages]);

  // Filtered Services (Real Staff filter + Gender + Category + Search)
  const filteredServices = useMemo(() => {
    return services.filter(item => {
      // 1. Staff Filter: if a staff is selected, check assigned services
      if (staffServiceIds !== null && !staffServiceIds.has(item.id)) {
        return false;
      }
      // 2. Search query
      const catName = item.category_name || item.category || '';
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          catName.toLowerCase().includes(searchQuery.toLowerCase());
      // 3. Gender target
      const matchGender = genderFilter === 'all' || item.gender_target === 'unisex' || item.gender_target === genderFilter;
      // 4. Category dropdown
      const matchCat = selectedCategory === 'all' || catName.toLowerCase() === selectedCategory.toLowerCase();

      return matchSearch && matchGender && matchCat;
    });
  }, [services, staffServiceIds, searchQuery, genderFilter, selectedCategory]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(item => {
      const cat = item.category || '';
      const brand = item.brand || '';
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cat.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || cat.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Filtered Packages
  const filteredPackages = useMemo(() => {
    return packages.filter(item => {
      const name = item.name || '';
      const desc = item.description || '';
      let cat = 'Hair Packages';
      const nameLower = name.toLowerCase();
      if (nameLower.includes('skin') || nameLower.includes('facial') || nameLower.includes('glow') || nameLower.includes('nail')) {
        cat = 'Skin Packages';
      } else if (nameLower.includes('makeup') || nameLower.includes('bridal') || nameLower.includes('party')) {
        cat = 'Makeup Packages';
      } else if (nameLower.includes('spa') || nameLower.includes('massage')) {
        cat = 'Spa Packages';
      }

      const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || cat.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [packages, searchQuery, selectedCategory]);

  // Cart operations
  const addToCart = (item, type) => {
    const existing = cart.find(c => String(c.id) === String(item.id) && c.type === type);
    if (existing) {
      setCart(cart.map(c => String(c.id) === String(item.id) && c.type === type ? { ...c, qty: c.qty + 1 } : c));
    } else {
      let subtitle = '';
      let price = 0;
      let img = getImageUrl(item.image_url) || '/pos/svc_women_haircut.png';

      if (type === 'service') {
        subtitle = `${item.duration_minutes || 45} mins`;
        price = parseFloat(item.price) || 0;
        img = getImageUrl(item.image_url) || (item.gender_target === 'male' ? '/pos/svc_men_haircut.png' : '/pos/svc_women_haircut.png');
      } else if (type === 'product') {
        subtitle = item.unit || '1 pc';
        price = parseFloat(item.selling_price || item.price) || 0;
        img = getImageUrl(item.image_url) || '/pos/prod_shampoo.jpg';
      } else if (type === 'package') {
        subtitle = `${item.validity_days || 30} Days Validity`;
        price = parseFloat(item.total_price || item.price) || 0;
        img = getImageUrl(item.image_url) || '/pos/pkg_keratin.jpg';
      }

      setCart([
        ...cart, 
        {
          id: item.id,
          type,
          name: item.name,
          subtitle,
          qty: 1,
          cart_price: price,
          image: img,
          staff_member_id: quickAssignStaffId ? parseInt(quickAssignStaffId) : null
        }
      ]);
    }
    toast.success(`Added ${item.name} to cart`, { duration: 1500 });
  };

  const updateCartQty = (id, type, delta) => {
    const existing = cart.find(c => String(c.id) === String(id) && c.type === type);
    if (!existing) return;

    const newQty = existing.qty + delta;
    if (newQty <= 0) {
      setCart(cart.filter(c => !(String(c.id) === String(id) && c.type === type)));
      toast.success(`Removed ${existing.name} from cart`, { duration: 1200 });
    } else {
      setCart(cart.map(c => String(c.id) === String(id) && c.type === type ? { ...c, qty: newQty } : c));
    }
  };

  const removeFromCart = (id, type) => {
    const existing = cart.find(c => String(c.id) === String(id) && c.type === type);
    setCart(cart.filter(c => !(String(c.id) === String(id) && c.type === type)));
    if (existing) {
      toast.success(`Removed ${existing.name} from cart`, { duration: 1200 });
    }
  };

  // Flipkart / Blinkit style cart action button / quantity stepper: [ + ADD ] or [ - count + ]
  const renderItemActionButton = (item, type) => {
    const cartItem = cart.find(c => String(c.id) === String(item.id) && c.type === type);
    const qty = cartItem ? cartItem.qty : 0;

    if (qty > 0) {
      return (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="h-8 flex items-center bg-[#E91E63] text-white rounded-xl shadow-md shadow-[#E91E63]/25 shrink-0 overflow-hidden font-bold select-none transition-all duration-200 hover:shadow-lg hover:shadow-[#E91E63]/35"
        >
          <button
            type="button"
            onClick={() => updateCartQty(item.id, type, -1)}
            className="w-7 sm:w-8 h-8 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/15 active:scale-90 transition-all cursor-pointer"
            title="Decrease quantity"
            aria-label="Decrease quantity"
          >
            <RiSubtractLine className="text-sm font-black" />
          </button>
          <span className="min-w-[20px] sm:min-w-[24px] px-1 text-center text-xs font-black tracking-tight leading-none text-white">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => updateCartQty(item.id, type, 1)}
            className="w-7 sm:w-8 h-8 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/15 active:scale-90 transition-all cursor-pointer"
            title="Increase quantity"
            aria-label="Increase quantity"
          >
            <RiAddLine className="text-sm font-black" />
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          addToCart(item, type);
        }}
        className="h-8 px-2.5 sm:px-3 rounded-xl bg-pink-50 hover:bg-[#E91E63] dark:bg-pink-950/40 dark:hover:bg-[#E91E63] text-[#E91E63] hover:text-white border border-[#E91E63]/25 hover:border-[#E91E63] flex items-center justify-center gap-1 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs shrink-0 cursor-pointer"
        title={`Add ${item.name} to Cart`}
        aria-label={`Add ${item.name} to Cart`}
      >
        <RiAddLine className="text-base font-black" />
        <span>ADD</span>
      </button>
    );
  };

  const handleEditPriceSave = (id, type) => {
    const newPrice = parseFloat(editPriceValue);
    if (!isNaN(newPrice) && newPrice >= 0) {
      setCart(cart.map(c => String(c.id) === String(id) && c.type === type ? { ...c, cart_price: newPrice } : c));
    }
    setEditingItemId(null);
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setCustomerQuery('');
    setAppointmentId(null);
    setCurrentDraftId(null);
    toast('Cart cleared', { icon: '🗑️' });
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + ((parseFloat(item.cart_price) || 0) * (item.qty || 1)), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountPercent > 0) {
      return (subtotal * discountPercent) / 100;
    }
    return 0;
  }, [subtotal, discountPercent]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * 0.18; // 18% GST
  const totalAmount = taxableAmount + taxAmount;

  // Coupon handler
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return toast.error('Please enter a coupon code');
    const code = couponCode.trim().toUpperCase();
    if (code === 'SAVE10') {
      setDiscountPercent(10);
      setAppliedCoupon('SAVE10 (10% OFF)');
      toast.success('Coupon SAVE10 applied: 10% Discount!');
    } else if (code === 'SUPER20') {
      setDiscountPercent(20);
      setAppliedCoupon('SUPER20 (20% OFF)');
      toast.success('Coupon SUPER20 applied: 20% Discount!');
    } else if (code === 'SALON15') {
      setDiscountPercent(15);
      setAppliedCoupon('SALON15 (15% OFF)');
      toast.success('Coupon SALON15 applied: 15% Discount!');
    } else {
      setDiscountPercent(10);
      setAppliedCoupon(`${code} (10% OFF)`);
      toast.success(`Coupon ${code} applied successfully!`);
    }
  };

  // Customer search autocomplete
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
        const res = await api.get('/customers', { params: { search: query, limit: 6, is_active: 'true' } });
        setCustomerResults(res.data || []);
        setShowCustomerDropdown(true);
      } catch (error) {
        console.error('Customer search failed', error);
      }
    }, 250);
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery(`${customer.first_name} ${customer.last_name || ''}`);
    setShowCustomerDropdown(false);
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!selectedCustomer) {
      return toast.error('Please select a customer first');
    }
    if (cart.length === 0) return toast.error('Cart is empty');

    setIsSavingDraft(true);
    try {
      const payload = {
        customer_id: selectedCustomer.id,
        appointment_id: appointmentId ? parseInt(appointmentId) : undefined,
        items: cart.map(c => ({
          item_type: c.type || 'service',
          item_id: c.id,
          quantity: c.qty,
          unit_price: parseFloat(c.cart_price),
          staff_member_id: c.staff_member_id || (quickAssignStaffId ? parseInt(quickAssignStaffId) : undefined)
        })),
        status: 'draft'
      };

      if (currentDraftId) {
        await api.put(`/invoices/${currentDraftId}`, payload);
      } else {
        await api.post('/invoices', payload);
      }
      toast.success('Draft saved successfully');
      setDraftCount(prev => prev + 1);
      clearCart();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Collect Payment
  const handleCheckout = () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (!selectedCustomer) {
      return toast.error('Please select or add a customer to proceed to checkout');
    }
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

  return (
    <div className="relative min-h-[calc(100vh-70px)] flex flex-col lg:flex-row gap-5 p-4 sm:p-5 lg:p-6 bg-[#fcfcfe] dark:bg-[#0f0f1a] text-slate-800 dark:text-slate-100 font-sans transition-colors">
      
      {/* Ambient Pink-White Top Gradient */}
      <PageHeaderGradient height="h-[300px]" />

      {/* ======================================================== */}
      {/* LEFT & CENTER COLUMN: CATALOGUE & CUSTOMER */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 gap-5 z-10">

        {/* 1. Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-300">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              POS & Billing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Create bills, manage sales and process payments easily.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsInvoicesDrawerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#E91E63] hover:text-[#E91E63] transition-all shadow-sm"
            >
              <RiFileList3Line className="text-base text-[#E91E63]" />
              Invoices History
            </button>
            <button
              type="button"
              onClick={() => setIsViewDraftsOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#E91E63] hover:text-[#E91E63] transition-all shadow-sm"
            >
              <RiFileList3Line className="text-base text-amber-500" />
              Drafts ({draftCount})
            </button>
          </div>
        </div>

        {/* 2. Customer Card with Smooth Expand & Collapse */}
        <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-100 dark:border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 relative transition-all duration-300 ease-out">
          
          {selectedCustomer ? (
            /* Selected Customer Display with Quick Stats */
            <div className="flex flex-col gap-3 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-[#E91E63] text-white flex items-center justify-center font-bold text-lg shadow-sm transition-transform duration-200 hover:scale-105">
                    {(selectedCustomer.first_name?.[0] || 'C') + (selectedCustomer.last_name?.[0] || '')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900 dark:text-white">
                        {selectedCustomer.first_name} {selectedCustomer.last_name || ''}
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-200/50">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span>{selectedCustomer.phone || 'No phone'}</span>
                      <span>•</span>
                      <span>Wallet: ₹{selectedCustomer.wallet_balance || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCustomerExpanded(!customerExpanded)}
                    className="text-xs text-slate-500 hover:text-[#E91E63] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-[#E91E63]/30 transition-all duration-200 font-medium"
                  >
                    {customerExpanded ? 'Less Info' : 'More Info'}
                  </button>
                  <button 
                    onClick={() => { setSelectedCustomer(null); setCustomerQuery(''); }}
                    className="w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-200 transition-all duration-200"
                    title="Remove/Switch Customer"
                  >
                    <RiCloseLine className="text-lg" />
                  </button>
                </div>
              </div>

              {/* Smooth Collapsible Customer Stats */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 border-t border-slate-100 dark:border-white/5 text-xs transition-all duration-300 ease-in-out overflow-hidden ${customerExpanded ? 'max-h-40 pt-3 opacity-100' : 'max-h-0 pt-0 opacity-0 pointer-events-none'}`}>
                <div className="flex flex-col">
                  <span className="text-slate-400">Membership</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCustomer.membership_name || 'None'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400">Reward Points</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCustomer.reward_points || 0} pts</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400">Pending</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">₹{selectedCustomer.pending_amount || 0}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400">Total Visits</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCustomer.total_visits || 0} visits</span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-slate-400">Notes</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300 truncate">{selectedCustomer.notes || 'No special notes'}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Search Input Bar */
            <div className="flex items-center gap-4">
              {/* Pink user avatar icon box */}
              <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/30 text-[#E91E63] flex items-center justify-center text-2xl shrink-0 shadow-sm transition-transform duration-200 hover:scale-105">
                <RiUserLine />
              </div>

              {/* Customer Input field */}
              <div className="flex-1 relative">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Add / Search Customer
                </label>
                <input
                  type="text"
                  placeholder="Enter customer name, mobile number or email..."
                  value={customerQuery}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  className="w-full bg-[#f8fafc] dark:bg-[#121224] border border-slate-200/80 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] transition-all duration-200"
                />

                {/* Smooth Auto-suggest customer dropdown */}
                {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e1e34] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-30 max-h-64 overflow-y-auto animate-fade-in transition-all duration-200">
                    {customerResults.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => selectCustomer(cust)}
                        className="px-4 py-3 hover:bg-pink-50 dark:hover:bg-white/5 flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors duration-150"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 text-[#E91E63] flex items-center justify-center font-bold text-xs">
                            {cust.first_name?.[0] || 'C'}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white block">
                              {cust.first_name} {cust.last_name || ''}
                            </span>
                            <span className="text-xs text-slate-400">{cust.phone || 'No phone'}</span>
                          </div>
                        </div>
                        <span className="text-xs text-[#E91E63] font-semibold">Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons: + Add New & ... */}
              <div className="flex items-center gap-2 pt-4 sm:pt-5">
                <button
                  onClick={() => { setCustomerToEdit(null); setIsAddCustomerOpen(true); }}
                  className="px-4 py-2.5 bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/30 dark:hover:bg-pink-900/40 border border-pink-200/80 dark:border-pink-900/40 text-[#E91E63] font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm shrink-0"
                >
                  <RiAddLine className="text-base" />
                  <span>Add New</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
                    title="More actions"
                  >
                    <RiMoreFill className="text-xl" />
                  </button>

                  {/* Dropdown for quick actions with smooth fade & scale */}
                  {showQuickActions && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1e1e34] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-30 py-1 transition-all duration-200 animate-scale-in">
                      <button
                        onClick={() => { setIsAddExpenseOpen(true); setShowQuickActions(false); }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-pink-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors duration-150"
                      >
                        <RiMoneyDollarCircleLine className="text-base text-[#E91E63]" />
                        <span>Add Expense</span>
                      </button>
                      <button
                        onClick={() => { setIsAddMoneyOpen(true); setShowQuickActions(false); }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-pink-50 dark:hover:bg-white/5 flex items-center gap-2 border-t border-slate-100 dark:border-white/5 transition-colors duration-150"
                      >
                        <RiWallet3Line className="text-base text-emerald-500" />
                        <span>Add Money to Wallet</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Main Tabs Navigation: Services, Products, Packages */}
        <div className="flex gap-8 border-b border-slate-200/80 dark:border-white/10 px-1 pt-1">
          {['Services', 'Products', 'Packages'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className={`pb-3 text-sm sm:text-base font-bold transition-all duration-200 relative ${
                  isActive 
                    ? 'text-[#E91E63]' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {tab}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E91E63] rounded-t-full shadow-[0_0_8px_rgba(233,30,99,0.8)] transition-all duration-300" />
                )}
              </button>
            );
          })}
        </div>

        {/* 4. Filters Bar (All Staff, Gender Toggle, Search Input, Category) */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* REAL STAFF DROPDOWN with filter logic */}
          <div className="relative">
            <select
              value={selectedStaffId}
              onChange={(e) => handleStaffFilterChange(e.target.value)}
              style={{ colorScheme: 'dark light' }}
              className="appearance-none bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-9 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#E91E63] transition-all duration-200 cursor-pointer shadow-sm hover:border-slate-300 [color-scheme:light] dark:[color-scheme:dark]"
            >
              <option value="" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">All Staff</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id} className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white py-1">
                  {st.first_name} {st.last_name || ''} ({st.designation || 'Staff'} • {getShiftLabel(st.shift_schedule)})
                </option>
              ))}
            </select>
            <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform duration-200" />
          </div>

          {/* Gender Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setGenderFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm ${
                genderFilter === 'all'
                  ? 'bg-[#E91E63] text-white shadow-[#E91E63]/20'
                  : 'bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <RiGroupLine className="text-sm" />
              <span>All</span>
            </button>

            <button
              onClick={() => setGenderFilter('male')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm ${
                genderFilter === 'male'
                  ? 'bg-blue-600 text-white shadow-blue-500/20'
                  : 'bg-white dark:bg-[#1a1a2e] border border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50/50'
              }`}
            >
              <RiMenLine className="text-sm" />
              <span>Male</span>
            </button>

            <button
              onClick={() => setGenderFilter('female')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm ${
                genderFilter === 'female'
                  ? 'bg-pink-600 text-white shadow-pink-500/20'
                  : 'bg-white dark:bg-[#1a1a2e] border border-pink-200 dark:border-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-50/50'
              }`}
            >
              <RiWomenLine className="text-sm" />
              <span>Female</span>
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative flex-1 min-w-[200px]">
            <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder={
                activeTab === 'Services' 
                  ? 'Search services by name, category...' 
                  : activeTab === 'Products' 
                  ? 'Search products by name, brand...' 
                  : 'Search packages by name...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#E91E63] transition-all duration-200 shadow-sm"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ colorScheme: 'dark light' }}
              className="appearance-none bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-9 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-[#E91E63] transition-all duration-200 cursor-pointer shadow-sm hover:border-slate-300 [color-scheme:light] dark:[color-scheme:dark]"
            >
              <option value="all" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">All Categories</option>
              {activeTab === 'Products' ? (
                productCategories.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.name} className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white py-1">{c.name}</option>
                ))
              ) : activeTab === 'Packages' ? (
                packageCategories.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.name} className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white py-1">{c.name}</option>
                ))
              ) : (
                ['Hair Care', 'Skin Care', 'Makeup', 'Nail Care', 'Wellness', 'Grooming'].map(c => (
                  <option key={c} value={c} className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white py-1">{c}</option>
                ))
              )}
            </select>
            <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform duration-200" />
          </div>

        </div>

        {/* 5. TAB CONTENT AREAS WITH SMOOTH FADE ANIMATION */}
        <div className="transition-opacity duration-300 ease-in-out">
          
          {/* ---------------------------------------------------- */}
          {/* TAB 1: SERVICES TAB (Comfortable 3-column responsive grid) */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'Services' && (
            <div className="relative pb-20 animate-fade-in">
              {filteredServices.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm">
                  {staffServiceIds !== null 
                    ? 'No services assigned to this staff member in this category.' 
                    : 'No services found matching your criteria.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
                  {filteredServices.map((service) => {
                    const isInCart = cart.some(c => String(c.id) === String(service.id) && c.type === 'service');
                    const imgUrl = getImageUrl(service.image_url) || (service.gender_target === 'male' ? '/pos/svc_men_haircut.png' : '/pos/svc_women_haircut.png');

                    return (
                      <div
                        key={service.id}
                        className={`bg-white dark:bg-[#1a1a2e] rounded-2xl border p-3 hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5 flex items-center justify-between gap-3 group relative overflow-hidden ${
                          isInCart 
                            ? 'border-[#E91E63] shadow-[0_4px_16px_rgba(233,30,99,0.1)]' 
                            : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'
                        }`}
                      >
                        {/* Image Thumbnail */}
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                          <Image
                            src={imgUrl}
                            alt={service.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Service Details */}
                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight" title={service.name}>
                            {service.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                            {service.category_name || service.category || 'Hair Care'}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            <RiTimeLine className="text-xs text-slate-400" />
                            <span>{service.duration_minutes || 30} mins</span>
                          </div>
                          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-1 block">
                            ₹{(parseFloat(service.price) || 0).toLocaleString()}
                          </span>
                        </div>

                        {/* Flipkart / Blinkit Style Action Button */}
                        {renderItemActionButton(service, 'service')}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Floating Pill: View Draft Bills & New Sale */}
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 xl:left-[calc(50%-180px)] z-20 flex items-center bg-white dark:bg-[#1a1a2e] border border-[#E91E63]/30 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-300 hover:shadow-[0_12px_36px_rgba(233,30,99,0.2)]">
                <button
                  onClick={() => setIsViewDraftsOpen(true)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2 hover:bg-pink-50/50 dark:hover:bg-white/5 transition-colors duration-150"
                >
                  <RiFileList3Line className="text-base text-[#E91E63]" />
                  <span>View Draft Bills ({draftCount})</span>
                </button>
                <button
                  onClick={async () => {
                    const isConfirmed = await confirm({
                      title: 'Start New Sale',
                      message: 'Do you want to clear the current cart and start a fresh sale?',
                      confirmText: 'Start New'
                    });
                    if (isConfirmed) clearCart();
                  }}
                  className="w-10 h-10 bg-[#E91E63] hover:bg-[#D81B60] text-white flex items-center justify-center transition-colors duration-150 shrink-0"
                  title="Start New Sale / Clear Cart"
                >
                  <RiAddLine className="text-xl" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 2: PRODUCTS TAB (Left Category Menu + Responsive 2/3 Col Grid) */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'Products' && (
            <div className="flex flex-col md:flex-row gap-5 animate-fade-in">
              {/* Left Category Menu */}
              <div className="w-full md:w-44 xl:w-48 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                {productCategories.map((cat) => {
                  const isActive = selectedCategory.toLowerCase() === cat.name.toLowerCase() || (selectedCategory === 'all' && cat.id === 'all');
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id === 'all' ? 'all' : cat.name)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? 'bg-pink-50 dark:bg-pink-950/40 text-[#E91E63] border border-pink-200/80 dark:border-pink-900/40 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md transition-colors duration-200 ${isActive ? 'bg-[#E91E63] text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>
                          {cat.count}
                        </span>
                        <RiArrowRightSLine className={`text-sm transition-transform duration-200 ${isActive ? 'text-[#E91E63] translate-x-0.5' : 'text-slate-300'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Products Grid (2/3 columns with generous width) */}
              <div className="flex-1 min-w-0">
                {filteredProducts.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm">
                    No products found matching your selection.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-3.5">
                    {filteredProducts.map((prod) => {
                      const isInCart = cart.some(c => String(c.id) === String(prod.id) && c.type === 'product');
                      const imgUrl = getImageUrl(prod.image_url) || '/pos/prod_shampoo.jpg';

                      return (
                        <div
                          key={prod.id}
                          className={`bg-white dark:bg-[#1a1a2e] rounded-2xl border p-3 hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5 flex items-center justify-between gap-3 group relative overflow-hidden ${
                            isInCart 
                              ? 'border-[#E91E63] shadow-[0_4px_16px_rgba(233,30,99,0.1)]' 
                              : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'
                          }`}
                        >
                          {/* Image Thumbnail */}
                          <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 p-1 shrink-0 flex items-center justify-center">
                            <Image
                              src={imgUrl}
                              alt={prod.name}
                              fill
                              className="object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0 pr-1">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight" title={prod.name}>
                              {prod.name}
                            </h4>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate mt-0.5">
                              {prod.unit || prod.brand || '1 pc'}
                            </span>
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-1.5 block">
                              ₹{(parseFloat(prod.selling_price || prod.price) || 0).toLocaleString()}
                            </span>
                          </div>

                          {/* Flipkart / Blinkit Style Action Button */}
                          {renderItemActionButton(prod, 'product')}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 3: PACKAGES TAB (Left Category Menu + Responsive 2/3 Col Grid) */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'Packages' && (
            <div className="flex flex-col md:flex-row gap-5 animate-fade-in">
              {/* Left Category Menu */}
              <div className="w-full md:w-44 xl:w-48 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                {packageCategories.map((cat) => {
                  const isActive = selectedCategory.toLowerCase() === cat.name.toLowerCase() || (selectedCategory === 'all' && cat.id === 'all');
                  const IconComponent = cat.icon || RiPriceTag3Line;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id === 'all' ? 'all' : cat.name)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? 'bg-pink-50 dark:bg-pink-950/40 text-[#E91E63] border border-pink-200/80 dark:border-pink-900/40 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className={`text-sm transition-colors duration-200 ${isActive ? 'text-[#E91E63]' : 'text-slate-400'}`} />
                        <span>{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md transition-colors duration-200 ${isActive ? 'bg-[#E91E63] text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>
                          {cat.count}
                        </span>
                        <RiArrowRightSLine className={`text-sm transition-transform duration-200 ${isActive ? 'text-[#E91E63] translate-x-0.5' : 'text-slate-300'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Packages Grid (2/3 columns with generous width) */}
              <div className="flex-1 min-w-0">
                {filteredPackages.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm">
                    No packages found matching your selection.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-3.5">
                    {filteredPackages.map((pkg) => {
                      const isInCart = cart.some(c => String(c.id) === String(pkg.id) && c.type === 'package');
                      const inclusions = pkg.description 
                        ? pkg.description.split(',').map(s => s.trim()) 
                        : ['Hair Care', 'Treatment'];
                      const isPopular = (pkg.name || '').toLowerCase().includes('keratin');
                      const isBestValue = (pkg.name || '').toLowerCase().includes('smoothening');

                      return (
                        <div
                          key={pkg.id}
                          className={`bg-white dark:bg-[#1a1a2e] rounded-2xl border p-3.5 hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5 flex flex-col justify-between group relative overflow-hidden ${
                            isInCart 
                              ? 'border-[#E91E63] shadow-[0_4px_16px_rgba(233,30,99,0.1)]' 
                              : 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Package Model Image */}
                            <div className="relative w-16 h-22 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                              <Image
                                src={getImageUrl(pkg.image_url) || '/pos/pkg_keratin.jpg'}
                                alt={pkg.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>

                            {/* Package Details */}
                            <div className="flex-1 min-w-0 pr-1">
                              {/* Dynamic Badges */}
                              {isPopular && (
                                <span className="inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mb-1 bg-[#E91E63] text-white">
                                  Popular
                                </span>
                              )}
                              {isBestValue && (
                                <span className="inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mb-1 bg-[#4338CA] text-white">
                                  Best Value
                                </span>
                              )}
                              
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight" title={pkg.name}>
                                {pkg.name}
                              </h4>

                              {/* Service Inclusions Bullet List */}
                              <div className="mt-1 space-y-0.5">
                                {inclusions.slice(0, 3).map((inc, i) => (
                                  <p key={i} className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight flex items-start gap-1">
                                    <span className="shrink-0">•</span>
                                    <span className="line-clamp-1">{inc}</span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Bottom Row: Price & + Button */}
                          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-white/5">
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              ₹{(parseFloat(pkg.total_price || pkg.price) || 0).toLocaleString()}
                            </span>
                            {/* Flipkart / Blinkit Style Action Button */}
                            {renderItemActionButton(pkg, 'package')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      <div className="w-full lg:w-[350px] xl:w-[370px] 2xl:w-[390px] shrink-0 flex flex-col bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-100 dark:border-white/5 shadow-md overflow-hidden z-20 self-start lg:sticky lg:top-[calc(var(--spacing-header)+1rem)] lg:max-h-[calc(100vh-var(--spacing-header)-2rem)] transition-all duration-300">
        
        {/* Cart Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-white dark:bg-[#1a1a2e]">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Cart
            </h2>
            <span className="text-base font-black text-[#E91E63] transition-all duration-200">
              ({cart.reduce((sum, item) => sum + item.qty, 0)})
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Today</span>
            <span>{mounted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:04 PM'}</span>
          </div>
        </div>

        {/* Quick Assign & Discount Controls */}
        <div className="p-4 border-b border-slate-100 dark:border-white/5 grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-white/[0.02] shrink-0">
          {/* Quick Assign */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              Quick Assign
            </label>
            <div className="relative">
              <select
                value={quickAssignStaffId}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuickAssignStaffId(val);
                  // Update all cart items with this staff assignment
                  setCart(cart.map(c => ({ ...c, staff_member_id: val ? parseInt(val) : null })));
                  const matched = staffList.find(s => String(s.id) === String(val));
                  if (matched) toast.success(`Assigned cart to ${matched.first_name}`);
                }}
                style={{ colorScheme: 'dark light' }}
                className="w-full appearance-none bg-white dark:bg-[#121224] border border-slate-200 dark:border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#E91E63] cursor-pointer shadow-sm truncate transition-colors duration-200 [color-scheme:light] dark:[color-scheme:dark]"
              >
                <option value="" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Select Staff</option>
                {staffList.map(st => (
                  <option key={st.id} value={st.id} className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white py-1">
                    {st.first_name} {st.last_name || ''} ({getShiftLabel(st.shift_schedule).split(' ')[0]})
                  </option>
                ))}
              </select>
              <RiArrowDownSLine className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform duration-200" />
            </div>
          </div>

          {/* Discount Dropdown */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              Discount
            </label>
            <div className="relative">
              <select
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                style={{ colorScheme: 'dark light' }}
                className="w-full appearance-none bg-white dark:bg-[#121224] border border-slate-200 dark:border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#E91E63] cursor-pointer shadow-sm truncate transition-colors duration-200 [color-scheme:light] dark:[color-scheme:dark]"
              >
                <option value={0} className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">Select Discount</option>
                <option value={5} className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">5% Off</option>
                <option value={10} className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">10% Off</option>
                <option value={15} className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">15% Off</option>
                <option value={20} className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">20% Off</option>
              </select>
              <RiArrowDownSLine className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform duration-200" />
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 min-h-[140px] overflow-y-auto p-4 space-y-3 custom-scrollbar transition-all duration-300">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium animate-fade-in">
              Cart is currently empty.
              <p className="text-[11px] text-slate-400/80 mt-1">Click &apos;+&apos; on any service, product or package to add.</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={`${item.id}-${item.type}-${idx}`}
                className="bg-white dark:bg-[#121224] rounded-2xl border border-slate-100 dark:border-white/5 p-3 shadow-sm hover:border-slate-200 transition-all duration-200 flex flex-col gap-2 relative group"
              >
                {/* Top Row: Thumbnail, Name, Subtitle, Price with Inline Edit */}
                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                    <Image
                      src={item.image || '/pos/svc_women_haircut.png'}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.name}
                    </h5>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">
                      {item.subtitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    {editingItemId === `${item.id}-${item.type}` ? (
                      <input
                        type="number"
                        className="w-16 bg-white dark:bg-black border border-[#E91E63] rounded px-1.5 py-0.5 text-xs font-bold text-slate-900 dark:text-white outline-none transition-all"
                        value={editPriceValue}
                        onChange={(e) => setEditPriceValue(e.target.value)}
                        onBlur={() => handleEditPriceSave(item.id, item.type)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditPriceSave(item.id, item.type)}
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          ₹{((parseFloat(item.cart_price) || 0) * (item.qty || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <RiEdit2Line
                          className="text-slate-400 hover:text-[#E91E63] cursor-pointer text-xs transition-colors duration-150"
                          onClick={() => {
                            setEditingItemId(`${item.id}-${item.type}`);
                            setEditPriceValue(item.cart_price.toString());
                          }}
                          title="Edit price"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Row inside Item: Individual Staff Assign + Quantity Adjuster & Delete Trash Icon */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {(() => {
                      const itemStaff = staffList.find(s => String(s.id) === String(item.staff_member_id));
                      return (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: itemStaff?.color_code || '#E91E63' }}
                          />
                          <select
                            value={item.staff_member_id || ''}
                            onChange={(e) => {
                              const newStaffId = e.target.value ? parseInt(e.target.value) : null;
                              setCart(cart.map((c, i) => i === idx ? { ...c, staff_member_id: newStaffId } : c));
                            }}
                            style={{ colorScheme: 'dark light' }}
                            className="bg-slate-50 dark:bg-[#1a1a2e] border border-slate-200/80 dark:border-white/10 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer max-w-[125px] truncate [color-scheme:light] dark:[color-scheme:dark]"
                          >
                            <option value="" className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white">No Staff</option>
                            {staffList.map(st => (
                              <option key={st.id} value={st.id} className="bg-white dark:bg-[#1a1a2e] text-slate-900 dark:text-white py-1">
                                {st.first_name} ({getShiftLabel(st.shift_schedule).split(' ')[0]})
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium">
                      ₹{parseFloat(item.cart_price || 0).toLocaleString()}
                    </span>

                    {/* Quantity Selector: [-] 1 [+] */}
                    <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-white/5">
                      <button
                        onClick={() => updateCartQty(item.id, item.type, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 transition-colors duration-150 active:scale-90"
                      >
                        <RiSubtractLine className="text-xs" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.id, item.type, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 transition-colors duration-150 active:scale-90"
                      >
                        <RiAddLine className="text-xs" />
                      </button>
                    </div>

                    {/* Pink Trash Icon */}
                    <button
                      onClick={() => removeFromCart(item.id, item.type)}
                      className="w-6 h-6 rounded-lg text-pink-500 hover:text-red-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 flex items-center justify-center transition-all duration-150 active:scale-90"
                      title="Remove item"
                    >
                      <RiDeleteBinLine className="text-sm" />
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Coupon Code Section */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-white/5 shrink-0 bg-white dark:bg-[#1a1a2e]">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <RiTicket2Line className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E91E63] text-sm" />
              <input
                type="text"
                placeholder="Apply Coupon Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                className="w-full bg-[#f8fafc] dark:bg-[#121224] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#E91E63] transition-colors duration-200"
              />
            </div>
            <button
              onClick={handleApplyCoupon}
              className="px-4 py-2 border border-slate-200 dark:border-white/10 hover:border-[#E91E63] hover:text-[#E91E63] bg-white dark:bg-[#121224] rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Pricing Summary Breakdown */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-white/5 space-y-2 text-xs transition-all duration-200 shrink-0 bg-white dark:bg-[#1a1a2e]">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold animate-fade-in">
              <span>Discount ({discountPercent}%)</span>
              <span>
                - ₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Tax (18%)</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              ₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Total Amount
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Bottom Action Buttons: Save as Draft & Collect Payment */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 flex gap-3 bg-slate-50/50 dark:bg-white/[0.02] shrink-0">
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft || cart.length === 0}
            className="flex-1 py-3 bg-white hover:bg-pink-50/50 dark:bg-[#121224] dark:hover:bg-white/5 border border-[#E91E63] text-[#E91E63] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            <RiFileList3Line className="text-sm" />
            <span>{isSavingDraft ? 'Saving...' : 'Save as Draft'}</span>
          </button>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="flex-[1.4] py-3 bg-[#E91E63] hover:bg-[#D81B60] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(233,30,99,0.35)] transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <RiBankCardLine className="text-base" />
            <span>Collect Payment</span>
          </button>
        </div>

      </div>

      {/* ======================================================== */}
      {/* MODALS INTEGRATION */}
      {/* ======================================================== */}
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
        initialData={customerToEdit}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={(customer) => {
          selectCustomer(customer);
          toast.success(`Customer ${customer.first_name} selected!`);
        }}
      />
      
      <ViewDraftsDrawer
        isOpen={isViewDraftsOpen}
        onClose={() => setIsViewDraftsOpen(false)}
        onSelectDraft={(draft) => {
          setIsViewDraftsOpen(false);
          setSelectedCustomer({
            id: draft.customer_id,
            first_name: draft.customer_first_name,
            last_name: draft.customer_last_name,
            phone: draft.customer_phone
          });
          setCustomerQuery(`${draft.customer_first_name} ${draft.customer_last_name || ''}`);
          setCurrentDraftId(draft.id);
          setCart((draft.items || []).map(item => ({
            id: parseInt(item.item_id, 10),
            type: item.item_type || 'service',
            name: item.item_name,
            subtitle: `${item.quantity || 1} unit`,
            cart_price: parseFloat(item.unit_price) || 0,
            qty: parseInt(item.quantity, 10) || 1,
            image: '/pos/svc_women_haircut.png',
            staff_member_id: item.staff_member_id ? parseInt(item.staff_member_id, 10) : null
          })));
        }}
        onDraftDeleted={() => setDraftCount(prev => Math.max(0, prev - 1))}
      />

      <ViewInvoicesDrawer
        isOpen={isInvoicesDrawerOpen}
        onClose={() => setIsInvoicesDrawerOpen(false)}
        onSelectInvoice={(inv) => {
          setCompletedInvoice(inv);
          setIsReceiptOpen(true);
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
