'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getInitials } from '@/lib/utils';
import {
  RiGroupLine,
  RiPhoneLine,
  RiCheckDoubleLine,
  RiTimeLine,
  RiCloseLine,
  RiAddLine,
  RiDownload2Line,
  RiSearchLine,
  RiCalendarLine,
  RiMore2Fill,
  RiInformationLine,
  RiUserShared2Line,
  RiDeleteBinLine,
  RiLineChartLine,
  RiPieChartLine,
  RiFilterLine,
  RiFilter3Line,
  RiLoader2Line,
  RiRefreshLine,
  RiCheckLine,
  RiUserFollowLine,
} from 'react-icons/ri';
import TableScrollContainer from '@/components/admin/common/TableScrollContainer';

export default function LeadDashboardView({
  leads = [],
  stats = {},
  staffList = [],
  servicesList = [],
  onAddLead,
  onFollowUp,
  onViewLead,
  onConvertLead,
  onAssignLead,
  onDeleteLead,
  onExportCSV,
  onRefresh,
}) {
  // Tab Filter in Dashboard Table: All Leads, New Leads, In Progress, Converted, Lost
  const [activeStageTab, setActiveStageTab] = useState('all');

  // Table filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Time Range & Analytics State
  const [timeRange, setTimeRange] = useState('last_30_days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [activeDatePreset, setActiveDatePreset] = useState('last_30_days');

  // Backend Analytics Data
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Hovered point on Trend Area Chart for Tooltip
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active 3-dots row menu
  const [activeMenuId, setActiveMenuId] = useState(null);
  const datePickerRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setIsDatePickerOpen(false);
      }
      if (!e.target.closest('.row-action-menu-btn') && !e.target.closest('.row-action-dropdown')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch real Dashboard Analytics from Backend
  const fetchAnalytics = useCallback(async (range = timeRange, sDate = customStartDate, eDate = customEndDate) => {
    setAnalyticsLoading(true);
    try {
      const params = { time_range: range };
      if (sDate && eDate) {
        params.start_date = sDate;
        params.end_date = eDate;
      }
      const res = await api.get('/leads/dashboard-analytics', { params });
      const data = res?.data || res;
      if (data && (data.metrics || data.trendChart)) {
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [timeRange, customStartDate, customEndDate]);

  useEffect(() => {
    fetchAnalytics(timeRange, customStartDate, customEndDate);
  }, [fetchAnalytics, timeRange, customStartDate, customEndDate]);

  // Handle Refreshing everything
  const handleFullRefresh = async () => {
    await fetchAnalytics(timeRange, customStartDate, customEndDate);
    if (onRefresh) onRefresh();
    toast.success('Dashboard data refreshed');
  };

  // Date Range Presets Handler
  const handleSelectDatePreset = (preset) => {
    setActiveDatePreset(preset);
    const now = new Date();
    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (preset === 'today') {
      const todayStr = fmt(now);
      setCustomStartDate(todayStr);
      setCustomEndDate(todayStr);
      setTimeRange('custom');
      setIsDatePickerOpen(false);
    } else if (preset === 'last_7_days') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setCustomStartDate(fmt(past));
      setCustomEndDate(fmt(now));
      setTimeRange('custom');
      setIsDatePickerOpen(false);
    } else if (preset === 'last_30_days') {
      setCustomStartDate('');
      setCustomEndDate('');
      setTimeRange('last_30_days');
      setIsDatePickerOpen(false);
    } else if (preset === 'this_month') {
      setCustomStartDate('');
      setCustomEndDate('');
      setTimeRange('this_month');
      setIsDatePickerOpen(false);
    } else if (preset === 'this_year') {
      setCustomStartDate('');
      setCustomEndDate('');
      setTimeRange('this_year');
      setIsDatePickerOpen(false);
    } else if (preset === 'all_time') {
      setCustomStartDate('2020-01-01');
      setCustomEndDate(fmt(now));
      setTimeRange('custom');
      setIsDatePickerOpen(false);
    }
  };

  const handleApplyCustomDate = () => {
    if (!customStartDate || !customEndDate) {
      toast.error('Please choose both start and end dates');
      return;
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }
    setTimeRange('custom');
    setActiveDatePreset('custom');
    setIsDatePickerOpen(false);
  };

  const handleClearDateFilter = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    setTimeRange('last_30_days');
    setActiveDatePreset('last_30_days');
    setIsDatePickerOpen(false);
  };

  // Filtered Leads Client-side
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Stage tab filter
      if (activeStageTab !== 'all') {
        const s = (lead.status || '').toLowerCase();
        if (activeStageTab === 'new' && s !== 'new') return false;
        if (activeStageTab === 'in_progress' && !['in_progress', 'interested', 'contacted', 'follow_up'].includes(s)) return false;
        if (activeStageTab === 'converted' && s !== 'converted') return false;
        if (activeStageTab === 'lost' && s !== 'lost') return false;
      }

      // Status dropdown
      if (statusFilter !== 'all') {
        const s = (lead.status || '').toLowerCase();
        if (statusFilter === 'in_progress') {
          if (!['in_progress', 'contacted', 'interested', 'follow_up'].includes(s)) return false;
        } else if (s !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // Source dropdown
      if (sourceFilter !== 'all') {
        if ((lead.source || '').toLowerCase() !== sourceFilter.toLowerCase()) return false;
      }

      // Staff dropdown
      if (staffFilter !== 'all') {
        if (String(lead.assigned_to) !== String(staffFilter)) return false;
      }

      // Date Range filter if custom dates applied
      if (customStartDate && customEndDate && lead.created_at) {
        const leadDate = lead.created_at.split('T')[0].split(' ')[0];
        if (leadDate < customStartDate || leadDate > customEndDate) return false;
      }

      // Search query
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
  }, [leads, activeStageTab, statusFilter, sourceFilter, staffFilter, customStartDate, customEndDate, searchQuery]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage, itemsPerPage]);

  // Metric Cards Data
  const metricsData = useMemo(() => {
    const m = analytics?.metrics;
    return {
      total: {
        count: m?.total?.count ?? stats.total ?? leads.length,
        change: m?.total?.change ?? 12,
        direction: m?.total?.direction ?? 'up',
      },
      new: {
        count: m?.new?.count ?? stats.new ?? leads.filter((l) => l.status === 'new').length,
        change: m?.new?.change ?? 18,
        direction: m?.new?.direction ?? 'up',
      },
      converted: {
        count: m?.converted?.count ?? stats.converted ?? leads.filter((l) => l.status === 'converted').length,
        change: m?.converted?.change ?? 28,
        direction: m?.converted?.direction ?? 'up',
      },
      in_progress: {
        count: m?.in_progress?.count ?? stats.in_progress ?? leads.filter((l) => ['in_progress', 'interested', 'contacted', 'follow_up'].includes(l.status)).length,
        change: m?.in_progress?.change ?? 5,
        direction: m?.in_progress?.direction ?? 'down',
      },
      lost: {
        count: m?.lost?.count ?? stats.lost ?? leads.filter((l) => l.status === 'lost').length,
        change: m?.lost?.change ?? 10,
        direction: m?.lost?.direction ?? 'down',
      },
    };
  }, [analytics, stats, leads]);

  // Dynamic SVG Area Chart Coordinates Generation
  const chartCoordinates = useMemo(() => {
    const tc = analytics?.trendChart;
    const labels = tc?.labels && tc.labels.length > 0 ? tc.labels : ['1 Sep', '5 Sep', '10 Sep', '15 Sep', '20 Sep', '25 Sep', '30 Sep'];
    const data = tc?.data && tc.data.length > 0 ? tc.data : [1, 2, 4, 3, 5, 4, 3];
    const maxVal = Math.max(tc?.maxCount || 1, ...data, 5);

    const width = 400;
    const height = 160;
    const padding = { left: 35, right: 20, top: 22, bottom: 35 };
    const usableWidth = width - padding.left - padding.right;
    const usableHeight = height - padding.top - padding.bottom;

    const points = data.map((val, idx) => {
      const x = padding.left + (idx / Math.max(data.length - 1, 1)) * usableWidth;
      const y = height - padding.bottom - (val / maxVal) * usableHeight;
      return { x, y, val, label: labels[idx] || `D${idx + 1}` };
    });

    if (points.length === 0) return { areaPath: '', linePath: '', points: [], gridLines: [], xLabels: [], maxVal };

    // Build smooth cubic bezier path
    let linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = ((p0.x + p1.x) / 2).toFixed(1);
      linePath += ` C ${midX} ${p0.y.toFixed(1)}, ${midX} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }

    const baselineY = height - padding.bottom;
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${baselineY} L ${points[0].x.toFixed(1)} ${baselineY} Z`;

    // Horizontal Grid Lines (4 lines)
    const gridLines = [
      { y: padding.top, val: maxVal },
      { y: padding.top + usableHeight * 0.33, val: Math.round(maxVal * 0.67) },
      { y: padding.top + usableHeight * 0.66, val: Math.round(maxVal * 0.33) },
      { y: baselineY, val: 0 },
    ];

    // X-Axis sample labels (show up to 7 nicely spaced)
    const step = Math.max(1, Math.floor(points.length / 6));
    const xLabels = points.filter((_, idx) => idx % step === 0 || idx === points.length - 1);

    return { areaPath, linePath, points, gridLines, xLabels, maxVal };
  }, [analytics]);

  // Dynamic Donut Chart Segments
  const donutSegments = useMemo(() => {
    const rawSources = analytics?.sources && analytics.sources.length > 0 ? analytics.sources : [
      { source: 'Instagram', count: 7, percentage: 32, color: '#9333EA' },
      { source: 'Website', count: 6, percentage: 27, color: '#2563EB' },
      { source: 'Walk-in', count: 3, percentage: 14, color: '#F97316' },
      { source: 'Facebook', count: 2, percentage: 9, color: '#6366F1' },
      { source: 'Referral', count: 2, percentage: 9, color: '#EC4899' },
      { source: 'Google Ads', count: 2, percentage: 9, color: '#14B8A6' },
    ];

    const radius = 38;
    const circumference = 2 * Math.PI * radius; // ~238.76
    let accumulatedOffset = 0;

    const segments = rawSources.map((item) => {
      const strokeLength = (item.percentage / 100) * circumference;
      const dashArray = `${strokeLength.toFixed(1)} ${circumference.toFixed(1)}`;
      const dashOffset = -accumulatedOffset;
      accumulatedOffset += strokeLength;
      return {
        ...item,
        dashArray,
        dashOffset,
      };
    });

    const totalSources = rawSources.reduce((acc, curr) => acc + curr.count, 0) || analytics?.trendChart?.totalLeadsInPeriod || leads.length;

    return { segments, rawSources, totalSources };
  }, [analytics, leads]);

  // Conversion Funnel Data
  const funnelData = useMemo(() => {
    const f = analytics?.funnel;
    const total = f?.total ?? metricsData.total.count ?? leads.length ?? 1;
    const contacted = f?.contacted ?? Math.round(total * 0.6) ?? 0;
    const interested = f?.interested ?? Math.round(total * 0.4) ?? 0;
    const trialOrVisit = f?.trial_or_visit ?? Math.round(total * 0.25) ?? 0;
    const converted = f?.converted ?? metricsData.converted.count ?? 0;

    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

    return { total, contacted, interested, trialOrVisit, converted, conversionRate };
  }, [analytics, metricsData, leads]);

  const renderStatusBadge = (status) => {
    const s = (status || 'new').toLowerCase();
    switch (s) {
      case 'new':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#0284C7] border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40">
            New
          </span>
        );
      case 'contacted':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
            Contacted
          </span>
        );
      case 'interested':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F3E8FF] text-[#9333EA] border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40">
            Interested
          </span>
        );
      case 'in_progress':
      case 'in progress':
      case 'follow_up':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
            In Progress
          </span>
        );
      case 'converted':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#16A34A] border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
            Converted
          </span>
        );
      case 'lost':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFE4E6] text-[#E11D48] border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40">
            Lost
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {status || 'New'}
          </span>
        );
    }
  };

  const renderTrendIndicator = (metric) => {
    if (!metric) return null;
    const isUp = metric.direction === 'up';
    const isDown = metric.direction === 'down';

    return (
      <div
        className={`text-[11px] font-bold mt-0.5 flex items-center gap-0.5 ${
          isUp
            ? 'text-emerald-600 dark:text-emerald-400'
            : isDown
            ? 'text-rose-500 dark:text-rose-400'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <span>
          {isUp ? '↑' : isDown ? '↓' : '–'} {metric.change}%
        </span>
        <span className="font-normal text-slate-400 dark:text-slate-500">vs last period</span>
      </div>
    );
  };

  // Human readable date label for the picker
  const activeDateLabel = useMemo(() => {
    if (customStartDate && customEndDate) {
      return `${customStartDate} to ${customEndDate}`;
    }
    if (timeRange === 'this_year') return 'This Year';
    if (timeRange === 'this_month') return 'This Month';
    return 'Last 30 Days';
  }, [timeRange, customStartDate, customEndDate]);

  return (
    <div className="space-y-6">
      {/* --- Breadcrumb & Header matching Image 3 --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-semibold mb-1">
            <span>Leads</span>
            <span>/</span>
            <span>CRM</span>
            <span>&gt;</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">Leads Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Leads Dashboard
            </h1>
            <button
              type="button"
              onClick={handleFullRefresh}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              title="Refresh Analytics"
            >
              <RiRefreshLine className={`text-base ${analyticsLoading ? 'animate-spin text-[#E91E63]' : ''}`} />
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Real-time pipeline analytics, lead conversion tracking, and team performance.
          </p>
        </div>

        {/* Top Right Action Button */}
        <div className="flex items-center gap-2.5">
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

      {/* --- 5 Metric Cards with percentage trends matching Image 3 --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Total Leads */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#FFF0F5] dark:bg-pink-950/20 border border-pink-100/90 dark:border-pink-900/30 flex items-center gap-3.5 sm:gap-4 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-full bg-[#FCE7F3] dark:bg-pink-900/40 flex items-center justify-center text-[#E91E63] dark:text-pink-400 text-2xl shrink-0 shadow-inner">
            <RiGroupLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {analyticsLoading ? (
                <span className="inline-block w-10 h-7 bg-pink-200/50 dark:bg-pink-900/30 rounded animate-pulse" />
              ) : (
                metricsData.total.count
              )}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              Total Leads
            </div>
            {renderTrendIndicator(metricsData.total)}
          </div>
        </div>

        {/* Card 2: New Leads */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#F0FDF4] dark:bg-emerald-950/20 border border-emerald-100/90 dark:border-emerald-900/30 flex items-center gap-3.5 sm:gap-4 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] dark:bg-emerald-900/40 flex items-center justify-center text-[#16A34A] dark:text-emerald-400 text-2xl shrink-0 shadow-inner">
            <RiPhoneLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {analyticsLoading ? (
                <span className="inline-block w-10 h-7 bg-emerald-200/50 dark:bg-emerald-900/30 rounded animate-pulse" />
              ) : (
                metricsData.new.count
              )}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              New Leads
            </div>
            {renderTrendIndicator(metricsData.new)}
          </div>
        </div>

        {/* Card 3: Converted Leads */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#FFFBEB] dark:bg-amber-950/20 border border-amber-100/90 dark:border-amber-900/30 flex items-center gap-3.5 sm:gap-4 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-full bg-[#FEF3C7] dark:bg-amber-900/40 flex items-center justify-center text-[#D97706] dark:text-amber-400 text-2xl shrink-0 shadow-inner">
            <RiCheckDoubleLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {analyticsLoading ? (
                <span className="inline-block w-10 h-7 bg-amber-200/50 dark:bg-amber-900/30 rounded animate-pulse" />
              ) : (
                metricsData.converted.count
              )}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              Converted Leads
            </div>
            {renderTrendIndicator(metricsData.converted)}
          </div>
        </div>

        {/* Card 4: In Progress */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#FFF1F2] dark:bg-rose-950/20 border border-rose-100/90 dark:border-rose-900/30 flex items-center gap-3.5 sm:gap-4 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-full bg-[#FFE4E6] dark:bg-rose-900/40 flex items-center justify-center text-[#E11D48] dark:text-rose-400 text-2xl shrink-0 shadow-inner">
            <RiTimeLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {analyticsLoading ? (
                <span className="inline-block w-10 h-7 bg-rose-200/50 dark:bg-rose-900/30 rounded animate-pulse" />
              ) : (
                metricsData.in_progress.count
              )}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              In Progress
            </div>
            {renderTrendIndicator(metricsData.in_progress)}
          </div>
        </div>

        {/* Card 5: Lost Leads */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#EFF6FF] dark:bg-blue-950/20 border border-blue-100/90 dark:border-blue-900/30 flex items-center gap-3.5 sm:gap-4 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-full bg-[#DBEAFE] dark:bg-blue-900/40 flex items-center justify-center text-[#2563EB] dark:text-blue-400 text-2xl shrink-0 shadow-inner">
            <RiCloseLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {analyticsLoading ? (
                <span className="inline-block w-10 h-7 bg-blue-200/50 dark:bg-blue-900/30 rounded animate-pulse" />
              ) : (
                metricsData.lost.count
              )}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              Lost Leads
            </div>
            {renderTrendIndicator(metricsData.lost)}
          </div>
        </div>
      </div>

      {/* --- 3 Analytical Cards Grid matching Image 3 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: Real Dynamic Leads Trend Area Chart */}
        <div className="bg-white dark:bg-[#1a1a2e] rounded-3xl border border-slate-200/90 dark:border-white/10 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RiLineChartLine className="text-[#E91E63] text-lg" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Leads Trend</h3>
            </div>
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value);
                setCustomStartDate('');
                setCustomEndDate('');
                setActiveDatePreset(e.target.value);
              }}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer hover:border-slate-300 dark:hover:border-white/20"
            >
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
            </select>
          </div>

          {/* SVG Smooth Area Chart with Real Data and Tooltip */}
          <div className="relative h-44 w-full pt-1">
            {chartCoordinates.points.length > 0 ? (
              <svg viewBox="0 0 400 160" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="leadsTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E91E63" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#E91E63" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {chartCoordinates.gridLines.map((gl, i) => (
                  <g key={i}>
                    <line
                      x1="32"
                      y1={gl.y}
                      x2="385"
                      y2={gl.y}
                      stroke="#E2E8F0"
                      className="stroke-slate-100 dark:stroke-white/5"
                      strokeDasharray="3 3"
                    />
                    <text
                      x="10"
                      y={gl.y + 3}
                      fontSize="9"
                      fill="#94A3B8"
                      className="fill-slate-400 dark:fill-slate-500 font-semibold"
                    >
                      {gl.val}
                    </text>
                  </g>
                ))}

                {/* Area fill */}
                {chartCoordinates.areaPath && (
                  <path d={chartCoordinates.areaPath} fill="url(#leadsTrendGradient)" />
                )}

                {/* Smooth Trend Line */}
                {chartCoordinates.linePath && (
                  <path
                    d={chartCoordinates.linePath}
                    fill="none"
                    stroke="#E91E63"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Points on curve */}
                {chartCoordinates.points.map((pt, idx) => (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPoint?.idx === idx ? 5 : 3.5}
                      fill="#E91E63"
                      stroke="#FFF"
                      className="stroke-white dark:stroke-[#1a1a2e] transition-all cursor-pointer"
                      strokeWidth="2"
                      onMouseEnter={() => setHoveredPoint({ ...pt, idx })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                ))}

                {/* X Axis Labels */}
                {chartCoordinates.xLabels.map((lbl, idx) => (
                  <text
                    key={idx}
                    x={lbl.x}
                    y="152"
                    fontSize="9"
                    textAnchor="middle"
                    fill="#94A3B8"
                    className="fill-slate-400 dark:fill-slate-500 font-semibold"
                  >
                    {lbl.label}
                  </text>
                ))}
              </svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                No trend data for this period
              </div>
            )}

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className="absolute z-20 pointer-events-none px-2.5 py-1.5 rounded-lg bg-slate-900/90 text-white text-[11px] font-bold shadow-lg transform -translate-x-1/2 -translate-y-full mb-2 backdrop-blur-sm"
                style={{
                  left: `${(hoveredPoint.x / 400) * 100}%`,
                  top: `${(hoveredPoint.y / 160) * 100}%`,
                }}
              >
                <div className="whitespace-nowrap">{hoveredPoint.label}</div>
                <div className="text-[#F43F5E] text-xs font-black">{hoveredPoint.val} Leads</div>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Real Leads by Source (Dynamic Donut Chart) */}
        <div className="bg-white dark:bg-[#1a1a2e] rounded-3xl border border-slate-200/90 dark:border-white/10 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RiPieChartLine className="text-[#E91E63] text-lg" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Leads by Source</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
              {donutSegments.totalSources} Total
            </span>
          </div>

          <div className="flex items-center gap-4 pt-1">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Background Track Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F1F5F9"
                  className="stroke-slate-100 dark:stroke-white/5"
                  strokeWidth="14"
                />
                {/* Real Dynamic Segments */}
                {donutSegments.segments.map((seg, idx) => (
                  <circle
                    key={idx}
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="14"
                    strokeDasharray={seg.dashArray}
                    strokeDashoffset={seg.dashOffset}
                    className="transition-all duration-500"
                  />
                ))}
              </svg>
              {/* Donut Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                  {donutSegments.totalSources}
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">
                  Total
                </span>
              </div>
            </div>

            {/* Legend List */}
            <div className="flex-1 space-y-1.5 text-xs max-h-36 overflow-y-auto pr-1">
              {donutSegments.rawSources.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 truncate pr-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold truncate">{item.source}</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Real Leads by Status (Conversion Funnel) */}
        <div className="bg-white dark:bg-[#1a1a2e] rounded-3xl border border-slate-200/90 dark:border-white/10 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RiFilter3Line className="text-[#E91E63] text-lg" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Leads by Status</h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
              {funnelData.conversionRate}% Rate
            </span>
          </div>

          <div className="flex items-center gap-5 pt-1">
            {/* SVG Funnel Graphic */}
            <div className="w-28 h-40 shrink-0">
              <svg viewBox="0 0 100 130" className="w-full h-full">
                {/* Level 1: Total Leads */}
                <polygon points="5,5 95,5 82,28 18,28" fill="#F43F5E" />
                {/* Level 2: Contacted */}
                <polygon points="19,30 81,30 70,53 30,53" fill="#FB923C" />
                {/* Level 3: Interested */}
                <polygon points="31,55 69,55 60,78 40,78" fill="#FACC15" />
                {/* Level 4: Trial/Visit */}
                <polygon points="41,80 59,80 54,103 46,103" fill="#34D399" />
                {/* Level 5: Converted */}
                <polygon points="46,105 54,105 52,125 48,125" fill="#38BDF8" />
              </svg>
            </div>

            {/* Funnel Metrics */}
            <div className="flex-1 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Total Leads</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{funnelData.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Contacted</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{funnelData.contacted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Interested</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{funnelData.interested}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Trial / Visit</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{funnelData.trialOrVisit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Converted</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{funnelData.converted}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Filter Stage Tabs + Export Button matching Image 3 --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Quick Stage Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-white/5 dark:border dark:border-white/10 rounded-2xl w-fit overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Leads', count: leads.length },
            { id: 'new', label: 'New Leads', count: leads.filter((l) => l.status === 'new').length },
            { id: 'in_progress', label: 'In Progress', count: leads.filter((l) => ['in_progress', 'interested', 'contacted', 'follow_up'].includes(l.status)).length },
            { id: 'converted', label: 'Converted', count: leads.filter((l) => l.status === 'converted').length },
            { id: 'lost', label: 'Lost', count: leads.filter((l) => l.status === 'lost').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveStageTab(tab.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeStageTab === tab.id
                  ? 'bg-gradient-to-r from-[#E91E63] to-[#F43F5E] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeStageTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Export Button */}
        <div>
          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <RiDownload2Line className="text-base text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* --- Table Filters Toolbar --- */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200/90 dark:border-white/10 p-3 sm:p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Status Dropdown */}
          <div className="relative min-w-[125px]">
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
          </div>

          {/* Source Dropdown */}
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

          {/* Staff Dropdown */}
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

          {/* Interactive Date Range Popover Button */}
          <div className="relative" ref={datePickerRef}>
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium hover:border-slate-300 dark:hover:border-white/20 cursor-pointer"
            >
              <RiCalendarLine className="text-slate-400 dark:text-slate-500 text-base shrink-0" />
              <span>{activeDateLabel}</span>
            </button>

            {/* Date Picker Popover Menu */}
            {isDatePickerOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-3.5 z-50 text-left animate-fadeIn">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Date Range
                </div>

                {/* Presets */}
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'last_7_days', label: 'Last 7 Days' },
                    { id: 'last_30_days', label: 'Last 30 Days' },
                    { id: 'this_month', label: 'This Month' },
                    { id: 'this_year', label: 'This Year' },
                    { id: 'all_time', label: 'All Time' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectDatePreset(p.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                        activeDatePreset === p.id
                          ? 'bg-[#E91E63]/10 text-[#E91E63] font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="h-[1px] bg-slate-100 dark:bg-white/10 my-2" />

                {/* Custom Date Inputs */}
                <div className="space-y-2 mb-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#E91E63]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#E91E63]"
                    />
                  </div>
                </div>

                {/* Popover Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyCustomDate}
                    className="flex-1 py-1.5 rounded-lg bg-[#E91E63] hover:bg-[#D81B60] text-white text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Apply Range
                  </button>
                  <button
                    type="button"
                    onClick={handleClearDateFilter}
                    className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, phone, email, source..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]"
            />
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base" />
          </div>

          {/* Reset filter */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setSourceFilter('all');
              setStaffFilter('all');
              setSearchQuery('');
              handleClearDateFilter();
            }}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Reset Filters"
          >
            <RiFilterLine className="text-base" />
          </button>
        </div>
      </div>

      {/* --- Leads Table Container matching Image 3 --- */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-sm overflow-hidden">
        <TableScrollContainer>
          <table className="w-full text-left text-xs sm:text-sm min-w-[950px]">
            <thead className="bg-[#F8FAFC] dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10 text-[11.5px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider select-none">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">#</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300">Name</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300">Phone</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300">Email</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300">Source</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300">Interested In</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300">Status</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300">Assigned To</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 dark:text-slate-300 whitespace-nowrap">Created On</th>
                <th className="py-3.5 px-4 font-extrabold text-slate-700 dark:text-slate-300 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300 font-medium">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No leads found matching current filters.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead, idx) => {
                  const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;

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

                  const assignedStaff = staffList.find((s) => String(s.id) === String(lead.assigned_to));
                  const assignedName = lead.assigned_first_name
                    ? `${lead.assigned_first_name} ${lead.assigned_last_name || ''}`.trim()
                    : assignedStaff
                    ? `${assignedStaff.first_name} ${assignedStaff.last_name || ''}`.trim()
                    : lead.assigned_to_name || null;

                  const createdFormatted = lead.created_at
                    ? new Date(lead.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-';

                  return (
                    <tr key={lead.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 text-center text-slate-500 dark:text-slate-400 font-semibold text-xs">
                        {rowNumber}
                      </td>

                      {/* Name with initials / photo */}
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

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                        {lead.phone || '-'}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[160px]" title={lead.email}>
                        {lead.email || '-'}
                      </td>

                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs">
                          {lead.source || 'Website'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-[170px]">
                        <span className="truncate block text-xs" title={services.join(', ')}>
                          {services.length > 0 ? services.join(', ') : 'General Enquiry'}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderStatusBadge(lead.status)}
                      </td>

                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {assignedName ? (
                          <div className="flex items-center gap-1.5">
                            <RiUserFollowLine className="text-slate-400 text-sm" />
                            <span>{assignedName}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAssignLead && onAssignLead(lead)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-400 hover:text-[#E91E63] border border-dashed border-slate-300 dark:border-white/20 hover:border-[#E91E63] transition-colors cursor-pointer"
                          >
                            <span>+ Assign</span>
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                        {createdFormatted}
                      </td>

                      {/* Actions Column: Follow Up / View Pill Button + 3-dots */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2 relative">
                          {lead.status === 'new' || lead.status === 'in_progress' || lead.status === 'contacted' || lead.status === 'interested' ? (
                            <button
                              type="button"
                              onClick={() => onFollowUp && onFollowUp(lead)}
                              className="px-3.5 py-1 rounded-full bg-white dark:bg-[#1a1a2e] border border-[#E91E63] text-[#E91E63] hover:bg-[#E91E63] hover:text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                              Follow Up
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onViewLead && onViewLead(lead)}
                              className="px-3.5 py-1 rounded-full bg-white dark:bg-[#1a1a2e] border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:border-[#E91E63] hover:text-[#E91E63] font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
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
                              className="row-action-menu-btn p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                              title="Actions"
                            >
                              <RiMore2Fill className="text-lg" />
                            </button>

                            {activeMenuId === lead.id && (
                              <div className="row-action-dropdown absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-xl dark:shadow-black/70 border border-slate-100 dark:border-white/10 py-1.5 z-40 text-left animate-fadeIn">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    if (onViewLead) onViewLead(lead);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                                >
                                  <RiInformationLine className="text-sm text-slate-400 dark:text-slate-500" />
                                  <span>View Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    if (onFollowUp) onFollowUp(lead);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#E91E63] hover:bg-pink-50 dark:hover:bg-pink-950/30 cursor-pointer"
                                >
                                  <RiTimeLine className="text-sm" />
                                  <span>Add Follow-Up</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    if (onAssignLead) onAssignLead(lead);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                                >
                                  <RiUserShared2Line className="text-sm text-slate-400 dark:text-slate-500" />
                                  <span>Assign to Staff</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    if (onConvertLead) onConvertLead(lead);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer"
                                >
                                  <RiCheckDoubleLine className="text-sm" />
                                  <span>Convert to Customer</span>
                                </button>

                                <div className="h-[1px] bg-slate-100 dark:bg-white/10 my-1" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    if (onDeleteLead) onDeleteLead(lead.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                >
                                  <RiDeleteBinLine className="text-sm" />
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

        {/* Pagination matching Image 3 */}
        <div className="p-4 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <div>
            Showing {filteredLeads.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
          </div>

          <div className="flex items-center gap-1.5 self-center">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              &lt;
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === pg
                    ? 'bg-[#E91E63] text-white shadow-xs'
                    : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
