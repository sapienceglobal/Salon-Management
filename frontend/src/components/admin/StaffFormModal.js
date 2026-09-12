'use client';

import {  useState, useEffect  } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { createPortal } from 'react-dom';
import { RiCloseLine, RiFileCopyLine, RiCheckLine, RiInformationLine } from 'react-icons/ri';
import api from '@/lib/api';

export default function StaffFormModal({ isOpen, onClose, onSuccess, initialData }) {
  const isEditing = !!initialData;
  
  const [formData, setFormData] = useState({
    // User Account fields (Only used for Creation)
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'staff',
    password: '',
    
    // Staff Profile fields
    designation: '',
    salary: '',
    joining_date: new Date().toISOString().split('T')[0],
    specializations: '', // Will be comma separated string in UI, array in API
    bio: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate a random secure password for new users
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData(prev => ({ ...prev, password: pass }));
  };

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      if (initialData) {
        setFormData({
          first_name: initialData.first_name || '',
          last_name: initialData.last_name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          role: initialData.role || 'staff',
          designation: initialData.designation || '',
          salary: initialData.salary || '',
          joining_date: initialData.joining_date ? initialData.joining_date.split('T')[0] : '',
          specializations: initialData.specializations ? 
            (typeof initialData.specializations === 'string' ? JSON.parse(initialData.specializations).join(', ') : initialData.specializations.join(', ')) 
            : '',
          bio: initialData.bio || '',
          password: ''
        });
      } else {
        setFormData({
          first_name: '', last_name: '', email: '', phone: '', role: 'staff', password: '',
          designation: '', salary: '', joining_date: new Date().toISOString().split('T')[0], specializations: '', bio: ''
        });
        generatePassword();
      }
      setError('');
      setCopied(false);
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  if (!isOpen || !mounted) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formData.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let userId = initialData?.user_id;

      if (!isEditing) {
        // Step 1: Create the User Account (Login Credentials)
        const userPayload = {
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          role: formData.role
        };
        const userRes = await api.post('/settings/users', userPayload);
        userId = userRes.data.id;
      }

      // Step 2: Create or Update the Staff Profile (HR Details)
      const staffPayload = {
        user_id: userId,
        designation: formData.designation,
        joining_date: formData.joining_date,
        salary: formData.salary ? Number(formData.salary) : undefined,
        specializations: formData.specializations ? formData.specializations.split(',').map(s => s.trim()).filter(Boolean) : [],
        bio: formData.bio
      };

      if (isEditing) {
        await api.put(`/staff/${initialData.id}`, staffPayload);
        
        // Also update user base details if changed
        const userUpdatePayload = {
           first_name: formData.first_name,
           last_name: formData.last_name,
           phone: formData.phone,
           role: formData.role
        };
        await api.put(`/settings/users/${initialData.user_id}`, userUpdatePayload);
      } else {
        await api.post('/staff', staffPayload);
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-[fadeOut_0.2s_ease_forwards]' : 'animate-[fadeIn_0.2s_ease_forwards]'}`} onMouseDown={handleClose}>
      <div 
        className={`bg-admin-card text-admin-text w-full max-w-2xl h-full border-l border-admin-border shadow-2xl flex flex-col ${isClosing ? 'animate-[slideOutRight_0.2s_ease_forwards]' : 'animate-[slideInRight_0.3s_ease_forwards]'}`}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-admin-border bg-admin-surface/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold">{isEditing ? 'Edit Staff Profile' : 'Onboard New Staff'}</h2>
            <p className="text-sm text-admin-text-secondary mt-1">
              {isEditing ? 'Update employment details and access roles.' : 'Create an account and employment profile in one step.'}
            </p>
          </div>
          <button onClick={handleClose} className="text-admin-text-secondary hover:text-admin-text p-2 rounded-md hover:bg-admin-surface-light transition-colors">
            <RiCloseLine className="text-2xl" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6">
          <form id="staff-form" onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm rounded-lg">
                {error}
              </div>
            )}

            {/* SECTION 1: Identity & Access */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-admin-text-muted border-b border-admin-border pb-2">1. Identity & Access</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">First Name *</label>
                  <input
                    type="text" required value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    placeholder="e.g., Sarah"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Last Name *</label>
                  <input
                    type="text" required value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    placeholder="e.g., Connor"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Email Address *</label>
                  <input
                    type="email" required value={formData.email} disabled={isEditing}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none disabled:opacity-60"
                    placeholder="sarah@example.com"
                  />
                  {isEditing && <p className="text-[11px] text-admin-text-muted mt-1">Email cannot be changed after creation.</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Phone Number *</label>
                  <input
                    type="tel" required value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">System Role *</label>
                  <select
                    required value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  >
                    <option value="staff">Staff (Service Provider)</option>
                    <option value="receptionist">Receptionist (Front Desk)</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                
                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Temporary Password</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text" readOnly value={formData.password || ''}
                        className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm font-mono text-admin-text outline-none opacity-80"
                      />
                      <button 
                        type="button" onClick={copyToClipboard}
                        className="p-2.5 border border-admin-border bg-admin-surface-light rounded-lg hover:bg-admin-surface transition-colors"
                        title="Copy Password"
                      >
                        {copied ? <RiCheckLine className="text-accent-green" /> : <RiFileCopyLine className="text-admin-text-secondary" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-admin-text-muted mt-1 flex items-center gap-1">
                      <RiInformationLine /> Share this securely. User will be forced to change it.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: Employment Details */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-admin-text-muted border-b border-admin-border pb-2">2. Employment Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Designation</label>
                  <input
                    type="text" value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    placeholder="e.g., Senior Stylist"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Base Salary (₹)</label>
                  <input
                    type="number" min="0" step="100" value={formData.salary}
                    onChange={e => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    placeholder="Monthly salary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Joining Date</label>
                  <input
                    type="date" value={formData.joining_date}
                    onChange={e => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none [color-scheme:dark] html[data-theme-mode='light']:![color-scheme:light]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Specializations</label>
                  <input
                    type="text" value={formData.specializations}
                    onChange={e => setFormData({ ...formData, specializations: e.target.value })}
                    className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    placeholder="Hair, Makeup, Nails (Comma separated)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-text-secondary mb-1.5">Bio / Notes</label>
                <textarea
                  rows="3" value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-admin-surface-light border border-admin-border rounded-lg px-4 py-2.5 text-sm text-admin-text focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
                  placeholder="Internal notes or public biography..."
                />
              </div>
            </div>

            {/* Footer Buttons attached directly inside the form to avoid excessive empty space */}
            <div className="pt-4 mt-2 border-t border-admin-border flex items-center justify-end gap-3">
              <button
                type="button" onClick={handleClose} disabled={loading}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface-light transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit" disabled={loading}
                className="bg-brand text-white px-8 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-light transition-colors shadow-lg shadow-brand/20 disabled:opacity-50 min-w-[140px]"
              >
                {loading ? 'Processing...' : isEditing ? 'Update Staff' : 'Onboard Staff'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
