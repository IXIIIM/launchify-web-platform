// src/pages/settings/components/SecuritySettings.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Shield, Smartphone, Key } from 'lucide-react';

interface SecuritySettingsProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

interface LoginSession {
  id: string;
  device: string;
  location: string;
  timestamp: string;
  status: 'success' | 'failed';
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ onError, onSuccess }) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginSession[]>([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchSecuritySettings();
    fetchLoginHistory();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      const response = await fetch('/api/settings/security');
      if (!response.ok) throw new Error('Failed to fetch security settings');
      const data = await response.json();
      setIsTwoFactorEnabled(data.twoFactorEnabled);
    } catch (error) {
      onError('Failed to load security settings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const response = await fetch('/api/settings/security/login-history');
      if (!response.ok) throw new Error('Failed to fetch login history');
      const data = await response.json();
      setLoginHistory(data);
    } catch (error) {
      onError('Failed to load login history');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      onError('New passwords do not match');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/settings/security/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      if (!response.ok) throw new Error('Failed to update password');

      onSuccess('Password updated successfully');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      onError('Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTwoFactor = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/settings/security/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isTwoFactorEnabled }),
      });

      if (!response.ok) throw new Error('Failed to update 2FA settings');

      setIsTwoFactorEnabled(!isTwoFactorEnabled);
      onSuccess(`Two-factor authentication ${isTwoFactorEnabled ? 'disabled' : 'enabled'}`);
    } catch (error) {
      onError('Failed to update two-factor authentication');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 w-1/4 rounded"></div>
      <div className="space-y-2">
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Security Settings</h3>

      {/* Password Change */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Password</h4>
        {isChangingPassword ? (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <Input
                type="password"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  currentPassword: e.target.value
                }))}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <Input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  newPassword: e.target.value
                }))}
                required
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <Input
                type="password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  confirmPassword: e.target.value
                }))}
                required
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsChangingPassword(true)}
          >
            <Key className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <div className="pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Two-Factor Authentication</h4>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className={`w-8 h-8 ${isTwoFactorEnabled ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">
                  {isTwoFactorEnabled
                    ? 'Your account is protected by two-factor authentication'
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
            </div>
            <Button
              variant={isTwoFactorEnabled ? "outline" : "default"}
              onClick={toggleTwoFactor}
              disabled={isSaving}
            >
              {isTwoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Login Activity */}
      <div className="pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Recent Login Activity</h4>
        <div className="space-y-4">
          {loginHistory.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <Smartphone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">{session.device}</p>
                  <p className="text-sm text-gray-500">{session.location}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {new Date(session.timestamp).toLocaleDateString()}
                </p>
                <p className={`text-sm ${
                  session.status === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;