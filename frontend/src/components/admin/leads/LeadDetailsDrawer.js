'use client';

import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { getInitials } from '@/lib/utils';
import { useScrollLock } from '@/hooks/useScrollLock';
import {
  RiCloseLine,
  RiPhoneLine,
  RiMailLine,
  RiWhatsappLine,
  RiCalendarLine,
  RiTimeLine,
  RiMapPinLine,
  RiUserLine,
  RiUserShared2Line,
  RiCheckDoubleLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCalendarCheckLine,
  RiScissorsLine,
  RiStore2Line,
  RiInformationLine,
  RiFileTextLine,
  RiSparklingLine,
  RiHistoryLine,
} from 'react-icons/ri';

export default function LeadDetailsDrawer({
  isOpen,
  onClose,
  lead,
  staffList = [],
  onEditLead,
  onFollowUp,
  onAssignLead,
  onConvertLead,
  onDeleteLead,
}) {
  const [mounted, setMounted] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useScrollLock(isRendered);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Smooth entrance & exit animations
  useEffect(() => {
    let timer;
    if (isOpen && lead) {
      setIsRendered(true);
      // Double rAF / short timeout ensures the browser renders the initial translate-x-full state
      // before transitioning to translate-x-0
      timer = setTimeout(() => {
        setIsVisible(true);
      }, 25);
    } else {
      setIsVisible(false);
      timer = setTimeout(() => {
        setIsRendered(false);
      }, 320);
    }
    return () => clearTimeout(timer);
  }, [isOpen, lead]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isVisible) handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  // Parse services
  const services = useMemo(() => {
    if (!lead?.interested_services) return [];
    if (Array.isArray(lead.interested_services)) return lead.interested_services;
    try {
      const parsed = JSON.parse(lead.interested_services);
      return Array.isArray(parsed) ? parsed : [lead.interested_services];
    } catch {
      return [lead.interested_services];
    }
  }, [lead]);

  // Parse notes / history timeline
  const activityLogs = useMemo(() => {
    if (!lead?.notes) return [];
    const lines = lead.notes.split('\n').filter((l) => l.trim().length > 0);
    return lines.map((line, idx) => {
      const isLog = line.startsWith('[Follow-Up') || line.startsWith('[Staff Assigned') || line.startsWith('[Lead Converted');
      return {
        id: idx,
        text: line,
        isLog,
      };
    });
  }, [lead]);

  if (!isRendered || !mounted || !lead) return null;

  // Find assigned staff
  const assignedStaff = staffList.find((s) => String(s.id) === String(lead.assigned_to));
  const assignedName = lead.assigned_first_name
    ? `${lead.assigned_first_name} ${lead.assigned_last_name || ''}`.trim()
    : assignedStaff
    ? `${assignedStaff.first_name} ${assignedStaff.last_name || ''}`.trim()
    : lead.assigned_to_name || null;

  const renderStatusBadge = (status) => {
    const s = (status || 'new').toLowerCase();
    switch (s) {
      case 'new':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#0284C7] border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40">
            New Lead
          </span>
        );
      case 'contacted':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
            Contacted
          </span>
        );
      case 'interested':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F3E8FF] text-[#9333EA] border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40">
            Interested
          </span>
        );
      case 'in_progress':
      case 'in progress':
      case 'follow_up':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
            In Progress
          </span>
        );
      case 'converted':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#16A34A] border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
            Converted to Customer
          </span>
        );
      case 'lost':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFE4E6] text-[#E11D48] border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40">
            Lost Lead
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  const handleWhatsApp = (phone, name) => {
    if (!phone) return;
    const clean = phone.replace(/[^\d+]/g, '');
    const msg = encodeURIComponent(`Hi ${name || 'there'}, greeting from our salon regarding your enquiry!`);
    window.open(`https://wa.me/${clean.replace('+', '')}?text=${msg}`, '_blank');
  };

  const createdFormatted = lead.created_at
    ? new Date(lead.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onMouseDown={handleClose}
    >
      {/* Drawer Panel Sliding Smoothly from the Right */}
      <div
        className={`w-full max-w-xl bg-white dark:bg-[#151522] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-white/10 transform transition-transform duration-300 ease-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E91E63]/20 to-[#FB7185]/30 text-[#E91E63] flex items-center justify-center text-xl shrink-0 border border-[#E91E63]/30">
              <RiInformationLine />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                Lead Profile & Details
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ID #{lead.id} • Created on {createdFormatted}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Hero Profile Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-pink-50/80 via-white to-rose-50/50 dark:from-pink-950/20 dark:via-[#1a1a2e] dark:to-rose-950/10 border border-pink-100 dark:border-pink-900/30 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {lead.avatar_url ? (
                  <div className="w-14 h-14 rounded-full overflow-hidden relative ring-2 ring-pink-200 dark:ring-pink-800/40 shadow-xs shrink-0">
                    <Image
                      src={lead.avatar_url}
                      alt={lead.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#E91E63] to-[#FB7185] flex items-center justify-center text-white font-extrabold text-lg shadow-sm shrink-0">
                    {getInitials(lead.name, '')}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                      {lead.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {renderStatusBadge(lead.status)}
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Source: <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{lead.source || 'Website'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions (Edit / Delete) */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {onEditLead && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onEditLead(lead);
                    }}
                    className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 text-base transition-colors cursor-pointer"
                    title="Edit Lead"
                  >
                    <RiEditLine />
                  </button>
                )}
                {onDeleteLead && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onDeleteLead(lead);
                    }}
                    className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-base transition-colors cursor-pointer"
                    title="Delete Lead"
                  >
                    <RiDeleteBinLine />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Contact Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-5 pt-4 border-t border-pink-100/70 dark:border-pink-900/30">
              {lead.phone && (
                <>
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs transition-all"
                  >
                    <RiPhoneLine className="text-blue-600 dark:text-blue-400 text-sm" />
                    <span>Call</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleWhatsApp(lead.phone, lead.name)}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <RiWhatsappLine className="text-emerald-600 dark:text-emerald-400 text-sm" />
                    <span>WhatsApp</span>
                  </button>
                </>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-slate-400 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs transition-all col-span-2 sm:col-span-1"
                >
                  <RiMailLine className="text-slate-500 text-sm" />
                  <span>Email</span>
                </a>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Contact & Location Info
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                <span className="text-[11px] font-semibold text-slate-400 block">Phone Number</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {lead.phone || '-'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                <span className="text-[11px] font-semibold text-slate-400 block">Email Address</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block truncate" title={lead.email}>
                  {lead.email || '-'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                <span className="text-[11px] font-semibold text-slate-400 block">Branch / Location</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {lead.location || lead.preferred_branch || 'All Branches'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">Assigned Staff</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {assignedName || 'Unassigned'}
                  </span>
                </div>
                {onAssignLead && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onAssignLead(lead);
                    }}
                    className="text-xs text-[#E91E63] font-bold hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interested Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Interested Services
            </h4>
            {services.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {services.map((svc, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/30 text-[#E91E63] dark:text-pink-300 border border-pink-200/80 dark:border-pink-900/40 text-xs font-bold"
                  >
                    <RiScissorsLine className="text-xs" />
                    <span>{svc}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No specific services marked.</p>
            )}
          </div>

          {/* Follow-Up Schedule & Notes Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Follow-Up & Activity Timeline
              </h4>
              {onFollowUp && (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onFollowUp(lead);
                  }}
                  className="text-xs font-bold text-[#E91E63] hover:underline"
                >
                  + Schedule Follow-Up
                </button>
              )}
            </div>

            {/* Scheduled Follow-Up Badge */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shrink-0">
                  <RiCalendarCheckLine />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Next Follow-Up</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {lead.follow_up_date
                      ? `${lead.follow_up_date} ${lead.follow_up_time || ''}`
                      : 'None scheduled'}
                  </span>
                </div>
              </div>
            </div>

            {/* History logs */}
            {activityLogs.length > 0 ? (
              <div className="space-y-2 pt-1">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed"
                  >
                    {log.text}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No notes or interaction logs recorded yet.</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              handleClose();
              if (onFollowUp) onFollowUp(lead);
            }}
            className="px-5 py-2.5 rounded-xl border border-[#E91E63] text-[#E91E63] font-bold text-xs sm:text-sm hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors cursor-pointer"
          >
            Add Follow-Up
          </button>

          <button
            type="button"
            onClick={() => {
              handleClose();
              if (onConvertLead) onConvertLead(lead);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RiCheckDoubleLine className="text-base" />
            <span>Convert to Customer</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
