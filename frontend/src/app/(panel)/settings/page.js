'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { 
  RiStore2Line, RiSettings3Line, RiMoneyDollarCircleLine, 
  RiUserSettingsLine, RiGroupLine, RiNotification3Line, RiHomeGearLine
} from 'react-icons/ri';

// Tab Components (We will create these next)
import GeneralSettingsTab from '@/components/admin/settings/GeneralSettingsTab';
import OperationsTab from '@/components/admin/settings/OperationsTab';
import BillingTaxTab from '@/components/admin/settings/BillingTaxTab';
import RoomsTab from '@/components/admin/settings/RoomsTab';
import UsersTab from '@/components/admin/settings/UsersTab';
import CommissionsTab from '@/components/admin/settings/CommissionsTab';
import NotificationsTab from '@/components/admin/settings/NotificationsTab';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [business, setBusiness] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      setBusiness(res.data?.business || null);
      setSettings(res.data?.settings || null);
    } catch (err) {
      console.error('Failed to fetch settings', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const tabs = [
    { id: 'general', label: 'Business Profile', icon: RiStore2Line },
    { id: 'operations', label: 'Operations', icon: RiSettings3Line },
    { id: 'billing', label: 'Billing & Tax', icon: RiMoneyDollarCircleLine },
    { id: 'users', label: 'Staff & Roles', icon: RiUserSettingsLine },
    { id: 'commissions', label: 'Commissions', icon: RiGroupLine },
    { id: 'rooms', label: 'Service Rooms', icon: RiHomeGearLine },
    { id: 'notifications', label: 'Notifications', icon: RiNotification3Line },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-admin-text">Settings</h1>
          <p className="text-sm text-admin-text-muted">Manage your salon configuration, billing, and team access.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Vertical Tabs Navigation (Sidebar on Desktop, Horizontal Scroll on Mobile) */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap lg:whitespace-normal text-left font-medium text-sm
                    ${isActive 
                      ? 'bg-brand text-white shadow-md shadow-brand/20' 
                      : 'text-admin-text-secondary hover:bg-admin-surface-light hover:text-admin-text'
                    }`}
                >
                  <Icon className={`text-xl ${isActive ? 'text-white' : 'text-admin-text-muted'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 bg-admin-surface rounded-2xl shadow-sm border border-admin-border p-6 min-h-[500px]">
          {activeTab === 'general' && <GeneralSettingsTab business={business} onUpdate={fetchSettings} />}
          {activeTab === 'operations' && <OperationsTab settings={settings} onUpdate={fetchSettings} />}
          {activeTab === 'billing' && <BillingTaxTab settings={settings} onUpdate={fetchSettings} />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'commissions' && <CommissionsTab />}
          {activeTab === 'rooms' && <RoomsTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
        </div>
      </div>
    </div>
  );
}
