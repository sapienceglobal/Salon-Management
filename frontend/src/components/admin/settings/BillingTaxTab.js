import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

export default function BillingTaxTab({ settings, onUpdate }) {
  const [formData, setFormData] = useState({
    tax_enabled: true,
    default_cgst: 9.00,
    default_sgst: 9.00,
    invoice_prefix: 'INV',
    reward_points_per_100: 10,
    reward_points_value: 1.00,
    feedback_enabled: true,
    auto_feedback_after_visit: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        tax_enabled: settings.tax_enabled ?? true,
        default_cgst: settings.default_cgst || 9.00,
        default_sgst: settings.default_sgst || 9.00,
        invoice_prefix: settings.invoice_prefix || 'INV',
        reward_points_per_100: settings.reward_points_per_100 || 10,
        reward_points_value: settings.reward_points_value || 1.00,
        feedback_enabled: settings.feedback_enabled ?? true,
        auto_feedback_after_visit: settings.auto_feedback_after_visit ?? true,
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value) 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/settings/business-settings', formData);
      toast.success('Billing & Tax settings updated successfully');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (!settings) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* --- Taxes & Invoicing --- */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
          Tax & Invoicing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 flex items-center">
            <input
              type="checkbox"
              id="tax_enabled"
              name="tax_enabled"
              checked={formData.tax_enabled}
              onChange={handleChange}
              className="w-5 h-5 text-primary rounded focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="tax_enabled" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Taxes on Invoices (GST)
            </label>
          </div>

          {formData.tax_enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default CGST (%)</label>
                <input
                  type="number"
                  name="default_cgst"
                  value={formData.default_cgst}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default SGST (%)</label>
                <input
                  type="number"
                  name="default_sgst"
                  value={formData.default_sgst}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-900 dark:text-white"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Prefix</label>
            <input
              type="text"
              name="invoice_prefix"
              value={formData.invoice_prefix}
              onChange={handleChange}
              placeholder="e.g., INV"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500">Invoices will look like: {formData.invoice_prefix}-0001</p>
          </div>
        </div>
      </section>

      {/* --- Reward Points --- */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
          Loyalty & Reward Points
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Points Earned per ₹100 Spent</label>
            <input
              type="number"
              name="reward_points_per_100"
              value={formData.reward_points_per_100}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value of 1 Point (in ₹)</label>
            <input
              type="number"
              name="reward_points_value"
              value={formData.reward_points_value}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </section>

      {/* --- Feedback & Reviews --- */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
          Customer Feedback
        </h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="feedback_enabled"
              name="feedback_enabled"
              checked={formData.feedback_enabled}
              onChange={handleChange}
              className="w-5 h-5 text-primary rounded focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="feedback_enabled" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Feedback System
            </label>
          </div>
          {formData.feedback_enabled && (
            <div className="flex items-center ml-8">
              <input
                type="checkbox"
                id="auto_feedback_after_visit"
                name="auto_feedback_after_visit"
                checked={formData.auto_feedback_after_visit}
                onChange={handleChange}
                className="w-5 h-5 text-primary rounded focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="auto_feedback_after_visit" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Automatically send feedback link via SMS/WhatsApp after checkout
              </label>
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg shadow-sm shadow-primary/20 font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
