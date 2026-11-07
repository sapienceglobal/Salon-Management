'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { RiErrorWarningLine, RiStore2Line, RiMapPin2Line, RiGlobalLine, RiCheckLine } from 'react-icons/ri';
import { useAuth } from '@/context/AuthContext';

export default function GeneralSettingsTab({ business, onUpdate }) {
  const { fetchUser } = useAuth();

  const [formData, setFormData] = useState({
    name: business?.name || '',
    email: business?.email || '',
    phone: business?.phone || '',
    gst_number: business?.gst_number || '',
    address: business?.address || '',
    city: business?.city || '',
    state: business?.state || '',
    pincode: business?.pincode || '',
    currency: business?.currency || 'INR',
    timezone: business?.timezone || 'Asia/Kolkata',
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Sync state whenever the business prop updates or initially loads
  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        email: business.email || '',
        phone: business.phone || '',
        gst_number: business.gst_number || '',
        address: business.address || '',
        city: business.city || '',
        state: business.state || '',
        pincode: business.pincode || '',
        currency: business.currency || 'INR',
        timezone: business.timezone || 'Asia/Kolkata',
      });
    }
  }, [business]);

  // Industry-level field validator
  const validateField = (fieldName, value) => {
    const val = (value ?? '').toString().trim();

    switch (fieldName) {
      case 'name':
        if (!val) return 'Business name is required';
        if (val.length < 2) return 'Business name must be at least 2 characters';
        if (val.length > 100) return 'Business name cannot exceed 100 characters';
        return '';

      case 'email':
        if (!val) return 'Contact email is required';
        // Comprehensive RFC-compliant email regex
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(val)) return 'Please enter a valid email address (e.g. name@example.com)';
        return '';

      case 'phone':
        if (!val) return 'Contact phone is required';
        const cleanDigits = val.replace(/\D/g, '');
        if (cleanDigits.length < 10 || cleanDigits.length > 15) {
          return 'Please enter a valid phone number (10 to 15 digits)';
        }
        return '';

      case 'gst_number':
        if (val) {
          // Indian GSTIN: 2 digits (state) + 5 chars (PAN) + 4 digits + 1 char + 1 entity + 'Z' + 1 check digit
          const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
          if (!gstRegex.test(val)) {
            return 'Invalid GSTIN format. Example: 07AAAAA0000A1Z5 (15 characters)';
          }
        }
        return '';

      case 'pincode':
        if (val) {
          // Valid Indian 6-digit PIN code (cannot start with 0) or general zip
          const pinRegex = /^[1-9][0-9]{5}$/;
          if (!pinRegex.test(val)) {
            return 'Please enter a valid 6-digit Indian PIN code (e.g. 110001)';
          }
        }
        return '';

      case 'currency':
        if (!val) return 'Currency code is required';
        return '';

      case 'timezone':
        if (!val) return 'Timezone is required';
        return '';

      case 'address':
        if (val && val.length > 500) return 'Address cannot exceed 500 characters';
        return '';

      case 'city':
        if (val && val.length > 100) return 'City cannot exceed 100 characters';
        return '';

      case 'state':
        if (val && val.length > 100) return 'State cannot exceed 100 characters';
        return '';

      default:
        return '';
    }
  };

  // Validate entire form
  const validateForm = (data) => {
    const newErrors = {};
    ['name', 'email', 'phone', 'gst_number', 'pincode', 'currency', 'timezone', 'address', 'city', 'state'].forEach((field) => {
      const err = validateField(field, data[field]);
      if (err) newErrors[field] = err;
    });
    return newErrors;
  };

  // Live validation on change
  const handleChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === 'gst_number' ? value.toUpperCase() : value;

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    // If the field was already touched or has an error, re-validate live
    if (touched[name] || errors[name]) {
      const fieldError = validateField(name, finalValue);
      setErrors(prev => ({
        ...prev,
        [name]: fieldError,
      }));
    }
  };

  // On blur: mark as touched and validate
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {
      name: true,
      email: true,
      phone: true,
      gst_number: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      currency: true,
      timezone: true,
    };
    setTouched(allTouched);

    // Validate all fields
    const formErrors = validateForm(formData);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      // Focus the first invalid field for top-notch UX
      const firstErrorKey = Object.keys(formErrors)[0];
      const targetElement = document.getElementById(`field-${firstErrorKey}`) || document.querySelector(`[name="${firstErrorKey}"]`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.focus();
      }
      toast.error('Please fix the highlighted errors before saving');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        gst_number: formData.gst_number.trim() ? formData.gst_number.trim().toUpperCase() : null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        pincode: formData.pincode.trim() || null,
        currency: formData.currency,
        timezone: formData.timezone,
      };

      await api.put('/settings/business', payload);
      toast.success('Business profile updated successfully');
      
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 3000);

      // Re-fetch settings so parent has fresh data
      if (onUpdate) await onUpdate();

      // Refresh current auth user so topbar/header branding updates instantly
      if (fetchUser) await fetchUser();

      // Reset touched state
      setTouched({});
    } catch (err) {
      console.error('Settings update error:', err);
      const serverMessage = err.response?.data?.message || err.message || 'Failed to update business profile';
      toast.error(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper for input border and background classes
  const getInputClasses = (fieldName) => {
    const hasError = touched[fieldName] && Boolean(errors[fieldName]);
    return `w-full px-4 py-2.5 rounded-xl border text-sm transition-all outline-none ${
      hasError
        ? 'bg-red-50/20 dark:bg-red-950/20 border-red-500 dark:border-red-500/80 text-gray-900 dark:text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 shadow-sm shadow-red-500/10'
        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20'
    }`;
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8 animate-in fade-in duration-300">
      
      {/* Section 1: Business Identity & Contact */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <RiStore2Line className="text-xl text-brand" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Business Identity & Contact</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Name */}
          <div>
            <label htmlFor="field-name" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Business Name <span className="text-brand dark:text-pink-400">*</span>
            </label>
            <input
              id="field-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. RAHairStylist"
              className={getInputClasses('name')}
            />
            {touched.name && errors.name && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>
          
          {/* Contact Email */}
          <div>
            <label htmlFor="field-email" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Contact Email <span className="text-brand dark:text-pink-400">*</span>
            </label>
            <input
              id="field-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="admin@rahairstylist.salontime.co.in"
              className={getInputClasses('email')}
            />
            {touched.email && errors.email && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <label htmlFor="field-phone" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Contact Phone <span className="text-brand dark:text-pink-400">*</span>
            </label>
            <input
              id="field-phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="+91 98765 43210"
              className={getInputClasses('phone')}
            />
            {touched.phone && errors.phone && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.phone}</span>
              </p>
            )}
          </div>

          {/* GSTIN / Tax ID */}
          <div>
            <label htmlFor="field-gst_number" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              GSTIN / Tax ID <span className="text-xs font-normal text-gray-400">(Optional)</span>
            </label>
            <input
              id="field-gst_number"
              type="text"
              name="gst_number"
              value={formData.gst_number}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="07AAAAA0000A1Z5"
              maxLength={15}
              className={`${getInputClasses('gst_number')} uppercase tracking-wider font-mono`}
            />
            {touched.gst_number && errors.gst_number ? (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.gst_number}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-400">15-digit alphanumeric Indian GST identifier</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Location & Address */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <RiMapPin2Line className="text-xl text-brand" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Salon Location & Address</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Street Address */}
          <div className="md:col-span-2">
            <label htmlFor="field-address" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Street Address <span className="text-xs font-normal text-gray-400">(Optional)</span>
            </label>
            <textarea
              id="field-address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={2}
              placeholder="e.g. Shop 12, Ground Floor, Central Plaza"
              className={getInputClasses('address')}
            />
            {touched.address && errors.address && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.address}</span>
              </p>
            )}
          </div>

          {/* City */}
          <div>
            <label htmlFor="field-city" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              City <span className="text-xs font-normal text-gray-400">(Optional)</span>
            </label>
            <input
              id="field-city"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. New Delhi"
              className={getInputClasses('city')}
            />
            {touched.city && errors.city && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.city}</span>
              </p>
            )}
          </div>

          {/* State */}
          <div>
            <label htmlFor="field-state" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              State / Province <span className="text-xs font-normal text-gray-400">(Optional)</span>
            </label>
            <input
              id="field-state"
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. Delhi"
              className={getInputClasses('state')}
            />
            {touched.state && errors.state && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.state}</span>
              </p>
            )}
          </div>

          {/* Pincode */}
          <div>
            <label htmlFor="field-pincode" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Pincode / Zip <span className="text-xs font-normal text-gray-400">(Optional)</span>
            </label>
            <input
              id="field-pincode"
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. 110001"
              maxLength={6}
              className={getInputClasses('pincode')}
            />
            {touched.pincode && errors.pincode ? (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.pincode}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-400">6-digit Indian postal code</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Localization & Currency */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <RiGlobalLine className="text-xl text-brand" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Regional & Localization</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Currency */}
          <div>
            <label htmlFor="field-currency" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Currency Code <span className="text-brand dark:text-pink-400">*</span>
            </label>
            <select
              id="field-currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClasses('currency')}
            >
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="AED">AED (د.إ) - UAE Dirham</option>
            </select>
            {touched.currency && errors.currency && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.currency}</span>
              </p>
            )}
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="field-timezone" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Timezone <span className="text-brand dark:text-pink-400">*</span>
            </label>
            <select
              id="field-timezone"
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={getInputClasses('timezone')}
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
              <option value="UTC">UTC (Universal Time)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
            </select>
            {touched.timezone && errors.timezone && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.timezone}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Submit Button */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
        <div>
          {isSavedRecently && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
              <RiCheckLine className="text-base" /> Changes saved successfully
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand hover:bg-brand-dark active:scale-[0.99] text-white rounded-xl shadow-md shadow-brand/20 font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>
    </form>
  );
}
