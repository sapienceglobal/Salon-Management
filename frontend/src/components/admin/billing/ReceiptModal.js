'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import { formatCurrency } from '@/lib/utils';
import { 
  RiCloseLine, RiPrinterLine, RiCheckDoubleLine, 
  RiDownload2Line, RiShareForwardLine, RiFileList3Line, 
  RiSparkling2Line, RiUserLine, RiBankCardLine, RiVipCrownLine
} from 'react-icons/ri';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const subscribe = () => () => {};

export default function ReceiptModal({ isOpen, onClose, invoice, business: propBusiness, businessSettings: propSettings }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [isClosing, setIsClosing] = useState(false);
  const [fetchedSettings, setFetchedSettings] = useState(null);
  
  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && (!propBusiness || !propSettings)) {
      api.get('/settings').then(res => {
        setFetchedSettings(res.data?.data || res.data || null);
      }).catch(err => console.error('Failed to load settings in ReceiptModal', err));
    }
  }, [isOpen, propBusiness, propSettings]);

  const business = propBusiness || fetchedSettings?.business || null;
  const settings = propSettings || fetchedSettings?.settings || null;

  if (!mounted || !isOpen || !invoice) return null;

  const salonName = business?.name || 'Salon Time';
  const salonAddress = business?.address 
    ? `${business.address}${business.city ? `, ${business.city}` : ''}${business.state ? `, ${business.state}` : ''}${business.pincode ? ` - ${business.pincode}` : ''}`
    : '123 Main Street, Downtown, New Delhi - 110001';
  const salonPhone = business?.phone ? `Phone: ${business.phone}` : 'Phone: +91 98765 43210';
  const salonGst = business?.gst_number ? `GSTIN: ${business.gst_number}` : '';

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

  const handleDownload = () => {
    const printContent = document.getElementById('printable-receipt');
    if (!printContent) return;
    const invNumber = invoice.invoice_number || `INV-${invoice.id || '001'}`;
    const printWindow = window.open('', '_blank', 'height=800,width=700');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups to download or print receipt.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${invNumber} - ${salonName}</title>
          <meta charset="utf-8">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #1a1a2e; padding: 24px; }
            .receipt-container { max-width: 480px; margin: 0 auto; border: 1px solid #f1f5f9; padding: 24px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            @media print {
              body { padding: 0; }
              .receipt-container { border: none; box-shadow: none; max-width: 100%; }
            }
          </style>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
        </head>
        <body>
          <div class="receipt-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShare = async () => {
    const invNum = invoice.invoice_number || `INV-${invoice.id || '001'}`;
    const custName = `${invoice.customer_first_name || invoice.customer?.first_name || 'Walk-in'} ${invoice.customer_last_name || invoice.customer?.last_name || ''}`.trim();
    const total = formatCurrency(invoice.total_amount || invoice.paid_amount || 0);
    const shareText = `*${salonName} - Invoice Receipt*\nInvoice: #${invNum}\nCustomer: ${custName}\nTotal Amount: ${total}\nStatus: Paid\n${salonAddress}\n${salonPhone}\nThank you for choosing ${salonName}!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice #${invNum} - ${salonName}`,
          text: shareText,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      toast.success('Invoice summary copied to clipboard!');
    } else {
      toast.success('Invoice text generated: ' + invNum);
    }
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

  const customerName = `${invoice.customer_first_name || invoice.customer?.first_name || 'Walk-in Customer'} ${invoice.customer_last_name || invoice.customer?.last_name || ''}`.trim();
  const customerPhone = invoice.customer_phone || invoice.customer?.phone || '+91 98765 43210';
  const invoiceNumber = invoice.invoice_number || `INV-${invoice.id || '001'}`;
  
  // Format Date
  let dateStr = 'Today';
  if (invoice.created_at) {
    try {
      dateStr = format(new Date(invoice.created_at), 'dd MMM yyyy, hh:mm a');
    } catch (_) {}
  }

  // Determine payment method and transaction ID
  let paymentMethod = 'Cash';
  let transactionId = `TXN-${invoice.id || '001'}`;
  if (invoice.payments && invoice.payments.length > 0) {
    const p = invoice.payments[0];
    paymentMethod = p.payment_method === 'wallet' ? 'Wallet' : (p.payment_method || 'Cash').toUpperCase();
    if (p.transaction_id) transactionId = p.transaction_id;
  } else if (invoice.payment_method) {
    paymentMethod = invoice.payment_method.toUpperCase();
  }

  return createPortal(
    <div 
      className={`fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} 
      onMouseDown={handleClose}
    >
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 99999 !important;
          }
        }
      `}</style>

      <div 
        className={`bg-white text-slate-800 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] border border-slate-100 ${isClosing ? 'animate-[slideDown_0.2s_ease_forwards]' : 'animate-[slideUp_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Top Dialog Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <RiCheckDoubleLine className="text-base" />
            </span>
            Invoice / Receipt
          </div>
          <button 
            onClick={handleClose} 
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Receipt Body (Printable Area) */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 sm:p-7 bg-white text-slate-900" id="printable-receipt">
          
          {/* Header Branding */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#E91E63] to-pink-400 flex items-center justify-center text-white shadow-md shadow-[#E91E63]/20">
                <RiSparkling2Line className="text-2xl" />
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight leading-none text-slate-900">
                  {salonName}
                </div>
                <p className="text-[9px] font-bold text-slate-500 tracking-wider mt-1.5 uppercase">
                  PREMIUM SALON &amp; WELLNESS EXPERIENCE
                </p>
              </div>
            </div>

            <div className="bg-[#FFF0F5] px-3.5 py-1.5 rounded-xl text-right border border-[#E91E63]/20">
              <p className="text-[10px] font-bold text-[#E91E63] uppercase tracking-wider">Invoice</p>
              <p className="text-xs font-black text-slate-900 mt-0.5">#{invoiceNumber}</p>
            </div>
          </div>

          {/* Branch & Timestamp */}
          <div className="flex justify-between items-start text-xs pt-3 pb-3 border-b border-slate-100">
            <div>
              <p className="font-bold text-slate-900 text-xs">{salonName}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">{salonAddress}</p>
              <p className="text-slate-500 text-[11px]">{salonPhone}</p>
              {salonGst && <p className="text-[#E91E63] text-[11px] font-semibold mt-0.5">{salonGst}</p>}
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-[10px] uppercase font-bold">Date & Time</p>
              <p className="text-slate-600 text-[11px] font-semibold mt-0.5">{dateStr}</p>
            </div>
          </div>

          {/* Customer Profile Banner */}
          <div className="flex items-center gap-3 bg-slate-50/80 p-3 rounded-2xl my-3.5 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-[#E91E63] flex items-center justify-center font-bold text-base">
              <RiUserLine className="text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900 text-sm truncate">{customerName}</p>
                <span className="bg-[#FFF0F5] text-[#E91E63] text-[9px] font-bold px-2 py-0.5 rounded-md border border-[#E91E63]/20">
                  Valued Customer
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{customerPhone}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="text-left py-2 font-bold">Item</th>
                  <th className="text-center py-2 font-bold w-12">Qty</th>
                  <th className="text-right py-2 font-bold w-16">Price</th>
                  <th className="text-right py-2 font-bold w-20">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">No items on invoice</td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const qty = item.quantity || item.qty || 1;
                    const price = Number(item.unit_price || item.price || 0);
                    const amount = Number(item.total_price || (price * qty));
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 font-semibold text-slate-900">
                          <div>{item.name || item.item_name || 'Service'}</div>
                          <div className="text-[10px] text-slate-400 font-normal">Service | 45 mins</div>
                        </td>
                        <td className="py-2.5 text-center text-slate-600 font-medium">{qty}</td>
                        <td className="py-2.5 text-right text-slate-600 font-medium">{formatCurrency(price)}</td>
                        <td className="py-2.5 text-right font-bold text-slate-900">{formatCurrency(amount)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="border-t border-slate-200 pt-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal ({items.length} items)</span>
              <span className="font-semibold text-slate-900">{formatCurrency(invoice.subtotal || 0)}</span>
            </div>
            
            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount ({invoice.discount_type === 'percentage' ? 'Applied' : 'Coupon'})</span>
                <span>-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            
            {settings?.tax_enabled !== false ? (
              <>
                <div className="flex justify-between text-slate-500">
                  <span>CGST ({settings?.default_cgst ?? 9}%)</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(invoice.cgst_amount ?? ((invoice.tax_amount || 0) / 2))}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>SGST ({settings?.default_sgst ?? 9}%)</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(invoice.sgst_amount ?? ((invoice.tax_amount || 0) / 2))}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-500">
                <span>Tax (GST Exempt)</span>
                <span className="font-semibold text-slate-900">₹0.00</span>
              </div>
            )}

            {settings?.reward_points_per_100 > 0 && (
              <div className="flex justify-between items-center bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200/60 text-amber-800 font-semibold text-[11px] mt-1">
                <span className="flex items-center gap-1.5"><RiVipCrownLine className="text-amber-500 text-sm" /> Reward Points Earned</span>
                <span>+{Math.floor((invoice.total_amount || invoice.paid_amount || 0) / 100) * settings.reward_points_per_100} pts</span>
              </div>
            )}
            
            <div className="bg-[#FFF0F5] border border-[#E91E63]/25 p-3 rounded-2xl flex justify-between items-center mt-2.5">
              <span className="font-bold text-[#E91E63] text-sm">Total Amount</span>
              <span className="font-black text-[#E91E63] text-xl tracking-tight">
                {formatCurrency(invoice.total_amount || invoice.paid_amount || 0)}
              </span>
            </div>
          </div>

          {/* Payment Method & Transaction Details */}
          <div className="mt-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-pink-100/80 text-[#E91E63] flex items-center justify-center">
                  <RiBankCardLine className="text-lg" />
                </span>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Payment Method</p>
                  <p className="font-bold text-slate-800 text-xs mt-0.5 capitalize">{paymentMethod}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                Paid <RiCheckDoubleLine className="text-xs" />
              </span>
            </div>

            <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-200/70 text-[11px] text-slate-500">
              <div>
                <span className="text-slate-400">Txn ID: </span>
                <span className="font-semibold text-slate-700">{transactionId}</span>
              </div>
              <div>
                <span className="text-slate-400">Payment Time: </span>
                <span className="font-semibold text-slate-700">{dateStr}</span>
              </div>
            </div>
          </div>

          {/* Thank You Note */}
          <div className="mt-4 text-center bg-[#FFF0F5]/60 py-3.5 rounded-2xl border border-[#E91E63]/15">
            <p className="text-lg font-bold italic text-[#E91E63]">
              Thank You!
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              We look forward to seeing you again at {salonName}!
            </p>
          </div>
        </div>

        {/* Bottom Industry-Level Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 print:hidden grid grid-cols-4 gap-2.5">
          <button 
            type="button" 
            onClick={handleDownload}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl font-semibold text-xs border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm group"
          >
            <RiDownload2Line className="text-lg text-slate-500 group-hover:text-[#E91E63] transition-colors mb-0.5" />
            <span>Download</span>
          </button>
          
          <button 
            type="button" 
            onClick={handleShare}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl font-semibold text-xs border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm group"
          >
            <RiShareForwardLine className="text-lg text-slate-500 group-hover:text-[#E91E63] transition-colors mb-0.5" />
            <span>Share</span>
          </button>

          <button 
            type="button" 
            onClick={handlePrint}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl font-semibold text-xs border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm group"
          >
            <RiPrinterLine className="text-lg text-slate-500 group-hover:text-[#E91E63] transition-colors mb-0.5" />
            <span>Print</span>
          </button>

          <button 
            type="button" 
            onClick={handleClose}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl font-bold text-xs bg-[#E91E63] text-white hover:bg-[#d81557] transition-all shadow-md shadow-[#E91E63]/25"
          >
            <RiFileList3Line className="text-lg mb-0.5" />
            <span>New Bill</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
