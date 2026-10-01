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

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    // Notes can contain multiple log entries separated by newline
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

  if (!isOpen || !mounted || !lead) return null;

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
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Drawer Panel */}
      <div
        className="w-full max-w-xl bg-white dark:bg-[#151522] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-white/10 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-white/[0.02]">
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
            onClick={onClose}
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
                  <div className="w-16 h-16 rounded-2xl overflow-hidden relative shrink-0 ring-2 ring-[#E91E63]/20 shadow-md">
                    <Image
                      src={lead.avatar_url}
                      alt={lead.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E91E63] to-[#FB7185] flex items-center justify-center text-white font-black text-xl shrink-0 shadow-md">
                    {getInitials(lead.name || 'Lead', '')}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                    {lead.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {renderStatusBadge(lead.status)}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                      via {lead.source || 'Website'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onEditLead) onEditLead(lead);
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-[#E91E63] hover:border-[#E91E63] transition-colors"
                  title="Edit Lead"
                >
                  <RiEditLine className="text-base" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onDeleteLead) onDeleteLead(lead.id);
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-300 transition-colors"
                  title="Delete Lead"
                >
                  <RiDeleteBinLine className="text-base" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Contact Action Bar */}
          <div className="grid grid-cols-3 gap-2.5">
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-100 transition-colors border border-blue-200/80 dark:border-blue-800/40"
            >
              <RiPhoneLine className="text-base" />
              <span>Call</span>
            </a>

            <button
              type="button"
              onClick={() => handleWhatsApp(lead.phone, lead.name)}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100 transition-colors border border-emerald-200/80 dark:border-emerald-800/40 cursor-pointer"
            >
              <RiWhatsappLine className="text-base" />
              <span>WhatsApp</span>
            </button>

            {lead.email ? (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors border border-slate-200/80 dark:border-white/10"
              >
                <RiMailLine className="text-base" />
                <span>Email</span>
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] text-slate-400 font-medium text-xs border border-slate-100 dark:border-white/5 opacity-60">
                <RiMailLine className="text-base" />
                <span>No Email</span>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="bg-white dark:bg-[#1a1a2e] rounded-3xl border border-slate-200/90 dark:border-white/10 p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Contact & Preference Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Phone Number</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {lead.phone || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Email Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {lead.email || 'Not provided'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Gender</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {lead.gender || 'Not specified'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Location / City</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {lead.location || 'Not provided'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Preferred Branch</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {lead.preferred_branch || 'Downtown Branch'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Assigned Staff</span>
                {assignedName ? (
                  <span className="font-bold text-[#E91E63]">{assignedName}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onAssignLead) onAssignLead(lead);
                    }}
                    className="text-xs font-bold text-[#E91E63] hover:underline cursor-pointer"
                  >
                    + Assign to Staff
                  </button>
                )}
              </div>
            </div>

            {/* Interested Services */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/10">
              <span className="text-slate-400 text-xs block mb-2 font-semibold">Interested Services</span>
              <div className="flex flex-wrap gap-1.5">
                {services.length > 0 ? (
                  services.map((svc, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-pink-50 dark:bg-pink-950/40 text-[#E91E63] border border-pink-200/70 dark:border-pink-900/40"
                    >
                      <RiScissorsLine className="text-sm" />
                      <span>{svc}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No specific services selected</span>
                )}
              </div>
            </div>
          </div>

          {/* Follow-Up Schedule & Notes Timeline */}
          <div className="bg-white dark:bg-[#1a1a2e] rounded-3xl border border-slate-200/90 dark:border-white/10 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RiCalendarCheckLine className="text-[#E91E63] text-lg" />
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Follow-Up & Activity Timeline
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onFollowUp) onFollowUp(lead);
                }}
                className="text-xs font-bold text-[#E91E63] hover:underline cursor-pointer"
              >
                + Schedule Follow-Up
              </button>
            </div>

            {/* Scheduled Follow-Up Badge */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <RiTimeLine className="text-slate-400 text-base" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Next Follow-Up</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
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
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onFollowUp) onFollowUp(lead);
            }}
            className="px-5 py-2.5 rounded-xl border border-[#E91E63] text-[#E91E63] font-bold text-xs sm:text-sm hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors cursor-pointer"
          >
            Add Follow-Up
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
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
