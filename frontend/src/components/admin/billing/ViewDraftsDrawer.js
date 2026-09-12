import { useState, useEffect } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { RiCloseLine, RiTimeLine } from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ViewDraftsDrawer({ isOpen, onClose, onSelectDraft }) {
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      fetchDrafts();
    }
  }, [isOpen]);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices', { params: { status: 'draft' } });
      setDrafts(res.data || []);
    } catch (error) {
      toast.error('Failed to fetch drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDraft = async (draft) => {
    try {
      const toastId = toast.loading('Loading draft...');
      const res = await api.get(`/invoices/${draft.id}`);
      toast.dismiss(toastId);
      
      const fullDraft = res.data;
      onSelectDraft(fullDraft);
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch draft details');
    }
  };

  const handleDeleteDraft = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('Draft deleted');
      fetchDrafts();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete draft');
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={handleClose}>
      <div 
        className={`bg-admin-card text-admin-text w-full max-w-md h-full border-l border-admin-border shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-admin-border bg-admin-surface/50 shrink-0">
          <h2 className="text-xl font-bold">Saved Drafts</h2>
          <button onClick={handleClose} className="text-admin-text-secondary hover:text-admin-text p-2 rounded-md hover:bg-admin-surface-light transition-colors">
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center p-8"><span className="animate-spin text-2xl">⏳</span></div>
          ) : drafts.length === 0 ? (
            <div className="text-center text-admin-text-secondary mt-10">
              No saved drafts found.
            </div>
          ) : (
            drafts.map(draft => (
              <div 
                key={draft.id} 
                onClick={() => handleSelectDraft(draft)}
                className="bg-admin-surface border border-admin-border/50 rounded-xl p-4 cursor-pointer hover:border-brand transition-colors flex flex-col gap-2 relative group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-admin-text">
                      {draft.customer_first_name} {draft.customer_last_name || ''}
                    </h3>
                    <p className="text-xs text-admin-text-secondary">{draft.customer_phone}</p>
                  </div>
                  <span className="font-bold text-lg text-brand">₹{draft.total_amount}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-admin-text-secondary flex items-center gap-1">
                    <RiTimeLine /> {new Date(draft.created_at).toLocaleString()}
                  </span>
                  <button 
                    onClick={(e) => handleDeleteDraft(draft.id, e)}
                    className="text-xs text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
