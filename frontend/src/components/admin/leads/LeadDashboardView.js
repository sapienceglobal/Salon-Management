'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
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
} from 'react-icons/ri';

export default function LeadDashboardView({
  leads = [],
  stats = {},
  staffList = [],
  onAddLead,
  onFollowUp,
  onViewLead,
  onConvertLead,
  onAssignLead,
  onDeleteLead,
  onExportCSV,
}) {
  // Tab Filter in Dashboard Table matching Image 3: All Leads, New Leads, In Progress, Converted, Lost
  const [activeStageTab, setActiveStageTab] = useState('all');

  // Table filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('This Month');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active 3-dots row menu
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Stage tab filter
      if (activeStageTab !== 'all') {
        if (activeStageTab === 'new' && lead.status !== 'new') return false;
        if (activeStageTab === 'in_progress' && lead.status !== 'in_progress' && lead.status !== 'interested' && lead.status !== 'contacted') return false;
        if (activeStageTab === 'converted' && lead.status !== 'converted') return false;
        if (activeStageTab === 'lost' && lead.status !== 'lost') return false;
      }

      // Status dropdown
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;

      // Source dropdown
      if (sourceFilter !== 'all' && lead.source?.toLowerCase() !== sourceFilter.toLowerCase()) return false;

      // Staff dropdown
      if (staffFilter !== 'all' && String(lead.assigned_to) !== String(staffFilter)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = lead.name?.toLowerCase().includes(q);
        const matchesPhone = lead.phone?.toLowerCase().includes(q);
        const matchesEmail = lead.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail) return false;
      }

      return true;
    });
  }, [leads, activeStageTab, statusFilter, sourceFilter, staffFilter, searchQuery]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage]);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#0284C7] border border-sky-200">
            New
          </span>
        );
      case 'contacted':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-amber-200">
            Contacted
          </span>
        );
      case 'interested':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F3E8FF] text-[#9333EA] border border-purple-200">
            Interested
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-amber-200">
            In Progress
          </span>
        );
      case 'converted':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#16A34A] border border-emerald-200">
            Converted
          </span>
        );
      case 'lost':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFE4E6] text-[#E11D48] border border-rose-200">
            Lost
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status || 'New'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* --- Breadcrumb & Header matching Image 3 --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-1">
            <span>Leads</span>
            <span>/</span>
            <span>CRM</span>
            <span>&gt;</span>
            <span className="text-slate-800 font-bold">Leads Dashboard</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Leads Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Track, manage and convert your leads into loyal customers.
          </p>
        </div>

        {/* Top Right Action Button */}
        <div>
          <button
            type="button"
            onClick={() => onAddLead && onAddLead()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E91E63] to-[#F43F5E] hover:from-[#D81B60] hover:to-[#E11D48] text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(233,30,99,0.35)] transition-all transform active:scale-95"
          >
            <RiAddLine className="text-lg" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* --- 5 Metric Cards with percentage trends matching Image 3 --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Total Leads */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#FFF0F5] border border-pink-100/90 flex items-center gap-3.5 sm:gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#FCE7F3] flex items-center justify-center text-[#E91E63] text-2xl shrink-0 shadow-inner">
            <RiGroupLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {stats.total || 128}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 mt-0.5">
              Total Leads
            </div>
            <div className="text-[11px] font-bold text-emerald-600 mt-0.5 flex items-center gap-0.5">
              <span>↑ 12%</span>
              <span className="font-normal text-slate-400">vs last month</span>
            </div>
          </div>
        </div>

        {/* Card 2: New Leads */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#F0FDF4] border border-emerald-100/90 flex items-center gap-3.5 sm:gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#16A34A] text-2xl shrink-0 shadow-inner">
            <RiPhoneLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {stats.new || 72}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 mt-0.5">
              New Leads
            </div>
            <div className="text-[11px] font-bold text-emerald-600 mt-0.5 flex items-center gap-0.5">
              <span>↑ 18%</span>
              <span className="font-normal text-slate-400">vs last month</span>
            </div>
          </div>
        </div>

        {/* Card 3: Converted Leads */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#FFFBEB] border border-amber-100/90 flex items-center gap-3.5 sm:gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706] text-2xl shrink-0 shadow-inner">
            <RiCheckDoubleLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {stats.converted || 46}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 mt-0.5">
              Converted Leads
            </div>
            <div className="text-[11px] font-bold text-emerald-600 mt-0.5 flex items-center gap-0.5">
              <span>↑ 28%</span>
              <span className="font-normal text-slate-400">vs last month</span>
            </div>
          </div>
        </div>

        {/* Card 4: In Progress */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#FFF1F2] border border-rose-100/90 flex items-center gap-3.5 sm:gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#FFE4E6] flex items-center justify-center text-[#E11D48] text-2xl shrink-0 shadow-inner">
            <RiTimeLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {stats.in_progress || 64}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 mt-0.5">
              In Progress
            </div>
            <div className="text-[11px] font-bold text-rose-500 mt-0.5 flex items-center gap-0.5">
              <span>↓ 5%</span>
              <span className="font-normal text-slate-400">vs last month</span>
            </div>
          </div>
        </div>

        {/* Card 5: Lost Leads */}
        <div className="rounded-2xl p-4 sm:p-5 bg-[#EFF6FF] border border-blue-100/90 flex items-center gap-3.5 sm:gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#DBEAFE] flex items-center justify-center text-[#2563EB] text-2xl shrink-0 shadow-inner">
            <RiCloseLine />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {stats.lost || 18}
            </div>
            <div className="text-xs sm:text-[13px] font-semibold text-slate-600 mt-0.5">
              Lost Leads
            </div>
            <div className="text-[11px] font-bold text-rose-500 mt-0.5 flex items-center gap-0.5">
              <span>↓ 10%</span>
              <span className="font-normal text-slate-400">vs last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- 3 Analytical Cards Grid matching Image 3 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: Leads Trend Area Chart */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RiLineChartLine className="text-[#E91E63] text-lg" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Leads Trend</h3>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
            >
              <option value="This Month">This Month</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          {/* SVG Smooth Area Chart */}
          <div className="relative h-44 w-full pt-2">
            <svg viewBox="0 0 400 160" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="leadsTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E91E63" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#E91E63" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              <line x1="30" y1="20" x2="390" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" />
              <text x="12" y="24" fontSize="9" fill="#94A3B8" fontWeight="600">40</text>

              <line x1="30" y1="55" x2="390" y2="55" stroke="#F1F5F9" strokeDasharray="3 3" />
              <text x="12" y="59" fontSize="9" fill="#94A3B8" fontWeight="600">30</text>

              <line x1="30" y1="90" x2="390" y2="90" stroke="#F1F5F9" strokeDasharray="3 3" />
              <text x="12" y="94" fontSize="9" fill="#94A3B8" fontWeight="600">20</text>

              <line x1="30" y1="125" x2="390" y2="125" stroke="#F1F5F9" strokeDasharray="3 3" />
              <text x="12" y="129" fontSize="9" fill="#94A3B8" fontWeight="600">10</text>

              {/* Area fill */}
              <path
                d="M 35 125 Q 75 105, 95 90 T 155 75 T 215 95 T 275 50 T 335 65 T 390 35 L 390 145 L 35 145 Z"
                fill="url(#leadsTrendGradient)"
              />

              {/* Smooth Trend Line */}
              <path
                d="M 35 125 Q 75 105, 95 90 T 155 75 T 215 95 T 275 50 T 335 65 T 390 35"
                fill="none"
                stroke="#E91E63"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data points */}
              <circle cx="35" cy="125" r="3.5" fill="#E91E63" stroke="#FFF" strokeWidth="2" />
              <circle cx="95" cy="90" r="3.5" fill="#E91E63" stroke="#FFF" strokeWidth="2" />
              <circle cx="155" cy="75" r="3.5" fill="#E91E63" stroke="#FFF" strokeWidth="2" />
              <circle cx="215" cy="95" r="3.5" fill="#E91E63" stroke="#FFF" strokeWidth="2" />
              <circle cx="275" cy="50" r="3.5" fill="#E91E63" stroke="#FFF" strokeWidth="2" />
              <circle cx="335" cy="65" r="3.5" fill="#E91E63" stroke="#FFF" strokeWidth="2" />
              <circle cx="390" cy="35" r="3.5" fill="#E91E63" stroke="#FFF" strokeWidth="2" />

              {/* X Axis Labels */}
              <text x="25" y="155" fontSize="9" fill="#94A3B8" fontWeight="600">1 Aug</text>
              <text x="85" y="155" fontSize="9" fill="#94A3B8" fontWeight="600">5 Aug</text>
              <text x="145" y="155" fontSize="9" fill="#94A3B8" fontWeight="600">10 Aug</text>
              <text x="205" y="155" fontSize="9" fill="#94A3B8" fontWeight="600">15 Aug</text>
              <text x="265" y="155" fontSize="9" fill="#94A3B8" fontWeight="600">20 Aug</text>
              <text x="325" y="155" fontSize="9" fill="#94A3B8" fontWeight="600">25 Aug</text>
              <text x="375" y="155" fontSize="9" fill="#94A3B8" fontWeight="600">31 Aug</text>
            </svg>
          </div>
        </div>

        {/* Chart 2: Leads by Source (Donut Chart matching Image 3) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <RiPieChartLine className="text-[#E91E63] text-lg" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Leads by Source</h3>
          </div>

          <div className="flex items-center gap-4">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Segments: Website(30%), Instagram(20%), Walk-in(14%), Referral(12%), Google Ads(11%), Facebook(8%), Others(5%) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#2563EB" strokeWidth="14" strokeDasharray="71.6 238.7" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#9333EA" strokeWidth="14" strokeDasharray="47.7 238.7" strokeDashoffset="-71.6" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F97316" strokeWidth="14" strokeDasharray="33.4 238.7" strokeDashoffset="-119.3" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EC4899" strokeWidth="14" strokeDasharray="28.6 238.7" strokeDashoffset="-152.7" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#14B8A6" strokeWidth="14" strokeDasharray="26.2 238.7" strokeDashoffset="-181.3" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#6366F1" strokeWidth="14" strokeDasharray="19.1 238.7" strokeDashoffset="-207.5" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#64748B" strokeWidth="14" strokeDasharray="12 238.7" strokeDashoffset="-226.6" />
              </svg>
              {/* Donut Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 leading-none">128</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Total</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                  <span className="font-semibold">Website</span>
                </div>
                <span className="text-slate-500 font-bold">38 (30%)</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#9333EA]" />
                  <span className="font-semibold">Instagram</span>
                </div>
                <span className="text-slate-500 font-bold">26 (20%)</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                  <span className="font-semibold">Walk-in</span>
                </div>
                <span className="text-slate-500 font-bold">18 (14%)</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#EC4899]" />
                  <span className="font-semibold">Referral</span>
                </div>
                <span className="text-slate-500 font-bold">16 (12%)</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#14B8A6]" />
                  <span className="font-semibold">Google Ads</span>
                </div>
                <span className="text-slate-500 font-bold">14 (11%)</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                  <span className="font-semibold">Facebook</span>
                </div>
                <span className="text-slate-500 font-bold">10 (8%)</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#64748B]" />
                  <span className="font-semibold">Others</span>
                </div>
                <span className="text-slate-500 font-bold">6 (5%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Leads by Status (Conversion Funnel matching Image 3) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <RiFilter3Line className="text-[#E91E63] text-lg" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Leads by Status</h3>
          </div>

          <div className="flex items-center gap-5 pt-1">
            {/* SVG Funnel graphic */}
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
            <div className="flex-1 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Total Leads</span>
                <span className="font-extrabold text-slate-900">128</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Contacted</span>
                <span className="font-extrabold text-slate-900">64</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Interested</span>
                <span className="font-extrabold text-slate-900">46</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Trial / Visit</span>
                <span className="font-extrabold text-slate-900">28</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Converted</span>
                <span className="font-extrabold text-slate-900">18</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Filter Stage Tabs + Export Button matching Image 3 --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Quick Stage Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl w-fit">
          {[
            { id: 'all', label: 'All Leads' },
            { id: 'new', label: 'New Leads' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'converted', label: 'Converted' },
            { id: 'lost', label: 'Lost' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveStageTab(tab.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeStageTab === tab.id
                  ? 'bg-gradient-to-r from-[#E91E63] to-[#F43F5E] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Export Button */}
        <div>
          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            <RiDownload2Line className="text-base text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* --- Table Filters Toolbar --- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Status Dropdown */}
          <div className="relative min-w-[125px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer"
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
              className="w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer"
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
              className="w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] cursor-pointer"
            >
              <option value="all">All Staff</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name || ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium">
            <RiCalendarLine className="text-slate-400 text-base shrink-0" />
            <span>Select Date Range</span>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, phone, email..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63]"
            />
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
          </div>

          {/* Reset filter */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setSourceFilter('all');
              setStaffFilter('all');
              setSearchQuery('');
            }}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            title="Reset Filters"
          >
            <RiFilterLine className="text-base" />
          </button>
        </div>
      </div>

      {/* --- Leads Table Container matching Image 3 --- */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11.5px] uppercase font-bold text-slate-500 tracking-wider select-none">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">#</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700">Name</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700">Phone</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700">Email</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700">Source</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700">Interested In</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700">Status</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700">Assigned To</th>
                <th className="py-3.5 px-3 font-extrabold text-slate-700 whitespace-nowrap">Created On</th>
                <th className="py-3.5 px-4 font-extrabold text-slate-700 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {paginatedLeads.map((lead, idx) => {
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

                const assignedName = lead.assigned_first_name
                  ? `${lead.assigned_first_name} ${lead.assigned_last_name || ''}`.trim()
                  : lead.assigned_to_name || 'Sneha Kapoor';

                const createdFormatted = lead.created_at
                  ? new Date(lead.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '31 Aug 2026';

                return (
                  <tr key={lead.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-500 font-semibold text-xs">
                      {rowNumber}
                    </td>

                    {/* Name with initials / photo */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {lead.avatar_url ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0 ring-1 ring-slate-200">
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
                        <span className="font-bold text-slate-900 truncate max-w-[140px]">
                          {lead.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                      {lead.phone || '-'}
                    </td>

                    <td className="py-3 px-3 text-slate-600 truncate max-w-[160px]" title={lead.email}>
                      {lead.email || '-'}
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-semibold whitespace-nowrap">
                      {lead.source || 'Website'}
                    </td>

                    <td className="py-3 px-3 text-slate-700 max-w-[160px]">
                      <span className="truncate block" title={services.join(', ')}>
                        {services.length > 0 ? services.join(', ') : 'Hair Spa'}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {renderStatusBadge(lead.status)}
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                      {assignedName}
                    </td>

                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-xs">
                      {createdFormatted}
                    </td>

                    {/* Actions Column: Follow Up / View Pill Button + 3-dots */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2 relative">
                        {lead.status === 'new' || lead.status === 'in_progress' ? (
                          <button
                            type="button"
                            onClick={() => onFollowUp && onFollowUp(lead)}
                            className="px-3.5 py-1 rounded-full bg-white border border-[#E91E63] text-[#E91E63] hover:bg-[#E91E63] hover:text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                          >
                            Follow Up
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onViewLead && onViewLead(lead)}
                            className="px-3.5 py-1 rounded-full bg-white border border-slate-300 text-slate-700 hover:border-[#E91E63] hover:text-[#E91E63] font-bold text-xs transition-all shadow-xs cursor-pointer"
                          >
                            View
                          </button>
                        )}

                        {/* 3-dots Menu Button */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === lead.id ? null : lead.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <RiMore2Fill className="text-lg" />
                          </button>

                          {activeMenuId === lead.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-40 text-left animate-fadeIn">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  if (onViewLead) onViewLead(lead);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <RiInformationLine className="text-sm text-slate-400" />
                                <span>View Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  if (onFollowUp) onFollowUp(lead);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#E91E63] hover:bg-pink-50"
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
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <RiUserShared2Line className="text-sm text-slate-400" />
                                <span>Assign to Staff</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  if (onConvertLead) onConvertLead(lead);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                              >
                                <RiCheckDoubleLine className="text-sm" />
                                <span>Convert to Customer</span>
                              </button>

                              <div className="h-[1px] bg-slate-100 my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  if (onDeleteLead) onDeleteLead(lead.id);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
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
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination matching Image 3 */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div>
            Showing {filteredLeads.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
          </div>

          <div className="flex items-center gap-1.5 self-center">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              &lt;
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  currentPage === pg
                    ? 'bg-[#E91E63] text-white shadow-xs'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
