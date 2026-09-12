'use client';

import { getInitials, formatCurrency } from '@/lib/utils';
import { RiMoreFill, RiTimeLine } from 'react-icons/ri';

/**
 * Schedule Grid Component for Day View
 * 
 * Props:
 * - staff: Array of staff members { id, first_name, last_name, specialization }
 * - appointments: Array of appointments for the current day
 * - hours: Array of hour strings (e.g., ['9 AM', '10 AM', '11 AM', ... '7 PM'])
 */
export default function ScheduleGrid({ staff = [], appointments = [], hours = [], onAppointmentClick }) {
  // Constants for rendering calculations
  const START_HOUR = 9; // 9 AM
  const TOTAL_HOURS = hours.length; // Ensure this exactly matches the columns

  // Colors for different appointment types/services as per design
  const APPOINTMENT_COLORS = [
    'bg-[#ffecf2] text-[#d6336c] border-[#ffb8d2]', // Pink
    'bg-[#e3f2fd] text-[#1971c2] border-[#a5d8ff]', // Blue
    'bg-[#e8f5e9] text-[#2b8a3e] border-[#b2f2bb]', // Green
    'bg-[#fff3bf] text-[#f08c00] border-[#ffec99]', // Yellow
    'bg-[#f3f0ff] text-[#6741d9] border-[#d0bfff]', // Purple
  ];
  const WALK_IN_COLOR = 'bg-[#fff3bf] text-[#f08c00] border-[#ffec99]';

  // Stable hash so a given service always maps to the same color, no matter
  // what order the API returns appointments in. (Previously this used the
  // array index, so the same "Hair Cut" could render pink on one load and
  // blue on the next just because of ordering — that's why it didn't look
  // consistent with the reference UI.)
  const hashToIndex = (str = '', mod) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash % mod;
  };

  const getColorStyle = (serviceName) =>
    APPOINTMENT_COLORS[hashToIndex(serviceName, APPOINTMENT_COLORS.length)];

  // Helper to parse time string "HH:MM:SS" to fractional hours since start
  const timeToFractionalHour = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = (hours * 60) + minutes;
    const startMinutes = START_HOUR * 60;
    return Math.max(0, (totalMinutes - startMinutes) / 60);
  };

  // Group appointments by staff
  const getStaffAppointments = (staffId) => {
    return appointments.filter(a => a.staff_member_id === staffId);
  };

  return (
    <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-max">
          
          {/* Header Row (Hours) */}
          <div className="grid border-b border-admin-border" style={{ gridTemplateColumns: `180px repeat(${TOTAL_HOURS}, minmax(120px, 1fr))` }}>
            <div className="px-5 py-4 font-semibold text-sm border-r border-admin-border bg-admin-surface-light flex items-center">
              Staff
            </div>
            {hours.map((hour, idx) => (
              <div key={idx} className="px-3 py-4 text-xs font-semibold text-admin-text-muted text-center border-r border-admin-border last:border-r-0 bg-admin-surface-light flex items-center justify-center">
                {hour}
              </div>
            ))}
          </div>

          {/* Staff Rows */}
          {staff.length === 0 ? (
            <div className="p-8 text-center text-admin-text-muted">No staff scheduled for today</div>
          ) : (
            staff.map((member) => (
              <div key={member.id} className="grid border-b border-admin-border last:border-b-0 group" style={{ gridTemplateColumns: `180px repeat(${TOTAL_HOURS}, minmax(120px, 1fr))` }}>
                
                {/* Staff Info Column */}
                <div className="px-4 py-4 border-r border-admin-border bg-admin-card flex items-center gap-3 relative z-20">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.first_name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-admin-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {getInitials(member.first_name, member.last_name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-admin-text truncate" title={`${member.first_name} ${member.last_name}`}>
                      {member.first_name} {member.last_name}
                    </div>
                    <div className="text-[0.65rem] text-admin-text-muted truncate">
                      {member.specialization || 'Stylist'}
                    </div>
                  </div>
                </div>

                {/* Schedule Timeline Column */}
                <div className="relative bg-admin-surface-light border-admin-border" style={{ 
                    gridColumn: `2 / span ${TOTAL_HOURS}`,
                    backgroundImage: 'linear-gradient(to right, var(--admin-border-light, rgba(150,150,150,0.15)) 1px, transparent 1px)',
                    backgroundSize: `${100 / TOTAL_HOURS}% 100%`
                  }}>
                  
                  {/* Appointments Blocks */}
                  {getStaffAppointments(member.id).map((appt) => {
                    const startOffset = timeToFractionalHour(appt.start_time);
                    const endOffset = timeToFractionalHour(appt.end_time);
                    const duration = endOffset - startOffset;
                    
                    // Skip rendering if outside grid bounds
                    if (startOffset < 0 || startOffset >= TOTAL_HOURS || duration <= 0) return null;

                    // Calculate CSS positioning based on percentages
                    const leftPct = (startOffset / TOTAL_HOURS) * 100;
                    const widthPct = (duration / TOTAL_HOURS) * 100;

                    // Color based on service (stable per service) or walk-in override
                    const isWalkIn = appt.source === 'walk_in' || appt.notes?.toLowerCase().includes('walk-in');
                    const colorStyle = isWalkIn ? WALK_IN_COLOR : getColorStyle(appt.service_name);

                    return (
                      <div 
                        key={appt.id}
                        onClick={() => onAppointmentClick && onAppointmentClick(appt)}
                        className={`absolute top-2 bottom-2 rounded-lg border ${colorStyle} px-2.5 py-1.5 flex flex-col justify-center overflow-hidden cursor-pointer hover:shadow-md hover:scale-[1.02] hover:z-10 transition-all duration-200`}
                        style={{
                          left: `calc(${leftPct}% + 4px)`,
                          width: `calc(${widthPct}% - 8px)`,
                          minWidth: '60px' // Ensure very short appointments are readable
                        }}
                        title={`${appt.customer_first_name || 'Walk-in'} - ${appt.service_name} (${appt.start_time.substring(0,5)} – ${appt.end_time.substring(0,5)})`}
                      >
                        <div className="text-[0.7rem] font-bold truncate leading-tight">
                          {appt.customer_first_name || 'Walk-in'} {appt.customer_last_name || ''}
                        </div>
                        <div className="text-[0.65rem] opacity-90 truncate leading-tight mt-0.5">{appt.service_name}</div>
                        {duration >= 0.5 && (
                          <div className="text-[0.65rem] opacity-80 mt-1">
                            {appt.start_time.substring(0,5)} – {appt.end_time.substring(0,5)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}