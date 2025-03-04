// src/pages/settings/components/SettingsTabs.tsx

import React from 'react';
import { Bell, Lock, User, Monitor } from 'lucide-react';

type TabId = 'profile' | 'notifications' | 'security' | 'preferences';

interface SettingsTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: 'profile' as TabId, label: 'Profile', icon: User },
  { id: 'notifications' as TabId, label: 'Notifications', icon: Bell },
  { id: 'security' as TabId, label: 'Security', icon: Lock },
  { id: 'preferences' as TabId, label: 'Preferences', icon: Monitor }
];

const SettingsTabs: React.FC<SettingsTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="space-y-1">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
            activeTab === id
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Icon className="w-5 h-5 mr-3" />
          {label}
        </button>
      ))}
    </nav>
  );
};

export default SettingsTabs;