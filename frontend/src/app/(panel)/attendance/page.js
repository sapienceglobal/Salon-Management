'use client';

import { useState, useEffect, useCallback } from 'react';
import { RiArrowLeftSLine as ArrowLeft, RiArrowRightSLine as ArrowRight, RiAddLine as PlusIcon, RiUpload2Line as UploadIcon } from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [staffData, setStaffData] = useState([]);
  const [currentStartDate, setCurrentStartDate] = useState(() => {
    // default to exactly this week (starting Sunday or Monday depending on locale, let's just pick today - 3 days to have a window)
    const d = new Date();
    d.setDate(d.getDate() - 3);
    return d;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  
  const daysToShow = 7;

  // Utility to generate dates
  const getDates = () => {
    const dates = [];
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(currentStartDate);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const dates = getDates();

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const startStr = dates[0].toISOString().split('T')[0];
      const endStr = dates[dates.length - 1].toISOString().split('T')[0];
      
      const response = await api.get(`/attendance?startDate=${startStr}&endDate=${endStr}`);
      setStaffData(response.data || []);
    } catch (error) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [currentStartDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const shiftDate = (days) => {
    const d = new Date(currentStartDate);
    d.setDate(d.getDate() + days);
    setCurrentStartDate(d);
  };

  const setToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    setCurrentStartDate(d);
  };

  const openMarkModal = (staff, dateObj) => {
    const dateStr = dateObj.toISOString().split('T')[0];
    const existing = staff.attendance && staff.attendance[dateStr];
    setSelectedCell({
      staff,
      dateStr,
      dateObj,
      status: existing?.status || 'present',
      checkInTime: existing?.check_in_time || ''
    });
    setIsModalOpen(true);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
           const content = event.target.result;
           let parsedData = [];
           if (file.name.endsWith('.json')) {
             parsedData = JSON.parse(content);
           } else {
             // Basic CSV parser
             const lines = content.split('\n').map(l => l.trim()).filter(l => l);
             const headers = lines[0].split(',').map(h => h.trim());
             for(let i=1; i<lines.length; i++) {
                const row = lines[i].split(',').map(c => c.trim());
                const obj = {};
                headers.forEach((h, idx) => { obj[h] = row[idx]; });
                if (obj.staff_id && obj.date && obj.status) {
                   parsedData.push(obj);
                }
             }
           }
           
           if(parsedData.length === 0) {
             toast.error('No valid data found in file');
             return;
           }
           
           toast.loading('Importing...', {id: 'import'});
           await api.post('/attendance/import', { attendance_data: parsedData });
           toast.success('Imported successfully', {id: 'import'});
           fetchAttendance();
        } catch (error) {
           toast.error('Import failed', {id: 'import'});
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-admin-text mb-1">Attendance</h1>
          <p className="text-sm text-admin-text-secondary mt-1">Manage staff attendance and timings.</p>
        </div>
        <button 
          onClick={handleImport}
          className="bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors shadow-lg shadow-brand/20 flex items-center gap-2"
        >
          <UploadIcon className="text-lg" /> Import Attendance
        </button>
      </div>

      <div className="bg-admin-card border border-admin-border rounded-xl p-4 flex flex-col flex-grow">
        {/* Top bar controls */}
        <div className="flex justify-between items-center mb-6">
          {/* Legend */}
          <div className="flex gap-4 text-xs font-semibold bg-admin-surface px-4 py-2 rounded-lg border border-admin-border">
            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Absent</span>
            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div> Weekly Off</span>
            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Holiday</span>
            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Present</span>
          </div>

          {/* Date Controls */}
          <div className="flex items-center gap-4 bg-admin-surface px-2 py-1.5 rounded-lg border border-admin-border">
            <button onClick={() => shiftDate(-7)} className="p-1.5 rounded hover:bg-admin-border text-admin-text-secondary"><ArrowLeft /></button>
            <button onClick={setToday} className="text-sm font-medium text-admin-text-secondary hover:text-admin-text px-2">View Today</button>
            <div className="h-4 w-px bg-admin-border"></div>
            <span className="text-sm font-bold text-admin-text min-w-[100px] text-center">
              {dates[0].toLocaleDateString('en-GB')} - {dates[dates.length-1].toLocaleDateString('en-GB')}
            </span>
            <button onClick={() => shiftDate(7)} className="p-1.5 rounded hover:bg-admin-border text-admin-text-secondary"><ArrowRight /></button>
          </div>
        </div>

        {/* Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-admin-border text-admin-text-secondary text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold w-48">Staff Name</th>
                {dates.map((d, i) => (
                  <th key={i} className="p-4 text-center font-semibold">
                    <div className="text-admin-text">{d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div className="text-admin-text-muted mt-1 font-normal">{d.toLocaleDateString('en-GB', { weekday: 'long' })}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan={daysToShow + 1} className="p-10 text-center text-admin-text-secondary">
                    Loading attendance...
                  </td>
                </tr>
              ) : staffData.length === 0 ? (
                <tr>
                  <td colSpan={daysToShow + 1} className="p-10 text-center text-admin-text-secondary">
                    No active staff found.
                  </td>
                </tr>
              ) : (
                staffData.map(staff => (
                  <tr key={staff.id} className="hover:bg-admin-surface/50 transition-colors">
                    <td className="p-4 font-medium text-admin-text">{staff.first_name} {staff.last_name}</td>
                    {dates.map((d, i) => {
                      const dateStr = d.toISOString().split('T')[0];
                      const record = staff.attendance && staff.attendance[dateStr];
                      
                      return (
                        <td key={i} className="p-4 text-center">
                          <button 
                            onClick={() => openMarkModal(staff, d)}
                            className="w-full h-full min-h-[40px] rounded-lg hover:bg-admin-surface flex items-center justify-center transition-colors group"
                          >
                            {!record ? (
                              <PlusIcon className="text-brand opacity-50 group-hover:opacity-100 text-xl" />
                            ) : (
                              <AttendanceCell record={record} />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for marking attendance */}
      {isModalOpen && selectedCell && (
        <MarkAttendanceModal 
          cell={selectedCell} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchAttendance();
          }}
        />
      )}
    </div>
  );
}

