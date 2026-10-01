'use client';

import { useEffect } from 'react';
import { RiCloseLine } from 'react-icons/ri';

/**
 * Reusable BulkActionBar Component
 *
 * Appears as a floating glassmorphic dock at the bottom of the screen
 * when one or more rows are selected in any table or list.
 *
 * Props:
 * - selectedCount: number of selected items
 * - totalCount: optional total number of items
 * - onClear: callback to clear selection
 * - actions: array of action objects:
 *     { label, icon: IconComponent, onClick, variant: 'default' | 'danger' | 'success' | 'warning', loading: boolean, disabled: boolean }
 * - children: optional custom action controls (dropdowns, buttons, etc.)
 * - resourceName: string (e.g., 'customer', 'service', 'lead')
 */
export default function BulkActionBar({
  selectedCount = 0,
  totalCount,
  onClear,
  actions = [],
  children,
  resourceName = 'item',
}) {
  // Listen for Escape key to deselect all
  useEffect(() => {
    if (selectedCount <= 0) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClear) {
        onClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCount, onClear]);

  if (selectedCount <= 0) return null;

  const pluralName = selectedCount === 1 ? resourceName : `${resourceName}s`;

  return (
    <aside
      aria-label="Bulk actions dock"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 px-3.5 sm:px-5 py-2.5 sm:py-3 bg-slate-900/95 dark:bg-[#16162a]/95 text-white backdrop-blur-2xl border border-white/15 dark:border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.45)] max-w-[96vw] sm:max-w-3xl overflow-x-auto custom-scrollbar animate-slideInUp"
    >
      {/* Selection Counter Pill */}
      <div className="flex items-center gap-2 pl-1 pr-2.5 sm:pr-3 border-r border-white/15 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E91E63] shadow-[0_0_8px_#E91E63] animate-pulse" />
        <span className="text-xs sm:text-sm font-extrabold tracking-tight text-white whitespace-nowrap">
          {selectedCount}
          <span className="font-medium text-slate-300 ml-1 hidden xs:inline">
            {pluralName} selected
          </span>
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {actions.map((act, index) => {
          const Icon = act.icon;
          const isDanger = act.variant === 'danger';
          const isSuccess = act.variant === 'success';

          let btnClass = 'bg-white/10 hover:bg-white/20 text-white border-white/10';
          if (isDanger) {
            btnClass =
              'bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border-rose-500/30';
          } else if (isSuccess) {
            btnClass =
              'bg-emerald-500/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/30';
          }

          return (
            <button
              key={index}
              type="button"
              onClick={act.onClick}
              disabled={act.disabled || act.loading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-[13px] font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${btnClass}`}
              title={act.title || act.label}
            >
              {Icon && <Icon className="text-sm sm:text-base shrink-0" />}
              <span className="whitespace-nowrap">{act.label}</span>
              {act.loading && (
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin ml-1" />
              )}
            </button>
          );
        })}

        {/* Custom Actions (e.g. Dropdowns or specialized pickers) */}
        {children}
      </div>

      {/* Clear / Deselect Button */}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="ml-1 sm:ml-2 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          title="Deselect all (Esc)"
          aria-label="Clear selection"
        >
          <RiCloseLine className="text-lg" />
        </button>
      )}
    </aside>
  );
}
