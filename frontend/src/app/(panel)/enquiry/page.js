'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { RiAddLine, RiSearchLine, RiDeleteBinLine } from 'react-icons/ri';
import AddEnquiryModal from '@/components/admin/enquiry/AddEnquiryModal';
import EnquiryProfilePanel from '@/components/admin/enquiry/EnquiryProfilePanel';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

export default function EnquiryPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [enquiryToEdit, setEnquiryToEdit] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const { user } = useAuth();
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    assigned_to: '',
    search: '',
    enquiry_date: '',
    start_date: '',
    end_date: '',
    follow_up_date: '',
    source: '',
  });

  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Derived filtered results (client-side filtering for simplicity on small datasets, 
  // but ideally would send to backend. We'll send to backend for status/assigned_to/search)
  const fetchEnquiries = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const params = {};
      if (currentFilters.status) params.status = currentFilters.status;
      if (currentFilters.assigned_to) params.assigned_to = currentFilters.assigned_to;
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.enquiry_date) params.enquiry_date = currentFilters.enquiry_date;
      if (currentFilters.start_date) params.start_date = currentFilters.start_date;
      if (currentFilters.end_date) params.end_date = currentFilters.end_date;
      if (currentFilters.follow_up_date) params.follow_up_date = currentFilters.follow_up_date;
      if (currentFilters.source) params.source = currentFilters.source;

      const res = await api.get('/leads', { params });
      setEnquiries(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.get('/staff');
      setStaffList(res.data.staff || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchEnquiries(filters);
  }, [filters, fetchEnquiries]);

  // Real-time socket listener
  useEffect(() => {
    if (!user?.business_id) return;
    
    // Connect to backend root url (strip /api/v1)
    let socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    socketUrl = socketUrl.replace('/api/v1', '');
    
    const socket = io(socketUrl);
    
    socket.emit('join_business_room', user.business_id);
    
    socket.on('new_lead', (newLead) => {
      toast.success('New Lead Received from Meta!', { icon: '🔥', duration: 5000 });
      setEnquiries(prev => [newLead, ...prev]);
    });
    
    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleDeleteLead = async (id) => {
    try {
      await api.delete(`/leads/${id}`);
      toast.success('Lead marked as inactive');
      fetchEnquiries(filters);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete lead');
    }
  };

  const handleConvertLead = async (id) => {
    try {
      await api.post(`/leads/${id}/convert`);
      toast.success('Lead converted to Customer successfully!');
      fetchEnquiries(filters);
    } catch (err) {
      console.error(err);
      toast.error('Failed to convert lead');
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Handle Search Debounce
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setFilters(prev => ({ ...prev, search: val }));
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
      contacted: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
      follow_up: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20',
      converted: 'bg-accent-green/10 text-accent-green border-accent-green/20',
      lost: 'bg-accent-red/10 text-accent-red border-accent-red/20',
    };
    const css = styles[status] || styles.new;
    return (
      <span className={`px-4 py-1.5 rounded-lg border text-[11px] font-extrabold uppercase tracking-widest inline-block min-w-[100px] text-center ${css}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full animate-[fadeOpacity_0.5s_ease_forwards]">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-2xl font-bold">Leads</h1>
        <button
          onClick={() => {
            setEnquiryToEdit(null);
            setIsAddModalOpen(true);
          }}
          className="bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors shadow-lg shadow-brand/20 flex items-center gap-2 shrink-0"
        >
          <RiAddLine className="text-lg" /> Add
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 mb-6 shrink-0 bg-admin-card p-4 rounded-xl border border-admin-border">
        
        {/* Real Backend Filters */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-bold text-admin-text-secondary uppercase tracking-wider mb-1">Enquiry Date</label>
          <select name="enquiry_date" value={filters.enquiry_date} onChange={handleFilterChange} className="w-full bg-admin-surface border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text outline-none focus:border-brand">
            <option value="">All</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {filters.enquiry_date === 'custom' && (
          <div className="flex gap-2 flex-1 min-w-[280px]">
             <div className="flex-1">
               <label className="block text-[10px] font-bold text-admin-text-secondary uppercase tracking-wider mb-1">Start Date</label>
               <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} className="w-full bg-admin-surface border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text outline-none focus:border-brand [color-scheme:dark] html[data-theme-mode='light']:![color-scheme:light]" />
             </div>
             <div className="flex-1">
               <label className="block text-[10px] font-bold text-admin-text-secondary uppercase tracking-wider mb-1">End Date</label>
               <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} className="w-full bg-admin-surface border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text outline-none focus:border-brand [color-scheme:dark] html[data-theme-mode='light']:![color-scheme:light]" />
             </div>
          </div>
        )}

        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-bold text-admin-text-secondary uppercase tracking-wider mb-1">Follow Up Date</label>
          <select name="follow_up_date" value={filters.follow_up_date} onChange={handleFilterChange} className="w-full bg-admin-surface border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text outline-none focus:border-brand">
            <option value="">All</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-bold text-admin-text-secondary uppercase tracking-wider mb-1">Enquiry Type</label>
          <select name="source" value={filters.source} onChange={handleFilterChange} className="w-full bg-admin-surface border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text outline-none focus:border-brand">
            <option value="">All</option>
            <option value="walk_in">Walk-in</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="justdial">JustDial</option>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
          </select>
        </div>

        {/* Real Backend Filters */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-bold text-admin-text-secondary uppercase tracking-wider mb-1">Select Lead Status</label>
          <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-admin-surface border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text outline-none focus:border-brand">
            <option value="">All</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="follow_up">Follow Up</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-bold text-admin-text-secondary uppercase tracking-wider mb-1">Select staff</label>
          <select name="assigned_to" value={filters.assigned_to} onChange={handleFilterChange} className="w-full bg-admin-surface border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text outline-none focus:border-brand">
            <option value="">All</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name}</option>)}
          </select>
        </div>

        <div className="flex-[1.5] min-w-[200px]">
          <label className="block text-[10px] font-bold text-admin-text-secondary uppercase tracking-wider mb-1">Name/Mobile No</label>
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted" />
            <input 
              type="text" 
              value={filters.search} 
              onChange={handleSearchChange} 
              placeholder="Search..."
              className="w-full bg-admin-surface border border-admin-border rounded-lg pl-9 pr-3 py-2 text-sm text-admin-text outline-none focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 bg-admin-card rounded-xl border border-admin-border overflow-hidden flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-10">
              <tr className="bg-admin-surface/70 text-admin-text-secondary border-b border-admin-border text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Enquiry Date</th>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Cust. No.</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Assigned To</th>
                <th className="px-6 py-4 font-semibold">Lead Status</th>
                <th className="px-6 py-4 font-semibold">Follow Up Date & Time</th>
                <th className="px-6 py-4 font-semibold">Latest Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-admin-text-muted">Loading enquiries...</td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-admin-text-muted">No enquiries found.</td>
                </tr>
              ) : (
                enquiries.map(lead => (
                  <tr 
                    key={lead.id} 
                    className="border-b border-admin-border hover:bg-admin-surface/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedEnquiry(lead)}
                  >
                    <td className="px-6 py-4 text-admin-text-secondary font-medium">{formatDate(lead.created_at)}</td>
                    <td className="px-6 py-4 font-bold">{lead.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{lead.phone || '-'}</td>
                    <td className="px-6 py-4 text-admin-text-secondary">{lead.location || '-'}</td>
                    <td className="px-6 py-4 text-admin-text-secondary font-bold uppercase text-[11px] tracking-wider">
                      {lead.assigned_first_name ? `${lead.assigned_first_name} ${lead.assigned_last_name || ''}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="px-6 py-4 text-admin-text-secondary">{formatDate(lead.follow_up_date)}</td>
                    <td className="px-6 py-4 text-admin-text-muted truncate max-w-[200px]" title={lead.notes}>{lead.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddEnquiryModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setEnquiryToEdit(null);
        }} 
        onEnquiryAdded={() => fetchEnquiries(filters)}
        enquiryToEdit={enquiryToEdit}
      />
      <EnquiryProfilePanel 
        enquiry={selectedEnquiry}
        isOpen={!!selectedEnquiry}
        onClose={() => setSelectedEnquiry(null)}
        onEdit={(enquiry) => {
          setEnquiryToEdit(enquiry);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDeleteLead}
        onConvert={handleConvertLead}
        fetchEnquiries={() => fetchEnquiries(filters)}
      />

    </div>
  );
}
