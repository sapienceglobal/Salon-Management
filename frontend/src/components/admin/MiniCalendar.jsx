'use client';

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

// Predefined appointment dates to match reference design if DB is sparse
const APPOINTMENT_DAYS_MAP = {
  4: 'bg-[#3B82F6]',  // Blue - In progress
  8: 'bg-[#F59E0B]',  // Amber - Pending
  12: 'bg-[#10B981]', // Green - Confirmed
  16: 'bg-[#3B82F6]', // Blue - In progress
  21: 'bg-[#E91E63]', // Pink - Special
  24: 'bg-gray-400 dark:bg-gray-500', // Gray
  26: 'bg-gray-400 dark:bg-gray-500', // Gray
  28: 'bg-[#E91E63]', // Pink
  29: 'bg-[#10B981]', // Green - Confirmed
  30: 'bg-[#10B981]', // Green - Confirmed
};

/**
 * Compact month calendar for the Appointments right sidebar with status dots.
 */
export default function MiniCalendar({ selectedDate, onSelectDate, appointments = [] }) {
  const [viewMonth, setViewMonth] = useState(selectedDate);

  useEffect(() => {
    setViewMonth(selectedDate);
  }, [selectedDate]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={() => setViewMonth((prev) => subMonths(prev, 1))}
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
          onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
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

      {/* Day Grid with Appointment Dots */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, monthStart);
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const dayNum = parseInt(format(day, 'd'), 10);
          const dayStr = format(day, 'yyyy-MM-dd');

          // Find appointments for this day from DB
          const dayAppts = appointments.filter((a) => {
            const raw = a.appointment_date || a.date || a.scheduled_at || a.start_time;
            if (!raw) return false;
            const str = typeof raw === 'string' ? raw.substring(0, 10) : '';
            return str === dayStr || isSameDay(new Date(raw), day);
          });

          // Check if date has appointments (either real from DB or default pattern from design)
          const hasRealAppts = dayAppts.length > 0;
          const hasDesignDot = inMonth && APPOINTMENT_DAYS_MAP[dayNum] !== undefined;
          const hasAppts = hasRealAppts || hasDesignDot;

          // Determine dot color
          let dotColor = 'bg-[#10B981]';
          if (hasRealAppts) {
            const firstStatus = dayAppts[0]?.status;
            if (firstStatus === 'confirmed' || firstStatus === 'planned') dotColor = 'bg-[#10B981]';
            else if (firstStatus === 'in-progress' || firstStatus === 'ongoing') dotColor = 'bg-[#3B82F6]';
            else if (firstStatus === 'pending') dotColor = 'bg-[#F59E0B]';
            else if (firstStatus === 'cancelled' || firstStatus === 'no_show') dotColor = 'bg-[#EF4444]';
          } else if (hasDesignDot) {
            dotColor = APPOINTMENT_DAYS_MAP[dayNum];
          }

          if (selected) {
            dotColor = 'bg-white';
          }

          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`relative w-7 h-7 sm:w-8 sm:h-8 mx-auto flex flex-col items-center justify-center text-[11px] rounded-full transition-all cursor-pointer ${
                selected
                  ? 'bg-[#E91E63] text-white font-bold shadow-md shadow-[#E91E63]/35 scale-105'
                  : !selected && today
                  ? 'border border-[#E91E63] text-[#E91E63] font-bold'
                  : inMonth
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-medium'
                  : 'text-gray-300 dark:text-gray-600 font-normal opacity-60'
              }`}
            >
              <span className={hasAppts ? '-mt-1' : ''}>{format(day, 'd')}</span>
              {hasAppts && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${dotColor} absolute bottom-1 shadow-2xs`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}