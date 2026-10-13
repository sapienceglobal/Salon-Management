'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import {
  RiWhatsappFill,
  RiShareForwardLine,
  RiCheckLine,
  RiCalendarEventLine,
  RiTimeLine,
  RiUserStarLine,
  RiUserLine,
  RiScissorsCutLine,
  RiCloseLine,
  RiFileCopyLine,
  RiSparklingFill,
  RiPhoneLine,
  RiMailLine,
  RiMailSendLine,
  RiLoader4Line,
  RiRefreshLine,
  RiEditLine
} from 'react-icons/ri';
import { getInitials } from '@/lib/utils';

export function formatWhatsAppPhone(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

export function generateAppointmentMessage(data) {
  const businessName = data.business_name || 'Kaira Makeover';
  const customerName = data.customer_name || 'Valued Client';
  const staffName = data.staff_name || 'Assigned Stylist';
  const serviceNames = data.service_name || 'Salon Services';
  const date = data.formatted_date || data.appointment_date || 'Today';
  const time = data.formatted_time || `${data.start_time || ''} - ${data.end_time || ''}`;
  const total = data.total_price !== undefined ? `₹${parseFloat(data.total_price).toLocaleString()}` : '';
  const duration = data.total_duration ? `${data.total_duration} mins` : '';
  const salonAddress = data.business_address || '123 Main Street, Sector 21, New Delhi';
  const salonPhone = data.business_phone || '+919876543210';
  const bookingId = data.id ? `#APT-${data.id}` : '';

  return `✨ *Appointment Confirmation — ${businessName}* ✨\n\n` +
    `Hello *${customerName}*,\n` +
    `Your salon appointment has been successfully booked! Here are your appointment details:\n\n` +
    (bookingId ? `🔖 *Booking ID:* ${bookingId}\n` : '') +
    `📅 *Date:* ${date}\n` +
    `⏰ *Time Slot:* ${time}${duration ? ` (${duration})` : ''}\n` +
    `💇 *Stylist / Specialist:* ${staffName}\n` +
    `💅 *Service(s):* ${serviceNames}\n` +
    (total ? `💰 *Total Estimate:* ${total}\n\n` : '\n') +
    `📍 *Salon Address:* ${salonAddress}\n` +
    `📞 *Helpline / Support:* ${salonPhone}\n\n` +
    `Please arrive 5–10 minutes before your scheduled slot. We look forward to welcoming you! ✨`;
}

export default function AppointmentSuccessModal({
  isOpen,
  onClose,
  appointment,
  businessSettings
}) {
  const [copied, setCopied] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Derive readable values
  const customerName = appointment?.customer_name || 'Customer';
  const customerPhone = appointment?.customer_phone || '';
  const customerEmail = appointment?.customer_email || appointment?.email || '';
  const staffName = appointment?.staff_name || 'Stylist';
  const staffRole = appointment?.staff_role || 'Specialist';
  const dateStr = appointment?.formatted_date || appointment?.appointment_date;
  const timeStr = appointment?.formatted_time || `${appointment?.start_time || ''} - ${appointment?.end_time || ''}`;
  const totalAmount = parseFloat(appointment?.total_price || appointment?.service_price || 0);
  const servicesList = appointment?.services || (appointment?.service_name ? [{ name: appointment?.service_name, price: totalAmount }] : []);

  const businessName = businessSettings?.business_name || businessSettings?.name || 'Kaira Makeover';
  const businessPhone = businessSettings?.phone || '+919876543210';
  const businessAddress = businessSettings?.address
    ? `${businessSettings.address}${businessSettings.city ? `, ${businessSettings.city}` : ''}`
    : '123 Main Street, Sector 21, New Delhi';

  const fullData = {
    ...appointment,
    business_name: businessName,
    business_phone: businessPhone,
    business_address: businessAddress,
    customer_name: customerName,
    staff_name: staffName,
  };

  const defaultMessage = generateAppointmentMessage(fullData);
  const cleanPhone = formatWhatsAppPhone(customerPhone);

  // Sync custom message and email when appointment changes or modal opens
  useEffect(() => {
    if (isOpen && appointment) {
      setCustomMessage(defaultMessage);
      setRecipientEmail(customerEmail);
      setEmailSent(false);
      setIsEditingEmail(false);
    }
  }, [isOpen, appointment?.id, customerEmail]);

  if (!isOpen || !appointment) return null;

  const handleResetMessage = () => {
    setCustomMessage(defaultMessage);
    toast.success('Message reset to default template');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customMessage);
      setCopied(true);
      toast.success('Message copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy text.');
    }
  };

  const handleSendWhatsApp = () => {
    if (!cleanPhone) {
      toast.error('Customer phone number is missing or invalid.');
      return;
    }
    const encodedText = encodeURIComponent(customMessage);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    toast.success('Opening WhatsApp with confirmation message!');
  };

  const handleSendRealEmail = async () => {
    const targetEmail = (recipientEmail || '').trim();
    if (!targetEmail) {
      setIsEditingEmail(true);
      toast.error('Please enter customer email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      setIsEditingEmail(true);
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSendingEmail(true);
    const toastId = toast.loading(`Sending confirmation email to ${targetEmail}...`);

    try {
      const endpoint = appointment?.id ? `/appointments/${appointment.id}/send-email` : '/appointments/send-email';
      const res = await api.post(endpoint, {
        appointment_id: appointment?.id,
        email: targetEmail,
        customMessage: customMessage
      });

      toast.success(res?.data?.message || `Confirmation email sent to ${targetEmail}!`, { id: toastId, duration: 5000 });
      setEmailSent(true);
      setIsEditingEmail(false);
    } catch (err) {
      console.error('Failed to send confirmation email:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to send confirmation email.';
      toast.error(errMsg, { id: toastId, duration: 4500 });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleShare = async () => {
    const sharePayload = {
      title: `Appointment Confirmation - ${businessName}`,
      text: customMessage,
    };

    // Try Windows / Mobile Native Share (Web Share API)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(sharePayload);
        toast.success('Shared successfully!');
        return;
      } catch (err) {
        if (err.name === 'AbortError') {
          // User closed share dialog
          return;
        }
        console.warn('Native share failed:', err);
      }
    }

    // Fallback: Copy to clipboard and open mailto
    try {
      await navigator.clipboard.writeText(customMessage);
      setCopied(true);
      toast.success('Native share dialog not available. Message copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.open(`mailto:?subject=${encodeURIComponent(sharePayload.title)}&body=${encodeURIComponent(customMessage)}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-[fadeIn_0.2s_ease_forwards]"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-[#151928] text-slate-900 dark:text-slate-100 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden relative animate-[scaleUp_0.2s_ease_forwards] my-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-lg shadow-md shadow-emerald-500/20">
              <RiCheckLine className="stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Appointment Booked Successfully
                </h3>
                {appointment.id && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    #APT-{appointment.id}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Horizontal Split Body (Left: Summary, Right: Editable Message & Share) */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-white/5">
          
          {/* Left Column: Appointment Details */}
          <div className="md:col-span-5 p-5 space-y-3.5 bg-slate-50/40 dark:bg-white/[0.01]">
            
            {/* Customer & Stylist */}
            <div className="space-y-2">
              {/* Customer Row */}
              <div className="flex items-center gap-2.5 bg-white dark:bg-[#1a1f33] p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-pink-500/15 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-xs shrink-0 border border-pink-500/20">
                  {getInitials(customerName?.split(' ')[0], customerName?.split(' ')[1]) || <RiUserLine />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer</span>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{customerName}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                    <RiPhoneLine className="text-[10px] text-[#25D366]" />
                    <span>{customerPhone || 'No Phone'}</span>
                  </div>
                  {recipientEmail && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mt-0.5">
                      <RiMailLine className="text-[10px] text-blue-500" />
                      <span>{recipientEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stylist Row */}
              <div className="flex items-center gap-2.5 bg-white dark:bg-[#1a1f33] p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-500/20">
                  {getInitials(staffName?.split(' ')[0], staffName?.split(' ')[1]) || <RiUserStarLine />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Stylist</span>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{staffName}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{staffRole}</div>
                </div>
              </div>
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-[#1a1f33] p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm shrink-0">
                  <RiCalendarEventLine />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Date</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">{dateStr || 'Today'}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1a1f33] p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm shrink-0">
                  <RiTimeLine />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Time Slot</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">{timeStr}</span>
                </div>
              </div>
            </div>

            {/* Services & Estimate Box */}
            <div className="bg-white dark:bg-[#1a1f33] p-3 rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <RiScissorsCutLine className="text-[#E91E63]" />
                  Services ({servicesList.length})
                </span>
                <span className="text-xs font-black text-[#E91E63]">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>

              <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                {servicesList.map((svc, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-100 dark:border-white/5 last:border-0">
                    <span className="text-slate-700 dark:text-slate-300 truncate pr-2 font-medium">
                      {svc.name || svc.service_name}
                    </span>
                    <span className="text-slate-900 dark:text-white font-semibold shrink-0">
                      {svc.price !== undefined ? `₹${parseFloat(svc.price).toLocaleString()}` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Editable Preview & Multi-channel Sharing */}
          <div className="md:col-span-7 p-5 flex flex-col justify-between space-y-3.5">
            
            {/* Message Editor Header */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <RiEditLine className="text-[#25D366] text-sm" />
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Customer Message (Editable)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetMessage}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                    title="Reset message to default template"
                  >
                    <RiRefreshLine className="text-xs" /> Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[11px] font-semibold text-[#E91E63] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    title="Copy current message text"
                  >
                    {copied ? <RiCheckLine className="text-xs" /> : <RiFileCopyLine className="text-xs" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Editable Message Box */}
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={7}
                placeholder="Type or customize your confirmation message..."
                className="w-full h-40 sm:h-44 p-3 bg-slate-50 dark:bg-[#0f121d] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#25D366] dark:focus:border-[#25D366] resize-none custom-scrollbar transition-colors"
              />
              <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1">
                💡 You can edit this text directly. WhatsApp, Mail and Share will include this customized message.
              </p>

              {/* Recipient Email Field */}
              <div className="mt-2.5 p-2 px-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <RiMailLine className="text-blue-500 shrink-0 text-xs" />
                  {isEditingEmail ? (
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="Enter customer email address..."
                      className="w-full text-xs bg-white dark:bg-[#1a1f33] border border-blue-400 rounded-lg px-2 py-0.5 text-slate-900 dark:text-white focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                      <strong className="text-slate-400 font-medium">To Email: </strong>
                      {recipientEmail ? (
                        <span className="font-semibold text-slate-900 dark:text-white">{recipientEmail}</span>
                      ) : (
                        <span className="text-amber-500 italic">No email set</span>
                      )}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(!isEditingEmail)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                >
                  {isEditingEmail ? 'Done' : recipientEmail ? 'Change' : '+ Add Email'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {/* Primary: WhatsApp Button */}
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#25D366]/25 transition-all cursor-pointer"
                title="Send customized confirmation message on WhatsApp"
              >
                <RiWhatsappFill className="text-lg" />
                <span>Notify Customer on WhatsApp</span>
              </button>

              {/* Secondary Row: Real Email Dispatch, Device Share & Done */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendRealEmail}
                  disabled={isSendingEmail}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border shadow-sm ${
                    emailSent
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/50'
                      : 'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-blue-500/20'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                  title="Send real confirmation email directly to customer inbox"
                >
                  {isSendingEmail ? (
                    <>
                      <RiLoader4Line className="text-base animate-spin" />
                      <span>Sending Mail...</span>
                    </>
                  ) : emailSent ? (
                    <>
                      <RiCheckLine className="text-base" />
                      <span>Email Sent ✓</span>
                    </>
                  ) : (
                    <>
                      <RiMailSendLine className="text-base" />
                      <span>Share Details (Mail)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 font-bold text-xs transition-colors cursor-pointer"
                  title="More share options (Windows / Mobile Native Share)"
                >
                  <RiShareForwardLine className="text-base" />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
