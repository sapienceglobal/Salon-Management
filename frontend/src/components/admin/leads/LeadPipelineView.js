'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getInitials } from '@/lib/utils';
import TableScrollContainer from '@/components/admin/common/TableScrollContainer';
import {
  RiGroupLine,
  RiUserSharedLine,
  RiFilter3Line,
  RiCloseLine,
  RiCheckDoubleLine,
  RiSearchLine,
  RiFilterLine,
  RiCalendarLine,
  RiAddLine,
  RiPhoneLine,
  RiMailLine,
  RiWhatsappLine,
  RiMore2Fill,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiEyeLine,
  RiCalendarCheckLine,
  RiDeleteBinLine,
  RiUserShared2Line,
  RiExchangeLine,
} from 'react-icons/ri';

// Stage definitions for Kanban Pipeline matching Image 2
const PIPELINE_STAGES = [
  {
    key: 'new',
    title: 'New Lead',
    subtext: 'Recently added leads',
    headerBg: 'bg-[#FFF0F5] dark:bg-pink-950/30',
    headerBorder: 'border-pink-200/70 dark:border-pink-900/40',
    badgeBg: 'bg-[#FFE4E6] text-[#E11D48] dark:bg-pink-900/50 dark:text-pink-300',
    dotColor: 'bg-[#E11D48]',
  },
  {
    key: 'contacted',
    title: 'Contacted',
    subtext: 'Initial communication done',
    headerBg: 'bg-[#FEF9C3] dark:bg-amber-950/30',
    headerBorder: 'border-yellow-200/80 dark:border-amber-900/40',
    badgeBg: 'bg-[#FEF08A] text-[#854D0E] dark:bg-amber-900/50 dark:text-amber-300',
    dotColor: 'bg-[#CA8A04]',
  },
  {
    key: 'interested',
    title: 'Interested',
    subtext: 'Showed interest in services',
    headerBg: 'bg-[#E0F2FE] dark:bg-sky-950/30',
    headerBorder: 'border-sky-200/80 dark:border-sky-900/40',
    badgeBg: 'bg-[#BAE6FD] text-[#0369A1] dark:bg-sky-900/50 dark:text-sky-300',
    dotColor: 'bg-[#0284C7]',
  },
  {
    key: 'in_progress',
    title: 'Quotation / In Progress',
    subtext: 'Proposal or in discussion',
    headerBg: 'bg-[#DCFCE7] dark:bg-emerald-950/30',
    headerBorder: 'border-emerald-200/80 dark:border-emerald-900/40',
    badgeBg: 'bg-[#BBF7D0] text-[#15803D] dark:bg-emerald-900/50 dark:text-emerald-300',
    dotColor: 'bg-[#16A34A]',
  },
  {
    key: 'converted',
    title: 'Converted',
    subtext: 'Converted into clients',
    headerBg: 'bg-[#F3E8FF] dark:bg-purple-950/30',
    headerBorder: 'border-purple-200/80 dark:border-purple-900/40',
    badgeBg: 'bg-[#E9D5FF] text-[#6B21A8] dark:bg-purple-900/50 dark:text-purple-300',
    dotColor: 'bg-[#9333EA]',
  },
  {
    key: 'lost',
    title: 'Lost',
    subtext: 'Drop-offs / not interested',
    headerBg: 'bg-[#FFE4E6] dark:bg-rose-950/30',
    headerBorder: 'border-rose-200/80 dark:border-rose-900/40',
    badgeBg: 'bg-[#FECDD3] text-[#BE123C] dark:bg-rose-900/50 dark:text-rose-300',
    dotColor: 'bg-[#E11D48]',
  },
];

