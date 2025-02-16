import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lock, Shield, Key, Bell } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SecuritySettings = () => {
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    passwordExpiration: 90,
    minPasswordLength: 12,
    requireSpecialChars: true,
    requireNumbers: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    notifyOnNewDevice: true,
    notifyOnPasswordChange: true,
    autoLockTimeout: 15,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      const response = await fetch('/api/settings/security');
      if (!response.ok) throw new Error('Failed to fetch security settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      setError('Failed to load security settings');
      console.error('Error fetching security settings:', error);
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
      const response = await fetch('/api/settings/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to update security settings');
      setSuccess('Security settings updated successfully');
    } catch (error) {
      setError('Failed to update security settings');
      console.error('Error updating security settings:', error);
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
        <h1 className="text-2xl font-bold">Security Settings</h1>
        <Lock className="w-6 h-6 text-blue-600" />
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
          <Shield className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Authentication Settings */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Authentication
          </h2>
          
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <span>Two-Factor Authentication</span>
              </label>
              <button
                type="button"
                onClick={() => setSettings(prev => ({
                  ...prev,
                  twoFactorEnabled: !prev.twoFactorEnabled
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium">
                Minimum Password Length
              </label>
              <input
                type="number"
                min="8"
                max="32"
                value={settings.minPasswordLength}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  minPasswordLength: parseInt(e.target.value)
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Password Expiration (days)
              </label>
              <input
                type="number"
                min="30"
                max="365"
                value={settings.passwordExpiration}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  passwordExpiration: parseInt(e.target.value)
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <span>Require Special Characters</span>
              </label>
              <button
                type="button"
                onClick={() => setSettings(prev => ({
                  ...prev,
                  requireSpecialChars: !prev.requireSpecialChars
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.requireSpecialChars ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.requireSpecialChars ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <span>Require Numbers</span>
              </label>
              <button
                type="button"
                onClick={() => setSettings(prev => ({
                  ...prev,
                  requireNumbers: !prev.requireNumbers
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.requireNumbers ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.requireNumbers ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Session Settings */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Session Security
          </h2>
          
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  sessionTimeout: parseInt(e.target.value)
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Maximum Login Attempts
              </label>
              <input
                type="number"
                min="3"
                max="10"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  maxLoginAttempts: parseInt(e.target.value)
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Auto-Lock Timeout (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={settings.autoLockTimeout}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  autoLockTimeout: parseInt(e.target.value)
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Security Notifications
          </h2>
          
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <span>Notify on New Device Login</span>
              </label>
              <button
                type="button"
                onClick={() => setSettings(prev => ({
                  ...prev,
                  notifyOnNewDevice: !prev.notifyOnNewDevice
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.notifyOnNewDevice ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.notifyOnNewDevice ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <span>Notify on Password Change</span>
              </label>
              <button
                type="button"
                onClick={() => setSettings(prev => ({
                  ...prev,
                  notifyOnPasswordChange: !prev.notifyOnPasswordChange
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.notifyOnPasswordChange ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.notifyOnPasswordChange ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SecuritySettings;