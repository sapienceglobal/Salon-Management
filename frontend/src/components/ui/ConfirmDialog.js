'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { RiAlertLine, RiCloseLine, RiErrorWarningLine } from 'react-icons/ri';
import { useScrollLock } from '@/hooks/useScrollLock';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' or 'warning'
  onConfirm,
  onCancel,
}) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);



  if (!isOpen || !mounted) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      if (onCancel) onCancel();
    }, 200);
  };

  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      if (onConfirm) onConfirm();
    }, 200);
  };

  // Determine colors based on type
  const isDanger = type === 'danger';
  const iconBgColor = isDanger ? 'bg-accent-red/10' : 'bg-accent-yellow/10';
  const iconTextColor = isDanger ? 'text-accent-red' : 'text-accent-yellow';
  const confirmBtnColor = isDanger ? 'bg-accent-red hover:bg-red-600 shadow-accent-red/20' : 'bg-brand hover:bg-brand-hover shadow-brand/20';

  return createPortal(
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeOpacity_0.2s_ease_forwards]'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      
      <div 
        className={`bg-admin-card w-full max-w-sm rounded-2xl border border-admin-border shadow-2xl relative overflow-hidden flex flex-col ${isClosing ? 'animate-[scaleOut_0.2s_ease_forwards]' : 'animate-[scaleIn_0.2s_ease_forwards]'}`}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-admin-text-muted hover:text-admin-text transition-colors"
        >
          <RiCloseLine className="text-xl" />
        </button>

        <div className="p-6 text-center pt-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${iconBgColor} ${iconTextColor}`}>
            {isDanger ? <RiErrorWarningLine className="text-3xl" /> : <RiAlertLine className="text-3xl" />}
          </div>
          
          <h3 className="text-lg font-bold text-admin-text mb-2">{title}</h3>
          <p className="text-sm text-admin-text-secondary">{message}</p>
        </div>

        <div className="p-5 border-t border-admin-border bg-admin-surface/30 flex gap-3">
          <button 
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-admin-text-secondary bg-admin-surface hover:bg-admin-surface-hover border border-admin-border transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-colors ${confirmBtnColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
