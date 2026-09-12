'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import { formatCurrency } from '@/lib/utils';
import { RiCloseLine, RiPrinterLine, RiCheckDoubleLine } from 'react-icons/ri';
import { format } from 'date-fns';

export default function ReceiptModal({ isOpen, onClose, invoice }) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || !invoice) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe parsing of items if they are JSON strings
  let items = invoice.items || [];
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch (e) {
      items = [];
    }
  }

  return createPortal(
    <div className={`fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={handleClose}>
      <div 
        className={`bg-admin-card text-admin-text w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-full ${isClosing ? 'animate-[slideDown_0.2s_ease_forwards]' : 'animate-[slideUp_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border bg-admin-surface/50 shrink-0 print:hidden">
          <h2 className="text-lg font-bold flex items-center gap-2 text-accent-green">
            <RiCheckDoubleLine className="text-xl" /> Payment Successful
          </h2>
          <button onClick={handleClose} className="text-admin-text-secondary hover:text-admin-text p-2 rounded-md hover:bg-admin-surface-light transition-colors">
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        {/* Receipt Content - This part should be styled for printing via CSS @media print */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-8 bg-white text-black" id="printable-receipt">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black tracking-tight uppercase mb-1">SALON PRO</h1>
            <p className="text-sm text-gray-500">Premium Hair & Beauty Salon</p>
            <p className="text-xs text-gray-400 mt-2">123 Business Avenue, City, State 12345</p>
            <p className="text-xs text-gray-400">Phone: +1 234 567 8900</p>
          </div>

          <div className="flex justify-between items-end border-b-2 border-dashed border-gray-200 pb-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Invoice To:</p>
              <p className="text-sm font-bold">{invoice.customer_first_name} {invoice.customer_last_name}</p>
              {invoice.customer_phone && <p className="text-xs text-gray-500">{invoice.customer_phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-bold">INV #{invoice.id}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">
                {format(new Date(invoice.created_at || Date.now()), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-bold text-gray-500 text-xs uppercase">Item</th>
                  <th className="text-center py-2 font-bold text-gray-500 text-xs uppercase w-12">Qty</th>
                  <th className="text-right py-2 font-bold text-gray-500 text-xs uppercase w-20">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 font-medium">{item.name || item.item_name || 'Service'}</td>
                    <td className="py-3 text-center text-gray-500">{item.quantity || 1}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.unit_price || item.price || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t-2 border-dashed border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-accent-red">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black pt-2">
              <span>Total Paid</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 uppercase font-bold">Thank you for your visit!</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-admin-border bg-admin-surface/50 shrink-0 print:hidden flex gap-3">
          <button 
            type="button" 
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium border border-admin-border hover:bg-admin-surface transition-colors"
          >
            Close
          </button>
          
          <button 
            type="button"
            onClick={handlePrint}
            className="flex-[2] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold bg-brand text-white hover:bg-brand-dark transition-colors shadow-lg shadow-brand/25"
          >
            <RiPrinterLine className="text-lg" /> Print Receipt
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
