import { useState, useEffect } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { RiCloseLine, RiTimeLine, RiFileList3Line, RiDeleteBin6Line, RiLoader2Line } from 'react-icons/ri';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ViewDraftsDrawer({ isOpen, onClose, onSelectDraft, onDraftDeleted }) {
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [mounted, setMounted] = useState(false);
  
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
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
      onClose();
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
      if (onDraftDeleted) onDraftDeleted();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete draft');
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 my-6 overflow-hidden relative animate-[scaleUp_0.25s_ease_forwards]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ══════════════════════════════════════════════════════════
            MODAL HEADER
           ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#E91E63] text-white flex items-center justify-center text-xl shadow-md shadow-[#E91E63]/30 shrink-0">
              <RiFileList3Line />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Saved Drafts
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Resume billing from a previously saved draft.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
            MODAL BODY
           ══════════════════════════════════════════════════════════ */}
        <div className="overflow-y-auto max-h-[calc(100vh-280px)] px-6 sm:px-8 py-5 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <RiLoader2Line className="animate-spin text-3xl text-[#E91E63]" />
              <p className="text-[13px] text-gray-500 dark:text-gray-400">Loading drafts...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                <RiFileList3Line className="text-2xl text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-[14px] font-semibold text-gray-600 dark:text-gray-400">No Saved Drafts</p>
              <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1">Drafts will appear here when you save a bill for later.</p>
            </div>
          ) : (
            drafts.map(draft => (
              <div 
                key={draft.id} 
                onClick={() => handleSelectDraft(draft)}
                className="bg-gray-50/60 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 cursor-pointer hover:border-[#E91E63]/40 hover:bg-[#E91E63]/[0.02] transition-all flex flex-col gap-2 relative group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[14px] text-gray-900 dark:text-white">
                      {draft.customer_first_name} {draft.customer_last_name || ''}
                    </h3>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400">{draft.customer_phone}</p>
                  </div>
                  <span className="font-bold text-lg text-[#E91E63]">₹{draft.total_amount}</span>
                </div>
                <div className="flex justify-between items-center mt-1 pt-2 border-t border-gray-100 dark:border-white/5">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <RiTimeLine className="text-[12px]" /> {new Date(draft.created_at).toLocaleString()}
                  </span>
                  <button 
                    onClick={(e) => handleDeleteDraft(draft.id, e)}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <RiDeleteBin6Line className="text-[13px]" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            MODAL FOOTER
           ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
