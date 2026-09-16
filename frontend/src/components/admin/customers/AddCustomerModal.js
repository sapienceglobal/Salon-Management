'use client';

import { useEffect, useState } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { customerSchema, formatZodErrors } from '@/lib/validations';
import { RiCloseLine, RiUserLine, RiPhoneLine, RiMailLine, RiMapPinLine, RiCalendarEventLine } from 'react-icons/ri';

export default function AddCustomerModal({ isOpen, onClose, onSuccess, initialData }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    gender: 'female',
    gst_number: '',
    date_of_birth: '',
    anniversary: '',
    location: '',
    source: '',
    address: '',
    notes: '',
    sms_opt_in: false,
    email_opt_in: false,
    whatsapp_opt_in: false,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          first_name: initialData.first_name || '',
          last_name: initialData.last_name || '',
          phone: initialData.phone || '',
          email: initialData.email || '',
          gender: initialData.gender || 'female',
          gst_number: initialData.gst_number || '',
          date_of_birth: initialData.date_of_birth ? initialData.date_of_birth.split('T')[0] : '',
          anniversary: initialData.anniversary ? initialData.anniversary.split('T')[0] : '',
          location: initialData.location || '',
          source: initialData.source || '',
          address: initialData.address || '',
          notes: initialData.notes || '',
          sms_opt_in: initialData.sms_opt_in ?? false,
          email_opt_in: initialData.email_opt_in ?? false,
          whatsapp_opt_in: initialData.whatsapp_opt_in ?? false,
        });
      } else {
        setFormData({
          first_name: '', last_name: '', phone: '', email: '', gender: 'female',
          gst_number: '', date_of_birth: '', anniversary: '', location: '', source: '',
          address: '', notes: '', sms_opt_in: false, email_opt_in: false, whatsapp_opt_in: false,
        });
      }
      setError('');
    }
  }, [isOpen, initialData]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  if (!isOpen || !mounted) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const payload = { ...formData };
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          delete payload[key];
        }
      });

      // Zod Validation
      const result = customerSchema.safeParse(payload);
      if (!result.success) {
        setFieldErrors(formatZodErrors(result.error));
        setLoading(false);
        return;
      }

      if (initialData) {
        const res = await api.put(`/customers/${initialData.id}`, payload);
        onSuccess(res.data);
      } else {
        const res = await api.post('/customers', payload);
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err?.message || err?.response?.data?.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={handleClose}>
      <div 
        className={`bg-admin-card text-admin-text w-full max-w-4xl h-full border-l border-admin-border shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-admin-border bg-admin-surface/50 shrink-0">
          <h2 className="text-xl font-bold">{initialData ? 'Edit Customer' : 'Add Customer'}</h2>
          <button onClick={handleClose} className="p-2 hover:bg-admin-surface rounded-full transition-colors text-admin-text-secondary hover:text-admin-text">
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6">
          {error && <div className="p-3 mb-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm">{error}</div>}
          
          <form id="customerForm" onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            
            <div className="grid grid-cols-2 gap-4">
              {/* Phone Code & Number */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Mobile number*</label>
                <div className="flex gap-2">
                  <select className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2.5 text-sm text-admin-text outline-none focus:border-brand w-20 shrink-0">
                    <option value="+91">+91</option>
                  </select>
                  <div className="w-full">
                    <input name="phone" value={formData.phone} onChange={handleChange}
                      className={`w-full bg-admin-surface border rounded-xl px-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand ${fieldErrors.phone ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`}
                      placeholder="9301386917" />
                    {fieldErrors.phone && <p className="text-accent-red text-xs mt-1">{fieldErrors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">First name*</label>
                <input name="first_name" value={formData.first_name} onChange={handleChange}
                  className={`w-full bg-admin-surface border rounded-xl px-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand ${fieldErrors.first_name ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`}
                  placeholder="First name" />
                {fieldErrors.first_name && <p className="text-accent-red text-xs mt-1">{fieldErrors.first_name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Email ID</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className={`w-full bg-admin-surface border rounded-xl px-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand ${fieldErrors.email ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`}
                  placeholder="Email ID" />
                {fieldErrors.email && <p className="text-accent-red text-xs mt-1">{fieldErrors.email}</p>}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Last name</label>
                <input name="last_name" value={formData.last_name} onChange={handleChange}
                  className={`w-full bg-admin-surface border rounded-xl px-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand ${fieldErrors.last_name ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`}
                  placeholder="Last name" />
                {fieldErrors.last_name && <p className="text-accent-red text-xs mt-1">{fieldErrors.last_name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-3">Gender</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleChange} className="accent-brand w-4 h-4" />
                    <span className="text-sm font-semibold">Female</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleChange} className="accent-brand w-4 h-4" />
                    <span className="text-sm font-semibold">Male</span>
                  </label>
                </div>
              </div>

              {/* GST Number */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">GST Number</label>
                <input name="gst_number" value={formData.gst_number} onChange={handleChange}
                  className={`w-full bg-admin-surface border rounded-xl px-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand ${fieldErrors.gst_number ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`}
                  placeholder="GST Number" />
                {fieldErrors.gst_number && <p className="text-accent-red text-xs mt-1">{fieldErrors.gst_number}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* DOB */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Date of birth</label>
                <div className="relative">
                  <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange}
                    className={`w-full bg-admin-surface border rounded-xl px-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand dark:[color-scheme:dark] ${fieldErrors.date_of_birth ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`} />
                  {fieldErrors.date_of_birth && <p className="text-accent-red text-xs mt-1">{fieldErrors.date_of_birth}</p>}
                </div>
              </div>

              {/* Anniversary */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Anniversary</label>
                <div className="relative">
                  <input type="date" name="anniversary" value={formData.anniversary} onChange={handleChange}
                    className="w-full bg-admin-surface border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand dark:[color-scheme:dark]" />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Location</label>
                <input name="location" value={formData.location} onChange={handleChange}
                  className={`w-full bg-admin-surface border rounded-xl px-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand ${fieldErrors.location ? 'border-accent-red focus:border-accent-red' : 'border-admin-border'}`}
                  placeholder="Location" />
                {fieldErrors.location && <p className="text-accent-red text-xs mt-1">{fieldErrors.location}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Source */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Select source</label>
                <select name="source" value={formData.source} onChange={handleChange}
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand">
                  <option value="">Select source</option>
                  <option value="walk_in">Walk-in</option>
                  <option value="referral">Referral</option>
                  <option value="online">Online</option>
                  <option value="campaign">Campaign</option>
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Address</label>
                <input name="address" value={formData.address} onChange={handleChange}
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand"
                  placeholder="Address" />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Customer Note</label>
                <input name="notes" value={formData.notes} onChange={handleChange}
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand"
                  placeholder="Customer Note" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Membership Card */}
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">Membership Card Number</label>
                <input className="w-full bg-admin-surface border border-admin-border rounded-xl px-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand"
                  placeholder="Membership Card Number" />
              </div>

              {/* Referred By */}
              <div>
                <label className="block text-xs font-semibold text-brand mb-1">Referred By</label>
                <div className="relative">
                  <input className="w-full bg-admin-surface border border-admin-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-admin-text outline-none focus:border-brand"
                    placeholder="Customer Name/mobile" />
                  <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-brand" />
                </div>
              </div>
            </div>

            {/* Promotion Checkboxes */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-admin-border">
              <span className="text-brand font-semibold text-sm">Promotion</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="sms_opt_in" checked={formData.sms_opt_in} onChange={handleChange} className="accent-brand w-4 h-4 bg-admin-surface" />
                <span className="text-sm font-semibold">SMS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="email_opt_in" checked={formData.email_opt_in} onChange={handleChange} className="accent-brand w-4 h-4 bg-admin-surface" />
                <span className="text-sm font-semibold">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="whatsapp_opt_in" checked={formData.whatsapp_opt_in} onChange={handleChange} className="accent-brand w-4 h-4 bg-admin-surface" />
                <span className="text-sm font-semibold">WhatsApp</span>
              </label>

              <span className="text-brand font-semibold text-sm ml-4">Transaction</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-brand w-4 h-4 bg-admin-surface" defaultChecked />
                <span className="text-sm font-semibold">SMS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-brand w-4 h-4 bg-admin-surface" defaultChecked />
                <span className="text-sm font-semibold">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-brand w-4 h-4 bg-admin-surface" defaultChecked />
                <span className="text-sm font-semibold">WhatsApp</span>
              </label>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-admin-border bg-admin-surface/50 shrink-0">
          <div className="flex gap-3">
            <button type="button" onClick={handleClose} disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl border border-admin-border text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface-light text-sm font-bold transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-brand hover:bg-brand-light text-white text-sm font-bold transition-colors shadow-lg shadow-brand/20 disabled:opacity-50 flex items-center justify-center">
              {loading ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