function AttendanceCell({ record }) {
  if (record.status === 'present') {
    return (
      <span className="text-blue-500 font-bold text-xs bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
        {record.check_in_time ? formatTime(record.check_in_time) : 'Present'}
      </span>
    );
  }
  if (record.status === 'absent') {
    return <span className="text-red-500 font-bold text-xs uppercase bg-red-500/10 px-3 py-1.5 rounded-full">Absent</span>;
  }
  if (record.status === 'weekly_off') {
    return <span className="text-yellow-500 font-bold text-xs uppercase bg-yellow-500/10 px-3 py-1.5 rounded-full">Weekly Off</span>;
  }
  if (record.status === 'holiday') {
    return <span className="text-green-500 font-bold text-xs uppercase bg-green-500/10 px-3 py-1.5 rounded-full">Holiday</span>;
  }
  if (record.status === 'half_day') {
    return <span className="text-orange-500 font-bold text-xs uppercase bg-orange-500/10 px-3 py-1.5 rounded-full">Half Day</span>;
  }
  return <span>{record.status}</span>;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10));
  d.setMinutes(parseInt(m, 10));
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function MarkAttendanceModal({ cell, onClose, onSuccess }) {
  const [status, setStatus] = useState(cell.status);
  const [time, setTime] = useState(cell.checkInTime || new Date().toTimeString().substring(0,5));
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/attendance/mark', {
        staff_id: cell.staff.id,
        date: cell.dateStr,
        status: status,
        check_in_time: status === 'present' || status === 'half_day' ? time : null
      });
      toast.success('Attendance updated');
      onSuccess();
    } catch (error) {
      toast.error('Failed to update attendance');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-admin-card border border-admin-border rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-admin-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-admin-text">Mark Attendance</h2>
          <button onClick={onClose} className="text-admin-text-secondary hover:text-admin-text p-1 rounded-lg hover:bg-admin-surface transition-colors">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-admin-text-secondary mb-1">Staff Member</p>
            <p className="text-admin-text font-medium">{cell.staff.first_name} {cell.staff.last_name}</p>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-admin-text-secondary mb-1">Date</p>
            <p className="text-admin-text font-medium">{cell.dateObj.toLocaleDateString('en-GB', { dateStyle: 'full' })}</p>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-admin-text-secondary">Status</label>
            <div className="grid grid-cols-2 gap-3">
              {['present', 'absent', 'weekly_off', 'holiday', 'half_day'].map(s => (
                <label key={s} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${status === s ? 'bg-brand/10 border-brand text-brand' : 'bg-admin-surface border-admin-border text-admin-text-secondary hover:border-admin-text-muted'}`}>
                  <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="hidden" />
                  <span className="text-sm font-medium capitalize">{s.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {(status === 'present' || status === 'half_day') && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-admin-text-secondary mb-2">Check In Time</label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-admin-surface border border-admin-border rounded-lg px-4 py-2.5 text-admin-text focus:border-brand outline-none transition-colors"
                required
              />
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-admin-text-secondary hover:text-admin-text transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors shadow-lg shadow-brand/20 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
