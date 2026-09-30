'use client';

import { getInitials } from '@/lib/utils';
import { RiMoreFill, RiUserLine } from 'react-icons/ri';

/**
 * Schedule Grid Component for Day View
 * Matches exact UI style from reference design, stretches full height to align with sidebar.
 */
export default function ScheduleGrid({
  staff = [],
  appointments = [],
  businessSettings,
  onAppointmentClick,
  className = '',
}) {
  const START_HOUR = 9; // 9 AM
  
  // Hours: 9 AM to 6 PM (10 columns)
  const hours = [
    '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'
  ];
  const TOTAL_HOURS = hours.length;

  const getStaffShiftRange = (shiftType) => {
    switch (shiftType) {
      case 'morning':
        return { label: 'Morning (9am - 4pm)', startHour: 9, endHour: 16 };
      case 'evening':
        return { label: 'Evening (1pm - 9pm)', startHour: 13, endHour: 21 };
      case 'flexible':
        return { label: 'Flexible (10am - 6pm)', startHour: 10, endHour: 18 };
      default:
        return { label: 'Full-time (10am - 8pm)', startHour: 10, endHour: 20 };
    }
  };

  const DEFAULT_STAFF = [
    { id: 101, first_name: 'Riya', last_name: 'Sharma', designation: 'Senior Stylist', avatar_url: '/service_women_haircut.png' },
    { id: 102, first_name: 'Anjali', last_name: 'Patel', designation: 'Beautician', avatar_url: '/service_hair_spa.png' },
    { id: 103, first_name: 'Pooja', last_name: 'Verma', designation: 'Hair Specialist', avatar_url: '/service_keratin.png' },
    { id: 104, first_name: 'Karan', last_name: 'Mehta', designation: 'Makeup Artist', avatar_url: '/service_men_haircut.png' },
    { id: 105, first_name: 'Neha', last_name: 'Gupta', designation: 'Nail Artist', avatar_url: '/service_women_haircut.png' },
  ];

  const DEFAULT_APPOINTMENTS = [
    // Riya Sharma
    { id: 'd1', staff_member_id: 101, customer_first_name: 'Priya', customer_last_name: 'Sharma', service_name: 'Hair Colour', start_time: '09:30:00', end_time: '10:30:00', color: 'pink' },
    { id: 'd2', staff_member_id: 101, customer_first_name: 'Neha', customer_last_name: 'Gupta', service_name: 'Facial Treatment', start_time: '11:00:00', end_time: '12:00:00', color: 'green' },
    { id: 'd3', staff_member_id: 101, customer_first_name: 'Kavita', customer_last_name: 'Singh', service_name: 'Hair Spa', start_time: '13:00:00', end_time: '14:00:00', color: 'purple' },
    { id: 'd4', staff_member_id: 101, customer_first_name: 'Simran', customer_last_name: 'Malhotra', service_name: 'Haircut & Styling', start_time: '15:30:00', end_time: '16:30:00', color: 'pink' },

    // Anjali Patel
    { id: 'd5', staff_member_id: 102, customer_first_name: 'Ritika', customer_last_name: 'Verma', service_name: 'Keratin Treatment', start_time: '10:00:00', end_time: '11:00:00', color: 'blue' },
    { id: 'd6', staff_member_id: 102, customer_first_name: 'Walk-in', customer_last_name: '', service_name: 'Haircut', start_time: '12:30:00', end_time: '13:30:00', color: 'amber', is_walk_in: true },
    { id: 'd7', staff_member_id: 102, customer_first_name: 'Aman', customer_last_name: 'Verma', service_name: 'Global Colour', start_time: '14:00:00', end_time: '15:00:00', color: 'pink' },
    { id: 'd8', staff_member_id: 102, customer_first_name: 'Sneha', customer_last_name: 'Kapoor', service_name: 'Facial', start_time: '16:30:00', end_time: '17:30:00', color: 'green' },

    // Pooja Verma
    { id: 'd9', staff_member_id: 103, customer_first_name: 'Rekha', customer_last_name: 'Jain', service_name: 'Hair Spa', start_time: '09:00:00', end_time: '10:00:00', color: 'pink' },
    { id: 'd10', staff_member_id: 103, customer_first_name: 'Walk-in', customer_last_name: '', service_name: 'Blow Dry', start_time: '11:30:00', end_time: '12:30:00', color: 'green', is_walk_in: true },
    { id: 'd11', staff_member_id: 103, customer_first_name: 'Rohit', customer_last_name: 'Mehta', service_name: 'Haircut', start_time: '14:00:00', end_time: '15:00:00', color: 'blue' },

    // Karan Mehta
    { id: 'd12', staff_member_id: 104, customer_first_name: 'Neha', customer_last_name: 'Singh', service_name: 'Bridal Makeup', start_time: '10:30:00', end_time: '11:30:00', color: 'purple' },
    { id: 'd13', staff_member_id: 104, customer_first_name: 'Pooja', customer_last_name: 'Desai', service_name: 'Party Makeup', start_time: '13:00:00', end_time: '14:00:00', color: 'pink' },
    { id: 'd14', staff_member_id: 104, customer_first_name: 'Walk-in', customer_last_name: '', service_name: 'Beard Styling', start_time: '15:00:00', end_time: '16:00:00', color: 'amber', is_walk_in: true },

    // Neha Gupta
    { id: 'd15', staff_member_id: 105, customer_first_name: 'Aarti', customer_last_name: 'Sharma', service_name: 'Nail Extension', start_time: '09:30:00', end_time: '10:30:00', color: 'green' },
    { id: 'd16', staff_member_id: 105, customer_first_name: 'Simran', customer_last_name: 'Kaur', service_name: 'Manicure', start_time: '12:00:00', end_time: '13:00:00', color: 'blue' },
    { id: 'd17', staff_member_id: 105, customer_first_name: 'Walk-in', customer_last_name: '', service_name: 'Pedicure', start_time: '15:30:00', end_time: '16:30:00', color: 'purple', is_walk_in: true },
  ];

  const effectiveStaff = staff.length > 0 ? staff : DEFAULT_STAFF;
  const effectiveAppointments = appointments.length > 0 ? appointments : DEFAULT_APPOINTMENTS;

  const timeToFractionalHour = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = START_HOUR * 60;
    return Math.max(0, (totalMinutes - startMinutes) / 60);
  };

  const getStaffAppointments = (staffId) => {
    return effectiveAppointments.filter((a) => a.staff_member_id === staffId || a.staff_id === staffId);
  };

  const getCardStyle = (appt) => {
    if (appt.color === 'pink' || appt.service_name?.toLowerCase().includes('colour') || appt.service_name?.toLowerCase().includes('color') || appt.service_name?.toLowerCase().includes('haircut & styling') || appt.service_name?.toLowerCase().includes('party makeup')) {
      return {
        card: 'bg-[#FFF0F5] dark:bg-pink-950/30 border-pink-200 dark:border-pink-900/40 text-gray-900 dark:text-white',
        serviceText: 'text-[#E91E63] font-semibold',
        dot: 'bg-[#E91E63]',
      };
    }
    if (appt.color === 'green' || appt.service_name?.toLowerCase().includes('facial') || appt.service_name?.toLowerCase().includes('blow dry') || appt.service_name?.toLowerCase().includes('nail')) {
      return {
        card: 'bg-[#E8F8EE] dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-gray-900 dark:text-white',
        serviceText: 'text-[#12B76A] font-semibold',
        dot: 'bg-[#12B76A]',
      };
    }
    if (appt.color === 'blue' || appt.service_name?.toLowerCase().includes('keratin') || appt.service_name?.toLowerCase().includes('manicure') || (appt.service_name?.toLowerCase().includes('haircut') && !appt.is_walk_in)) {
      return {
        card: 'bg-[#EFF8FF] dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-gray-900 dark:text-white',
        serviceText: 'text-[#2E90FA] font-semibold',
        dot: 'bg-[#2E90FA]',
      };
    }
    if (appt.color === 'amber' || appt.is_walk_in || appt.customer_first_name === 'Walk-in' || appt.service_name?.toLowerCase().includes('beard')) {
      return {
        card: 'bg-[#FEF6EE] dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-gray-900 dark:text-white',
        serviceText: 'text-[#F79009] font-semibold',
        dot: 'bg-[#F79009]',
      };
    }
    return {
      card: 'bg-[#F5F0FF] dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/40 text-gray-900 dark:text-white',
      serviceText: 'text-[#7F56D9] font-semibold',
      dot: 'bg-[#7F56D9]',
    };
  };

  return (
    <div className={`bg-white dark:bg-[#1a1a2e] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full w-full justify-between ${className}`}>
      <div className="overflow-x-auto no-scrollbar flex-1 flex flex-col w-full">
        <div className="w-full min-w-0 flex-1 flex flex-col">
          {/* Header Row (Staff Count + Hours) */}
          <div
            className="grid border-b border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02] shrink-0"
            style={{ gridTemplateColumns: `160px repeat(${TOTAL_HOURS}, minmax(0, 1fr))` }}
          >
            <div className="px-4 py-3.5 font-bold text-xs text-gray-800 dark:text-white border-r border-gray-100 dark:border-white/5 flex items-center">
              Staff ({effectiveStaff.length})
            </div>
            {hours.map((hour, idx) => (
              <div
                key={idx}
                className="px-1 py-3.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 text-center border-r border-gray-100 dark:border-white/5 last:border-r-0 flex items-center justify-center truncate"
              >
                {hour}
              </div>
            ))}
          </div>

          {/* Staff Rows Container: Each row has flex-1 to fill the vertical height equally and match sidebar */}
          <div className="flex-1 flex flex-col divide-y divide-gray-100 dark:divide-white/5">
            {effectiveStaff.map((member) => (
              <div
                key={member.id}
                className="flex-1 min-h-[92px] grid hover:bg-gray-50/30 dark:hover:bg-white/[0.01] transition-colors"
                style={{ gridTemplateColumns: `160px repeat(${TOTAL_HOURS}, minmax(0, 1fr))` }}
              >
                {/* Staff Info Column */}
                <div className="px-4 py-3.5 border-r border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a1a2e] flex items-center gap-2.5 relative z-10 h-full">
                  <div className="relative shrink-0">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.first_name}
                        className="w-10 h-10 rounded-full object-cover shadow-xs border-2"
                        style={{ borderColor: member.color_code || '#E91E63' }}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                        style={{ backgroundColor: member.color_code || '#E91E63' }}
                      >
                        {getInitials(member.first_name, member.last_name)}
                      </div>
                    )}
                    <span
                      className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-[#1a1a2e] absolute -bottom-0.5 -right-0.5 shadow-xs"
                      style={{ backgroundColor: member.color_code || '#E91E63' }}
                      title={`Staff Color: ${member.color_code || '#E91E63'}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {member.first_name} {member.last_name}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {member.designation || member.specialization || 'Stylist'}
                    </div>
                    <div className="mt-1">
                      <span className="inline-block text-[9px] font-semibold text-[#E91E63] bg-pink-50 dark:bg-pink-950/40 px-1.5 py-0.5 rounded border border-pink-200/50 dark:border-pink-900/30 truncate max-w-full">
                        {getStaffShiftRange(member.shift_schedule).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Schedule Timeline Column */}
                <div
                  className="relative bg-white dark:bg-[#1a1a2e] h-full min-h-[85px]"
                  style={{
                    gridColumn: `2 / span ${TOTAL_HOURS}`,
                    backgroundImage:
                      'linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px)',
                    backgroundSize: `${100 / TOTAL_HOURS}% 100%`,
                  }}
                >
                  {/* Off-shift background shading */}
                  {(() => {
                    const shift = getStaffShiftRange(member.shift_schedule);
                    const offRanges = [];
                    // Before shift start (if within grid hours 9..18)
                    if (shift.startHour > START_HOUR) {
                      const dur = Math.min(shift.startHour - START_HOUR, TOTAL_HOURS);
                      if (dur > 0) offRanges.push({ start: 0, duration: dur });
                    }
                    // After shift end (if within grid hours 9..18)
                    const gridEndHour = START_HOUR + TOTAL_HOURS; // 19
                    if (shift.endHour < gridEndHour) {
                      const startOffset = Math.max(0, shift.endHour - START_HOUR);
                      const dur = gridEndHour - shift.endHour;
                      if (startOffset < TOTAL_HOURS && dur > 0) {
                        offRanges.push({ start: startOffset, duration: Math.min(dur, TOTAL_HOURS - startOffset) });
                      }
                    }
                    return offRanges.map((off, oIdx) => (
                      <div
                        key={oIdx}
                        className="absolute top-0 bottom-0 bg-slate-100/50 dark:bg-black/35 pointer-events-none border-x border-dashed border-slate-200/50 dark:border-white/5 flex items-center justify-center select-none z-0"
                        style={{
                          left: `${(off.start / TOTAL_HOURS) * 100}%`,
                          width: `${(off.duration / TOTAL_HOURS) * 100}%`,
                        }}
                      >
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest opacity-60">
                          Off-Shift
                        </span>
                      </div>
                    ));
                  })()}

                  {/* Appointment Blocks */}
                  {getStaffAppointments(member.id).map((appt) => {
                    const startOffset = timeToFractionalHour(appt.start_time);
                    const endOffset = timeToFractionalHour(appt.end_time);
                    const duration = endOffset - startOffset;

                    if (startOffset < 0 || startOffset >= TOTAL_HOURS || duration <= 0) return null;

                    const leftPct = (startOffset / TOTAL_HOURS) * 100;
                    const widthPct = (duration / TOTAL_HOURS) * 100;
                    const style = getCardStyle(appt);

                    return (
                      <div
                        key={appt.id}
                        onClick={() => onAppointmentClick && onAppointmentClick(appt)}
                        className={`absolute top-2 bottom-2 rounded-xl border ${style.card} px-2.5 py-1.5 flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-md hover:scale-[1.01] hover:z-20 transition-all select-none shadow-xs`}
                        style={{
                          left: `calc(${leftPct}% + 4px)`,
                          width: `calc(${widthPct}% - 8px)`,
                          minWidth: '85px',
                        }}
                        title={`${appt.customer_first_name || 'Walk-in'} - ${appt.service_name} (${appt.start_time?.substring(0, 5)} - ${appt.end_time?.substring(0, 5)})`}
                      >
                        {/* Top Row: Time Range + 3 dots */}
                        <div className="flex items-center justify-between gap-1 leading-none">
                          <span className="text-[10px] font-bold tracking-tight opacity-90 truncate">
                            {appt.start_time?.substring(0, 5)} - {appt.end_time?.substring(0, 5)}
                          </span>
                          <RiMoreFill className="text-xs opacity-50 hover:opacity-100 shrink-0" />
                        </div>

                        {/* Bottom Row: Customer Avatar + Name & Service */}
                        <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/80 dark:border-black/30 shadow-2xs">
                            {appt.is_walk_in || appt.customer_first_name === 'Walk-in' ? (
                              <div className="w-full h-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px]">
                                <RiUserLine />
                              </div>
                            ) : (
                              <img
                                src="/service_women_haircut.png"
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 leading-none">
                            <div className="text-[11px] font-bold truncate text-gray-900 dark:text-white">
                              {appt.customer_first_name || 'Walk-in'} {appt.customer_last_name || ''}
                            </div>
                            <div className={`text-[10px] truncate mt-0.5 ${style.serviceText}`}>
                              {appt.service_name}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}