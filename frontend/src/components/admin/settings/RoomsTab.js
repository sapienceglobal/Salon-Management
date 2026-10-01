import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { RiAddLine, RiDoorOpenLine, RiCloseLine } from 'react-icons/ri';
import { createPortal } from 'react-dom';

export default function RoomsTab() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Room Form State
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', capacity: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const closeModal = () => {
    setIsAdding(false);
  };

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/rooms');
      setRooms(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/settings/rooms', formData);
      toast.success('Room added successfully');
      setFormData({ name: '', capacity: 1 });
      closeModal();
      fetchRooms();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to add room');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#E91E63] rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-colors";
  const labelClass = "block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5";

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading rooms...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Service Rooms</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage rooms, stations, or chairs where services are performed.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#E91E63] text-white rounded-xl hover:bg-[#d81557] transition-all text-sm font-medium shadow-md shadow-[#E91E63]/25 cursor-pointer"
          >
            <RiAddLine className="text-lg" /> Add Room
          </button>
        )}
      </div>

      {/* Add Room Modal Popup */}
      {isAdding && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
          onMouseDown={closeModal}
        >
          <div 
            className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
                  <RiDoorOpenLine />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Add Service Room
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Create a new room, station, or styling chair.
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <RiCloseLine className="text-2xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(100vh-220px)] px-6 sm:px-8 py-6 custom-scrollbar">
              <form id="rooms-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={labelClass}>Room / Chair Name <span className="text-[#E91E63]">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., VIP Spa Suite or Station 1"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Capacity (Max clients at once) <span className="text-[#E91E63]">*</span></label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={e => setFormData({...formData, capacity: Number(e.target.value)})}
                    min="1"
                    className={inputClass}
                    required
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
              <button 
                type="button" 
                onClick={closeModal} 
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="rooms-form" 
                disabled={submitting} 
                className="px-6 py-2.5 text-sm font-semibold bg-[#E91E63] text-white rounded-xl hover:bg-[#d81557] transition-all disabled:opacity-50 shadow-md shadow-[#E91E63]/25 cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Save Room'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Rooms List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.length === 0 ? (
          <div className="col-span-full py-8 text-center text-gray-500 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02]">
            No rooms configured yet.
          </div>
        ) : (
          rooms.map(room => (
            <div key={room.id} className="flex items-center p-4 border border-gray-100 dark:border-white/10 rounded-2xl bg-white dark:bg-[#1a1a2e] shadow-sm hover:shadow-md transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-[#E91E63]/10 flex items-center justify-center text-[#E91E63] mr-4 text-xl">
                <RiDoorOpenLine />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{room.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Capacity: {room.capacity} Client(s)</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
