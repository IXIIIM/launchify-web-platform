// src/pages/settings/components/NotificationSettings.tsx

import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface NotificationPreferences {
  email: {
    matches: boolean;
    messages: boolean;
    updates: boolean;
    marketing: boolean;
  };
  push: {
    matches: boolean;
    messages: boolean;
    updates: boolean;
  };
}

interface NotificationSettingsProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onError, onSuccess }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      matches: true,
      messages: true,
      updates: true,
      marketing: false
    },
    push: {
      matches: true,
      messages: true,
      updates: false
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/settings/notifications');
      if (!response.ok) throw new Error('Failed to fetch notification preferences');
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      onError('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (type: 'email' | 'push', setting: string) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [setting]: !prev[type][setting as keyof typeof prev[typeof type]]
      }
    }));
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error('Failed to update notification settings');
      onSuccess('Notification preferences saved successfully');
    } catch (error) {
      onError('Failed to save notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 w-1/4 rounded"></div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Notification Preferences</h3>
      
      {/* Email Notifications */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Email Notifications</h4>
        <div className="space-y-4">
          {Object.entries(preferences.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">
                  {key === 'matches' ? 'New Matches' :
                   key === 'messages' ? 'New Messages' :
                   key === 'updates' ? 'Platform Updates' : 
                   'Marketing Communications'}
                </p>
                <p className="text-sm text-gray-500">
                  {key === 'matches' ? 'Get notified when you have new matches' :
                   key === 'messages' ? 'Receive email notifications for new messages' :
                   key === 'updates' ? 'Stay informed about platform updates and new features' :
                   'Receive marketing and promotional emails'}
                </p>
              </div>
              <Switch
                checked={value}
                onCheckedChange={() => handleToggle('email', key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Push Notifications</h4>
        <div className="space-y-4">
          {Object.entries(preferences.push).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">
                  {key === 'matches' ? 'New Matches' :
                   key === 'messages' ? 'New Messages' :
                   'Platform Updates'}
                </p>
                <p className="text-sm text-gray-500">
                  {key === 'matches' ? 'Get push notifications for new matches' :
                   key === 'messages' ? 'Receive push notifications for new messages' :
                   'Get notified about important platform updates'}
                </p>
              </div>
              <Switch
                checked={value}
                onCheckedChange={() => handleToggle('push', key)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button
          onClick={savePreferences}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;