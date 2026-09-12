'use client';

import { useState, useEffect } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday
} from 'date-fns';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Compact month calendar for the Appointments right sidebar.
 *
 * Props:
 * - selectedDate: Date — the currently active date (highlighted, filled)
 * - onSelectDate: (date: Date) => void — called when a day is clicked
 */
export default function MiniCalendar({ selectedDate, onSelectDate, appointments = [] }) {
  const [viewMonth, setViewMonth] = useState(selectedDate);

  // Keep the visible month in sync if the parent changes the date
  // externally (e.g. the Day/Week toolbar arrows).
  useEffect(() => {
    setViewMonth(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate.getFullYear(), selectedDate.getMonth()]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="bg-admin-card border border-admin-border rounded-2xl p-5 shadow-sm">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setViewMonth(prev => subMonths(prev, 1))}
          className="p-1.5 rounded-lg text-admin-text-secondary hover:bg-admin-surface-light transition-colors"
          aria-label="Previous month"
        >
          <RiArrowLeftSLine className="text-lg" />
        </button>
        <h3 className="font-heading text-sm font-bold">{format(viewMonth, 'MMMM yyyy')}</h3>
        <button
          type="button"
          onClick={() => setViewMonth(prev => addMonths(prev, 1))}
          className="p-1.5 rounded-lg text-admin-text-secondary hover:bg-admin-surface-light transition-colors"
          aria-label="Next month"
        >
          <RiArrowRightSLine className="text-lg" />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[0.65rem] font-semibold text-admin-text-muted py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, monthStart);
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);

          const dayAppts = appointments.filter(a => isSameDay(new Date(a.appointment_date), day));
          const statuses = [...new Set(dayAppts.map(a => a.status))];

          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`relative w-8 h-8 mx-auto flex items-center justify-center text-xs rounded-full transition-colors
                ${selected ? 'bg-brand text-white font-bold shadow-md shadow-brand/30' : ''}
                ${!selected && today ? 'border border-brand text-brand font-semibold' : ''}
                ${!selected && !today && inMonth ? 'text-admin-text hover:bg-admin-surface-light' : ''}
                ${!inMonth ? 'text-admin-text-muted/50 hover:bg-admin-surface-light' : ''}
              `}
            >
              <span className={dayAppts.length > 0 ? 'mb-1' : ''}>{format(day, 'd')}</span>

              {dayAppts.length > 0 && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-[2px]">
                  {statuses.slice(0, 3).map(status => {
                    let bgColor = 'bg-brand';
                    if (status === 'planned' || status === 'confirmed') bgColor = 'bg-accent-green';
                    else if (status === 'cancelled' || status === 'no_show') bgColor = 'bg-accent-red';
                    else if (status === 'ongoing' || status === 'in-progress') bgColor = 'bg-orange-500';
                    else if (status === 'pending') bgColor = 'bg-accent-yellow';
                    else if (status === 'completed') bgColor = 'bg-[#6741d9]';

                    if (selected) bgColor = 'bg-white';

                    return <span key={status} className={`w-1 h-1 rounded-full ${bgColor}`} />
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      {/* <div className="mt-4 pt-3 border-t border-admin-border grid grid-cols-2 gap-y-2 gap-x-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
          <span className="text-[0.65rem] text-admin-text-secondary">Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          <span className="text-[0.65rem] text-admin-text-secondary">In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow" />
          <span className="text-[0.65rem] text-admin-text-secondary">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6741d9]" />
          <span className="text-[0.65rem] text-admin-text-secondary">Completed</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />
          <span className="text-[0.65rem] text-admin-text-secondary">Cancelled / No show</span>
        </div>
      </div> */}
    </div>
  );
}