export default function LeadPipelineView({
  leads = [],
  stats = {},
  staffList = [],
  onAddLead,
  onFollowUp,
  onViewLead,
  onConvertLead,
  onAssignLead,
  onDeleteLead,
  onRefresh,
}) {
  // Filters state
  const [branchFilter, setBranchFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Date Picker Popover State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedRangePreset, setSelectedRangePreset] = useState('All Time');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Active 3-dots card menu ID
  const [activeCardMenuId, setActiveCardMenuId] = useState(null);
  const datePickerRef = useRef(null);

  // Horizontal Pipeline Scroll State & Ref
  const pipelineScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkPipelineScroll = useCallback(() => {
    const el = pipelineScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = pipelineScrollRef.current;
    if (!el) return;

    checkPipelineScroll();
    el.addEventListener('scroll', checkPipelineScroll, { passive: true });
    window.addEventListener('resize', checkPipelineScroll);

    const resizeObserver = new ResizeObserver(() => {
      checkPipelineScroll();
    });
    resizeObserver.observe(el);
    if (el.firstElementChild) {
      resizeObserver.observe(el.firstElementChild);
    }

    const timer = setTimeout(checkPipelineScroll, 120);

    return () => {
      el.removeEventListener('scroll', checkPipelineScroll);
      window.removeEventListener('resize', checkPipelineScroll);
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [checkPipelineScroll, leads]);

  const handleScrollPipeline = (direction) => {
    const el = pipelineScrollRef.current;
    if (!el) return;
    const scrollAmount = Math.max(300, Math.floor(el.clientWidth * 0.6));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setIsDatePickerOpen(false);
      }
      if (!e.target.closest('.card-action-menu-btn') && !e.target.closest('.card-action-dropdown')) {
        setActiveCardMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Real Database Metrics computed directly from leads
  const pipelineMetrics = useMemo(() => {
    const total = leads.length;
    const openLeads = leads.filter((l) => l.status === 'new').length;
    const inPipeline = leads.filter((l) => ['in_progress', 'interested', 'contacted', 'follow_up'].includes(l.status)).length;
    const converted = leads.filter((l) => l.status === 'converted').length;
    const lost = leads.filter((l) => l.status === 'lost').length;

    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;
    const lostRate = total > 0 ? ((lost / total) * 100).toFixed(1) : 0;

    return {
      total,
      openLeads,
      inPipeline,
      converted,
      lost,
      conversionRate,
      lostRate,
    };
  }, [leads]);

  // Group 100% REAL DB leads into pipeline stages
  const stageColumns = useMemo(() => {
    const columns = {};
    PIPELINE_STAGES.forEach((stage) => {
      columns[stage.key] = [];
    });

    leads.forEach((lead) => {
      // Branch filter
      if (branchFilter !== 'all' && lead.preferred_branch !== branchFilter) return;

      // Source filter
      if (sourceFilter !== 'all' && (lead.source || '').toLowerCase() !== sourceFilter.toLowerCase()) return;

      // Staff filter
      if (staffFilter !== 'all' && String(lead.assigned_to) !== String(staffFilter)) return;

      // Service / Tag filter
      if (tagFilter !== 'all') {
        let servs = [];
        if (Array.isArray(lead.interested_services)) servs = lead.interested_services;
        else if (typeof lead.interested_services === 'string') {
          try {
            servs = JSON.parse(lead.interested_services);
          } catch {
            servs = [lead.interested_services];
          }
        }
        if (!servs.some((s) => s.toLowerCase().includes(tagFilter.toLowerCase()))) return;
      }

      // Date Range filter
      if (customStartDate && customEndDate && lead.created_at) {
        const leadDate = lead.created_at.split('T')[0].split(' ')[0];
        if (leadDate < customStartDate || leadDate > customEndDate) return;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (lead.name || '').toLowerCase().includes(q);
        const matchesPhone = (lead.phone || '').toLowerCase().includes(q);
        const matchesEmail = (lead.email || '').toLowerCase().includes(q);
        const matchesSource = (lead.source || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesSource) return;
      }

      // Map status into standard Kanban columns
      let stageKey = lead.status;
      if (stageKey === 'follow_up') stageKey = 'in_progress';
      if (!columns[stageKey]) stageKey = 'new';

      let tag = lead.source || 'Website';
      if (Array.isArray(lead.interested_services) && lead.interested_services.length > 0) {
        tag = lead.interested_services[0];
      } else if (typeof lead.interested_services === 'string') {
        try {
          const parsed = JSON.parse(lead.interested_services);
          if (Array.isArray(parsed) && parsed.length > 0) tag = parsed[0];
        } catch {
          if (lead.interested_services) tag = lead.interested_services;
        }
      }

      columns[stageKey].push({
        id: lead.id,
        rawLead: lead,
        name: lead.name,
        initials: getInitials(lead.name || 'Lead', ''),
        phone: lead.phone || '-',
        email: lead.email || '',
        avatar_url: lead.avatar_url || null,
        date: lead.created_at
          ? new Date(lead.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : '-',
        tag: tag,
        tagColor:
          stageKey === 'lost'
            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40'
            : stageKey === 'converted'
            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/40'
            : 'bg-pink-50 text-[#E91E63] border-pink-200 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-800/40',
      });
    });

    return columns;
  }, [leads, branchFilter, sourceFilter, staffFilter, tagFilter, customStartDate, customEndDate, searchQuery]);

  // Real Backend Stage Movement
  const handleMoveStage = async (leadId, newStage) => {
    try {
      await api.put(`/leads/${leadId}`, { status: newStage });
      toast.success(`Lead moved to ${newStage.replace('_', ' ')}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update lead status');
    }
  };

  const handleWhatsApp = (phone, name) => {
    if (!phone) return;
    const clean = phone.replace(/[^\d+]/g, '');
    const msg = encodeURIComponent(`Hi ${name || 'there'}, greeting from our salon regarding your enquiry!`);
    window.open(`https://wa.me/${clean.replace('+', '')}?text=${msg}`, '_blank');
  };

  const handleSelectDatePreset = (preset) => {
    setSelectedRangePreset(preset);
    const now = new Date();
    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (preset === 'Today') {
      const todayStr = fmt(now);
      setCustomStartDate(todayStr);
      setCustomEndDate(todayStr);
      setIsDatePickerOpen(false);
    } else if (preset === 'Last 7 Days') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setCustomStartDate(fmt(past));
      setCustomEndDate(fmt(now));
      setIsDatePickerOpen(false);
    } else if (preset === 'Last 30 Days') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setCustomStartDate(fmt(past));
      setCustomEndDate(fmt(now));
      setIsDatePickerOpen(false);
    } else if (preset === 'This Month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setCustomStartDate(fmt(first));
      setCustomEndDate(fmt(last));
      setIsDatePickerOpen(false);
    } else if (preset === 'All Time') {
      setCustomStartDate('');
      setCustomEndDate('');
      setIsDatePickerOpen(false);
    }
  };

  const activeDateLabel = useMemo(() => {
    if (customStartDate && customEndDate) {
      return `${customStartDate} to ${customEndDate}`;
    }
    return selectedRangePreset;
  }, [customStartDate, customEndDate, selectedRangePreset]);

  return (
    <div className="space-y-6">
      {/* --- Breadcrumb & Header matching Image 2 --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-semibold mb-1">
            <span>Leads</span>
            <span>/</span>
            <span>CRM</span>
            <span>&gt;</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">Lead Status / Pipeline</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Lead Status / Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Track and manage your leads across real Kanban conversion stages in real-time.
          </p>
        </div>

        {/* Top Right Action Button */}
        <div>
          <button
            type="button"
            onClick={() => onAddLead && onAddLead()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#F43F5E] hover:from-[#D81B60] hover:to-[#E11D48] text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(233,30,99,0.35)] transition-all transform active:scale-95 cursor-pointer"
          >
            <RiAddLine className="text-lg" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* --- 5 Real Metric Cards matching Image 2 --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Total Leads */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#FFF0F5] dark:bg-pink-950/20 border border-pink-100/90 dark:border-pink-900/30 flex items-center gap-3.5 sm:gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#FCE7F3] dark:bg-pink-900/40 flex items-center justify-center text-[#E91E63] dark:text-pink-400 text-2xl shrink-0 shadow-inner">
            <RiGroupLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {pipelineMetrics.total}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              Total Leads
            </div>
          </div>
        </div>

        {/* Card 2: Open Leads */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#F0FDF4] dark:bg-emerald-950/20 border border-emerald-100/90 dark:border-emerald-900/30 flex items-center gap-3.5 sm:gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] dark:bg-emerald-900/40 flex items-center justify-center text-[#16A34A] dark:text-emerald-400 text-2xl shrink-0 shadow-inner">
            <RiUserSharedLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {pipelineMetrics.openLeads}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              Open Leads
            </div>
          </div>
        </div>

        {/* Card 3: In Pipeline */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#EFF6FF] dark:bg-blue-950/20 border border-blue-100/90 dark:border-blue-900/30 flex items-center gap-3.5 sm:gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#DBEAFE] dark:bg-blue-900/40 flex items-center justify-center text-[#2563EB] dark:text-blue-400 text-2xl shrink-0 shadow-inner">
            <RiFilter3Line />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {pipelineMetrics.inPipeline}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              In Pipeline
            </div>
            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {pipelineMetrics.conversionRate}% Conversion
            </div>
          </div>
        </div>

        {/* Card 4: Converted */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#FAF5FF] dark:bg-purple-950/20 border border-purple-100/90 dark:border-purple-900/30 flex items-center gap-3.5 sm:gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#F3E8FF] dark:bg-purple-900/40 flex items-center justify-center text-[#9333EA] dark:text-purple-400 text-2xl shrink-0 shadow-inner">
            <RiCheckDoubleLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {pipelineMetrics.converted}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              Converted
            </div>
            <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
              {pipelineMetrics.conversionRate}% Rate
            </div>
          </div>
        </div>

        {/* Card 5: Lost */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#FFF1F2] dark:bg-rose-950/20 border border-rose-100/90 dark:border-rose-900/30 flex items-center gap-3.5 sm:gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#FFE4E6] dark:bg-rose-900/40 flex items-center justify-center text-[#E11D48] dark:text-rose-400 text-2xl shrink-0 shadow-inner">
            <RiCloseLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {pipelineMetrics.lost}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              Lost
            </div>
            <div className="text-[11px] font-bold text-rose-500 dark:text-rose-400 mt-0.5">
              {pipelineMetrics.lostRate}%
            </div>
          </div>
        </div>
      </div>

      {/* --- Filter Toolbar with Popover --- */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200/90 dark:border-white/10 p-3 sm:p-3.5 shadow-sm relative">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Branch */}
          <div className="relative min-w-[125px]">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer"
            >
              <option value="all">All Branches</option>
              <option value="Downtown Branch">Downtown Branch</option>
              <option value="Central Plaza">Central Plaza</option>
            </select>
          </div>

          {/* Sources */}
          <div className="relative min-w-[125px]">
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
            </select>
          </div>

          {/* Staff */}
          <div className="relative min-w-[125px]">
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer"
            >
              <option value="all">All Staff</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name || ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="relative min-w-[120px]">
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer"
            >
              <option value="all">All Services</option>
              <option value="Hair Spa">Hair Spa</option>
              <option value="Haircut">Haircut</option>
              <option value="Hair Colour">Hair Colour</option>
              <option value="Facial">Facial</option>
              <option value="Bridal">Bridal Makeup</option>
              <option value="Keratin">Keratin Treatment</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads in pipeline..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]"
            />
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base" />
          </div>

          {/* Date Range Popover */}
          <div className="relative" ref={datePickerRef}>
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-[#E91E63] text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
            >
              <RiCalendarLine className="text-slate-400 dark:text-slate-500 text-base shrink-0" />
              <span>{activeDateLabel}</span>
            </button>

            {isDatePickerOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-4 min-w-[260px] animate-fadeIn">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Filter by Period
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {['All Time', 'Today', 'Last 7 Days', 'Last 30 Days', 'This Month'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectDatePreset(preset)}
                      className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        selectedRangePreset === preset
                          ? 'bg-[#E91E63]/10 text-[#E91E63] font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={() => {
              setBranchFilter('all');
              setSourceFilter('all');
              setStaffFilter('all');
              setTagFilter('all');
              setSearchQuery('');
              handleSelectDatePreset('All Time');
            }}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Reset Filters"
          >
            <RiFilterLine className="text-base" />
          </button>

          {/* Horizontal Scroll Quick Buttons (Top Toolbar) */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-1 rounded-xl shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pl-2 pr-1 select-none hidden sm:inline">
              Scroll Pipeline
            </span>
            <button
              type="button"
              onClick={() => handleScrollPipeline('left')}
              disabled={!canScrollLeft}
              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-white hover:bg-[#E91E63] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-xs cursor-pointer"
              title="Scroll pipeline left (X-Axis)"
              aria-label="Scroll pipeline left"
            >
              <RiArrowLeftSLine className="text-base" />
            </button>
            <button
              type="button"
              onClick={() => handleScrollPipeline('right')}
              disabled={!canScrollRight}
              className="w-7 h-7 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-white hover:bg-[#E91E63] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-xs cursor-pointer"
              title="Scroll pipeline right (X-Axis)"
              aria-label="Scroll pipeline right"
            >
              <RiArrowRightSLine className="text-base" />
            </button>
          </div>
        </div>
      </div>

      {/* --- Real Kanban Pipeline Columns with Floating Scroll Indicators --- */}
      <TableScrollContainer
        ref={pipelineScrollRef}
        innerClassName="pb-4"
        scrollStep={320}
        leftGradientClass="bg-gradient-to-r from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent dark:from-[#0f0f1a] dark:via-[#0f0f1a]/90 dark:to-transparent"
        rightGradientClass="bg-gradient-to-l from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent dark:from-[#0f0f1a] dark:via-[#0f0f1a]/90 dark:to-transparent"
      >
        <div className="flex gap-4 min-w-[1280px]">
          {PIPELINE_STAGES.map((stage, stageIdx) => {
            const cards = stageColumns[stage.key] || [];

            return (
              <div
                key={stage.key}
                className="w-72 shrink-0 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-3xl p-3 flex flex-col gap-3 min-h-[620px]"
              >
                {/* Column Header */}
                <div
                  className={`p-3 rounded-2xl ${stage.headerBg} border ${stage.headerBorder} flex flex-col gap-1`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`} />
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm tracking-tight">
                        {stage.title}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-black ${stage.badgeBg}`}
                    >
                      {cards.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                    {stage.subtext}
                  </p>
                </div>

                {/* Cards List */}
                <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[680px] pr-0.5">
                  {cards.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                      <p>No leads in {stage.title}</p>
                    </div>
                  ) : (
                    cards.map((card) => {
                      const isMenuOpen = activeCardMenuId === card.id;

                      return (
                        <div
                          key={card.id}
                          className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200/90 dark:border-white/10 hover:border-pink-300 dark:hover:border-pink-500/40 p-3.5 shadow-xs hover:shadow-md transition-all relative group cursor-pointer"
                          onClick={() => onViewLead && onViewLead(card.rawLead)}
                        >
                          {/* Top: Avatar + Name + 3-dots */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {card.avatar_url ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0 ring-1 ring-slate-200 dark:ring-white/10">
                                  <Image
                                    src={card.avatar_url}
                                    alt={card.name}
                                    fill
                                    sizes="32px"
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E91E63]/20 to-[#FB7185]/30 text-[#E91E63] font-bold text-xs flex items-center justify-center shrink-0 border border-[#E91E63]/30">
                                  {card.initials}
                                </div>
                              )}
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                {card.name}
                              </span>
                            </div>

                            {/* 3-dots menu */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCardMenuId(isMenuOpen ? null : card.id)
                                }
                                className="card-action-menu-btn p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                              >
                                <RiMore2Fill className="text-base" />
                              </button>

                              {/* Dropdown Menu */}
                              {isMenuOpen && (
                                <div className="card-action-dropdown absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-xl dark:shadow-black/70 border border-slate-100 dark:border-white/10 py-1.5 z-40 text-left animate-fadeIn">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCardMenuId(null);
                                      if (onViewLead) onViewLead(card.rawLead);
                                    }}
                                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                                  >
                                    <RiEyeLine className="text-sm text-slate-400 dark:text-slate-500" />
                                    <span>View Details</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCardMenuId(null);
                                      if (onFollowUp) onFollowUp(card.rawLead);
                                    }}
                                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#E91E63] hover:bg-pink-50 dark:hover:bg-pink-950/30"
                                  >
                                    <RiCalendarCheckLine className="text-sm" />
                                    <span>Add Follow-Up</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCardMenuId(null);
                                      if (onAssignLead) onAssignLead(card.rawLead);
                                    }}
                                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                                  >
                                    <RiUserShared2Line className="text-sm text-slate-400 dark:text-slate-500" />
                                    <span>Assign to Staff</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCardMenuId(null);
                                      if (onConvertLead) onConvertLead(card.rawLead);
                                    }}
                                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  >
                                    <RiCheckDoubleLine className="text-sm" />
                                    <span>Convert to Customer</span>
                                  </button>

                                  <div className="h-[1px] bg-slate-100 dark:bg-white/10 my-1" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCardMenuId(null);
                                      if (onDeleteLead) onDeleteLead(card.rawLead?.id || card.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                  >
                                    <RiDeleteBinLine className="text-sm" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Phone Number */}
                          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2.5">
                            {card.phone}
                          </div>

                          {/* Quick Contact Action Icons (Phone, Mail, WhatsApp) */}
                          <div
                            className="flex items-center gap-2 mb-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a
                              href={`tel:${card.phone}`}
                              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center text-xs transition-colors"
                              title="Call"
                            >
                              <RiPhoneLine />
                            </a>

                            {card.email && (
                              <a
                                href={`mailto:${card.email}`}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs transition-colors"
                                title="Email"
                              >
                                <RiMailLine />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleWhatsApp(card.phone, card.name)}
                              className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs transition-colors cursor-pointer"
                              title="WhatsApp"
                            >
                              <RiWhatsappLine />
                            </button>

                            {/* Quick Stage Mover Selector */}
                            <div className="ml-auto flex items-center gap-1">
                              {stageIdx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveStage(card.rawLead.id, PIPELINE_STAGES[stageIdx - 1].key)}
                                  className="p-1 rounded-md bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-xs transition-colors"
                                  title={`Move to ${PIPELINE_STAGES[stageIdx - 1].title}`}
                                >
                                  <RiArrowLeftSLine />
                                </button>
                              )}
                              {stageIdx < PIPELINE_STAGES.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveStage(card.rawLead.id, PIPELINE_STAGES[stageIdx + 1].key)}
                                  className="p-1 rounded-md bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-xs transition-colors"
                                  title={`Move to ${PIPELINE_STAGES[stageIdx + 1].title}`}
                                >
                                  <RiArrowRightSLine />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Bottom Row: Date + Source / Service Tag */}
                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-white/10">
                            <span className="text-slate-400 dark:text-slate-500 font-medium">{card.date}</span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${card.tagColor}`}
                            >
                              {card.tag}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Column Bottom + Add Lead Button */}
                <button
                  type="button"
                  onClick={() => onAddLead && onAddLead(stage.key)}
                  className="w-full py-2.5 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 hover:border-[#E91E63] dark:hover:border-[#E91E63] hover:text-[#E91E63] dark:hover:text-[#E91E63] text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all bg-white dark:bg-[#1a1a2e]/60 hover:bg-pink-50/50 dark:hover:bg-pink-950/20 shadow-xs cursor-pointer"
                >
                  <RiAddLine className="text-base" />
                  <span>Add Lead</span>
                </button>
              </div>
            );
          })}
        </div>
      </TableScrollContainer>
    </div>
  );
}
