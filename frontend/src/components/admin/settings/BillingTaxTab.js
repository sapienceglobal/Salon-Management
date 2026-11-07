'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { RiErrorWarningLine, RiCheckLine, RiPercentLine, RiCoinsLine, RiFeedbackLine } from 'react-icons/ri';

export default function BillingTaxTab({ settings, onUpdate }) {
  const [formData, setFormData] = useState(() => ({
    tax_enabled: settings?.tax_enabled ?? true,
    default_cgst: settings?.default_cgst ?? 9.00,
    default_sgst: settings?.default_sgst ?? 9.00,
    invoice_prefix: settings?.invoice_prefix || 'INV',
    reward_points_per_100: settings?.reward_points_per_100 ?? 10,
    reward_points_value: settings?.reward_points_value ?? 1.00,
    feedback_enabled: settings?.feedback_enabled ?? true,
    auto_feedback_after_visit: settings?.auto_feedback_after_visit ?? true,
  }));

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        tax_enabled: settings.tax_enabled ?? true,
        default_cgst: settings.default_cgst ?? 9.00,
        default_sgst: settings.default_sgst ?? 9.00,
        invoice_prefix: settings.invoice_prefix || 'INV',
        reward_points_per_100: settings.reward_points_per_100 ?? 10,
        reward_points_value: settings.reward_points_value ?? 1.00,
        feedback_enabled: settings.feedback_enabled ?? true,
        auto_feedback_after_visit: settings.auto_feedback_after_visit ?? true,
      });
    }
  }, [settings]);

  const validateField = (name, value) => {
    switch (name) {
      case 'invoice_prefix':
        if (!value || !value.toString().trim()) return 'Invoice prefix is required';
        if (value.toString().trim().length > 20) return 'Invoice prefix cannot exceed 20 characters';
        return '';
      case 'default_cgst':
        if (value === '' || value === null || value === undefined) return 'CGST rate is required';
        if (Number(value) < 0 || Number(value) > 100) return 'CGST must be between 0% and 100%';
        return '';
      case 'default_sgst':
        if (value === '' || value === null || value === undefined) return 'SGST rate is required';
        if (Number(value) < 0 || Number(value) > 100) return 'SGST must be between 0% and 100%';
        return '';
      case 'reward_points_per_100':
        if (Number(value) < 0) return 'Points cannot be negative';
        return '';
      case 'reward_points_value':
        if (Number(value) < 0) return 'Point value cannot be negative';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : Number(value)) : value);

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    if (touched[name] || errors[name]) {
      const err = validateField(name, finalValue);
      setErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = {
      invoice_prefix: true,
      default_cgst: true,
      default_sgst: true,
      reward_points_per_100: true,
      reward_points_value: true,
    };
    setTouched(allTouched);

    const newErrors = {};
    if (formData.tax_enabled) {
      const cgstErr = validateField('default_cgst', formData.default_cgst);
      if (cgstErr) newErrors.default_cgst = cgstErr;

      const sgstErr = validateField('default_sgst', formData.default_sgst);
      if (sgstErr) newErrors.default_sgst = sgstErr;
    }
    const prefixErr = validateField('invoice_prefix', formData.invoice_prefix);
    if (prefixErr) newErrors.invoice_prefix = prefixErr;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the highlighted errors before saving');
      return;
    }

    setLoading(true);
    try {
      await api.put('/settings/business-settings', {
        ...formData,
        default_cgst: Number(formData.default_cgst) || 0,
        default_sgst: Number(formData.default_sgst) || 0,
        reward_points_per_100: Number(formData.reward_points_per_100) || 0,
        reward_points_value: Number(formData.reward_points_value) || 0,
      });
      toast.success('Billing & Tax settings updated successfully');
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 3000);
      if (onUpdate) await onUpdate();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

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
      
      {/* --- Taxes & Invoicing --- */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <RiPercentLine className="text-xl text-brand" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Tax & Invoicing</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 flex items-center p-3.5 bg-gray-50/70 dark:bg-gray-800/40 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <input
              type="checkbox"
              id="tax_enabled"
              name="tax_enabled"
              checked={formData.tax_enabled}
              onChange={handleChange}
              className="w-5 h-5 text-brand rounded focus:ring-brand dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
            />
            <label htmlFor="tax_enabled" className="ml-3 block text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
              Enable GST / Taxes on Invoices
            </label>
          </div>

          {formData.tax_enabled && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Default CGST (%) <span className="text-brand">*</span>
                </label>
                <input
                  type="number"
                  name="default_cgst"
                  value={formData.default_cgst}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  step="0.01"
                  min="0"
                  max="100"
                  className={getInputClasses('default_cgst')}
                />
                {touched.default_cgst && errors.default_cgst && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.default_cgst}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Default SGST (%) <span className="text-brand">*</span>
                </label>
                <input
                  type="number"
                  name="default_sgst"
                  value={formData.default_sgst}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  step="0.01"
                  min="0"
                  max="100"
                  className={getInputClasses('default_sgst')}
                />
                {touched.default_sgst && errors.default_sgst && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.default_sgst}</span>
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Invoice Prefix <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              name="invoice_prefix"
              value={formData.invoice_prefix}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. INV"
              className={getInputClasses('invoice_prefix')}
            />
            {touched.invoice_prefix && errors.invoice_prefix ? (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.invoice_prefix}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-400">Generated invoice format: {formData.invoice_prefix || 'INV'}-0001</p>
            )}
          </div>
        </div>
      </div>

      {/* --- Reward Points --- */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <RiCoinsLine className="text-xl text-brand" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Loyalty & Reward Points</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Points Earned per ₹100 Spent
            </label>
            <input
              type="number"
              name="reward_points_per_100"
              value={formData.reward_points_per_100}
              onChange={handleChange}
              onBlur={handleBlur}
              min="0"
              className={getInputClasses('reward_points_per_100')}
            />
            {touched.reward_points_per_100 && errors.reward_points_per_100 && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.reward_points_per_100}</span>
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Value of 1 Point (in ₹)
            </label>
            <input
              type="number"
              name="reward_points_value"
              value={formData.reward_points_value}
              onChange={handleChange}
              onBlur={handleBlur}
              step="0.01"
              min="0"
              className={getInputClasses('reward_points_value')}
            />
            {touched.reward_points_value && errors.reward_points_value && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <RiErrorWarningLine className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.reward_points_value}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* --- Feedback & Reviews --- */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          <RiFeedbackLine className="text-xl text-brand" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Customer Feedback</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center p-3.5 bg-gray-50/70 dark:bg-gray-800/40 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <input
              type="checkbox"
              id="feedback_enabled"
              name="feedback_enabled"
              checked={formData.feedback_enabled}
              onChange={handleChange}
              className="w-5 h-5 text-brand rounded focus:ring-brand dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
            />
            <label htmlFor="feedback_enabled" className="ml-3 block text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
              Enable Customer Feedback Collection
            </label>
          </div>
          {formData.feedback_enabled && (
            <div className="flex items-center ml-4 p-3.5 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-200/40 dark:border-gray-700/40">
              <input
                type="checkbox"
                id="auto_feedback_after_visit"
                name="auto_feedback_after_visit"
                checked={formData.auto_feedback_after_visit}
                onChange={handleChange}
                className="w-5 h-5 text-brand rounded focus:ring-brand dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
              />
              <label htmlFor="auto_feedback_after_visit" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Automatically send feedback survey link via SMS / WhatsApp after checkout
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Footer Submit Button */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
        <div>
          {isSavedRecently && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
              <RiCheckLine className="text-base" /> Billing settings saved successfully
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
