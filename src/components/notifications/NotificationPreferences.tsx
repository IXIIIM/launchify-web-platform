import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, DollarSign, UserCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NotificationPreferences {
  email: {
    matches: boolean;
    messages: boolean;
    payments: boolean;
    verifications: boolean;
    updates: boolean;
  };
  push: {
    matches: boolean;
    messages: boolean;
    payments: boolean;
    verifications: boolean;
    updates: boolean;
  };
  inApp: {
    matches: boolean;
    messages: boolean;
    payments: boolean;
    verifications: boolean;
    updates: boolean;
  };
}

const NOTIFICATION_TYPES = [
  {
    id: 'matches',
    label: 'Match Notifications',
    description: 'Get notified about new matches and match requests',
    icon: UserCheck
  },
  {
    id: 'messages',
    label: 'Message Notifications',
    description: 'Get notified about new messages',
    icon: MessageSquare
  },
  {
    id: 'payments',
    label: 'Payment Notifications',
    description: 'Get notified about payments and escrow updates',
    icon: DollarSign
  },
  {
    id: 'verifications',
    label: 'Verification Notifications',
    description: 'Get notified about verification status changes',
    icon: UserCheck
  },
  {
    id: 'updates',
    label: 'Platform Updates',
    description: 'Get notified about platform updates and announcements',
    icon: Bell
  }
];

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    fetchPreferences();
    checkPushPermission();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const checkPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.permission;
      setPushPermission(permission);
    }
  };

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPushPermission(permission);
        
        if (permission === 'granted') {
          // Register service worker and get push subscription
          const registration = await navigator.serviceWorker.register('/notification-worker.js');
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          });

          // Send subscription to backend
          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
          });
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to enable push notifications');
      }
    }
  };

  const handleToggle = async (
    channel: 'email' | 'push' | 'inApp',
    type: string,
    enabled: boolean
  ) => {
    if (!preferences) return;

    try {
      setSaving(true);
      setError('');

      // If enabling push notifications and permission not granted
      if (channel === 'push' && enabled && pushPermission !== 'granted') {
        await requestPushPermission();
        if (pushPermission !== 'granted') return;
      }

      const updatedPreferences = {
        ...preferences,
        [channel]: {
          ...preferences[channel],
          [type]: enabled
        }
      };

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPreferences)
      });

      if (!response.ok) throw new Error('Failed to update preferences');

      setPreferences(updatedPreferences);
      setSuccess('Preferences updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!preferences) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {NOTIFICATION_TYPES.map((type) => (
          <Card key={type.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <type.icon className="h-5 w-5 mr-2" />
                {type.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">{type.description}</p>

              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span>Email Notifications</span>
                  </div>
                  <Switch
                    checked={preferences.email[type.id as keyof typeof preferences.email]}
                    onCheckedChange={(checked) => handleToggle('email', type.id, checked)}
                    disabled={saving}
                  />
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-gray-500" />
                    <span>Push Notifications</span>
                  </div>
                  <Switch
                    checked={preferences.push[type.id as keyof typeof preferences.push]}
                    onCheckedChange={(checked) => handleToggle('push', type.id, checked)}
                    disabled={saving}
                  />
                </div>

                {/* In-App Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-gray-500" />
                    <span>In-App Notifications</span>
                  </div>
                  <Switch
                    checked={preferences.inApp[type.id as keyof typeof preferences.inApp]}
                    onCheckedChange={(checked) => handleToggle('inApp', type.id, checked)}
                    disabled={saving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}