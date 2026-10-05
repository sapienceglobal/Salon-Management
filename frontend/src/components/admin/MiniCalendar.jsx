'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Compact month calendar for the Appointments right sidebar with authentic multi-status dots.
 */
export default function MiniCalendar({ selectedDate, onSelectDate, onMonthChange, appointments = [] }) {
  const [viewMonth, setViewMonth] = useState(selectedDate);

  useEffect(() => {
    setViewMonth(selectedDate);
  }, [selectedDate]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const handlePrevMonth = () => {
    const next = subMonths(viewMonth, 1);
    setViewMonth(next);
    if (onMonthChange) onMonthChange(next);
  };

  const handleNextMonth = () => {
    const next = addMonths(viewMonth, 1);
    setViewMonth(next);
    if (onMonthChange) onMonthChange(next);
  };

  return (
    <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Previous month"
        >
          <RiArrowLeftSLine className="text-base" />
        </button>
        <h3 className="font-bold text-xs text-gray-900 dark:text-white tracking-tight">
          {format(viewMonth, 'MMMM yyyy')}
        </h3>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Next month"
        >
          <RiArrowRightSLine className="text-base" />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 mb-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Day Grid with Authentic Status Dots */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, monthStart);
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const dayStr = format(day, 'yyyy-MM-dd');

          // Find authentic appointments for this day from DB
          const dayAppts = (appointments || []).filter((a) => {
            const raw = a.appointment_date || a.date || a.scheduled_at || a.start_time;
            if (!raw) return false;
            const str = typeof raw === 'string' ? raw.substring(0, 10) : '';
            return str === dayStr || isSameDay(new Date(raw), day);
          });

          // Determine distinct status dots
          const statusDots = [];
          if (dayAppts.length > 0) {
            const hasConfirmed = dayAppts.some((a) => a.status === 'confirmed' || a.status === 'planned');
            const hasPending = dayAppts.some((a) => a.status === 'pending');
            const hasOngoing = dayAppts.some((a) => a.status === 'ongoing' || a.status === 'in-progress');
            const hasCancelled = dayAppts.some((a) => a.status === 'cancelled' || a.status === 'no_show');
            const hasUnassigned = dayAppts.some((a) => !a.staff_member_id && !a.staff_id);

            if (hasPending) statusDots.push({ color: 'bg-[#F59E0B]', label: 'Pending' });
            if (hasOngoing) statusDots.push({ color: 'bg-[#3B82F6]', label: 'In Progress' });
            if (hasConfirmed) statusDots.push({ color: 'bg-[#10B981]', label: 'Confirmed' });
            if (hasCancelled) statusDots.push({ color: 'bg-[#EF4444]', label: 'Cancelled' });
            if (hasUnassigned && !hasPending) statusDots.push({ color: 'bg-[#8B5CF6]', label: 'Unassigned' });
          }

          const hasAppts = statusDots.length > 0;
          const tooltip = hasAppts
            ? `${format(day, 'd MMM yyyy')}: ${dayAppts.length} appointment${dayAppts.length > 1 ? 's' : ''} (${statusDots.map((s) => s.label).join(', ')})`
            : format(day, 'd MMM yyyy');

          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              title={tooltip}
              className={`relative w-7 h-7 sm:w-8 sm:h-8 mx-auto flex flex-col items-center justify-center text-[11px] rounded-full transition-all cursor-pointer ${
                selected
                  ? 'bg-[#E91E63] text-white font-bold shadow-md shadow-[#E91E63]/35 scale-105'
                  : !selected && today
                  ? 'border border-[#E91E63] text-[#E91E63] font-bold'
                  : inMonth
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-medium'
                  : 'text-gray-300 dark:text-gray-600 font-normal opacity-40'
              }`}
            >
              <span className={hasAppts ? '-mt-1' : ''}>{format(day, 'd')}</span>
              {hasAppts && (
                <div className="flex items-center gap-0.5 absolute bottom-1">
                  {statusDots.slice(0, 3).map((dot, dIdx) => (
                    <span
                      key={dIdx}
                      className={`w-1 h-1 rounded-full ${selected ? 'bg-white' : dot.color} shadow-2xs`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Mini Status Legend */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[9px] text-gray-500 dark:text-gray-400 font-medium px-1">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Confirmed
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" /> Active
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> Pending
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" /> Cancelled
        </span>
      </div>
    </div>
  );
}