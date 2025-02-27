import React, { useState, useEffect } from 'react';
import { Bell, Mail, AlertTriangle, Check, AlertCircle, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    email: {
      securityAlerts: true,
      newMatches: true,
      messages: true,
      systemUpdates: false,
      subscriptionUpdates: true,
      marketingEmails: false
    },
    push: {
      securityAlerts: true,
      newMatches: true,
      messages: true,
      systemUpdates: true,
      subscriptionUpdates: false,
      marketingNotifications: false
    },
    frequency: 'instant', // 'instant', 'daily', 'weekly'
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setError('Failed to load notification preferences');
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error('Failed to update notification preferences');
      setSuccess('Notification preferences updated successfully');
    } catch (error) {
      setError('Failed to update notification preferences');
      console.error('Error updating preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
        <Bell className="w-6 h-6 text-blue-600" />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Email Notifications */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Email Notifications
          </h2>
          
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            {Object.entries(preferences.email).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <span className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setPreferences(prev => ({
                    ...prev,
                    email: {
                      ...prev.email,
                      [key]: !value
                    }
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    value ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Push Notifications */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Push Notifications
          </h2>
          
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            {Object.entries(preferences.push).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <span className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setPreferences(prev => ({
                    ...prev,
                    push: {
                      ...prev.push,
                      [key]: !value
                    }
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    value ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Notification Frequency */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Notification Frequency
          </h2>
          
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {['instant', 'daily', 'weekly'].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setPreferences(prev => ({
                    ...prev,
                    frequency: freq
                  }))}
                  className={`p-3 rounded-lg border-2 text-center capitalize ${
                    preferences.frequency === freq
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Quiet Hours */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Quiet Hours
          </h2>
          
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <span>Enable Quiet Hours</span>
              </label>
              <button
                type="button"
                onClick={() => setPreferences(prev => ({
                  ...prev,
                  quietHours: {
                    ...prev.quietHours,
                    enabled: !prev.quietHours.enabled
                  }
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  preferences.quietHours.enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    preferences.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {preferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      quietHours: {
                        ...prev.quietHours,
                        start: e.target.value
                      }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      quietHours: {
                        ...prev.quietHours,
                        end: e.target.value
                      }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationPreferences;