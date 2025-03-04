// src/pages/settings/security/TwoFactorSettings.tsx

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';

const TwoFactorSettings = () => {
  const [status, setStatus] = useState<{
    enabled: boolean;
    method: 'authenticator' | 'sms' | null;
  }>({ enabled: false, method: null });
  const [showSetup, setShowSetup] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/2fa/status');
      if (!response.ok) throw new Error('Failed to fetch 2FA status');
      
      const data = await response.json();
      setStatus({
        enabled: data.enabled,
        method: data.method
      });
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
      setError('Failed to load 2FA settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    try {
      const response = await fetch('/api/2fa/disable', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to disable 2FA');

      setStatus({ enabled: false, method: null });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      setError('Failed to disable 2FA');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <TwoFactorSetup
        onComplete={() => {
          setShowSetup(false);
          fetchStatus();
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
        <p className="mt-1 text-sm text-gray-600">
          Add an extra layer of security to your account
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {status.enabled ? (
            <div className="space-y-4">
              <Alert>
                <AlertTitle>2FA is enabled</AlertTitle>
                <AlertDescription>
                  Your account is secured using {status.method === 'authenticator' 
                    ? 'an authenticator app' 
                    : 'SMS verification'
                  }
                </AlertDescription>
              </Alert>

              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleDisable}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Disable 2FA
                </button>
                <button
                  onClick={() => setShowSetup(true)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Change 2FA Method
                </button>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900">Recovery Codes</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Recovery codes can be used to access your account if you lose your 2FA device.
                </p>
                <div className="mt-2">
                  <button
                    onClick={() => {/* Handle viewing recovery codes */}}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    View Recovery Codes
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Two-factor authentication adds an extra layer of security to your account
                by requiring more than just a password to sign in.
              </p>

              <button
                onClick={() => setShowSetup(true)}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Enable 2FA
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Security tips */}
      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-yellow-400">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Security Tips
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Always keep your recovery codes in a safe place
                </li>
                <li>
                  Don't share your 2FA codes with anyone
                </li>
                <li>
                  Use an authenticator app instead of SMS when possible
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSettings;