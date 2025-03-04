// src/pages/settings/SettingsPage.tsx

import React, { useState } from 'react';
import { Card, PageHeader } from '@/components/ui/card';
import { Bell, Lock, User, Monitor } from 'lucide-react';
import ProfileSettings from './components/ProfileSettings';
import NotificationSettings from './components/NotificationSettings';
import SecuritySettings from './components/SecuritySettings';
import PreferenceSettings from './components/PreferenceSettings';
import SettingsTabs from './components/SettingsTabs';

type TabId = 'profile' | 'notifications' | 'security' | 'preferences';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings onError={setError} onSuccess={setSuccess} />;
      case 'notifications':
        return <NotificationSettings onError={setError} onSuccess={setSuccess} />;
      case 'security':
        return <SecuritySettings onError={setError} onSuccess={setSuccess} />;
      case 'preferences':
        return <PreferenceSettings onError={setError} onSuccess={setSuccess} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <PageHeader 
        title="Settings" 
        description="Manage your account settings and preferences"
      />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div className="mt-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 sm:col-span-3">
          <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </aside>

        <main className="col-span-12 sm:col-span-9">
          <Card className="p-6">
            {renderContent()}
          </Card>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;