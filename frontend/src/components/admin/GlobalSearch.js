'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  RiSearchLine, 
  RiUserLine, 
  RiCalendarCheckLine, 
  RiScissorsLine, 
  RiPriceTag3Line, 
  RiTeamLine, 
  RiFileList3Line, 
  RiMoneyDollarCircleLine,
  RiChat1Line,
  RiArrowRightUpLine,
  RiLoader2Line,
  RiLinksLine
} from 'react-icons/ri';
import api from '@/lib/api';

const ICONS = {
  customers: RiUserLine,
  appointments: RiCalendarCheckLine,
  services: RiScissorsLine,
  products: RiPriceTag3Line,
  staff: RiTeamLine,
  invoices: RiFileList3Line,
  expenses: RiMoneyDollarCircleLine,
  enquiries: RiChat1Line,
  links: RiLinksLine
};

const CATEGORY_LABELS = {
  customers: 'Customers',
  appointments: 'Appointments',
  services: 'Services',
  products: 'Products',
  staff: 'Staff',
  invoices: 'Invoices',
  expenses: 'Expenses',
  enquiries: 'Enquiries',
  links: 'Quick Links'
};

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut (/) to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const input = wrapperRef.current?.querySelector('input');
        if (input) input.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data || null);
        setIsOpen(true);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (category, item) => {
    setIsOpen(false);
    setQuery('');
    
    switch (category) {
      case 'links':
        router.push(item.route);
        break;
      case 'customers':
        router.push(`/admin/customers?customer_id=${item.id}`);
        break;
      case 'appointments':
        router.push(`/admin/appointments?appointment_id=${item.id}`);
        break;
      case 'services':
        router.push(`/admin/services?category_id=${item.category_id}&service_id=${item.id}`);
        break;
      case 'products':
        router.push(`/admin/inventory?product_id=${item.id}`);
        break;
      case 'staff':
        router.push(`/admin/staff?staff_id=${item.id}`);
        break;
      case 'invoices':
        router.push(`/admin/billing?invoice_id=${item.id}`);
        break;
      case 'expenses':
        router.push(`/admin/expenses?expense_id=${item.id}`);
        break;
      case 'enquiries':
        router.push(`/admin/enquiry?enquiry_id=${item.id}`);
        break;
      default:
        break;
    }
  };

  const renderItemContent = (category, item) => {
    switch (category) {
      case 'links':
        return <div className="text-sm font-medium">{item.title}</div>;
      case 'customers':
        return (
          <div>
            <div className="text-sm font-medium">{item.first_name} {item.last_name || ''}</div>
            <div className="text-[0.65rem] text-admin-text-muted mt-0.5">{item.phone || item.email}</div>
          </div>
        );
      case 'appointments':
        return (
          <div>
            <div className="text-sm font-medium">{item.first_name} {item.last_name || ''}</div>
            <div className="text-[0.65rem] text-admin-text-muted mt-0.5">#{item.id} • {item.appointment_date}</div>
          </div>
        );
      case 'services':
        return (
          <div>
            <div className="text-sm font-medium">{item.name}</div>
            <div className="text-[0.65rem] text-admin-text-muted mt-0.5">₹{item.price}</div>
          </div>
        );
      case 'products':
        return (
          <div>
            <div className="text-sm font-medium">{item.name}</div>
            <div className="text-[0.65rem] text-admin-text-muted mt-0.5">SKU: {item.sku} • Stock: {item.stock_quantity}</div>
          </div>
        );
      case 'staff':
        return (
          <div>
            <div className="text-sm font-medium">{item.first_name} {item.last_name || ''}</div>
            <div className="text-[0.65rem] text-admin-text-muted mt-0.5">{item.role}</div>
          </div>
        );
      case 'invoices':
        return (
          <div>
            <div className="text-sm font-medium">{item.invoice_number}</div>
            <div className="text-[0.65rem] text-admin-text-muted mt-0.5">₹{item.total_amount} • {item.status}</div>
          </div>
        );
      case 'expenses':
        return (
          <div>
            <div className="text-sm font-medium">₹{item.amount} • {item.category}</div>
            <div className="text-[0.65rem] text-admin-text-muted mt-0.5 truncate max-w-[200px]">{item.notes}</div>
          </div>
        );
      case 'enquiries':
        return (
          <div>
            <div className="text-sm font-medium">{item.name}</div>
            <div className="text-[0.65rem] text-admin-text-muted mt-0.5">{item.phone} • {item.status}</div>
          </div>
        );
      default:
        return <div className="text-sm">{item.name || item.title || item.id}</div>;
    }
  };

  const hasResults = results && Object.values(results).some(arr => arr && arr.length > 0);

  return (
    <div className="relative z-50" ref={wrapperRef}>
      <div className="flex items-center gap-2.5 bg-admin-surface-light border border-admin-border rounded-full px-[18px] py-2 w-[420px] focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition-all duration-200 shadow-sm">
        {loading ? (
          <RiLoader2Line className="text-brand text-base shrink-0 animate-spin" />
        ) : (
          <RiSearchLine className="text-admin-text-muted text-base shrink-0" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.length > 1) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder="Search customers, services, bills, anything..."
          className="bg-transparent border-none text-admin-text text-sm w-full outline-none placeholder:text-admin-text-muted"
        />
        {/* Keyboard shortcut hint */}
        {!query && (
          <div className="hidden sm:flex shrink-0 items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold text-admin-text-muted bg-admin-surface border border-admin-border shadow-sm">
            /
          </div>
        )}
      </div>

      {/* Dropdown Overlay */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-[calc(100%+12px)] left-0 w-[550px] bg-admin-card border border-admin-border rounded-2xl shadow-2xl overflow-hidden animate-[fadeOpacity_0.2s_ease_forwards]">
          
          {loading && !results && (
            <div className="p-8 text-center text-admin-text-secondary text-sm flex flex-col items-center gap-3">
              <RiLoader2Line className="animate-spin text-2xl text-brand" />
              Searching everywhere...
            </div>
          )}

          {!loading && !hasResults && results && (
            <div className="p-8 text-center text-admin-text-secondary text-sm">
              <div className="w-12 h-12 bg-admin-surface-light rounded-full flex items-center justify-center mx-auto mb-3">
                <RiSearchLine className="text-xl text-admin-text-muted" />
              </div>
              No results found for &quot;<span className="text-admin-text font-semibold">{query}</span>&quot;
            </div>
          )}

          {hasResults && (
            <div className="max-h-[450px] overflow-y-auto custom-scrollbar py-3">
              {Object.entries(results).map(([category, items]) => {
                if (!items || items.length === 0) return null;
                const Icon = ICONS[category] || RiSearchLine;
                return (
                  <div key={category} className="mb-4 last:mb-0 px-3">
                    <div className="px-3 py-1.5 mb-1 text-[0.65rem] font-bold text-admin-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Icon className="text-brand/70" />
                      {CATEGORY_LABELS[category] || category}
                    </div>
                    {items.map((item, idx) => (
                      <div
                        key={item.id || item.route || idx}
                        onClick={() => handleSelect(category, item)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-admin-surface transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-admin-surface-light group-hover:bg-brand/10 group-hover:text-brand transition-colors flex items-center justify-center text-admin-text-secondary border border-admin-border group-hover:border-brand/20">
                            <Icon />
                          </div>
                          {renderItemContent(category, item)}
                        </div>
                        <RiArrowRightUpLine className="opacity-0 group-hover:opacity-100 text-brand transition-opacity" />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
