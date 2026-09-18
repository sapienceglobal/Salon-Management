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
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState({ name: '', capacity: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const closeDrawer = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsAdding(false);
      setIsClosing(false);
    }, 200);
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
      closeDrawer();
      fetchRooms();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to add room');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading rooms...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Service Rooms</h3>
          <p className="text-sm text-gray-500">Manage rooms, stations, or chairs where services are performed.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            <RiAddLine /> Add Room
          </button>
        )}
      </div>

      {/* Add Room Drawer */}
      {isAdding && mounted && createPortal(
        <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={closeDrawer}>
          <div 
            className={`bg-white dark:bg-gray-900 w-full max-w-md h-full border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Service Room</h2>
                <p className="text-xs text-gray-500 mt-1">Create a new room, station, or chair.</p>
              </div>
              <button onClick={closeDrawer} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <RiCloseLine className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="rooms-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Room / Chair Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Spa Room 1"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity (Max clients at once) *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={e => setFormData({...formData, capacity: Number(e.target.value)})}
                    min="1"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    required
                  />
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 flex justify-end gap-3">
              <button type="button" onClick={closeDrawer} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" form="rooms-form" disabled={submitting} className="px-5 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-70 shadow-sm">
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
          <div className="col-span-full py-8 text-center text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            No rooms configured yet.
          </div>
        ) : (
          rooms.map(room => (
            <div key={room.id} className="flex items-center p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
                <RiDoorOpenLine className="text-xl" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{room.name}</h4>
                <p className="text-xs text-gray-500">Capacity: {room.capacity} Client(s)</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
