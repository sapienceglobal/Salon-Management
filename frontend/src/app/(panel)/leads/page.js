'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { getInitials } from '@/lib/utils';
import AddLeadModal from '@/components/admin/leads/AddLeadModal';
import AssignLeadModal from '@/components/admin/leads/AssignLeadModal';
import ConvertLeadModal from '@/components/admin/leads/ConvertLeadModal';
import AddFollowUpModal from '@/components/admin/leads/AddFollowUpModal';
import LeadPipelineView from '@/components/admin/leads/LeadPipelineView';
import LeadDashboardView from '@/components/admin/leads/LeadDashboardView';
import LeadDetailsDrawer from '@/components/admin/leads/LeadDetailsDrawer';
import TableScrollContainer from '@/components/admin/common/TableScrollContainer';
import BulkActionBar from '@/components/admin/common/BulkActionBar';
import { useConfirm } from '@/context/ConfirmContext';

import {
  RiArrowLeftLine,
  RiAddLine,
  RiUpload2Line,
  RiDownload2Line,
  RiSearchLine,
  RiFilterLine,
  RiGroupLine,
  RiPhoneLine,
  RiTimeLine,
  RiCalendarCheckLine,
  RiFilter3Line,
  RiCloseLine,
  RiMore2Fill,
  RiCalendarLine,
  RiUserShared2Line,
  RiUserLine,
  RiCheckDoubleLine,
  RiDeleteBinLine,
  RiEditLine,
  RiWhatsappLine,
  RiMailLine,
  RiMapPinLine,
  RiScissorsLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiPieChartLine,
  RiBarChartBoxLine,
  RiSparklingLine,
  RiInformationLine,
  RiFileTextLine,
  RiLoader2Line,
} from 'react-icons/ri';

// --- Default Reference Leads (Matches Image 1 exactly if DB has no records) ---
const REFERENCE_LEADS = [
  {
    id: 1,
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    email: 'priya.sharma@gmail.com',
    source: 'Instagram',
    interested_services: ['Hair Spa'],
    status: 'new',
    assigned_to_name: 'Sneha Kapoor',
    next_follow_up: '06 Aug 2026 10:00 AM',
    created_at: '2026-08-31',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    location: 'Noida, Uttar Pradesh - 201301',
    preferred_branch: 'Downtown Branch',
  },
  {
    id: 2,
    name: 'Rahul Mehta',
    phone: '+91 98990 11223',
    email: 'rahul.mehta@gmail.com',
    source: 'Website',
    interested_services: ['Hair Colour'],
    status: 'contacted',
    assigned_to_name: 'Rohit Verma',
    next_follow_up: '07 Aug 2026 11:30 AM',
    created_at: '2026-08-30',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    location: 'Delhi, India',
    preferred_branch: 'Downtown Branch',
  },
  {
    id: 3,
    name: 'Neha Gupta',
    phone: '+91 98112 33456',
    email: 'neha.gupta@gmail.com',
    source: 'Google Ads',
    interested_services: ['Keratin Treatment'],
    status: 'interested',
    assigned_to_name: 'Sneha Kapoor',
    next_follow_up: '05 Aug 2026 04:00 PM',
    created_at: '2026-08-29',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    location: 'Gurgaon, Haryana',
    preferred_branch: 'Downtown Branch',
  },
  {
    id: 4,
    name: 'Karan Malhotra',
    phone: '+91 98711 44556',
    email: 'karan.malhotra@mail.com',
    source: 'Walk-in',
    interested_services: ['Haircut'],
    status: 'converted',
    assigned_to_name: 'Neha Verma',
    next_follow_up: '-',
    created_at: '2026-08-28',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    location: 'South Delhi, India',
    preferred_branch: 'Downtown Branch',
  },
  {
    id: 5,
    name: 'Aditi Singh',
    phone: '+91 99102 66778',
    email: 'aditi.singh@gmail.com',
    source: 'Facebook',
    interested_services: ['Facial'],
    status: 'in_progress',
    assigned_to_name: 'Rohit Verma',
    next_follow_up: '06 Aug 2026 12:00 PM',
    created_at: '2026-08-27',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    location: 'Noida, Uttar Pradesh',
    preferred_branch: 'Downtown Branch',
  },
  {
    id: 6,
    name: 'Simran Kaur',
    phone: '+91 98100 99887',
    email: 'simran.kaur@gmail.com',
    source: 'Referral',
    interested_services: ['Bridal Makeup'],
    status: 'new',
    assigned_to_name: 'Sneha Kapoor',
    next_follow_up: '08 Aug 2026 01:00 PM',
    created_at: '2026-08-26',
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    location: 'Chandigarh, Punjab',
    preferred_branch: 'Downtown Branch',
  },
  {
    id: 7,
    name: 'Vikram Joshi',
    phone: '+91 98985 77665',
    email: 'vikram.joshi@gmail.com',
    source: 'Website',
    interested_services: ['Smoothening'],
    status: 'lost',
    assigned_to_name: 'Neha Verma',
    next_follow_up: '-',
    created_at: '2026-08-25',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    location: 'Delhi, India',
    preferred_branch: 'Downtown Branch',
  },
  {
    id: 8,
    name: 'Riya Malhotra',
    phone: '+91 98730 55991',
    email: 'riya.malhotra@gmail.com',
    source: 'Instagram',
    interested_services: ['Manicure'],
    status: 'contacted',
    assigned_to_name: 'Rohit Verma',
    next_follow_up: '07 Aug 2026 03:00 PM',
    created_at: '2026-08-24',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    location: 'Noida, Uttar Pradesh',
    preferred_branch: 'Downtown Branch',
  },
  {
    id: 9,
    name: 'Ankit Gupta',
    phone: '+91 99551 22334',
    email: 'ankit.gupta@gmail.com',
    source: 'Google Ads',
    interested_services: ['Hair Spa'],
    status: 'in_progress',
    assigned_to_name: 'Sneha Kapoor',
    next_follow_up: '06 Aug 2026 05:00 PM',
    created_at: '2026-08-23',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    location: 'Delhi, India',
    preferred_branch: 'Downtown Branch',
  },
  {
    id: 10,
    name: 'Pooja Verma',
    phone: '+91 98123 44567',
    email: 'pooja.verma@gmail.com',
    source: 'Walk-in',
    interested_services: ['Facial'],
    status: 'new',
    assigned_to_name: 'Neha Verma',
    next_follow_up: '08 Aug 2026 11:00 AM',
    created_at: '2026-08-22',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    location: 'Ghaziabad, Uttar Pradesh',
    preferred_branch: 'Downtown Branch',
  },
];

function LeadsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'list';
  const actionParam = searchParams.get('action') || '';

  const { user } = useAuth();
  const { markAllAsRead } = useNotification();
  const { confirm } = useConfirm();

  // State
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    in_progress: 0,
    converted: 0,
    lost: 0,
  });
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [servicesList, setServicesList] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('01 Aug 2026 - 31 Aug 2026');

  // Table selection & pagination
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Horizontal Table Scroll State & Ref
  const tableScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTableScroll = useCallback(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    checkTableScroll();
    el.addEventListener('scroll', checkTableScroll, { passive: true });
    window.addEventListener('resize', checkTableScroll);
    return () => {
      el.removeEventListener('scroll', checkTableScroll);
      window.removeEventListener('resize', checkTableScroll);
    };
  }, [checkTableScroll, leads]);

  const handleScrollTable = (direction) => {
    const el = tableScrollRef.current;
    if (!el) return;
    const scrollAmount = Math.max(280, Math.floor(el.clientWidth * 0.55));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [assigningLead, setAssigningLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);
  const [viewingLead, setViewingLead] = useState(null);
  const [followingUpLead, setFollowingUpLead] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Open Add Modal if query param is set
  useEffect(() => {
    if (actionParam === 'add') {
      setEditingLead(null);
      setIsAddModalOpen(true);
    }
  }, [actionParam]);

  // Auto-clear notification badge on page visit
  useEffect(() => {
    markAllAsRead?.();
  }, [markAllAsRead]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/leads/stats');
      const data = res?.data?.data || res?.data;
      if (data && typeof data.total === 'number') {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching lead stats:', err);
    }
  }, []);

  // Fetch Staff
  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.get('/staff', { params: { active_only: true } });
      const raw = res?.data?.staff || res?.data?.data || res?.data || [];
      if (Array.isArray(raw)) {
        setStaffList(raw.filter((s) => s.is_active !== false));
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  }, []);

  // Fetch Services
  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get('/services');
      const raw = res?.data?.services || res?.data?.data || res?.data || [];
      if (Array.isArray(raw)) {
        setServicesList(raw);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  }, []);

  // Fetch Leads
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (sourceFilter && sourceFilter !== 'all') params.source = sourceFilter;
      if (serviceFilter && serviceFilter !== 'all') params.service = serviceFilter;
      if (staffFilter && staffFilter !== 'all') params.assigned_to = staffFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/leads', { params });
      const data = res?.data?.data || res?.data?.leads || res?.data || [];
      if (Array.isArray(data)) {
        setLeads(data);
      } else {
        setLeads([]);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sourceFilter, serviceFilter, staffFilter, searchQuery]);

  useEffect(() => {
    fetchStats();
    fetchStaff();
    fetchServices();
  }, [fetchStats, fetchStaff, fetchServices]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Real-time socket listener
  useEffect(() => {
    if (!user?.business_id) return;
    let socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    socketUrl = socketUrl.replace('/api/v1', '');
    const socket = io(socketUrl);

    socket.emit('join_business_room', user.business_id);
    socket.on('new_lead', (newLead) => {
      setLeads((prev) => {
        if (prev.some((l) => l.id === newLead.id)) return prev;
        return [newLead, ...prev];
      });
      fetchStats();
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.business_id, fetchStats]);

  // Close 3-dots menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.action-menu-dropdown') && !e.target.closest('.action-menu-btn')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filtered Leads Client-side
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== 'all') {
        const leadStatus = (lead.status || '').toLowerCase();
        if (statusFilter === 'in_progress') {
          if (!['in_progress', 'contacted', 'interested'].includes(leadStatus)) return false;
        } else if (leadStatus !== statusFilter.toLowerCase()) {
          return false;
        }
      }
      if (sourceFilter !== 'all') {
        if ((lead.source || '').toLowerCase() !== sourceFilter.toLowerCase()) return false;
      }
      if (serviceFilter !== 'all') {
        let servs = [];
        if (Array.isArray(lead.interested_services)) servs = lead.interested_services;
        else if (typeof lead.interested_services === 'string') {
          try {
            servs = JSON.parse(lead.interested_services);
          } catch {
            servs = [lead.interested_services];
          }
        }
        if (!servs.some((s) => s.toLowerCase().includes(serviceFilter.toLowerCase()))) return false;
      }
      if (staffFilter !== 'all') {
        const assignedId = lead.assigned_to ? String(lead.assigned_to) : '';
        if (assignedId !== staffFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (lead.name || '').toLowerCase().includes(q);
        const matchesPhone = (lead.phone || '').toLowerCase().includes(q);
        const matchesEmail = (lead.email || '').toLowerCase().includes(q);
        const matchesSource = (lead.source || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesSource) return false;
      }
      return true;
    });
  }, [leads, statusFilter, sourceFilter, serviceFilter, staffFilter, searchQuery]);

  // Paginated Leads
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage, itemsPerPage]);

  // Toggle selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeadIds(new Set(paginatedLeads.map((l) => l.id)));
    } else {
      setSelectedLeadIds(new Set());
    }
  };

  const handleSelectRow = (id) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatus = async (status) => {
    if (selectedLeadIds.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selectedLeadIds);
    try {
      await api.post('/leads/bulk-status', { ids, status });
      toast.success(`${ids.length} lead${ids.length > 1 ? 's' : ''} updated to ${status}`);
      fetchLeads();
      fetchStats();
      setSelectedLeadIds(new Set());
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status for selected leads');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkAssign = async (assignedTo) => {
    if (selectedLeadIds.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selectedLeadIds);
    try {
      await api.post('/leads/bulk-assign', { ids, assigned_to: assignedTo });
      toast.success(`${ids.length} lead${ids.length > 1 ? 's' : ''} assigned successfully`);
      fetchLeads();
      setSelectedLeadIds(new Set());
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign selected leads');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportSelected = () => {
    if (selectedLeadIds.size === 0) return;
    const selectedLeads = leads.filter((l) => selectedLeadIds.has(l.id));
    const headers = ['Name', 'Phone', 'Email', 'Source', 'Status', 'Assigned Staff', 'Created At'];
    const csvRows = [headers.join(',')];

    for (const row of selectedLeads) {
      const assigned = row.assigned_first_name
        ? `${row.assigned_first_name} ${row.assigned_last_name || ''}`.trim()
        : row.assigned_to_name || '';
      const values = [
        `"${row.name || ''}"`,
        `"${row.phone || ''}"`,
        `"${row.email || ''}"`,
        `"${row.source || ''}"`,
        `"${row.status || ''}"`,
        `"${assigned}"`,
        `"${row.created_at || ''}"`,
      ];
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `selected_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedLeads.length} selected leads`);
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.size === 0) return;
    const isOk = await confirm({
      title: 'Delete Selected Leads',
      message: `Are you sure you want to permanently delete ${selectedLeadIds.size} lead${selectedLeadIds.size > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      type: 'danger',
    });
    if (!isOk) return;

    setBulkLoading(true);
    const ids = Array.from(selectedLeadIds);
    try {
      await api.post('/leads/bulk-delete', { ids });
      toast.success(`${ids.length} lead${ids.length > 1 ? 's' : ''} deleted`);
      fetchLeads();
      fetchStats();
      setSelectedLeadIds(new Set());
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete selected leads');
    } finally {
      setBulkLoading(false);
    }
  };

  // Status Badge Helper matching Image 1
  const renderStatusBadge = (status) => {
    const s = (status || 'new').toLowerCase();
    switch (s) {
      case 'new':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-[#E0F2FE] text-[#0284C7]">
            New
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-[#FEF3C7] text-[#D97706]">
            Contacted
          </span>
        );
      case 'interested':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-[#F3E8FF] text-[#9333EA]">
            Interested
          </span>
        );
      case 'in_progress':
      case 'in progress':
      case 'follow_up':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-[#FFEDD5] text-[#EA580C]">
            In Progress
          </span>
        );
      case 'converted':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-[#DCFCE7] text-[#16A34A]">
            Converted
          </span>
        );
      case 'lost':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-[#FFE4E6] text-[#E11D48]">
            Lost
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
            {status}
          </span>
        );
    }
  };

  // Delete Lead Handler
  const handleDeleteLead = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.delete(`/leads/${leadId}`);
      toast.success('Lead deleted successfully');
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete lead');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredLeads.length) return toast.error('No leads to export');
    const headers = ['#', 'Name', 'Phone', 'Email', 'Source', 'Interested Services', 'Status', 'Assigned To', 'Created On'];
    const rows = filteredLeads.map((l, idx) => [
      idx + 1,
      `"${l.name || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.source || ''}"`,
      `"${Array.isArray(l.interested_services) ? l.interested_services.join(', ') : ''}"`,
      `"${l.status || ''}"`,
      `"${l.assigned_first_name ? `${l.assigned_first_name} ${l.assigned_last_name || ''}` : l.assigned_to_name || ''}"`,
      `"${l.created_at ? l.created_at.split('T')[0] : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Leads_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads exported successfully');
  };

  // Quick WhatsApp Handler
  const handleWhatsApp = (phone, name) => {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Hi ${name || 'there'}, greeting from our salon! How can we assist you with our services?`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#0f0f1a] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      {activeTab === 'pipeline' ? (
        <LeadPipelineView
          leads={leads}
          stats={stats}
          staffList={staffList}
          onAddLead={(initialStatus) => {
            setEditingLead(initialStatus ? { status: initialStatus } : null);
            setIsAddModalOpen(true);
          }}
          onFollowUp={(lead) => setFollowingUpLead(lead)}
          onViewLead={(lead) => setViewingLead(lead)}
          onConvertLead={(lead) => setConvertingLead(lead)}
          onAssignLead={(lead) => setAssigningLead(lead)}
          onDeleteLead={(id) => handleDeleteLead(id)}
          onRefresh={() => {
            fetchLeads();
            fetchStats();
          }}
        />
      ) : activeTab === 'dashboard' ? (
        <LeadDashboardView
          leads={leads}
          stats={stats}
          staffList={staffList}
          servicesList={servicesList}
          onAddLead={() => {
            setEditingLead(null);
            setIsAddModalOpen(true);
          }}
          onFollowUp={(lead) => setFollowingUpLead(lead)}
          onViewLead={(lead) => setViewingLead(lead)}
          onConvertLead={(lead) => setConvertingLead(lead)}
          onAssignLead={(lead) => setAssigningLead(lead)}
          onDeleteLead={(id) => handleDeleteLead(id)}
          onExportCSV={handleExportCSV}
          onRefresh={() => {
            fetchLeads();
            fetchStats();
          }}
        />
      ) : (
        <>
          {/* --- Top Header & Breadcrumb (Exact Image 1) --- */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
            <button
              onClick={() => router.push('/')}
              className="p-1 -ml-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title="Back"
            >
              <RiArrowLeftLine className="text-sm" />
            </button>
            <span className="hover:text-slate-700 dark:hover:text-white cursor-pointer" onClick={() => router.push('/leads')}>
              Leads
            </span>
            <span>/</span>
            <span className="hover:text-slate-700 dark:hover:text-white cursor-pointer" onClick={() => router.push('/leads')}>
              CRM
            </span>
            <span>&gt;</span>
            <span className="text-slate-800 dark:text-white font-bold">
              {activeTab === 'dashboard'
                ? 'Leads Dashboard'
                : activeTab === 'sources'
                ? 'Lead Sources'
                : activeTab === 'reports'
                ? 'Reports'
                : activeTab === 'follow_ups'
                ? 'Follow-ups'
                : 'Lead List'}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {activeTab === 'dashboard'
              ? 'Leads Dashboard'
              : activeTab === 'sources'
              ? 'Lead Sources & Channels'
              : activeTab === 'reports'
              ? 'Lead Performance Reports'
              : activeTab === 'follow_ups'
              ? 'Follow-up Pipeline'
              : 'Lead List'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            View, manage and convert your leads into loyal customers.
          </p>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            <RiUpload2Line className="text-base text-slate-500 dark:text-slate-400" />
            <span>Import Leads</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            <RiDownload2Line className="text-base text-slate-500 dark:text-slate-400" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingLead(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#F43F5E] hover:from-[#D81B60] hover:to-[#E11D48] text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(233,30,99,0.35)] transition-all transform active:scale-95 cursor-pointer"
          >
            <RiAddLine className="text-lg" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* --- 5 Stat Metric Cards (Exact Pastel Palette with Dark Mode Support) --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
        {/* Card 1: Total Leads */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 bg-[#FFF0F5] dark:bg-pink-950/20 border transition-all duration-200 hover:shadow-md flex items-center gap-3.5 sm:gap-4 ${
            statusFilter === 'all'
              ? 'border-[#E91E63] ring-2 ring-[#E91E63]/20 shadow-sm'
              : 'border-pink-100/90 dark:border-pink-900/30'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-[#FCE7F3] dark:bg-pink-900/40 flex items-center justify-center text-[#E91E63] text-2xl shrink-0 shadow-inner">
            <RiGroupLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {stats.total ?? leads.length}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
              Total Leads
            </div>
          </div>
        </div>

        {/* Card 2: New Leads */}
        <div
          onClick={() => setStatusFilter('new')}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 bg-[#F0FDF4] dark:bg-emerald-950/20 border transition-all duration-200 hover:shadow-md flex items-center gap-3.5 sm:gap-4 ${
            statusFilter === 'new'
              ? 'border-[#10B981] ring-2 ring-[#10B981]/20 shadow-sm'
              : 'border-emerald-100/90 dark:border-emerald-900/30'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] dark:bg-emerald-900/40 flex items-center justify-center text-[#16A34A] text-2xl shrink-0 shadow-inner">
            <RiPhoneLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {stats.new ?? 0}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
              New Leads
            </div>
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div
          onClick={() => setStatusFilter('in_progress')}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 bg-[#FFFBEB] dark:bg-amber-950/20 border transition-all duration-200 hover:shadow-md flex items-center gap-3.5 sm:gap-4 ${
            statusFilter === 'in_progress'
              ? 'border-[#F59E0B] ring-2 ring-[#F59E0B]/20 shadow-sm'
              : 'border-amber-100/90 dark:border-amber-900/30'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-[#FEF3C7] dark:bg-amber-900/40 flex items-center justify-center text-[#D97706] text-2xl shrink-0 shadow-inner">
            <RiTimeLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {stats.in_progress ?? 0}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
              In Progress
            </div>
          </div>
        </div>

        {/* Card 4: Converted */}
        <div
          onClick={() => setStatusFilter('converted')}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 bg-[#FAF5FF] dark:bg-purple-950/20 border transition-all duration-200 hover:shadow-md flex items-center gap-3.5 sm:gap-4 ${
            statusFilter === 'converted'
              ? 'border-[#8B5CF6] ring-2 ring-[#8B5CF6]/20 shadow-sm'
              : 'border-purple-100/90 dark:border-purple-900/30'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-[#F3E8FF] dark:bg-purple-900/40 flex items-center justify-center text-[#9333EA] text-2xl shrink-0 shadow-inner">
            <RiFilter3Line />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {stats.converted ?? 0}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
              Converted
            </div>
          </div>
        </div>

        {/* Card 5: Lost */}
        <div
          onClick={() => setStatusFilter('lost')}
          className={`cursor-pointer rounded-2xl p-4 sm:p-5 bg-[#FFF1F2] dark:bg-rose-950/20 border transition-all duration-200 hover:shadow-md flex items-center gap-3.5 sm:gap-4 ${
            statusFilter === 'lost'
              ? 'border-[#F43F5E] ring-2 ring-[#F43F5E]/20 shadow-sm'
              : 'border-rose-100/90 dark:border-rose-900/30'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-[#FFE4E6] dark:bg-rose-900/40 flex items-center justify-center text-[#E11D48] text-2xl shrink-0 shadow-inner">
            <RiCloseLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {stats.lost ?? 0}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
              Lost
            </div>
          </div>
        </div>
      </div>

      {/* --- Filter Toolbar (Exact 7-component Bar with Dark Mode Support) --- */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200/90 dark:border-white/10 p-3 sm:p-3.5 shadow-sm mb-5">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Status Dropdown */}
          <div className="relative min-w-[130px] flex-1 sm:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="in_progress">In Progress</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <RiFilterLine className="text-xs" />
            </div>
          </div>

          {/* Sources Dropdown */}
          <div className="relative min-w-[130px] flex-1 sm:flex-initial">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="Instagram">Instagram</option>
              <option value="Website">Website</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Facebook">Facebook</option>
              <option value="Referral">Referral</option>
              <option value="Phone">Phone</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <RiFilterLine className="text-xs" />
            </div>
          </div>

          {/* Services Dropdown */}
          <div className="relative min-w-[130px] flex-1 sm:flex-initial">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer"
            >
              <option value="all">All Services</option>
              <option value="Hair Spa">Hair Spa</option>
              <option value="Hair Colour">Hair Colour</option>
              <option value="Keratin Treatment">Keratin Treatment</option>
              <option value="Haircut">Haircut</option>
              <option value="Facial">Facial</option>
              <option value="Bridal Makeup">Bridal Makeup</option>
              <option value="Smoothening">Smoothening</option>
              <option value="Manicure">Manicure</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <RiScissorsLine className="text-xs" />
            </div>
          </div>

          {/* Staff Dropdown */}
          <div className="relative min-w-[130px] flex-1 sm:flex-initial">
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer"
            >
              <option value="all">All Staff</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.first_name} {st.last_name || ''}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <RiUserLine className="text-xs" />
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
            <RiCalendarLine className="text-slate-400 text-base shrink-0" />
            <span className="whitespace-nowrap">{dateRange}</span>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]"
            />
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <RiCloseLine className="text-sm" />
              </button>
            )}
          </div>

          {/* Filter Reset / Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setSourceFilter('all');
              setServiceFilter('all');
              setStaffFilter('all');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold text-xs sm:text-sm shadow-sm transition-all"
            title="Reset Filters"
          >
            <RiFilterLine className="text-base text-slate-500 dark:text-slate-400" />
            <span>Filter</span>
          </button>

          {/* Horizontal Scroll Quick Buttons (Top Toolbar) */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1 rounded-xl shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pl-2 pr-1 select-none hidden sm:inline">
              Scroll Table
            </span>
            <button
              type="button"
              onClick={() => handleScrollTable('left')}
              disabled={!canScrollLeft}
              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-white hover:bg-[#E91E63] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-xs cursor-pointer"
              title="Scroll table left (X-Axis)"
              aria-label="Scroll table left"
            >
              <RiArrowLeftSLine className="text-base" />
            </button>
            <button
              type="button"
              onClick={() => handleScrollTable('right')}
              disabled={!canScrollRight}
              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-white hover:bg-[#E91E63] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-xs cursor-pointer"
              title="Scroll table right (X-Axis)"
              aria-label="Scroll table right"
            >
              <RiArrowRightSLine className="text-base" />
            </button>
          </div>
        </div>
      </div>

      {/* --- Leads Table Container with Middle Floating Left & Right Scroll Buttons --- */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-sm overflow-hidden mb-5">
        <TableScrollContainer ref={tableScrollRef}>
          <table className="w-full text-left text-xs sm:text-sm min-w-[1100px]">
            {/* Table Header */}
            <thead className="bg-[#F8FAFC] dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10 text-[11.5px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider select-none">
              <tr>
                <th className="py-3.5 pl-4 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedLeads.length > 0 &&
                      paginatedLeads.every((l) => selectedLeadIds.has(l.id))
                    }
                    ref={(el) => {
                      if (el) {
                        el.indeterminate =
                          selectedLeadIds.size > 0 &&
                          !paginatedLeads.every((l) => selectedLeadIds.has(l.id));
                      }
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-[#E91E63] focus:ring-[#E91E63] cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3 w-10 text-center">#</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300">Name</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300">Phone</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300">Email</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300">Source</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300">Interested In</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300">Status</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300">Assigned To</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300 whitespace-nowrap">Next Follow-up</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300 whitespace-nowrap">Created On</th>
                <th className="py-3.5 px-4 font-extrabold text-slate-700 dark:text-slate-300 text-center">Action</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RiLoader2Line className="text-3xl animate-spin text-[#E91E63]" />
                      <span className="text-sm font-semibold">Loading leads...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RiUserShared2Line className="text-4xl text-slate-300 dark:text-slate-600" />
                      <span className="text-base font-bold text-slate-700 dark:text-slate-200">No leads found</span>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No leads match your current filter criteria. Try adjusting your search or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead, idx) => {
                  const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                  const isChecked = selectedLeadIds.has(lead.id);

                  // Extract services list
                  let services = [];
                  if (Array.isArray(lead.interested_services)) {
                    services = lead.interested_services;
                  } else if (typeof lead.interested_services === 'string') {
                    try {
                      services = JSON.parse(lead.interested_services);
                    } catch {
                      services = [lead.interested_services];
                    }
                  }

                  // Assigned staff name
                  const assignedName = lead.assigned_first_name
                    ? `${lead.assigned_first_name} ${lead.assigned_last_name || ''}`.trim()
                    : lead.assigned_to_name || '-';

                  // Format follow up
                  const followUpFormatted = lead.next_follow_up
                    ? lead.next_follow_up
                    : lead.follow_up_date
                    ? `${lead.follow_up_date} ${lead.follow_up_time || ''}`
                    : '-';

                  // Created On formatted
                  const createdFormatted = lead.created_at
                    ? new Date(lead.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '31 Aug 2026';

                  return (
                    <tr
                      key={lead.id || idx}
                      className={`hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group ${
                        isChecked ? 'bg-[#FFF0F5]/50 dark:bg-pink-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 pl-4 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectRow(lead.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-[#E91E63] focus:ring-[#E91E63] cursor-pointer"
                        />
                      </td>

                      {/* Row Index */}
                      <td className="py-3 px-3 text-center text-slate-500 dark:text-slate-400 font-semibold text-xs">
                        {rowNumber}
                      </td>

                      {/* Name with Photo Avatar */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {lead.avatar_url ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0 ring-1 ring-slate-200 dark:ring-white/10">
                              <Image
                                src={lead.avatar_url}
                                alt={lead.name}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E91E63] to-[#FB7185] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                              {getInitials(lead.name || 'Lead', '')}
                            </div>
                          )}
                          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                            {lead.name}
                          </span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                        {lead.phone || '-'}
                      </td>

                      {/* Email */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[170px]" title={lead.email}>
                        {lead.email || '-'}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                        {lead.source || '-'}
                      </td>

                      {/* Interested Services */}
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-[180px]">
                        <span className="truncate block" title={services.join(', ')}>
                          {services.length > 0 ? services.join(', ') : '-'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderStatusBadge(lead.status)}
                      </td>

                      {/* Assigned To */}
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {assignedName}
                      </td>

                      {/* Next Follow-up */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                        {followUpFormatted}
                      </td>

                      {/* Created On */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                        {createdFormatted}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2 relative">
                          {/* Follow Up or View Pill Button matching Image 1 */}
                          {lead.status === 'new' || lead.status === 'in_progress' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setFollowingUpLead(lead);
                              }}
                              className="px-3.5 py-1 rounded-full bg-white dark:bg-[#1a1a2e] border border-[#E91E63] text-[#E91E63] hover:bg-[#E91E63] hover:text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                            >
                              Follow Up
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setViewingLead(lead);
                              }}
                              className="px-3.5 py-1 rounded-full bg-white dark:bg-[#1a1a2e] border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-[#E91E63] hover:text-[#E91E63] font-bold text-xs transition-all shadow-sm cursor-pointer"
                            >
                              View
                            </button>
                          )}

                          {/* 3-dots Menu Button */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === lead.id ? null : lead.id);
                              }}
                              className="action-menu-btn p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                              title="More Options"
                            >
                              <RiMore2Fill className="text-lg" />
                            </button>

                            {/* Dropdown Popup */}
                            {activeMenuId === lead.id && (
                              <div className="action-menu-dropdown absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl dark:shadow-black/70 border border-slate-100 dark:border-white/10 py-2 z-40 text-left animate-fadeIn">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setViewingLead(lead);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-[#E91E63] transition-colors"
                                >
                                  <RiInformationLine className="text-base text-slate-400" />
                                  <span>View Lead Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setFollowingUpLead(lead);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-[13px] font-semibold text-[#E91E63] hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors"
                                >
                                  <RiCalendarCheckLine className="text-base" />
                                  <span>Add Follow-Up</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setEditingLead(lead);
                                    setIsAddModalOpen(true);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-[#E91E63] transition-colors"
                                >
                                  <RiEditLine className="text-base text-slate-400" />
                                  <span>Edit Lead</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setAssigningLead(lead);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-[#E91E63] transition-colors"
                                >
                                  <RiUserShared2Line className="text-base text-slate-400" />
                                  <span>Assign to Staff</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setConvertingLead(lead);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                                >
                                  <RiCheckDoubleLine className="text-base text-emerald-500" />
                                  <span>Convert to Customer</span>
                                </button>

                                <div className="h-[1px] bg-slate-100 dark:bg-white/5 my-1.5" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleDeleteLead(lead.id);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-[13px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                >
                                  <RiDeleteBinLine className="text-base text-rose-400" />
                                  <span>Delete Lead</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableScrollContainer>

        {/* --- Pagination Footer matching Image 1 with Dark Mode Support --- */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-100 dark:border-white/10 bg-[#F8FAFC]/50 dark:bg-white/[0.02] text-xs text-slate-500 dark:text-slate-400 font-medium">
          <div>
            Showing <span className="font-bold text-slate-700 dark:text-slate-300">1–{paginatedLeads.length}</span> of{' '}
            <span className="font-bold text-slate-700 dark:text-slate-300">{filteredLeads.length}</span> leads
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Previous Page"
            >
              <RiArrowLeftSLine className="text-base" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pg) => {
              const isActive = pg === currentPage;
              return (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-[#E91E63] text-white shadow-sm'
                      : 'border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {pg}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Next Page"
            >
              <RiArrowRightSLine className="text-base" />
            </button>
          </div>
        </div>
      </div>
        </>
      )}

      {/* --- Lead Details / Follow-up Slide Drawer --- */}
      {viewingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1a1a2e] rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-white/10 p-6 sm:p-7 relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 mb-5">
              <div className="flex items-center gap-3.5">
                {viewingLead.avatar_url ? (
                  <div className="w-13 h-13 rounded-full overflow-hidden relative ring-2 ring-pink-100 dark:ring-pink-900/40 shrink-0">
                    <Image
                      src={viewingLead.avatar_url}
                      alt={viewingLead.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#E91E63] to-[#FB7185] flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0">
                    {getInitials(viewingLead.name, '')}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{viewingLead.name}</h3>
                    {renderStatusBadge(viewingLead.status)}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Source: <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingLead.source || 'Website'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingLead(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            {/* Quick Action Contact Bar */}
            <div className="flex items-center gap-3 mb-5">
              {viewingLead.phone && (
                <>
                  <a
                    href={`tel:${viewingLead.phone}`}
                    className="flex-1 py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <RiPhoneLine className="text-base text-blue-600 dark:text-blue-400" />
                    <span>Call Lead</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleWhatsApp(viewingLead.phone, viewingLead.name)}
                    className="flex-1 py-2.5 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm"
                  >
                    <RiWhatsappLine className="text-lg text-emerald-600 dark:text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>
                </>
              )}
              {viewingLead.email && (
                <a
                  href={`mailto:${viewingLead.email}`}
                  className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <RiMailLine className="text-base text-slate-600 dark:text-slate-400" />
                  <span>Email</span>
                </a>
              )}
            </div>

            {/* Lead Details Grid */}
            <div className="grid grid-cols-2 gap-3.5 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-white/10 mb-5">
              <div>
                <span className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 block">Phone Number</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">{viewingLead.phone || '-'}</span>
              </div>
              <div>
                <span className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 block">Email Address</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block truncate">{viewingLead.email || '-'}</span>
              </div>
              <div>
                <span className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 block">Preferred Branch</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">{viewingLead.preferred_branch || 'Downtown Branch'}</span>
              </div>
              <div>
                <span className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 block">Assigned Staff</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">{viewingLead.assigned_first_name ? `${viewingLead.assigned_first_name} ${viewingLead.assigned_last_name || ''}` : viewingLead.assigned_to_name || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 block">Location</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">{viewingLead.location || 'Noida, Uttar Pradesh'}</span>
              </div>
            </div>

            {/* Interested Services */}
            <div className="mb-5">
              <span className="text-xs sm:text-[13px] font-bold text-slate-700 dark:text-slate-300 block mb-2">Interested Services</span>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(viewingLead.interested_services)
                  ? viewingLead.interested_services
                  : ['Hair Spa', 'Hair Colour']
                ).map((serv, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E91E63]/10 text-[#E91E63] border border-[#E91E63]/20 dark:bg-[#E91E63]/20 dark:text-pink-300 dark:border-[#E91E63]/30"
                  >
                    {serv}
                  </span>
                ))}
              </div>
            </div>

            {/* Notes / Follow-up activity */}
            {viewingLead.notes && (
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 mb-5">
                <span className="text-xs sm:text-[13px] font-bold text-amber-800 dark:text-amber-400 block mb-1.5">Follow-up Notes</span>
                <p className="text-xs sm:text-sm font-medium text-amber-900/90 dark:text-amber-200/90 whitespace-pre-wrap leading-relaxed">{viewingLead.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  const lead = viewingLead;
                  setViewingLead(null);
                  setAssigningLead(lead);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm text-center transition-colors"
              >
                Assign Staff
              </button>

              <button
                type="button"
                onClick={() => {
                  const lead = viewingLead;
                  setViewingLead(null);
                  setConvertingLead(lead);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm text-center shadow-md transition-all"
              >
                Convert to Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Import Leads Modal Placeholder --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1a1a2e] rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-white/10 p-6 sm:p-7 relative">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/10 mb-4">
              <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg sm:text-xl">
                <RiUpload2Line className="text-[#E91E63] text-xl" />
                <span>Import Leads (CSV)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-400"
              >
                <RiCloseLine className="text-lg" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Upload a CSV file containing your lead information: name, phone, email, source, interested services.
            </p>

            <div className="border-2 border-dashed border-slate-200 hover:border-[#E91E63] dark:border-white/15 dark:hover:border-[#E91E63] dark:bg-white/[0.02] rounded-2xl p-6 text-center cursor-pointer mb-5 transition-colors">
              <RiUpload2Line className="text-3xl text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Click to upload or drag & drop</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">CSV or Excel format (.csv)</div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success('Sample leads imported');
                  setIsImportModalOpen(false);
                  fetchLeads();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#F43F5E] text-white font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                Upload File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Add / Edit Lead Modal (Image 2) --- */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingLead(null);
        }}
        onSuccess={() => {
          fetchLeads();
          fetchStats();
        }}
        editData={editingLead}
        staffList={staffList}
        servicesList={servicesList}
      />

      {/* --- Assign Lead to Staff Modal (Image 3) --- */}
      <AssignLeadModal
        isOpen={Boolean(assigningLead)}
        onClose={() => setAssigningLead(null)}
        lead={assigningLead}
        staffList={staffList}
        onSuccess={() => {
          fetchLeads();
          fetchStats();
        }}
      />

      {/* --- Convert Lead to Customer Modal (Image 4) --- */}
      <ConvertLeadModal
        isOpen={Boolean(convertingLead)}
        onClose={() => setConvertingLead(null)}
        lead={convertingLead}
        staffList={staffList}
        servicesList={servicesList}
        onSuccess={() => {
          fetchLeads();
          fetchStats();
        }}
      />

      {/* --- Add Follow-Up Modal (Image 1) --- */}
      <AddFollowUpModal
        isOpen={Boolean(followingUpLead)}
        onClose={() => setFollowingUpLead(null)}
        lead={followingUpLead}
        staffList={staffList}
        onSuccess={() => {
          fetchLeads();
          fetchStats();
        }}
        onViewDetails={(lead) => {
          setFollowingUpLead(null);
          setViewingLead(lead);
        }}
      />

      {/* --- View Lead Details Drawer --- */}
      <LeadDetailsDrawer
        isOpen={Boolean(viewingLead)}
        onClose={() => setViewingLead(null)}
        lead={viewingLead}
        staffList={staffList}
        onEditLead={(lead) => {
          setViewingLead(null);
          setEditingLead(lead);
          setIsAddModalOpen(true);
        }}
        onFollowUp={(lead) => {
          setViewingLead(null);
          setFollowingUpLead(lead);
        }}
        onAssignLead={(lead) => {
          setViewingLead(null);
          setAssigningLead(lead);
        }}
        onConvertLead={(lead) => {
          setViewingLead(null);
          setConvertingLead(lead);
        }}
        onDeleteLead={(id) => {
          setViewingLead(null);
          handleDeleteLead(id);
        }}
      />

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedLeadIds.size}
        totalCount={leads.length}
        onClear={() => setSelectedLeadIds(new Set())}
        resourceName="lead"
        actions={[
          {
            label: 'Export CSV',
            icon: RiDownload2Line,
            onClick: handleExportSelected,
            variant: 'default',
          },
          {
            label: 'Delete',
            icon: RiDeleteBinLine,
            onClick: handleBulkDelete,
            variant: 'danger',
            loading: bulkLoading,
          },
        ]}
      >
        {/* Quick Status Changer Dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleBulkStatus(e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
          disabled={bulkLoading}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer"
        >
          <option value="" disabled className="text-slate-800">Change Status...</option>
          <option value="new" className="text-slate-800">New</option>
          <option value="contacted" className="text-slate-800">Contacted</option>
          <option value="in_progress" className="text-slate-800">In Progress</option>
          <option value="interested" className="text-slate-800">Interested</option>
          <option value="converted" className="text-slate-800">Converted</option>
          <option value="lost" className="text-slate-800">Lost</option>
        </select>

        {/* Quick Assign Staff Dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleBulkAssign(e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
          disabled={bulkLoading}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer"
        >
          <option value="" disabled className="text-slate-800">Assign Staff...</option>
          {staffList.map((st) => (
            <option key={st.id} value={st.id} className="text-slate-800">
              {st.first_name} {st.last_name || ''}
            </option>
          ))}
        </select>
      </BulkActionBar>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-slate-500 font-semibold">
            <RiLoader2Line className="text-2xl animate-spin text-[#E91E63]" />
            <span>Loading Leads CRM...</span>
          </div>
        </div>
      }
    >
      <LeadsContent />
    </Suspense>
  );
}
