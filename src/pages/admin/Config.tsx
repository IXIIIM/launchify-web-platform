import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PlatformConfig {
  matching: {
    dailyLimit: number;
    refreshInterval: number;
    minimumCompatibility: number;
  };
  verification: {
    reviewTimeout: number;
    requiredDocuments: string[];
    autoRejectAfter: number;
  };
  subscription: {
    trialPeriod: number;
    gracePeriod: number;
    brokerageFee: number;
  };
  notifications: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    reminderIntervals: number[];
  };
}

export default function AdminConfig() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (!response.ok) throw new Error('Failed to fetch configuration');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      setError('Failed to load configuration');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Failed to update configuration');
      
      setSuccess('Configuration updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update configuration');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const response = await fetch('/api/admin/config/reset', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to reset configuration');
      
      await fetchConfig();
      setSuccess('Configuration reset to defaults');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to reset configuration');
      console.error(error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!config) return null;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Platform Configuration</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleReset}
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Reset to Defaults
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Matching Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Matching Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Daily Match Limit
              </label>
              <input
                type="number"
                value={config.matching.dailyLimit}
                onChange={(e) => setConfig(prev => prev ? {
                  ...prev,
                  matching: {
                    ...prev.matching,
                    dailyLimit: Number(e.target.value)
                  }
                } : null)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Refresh Interval (hours)
              </label>
              <input
                type="number"
                value={config.matching.refreshInterval}
                onChange={(e) => setConfig(prev => prev ? {
                  ...prev,
                  matching: {
                    ...prev.matching,
                    refreshInterval: Number(e.target.value)
                  }
                } : null)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Minimum Compatibility (%)
              </label>
              <input
                type="number"
                value={config.matching.minimumCompatibility}
                onChange={(e) => setConfig(prev => prev ? {
                  ...prev,
                  matching: {
                    ...prev.matching,
                    minimumCompatibility: Number(e.target.value)
                  }
                } : null)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Verification Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Review Timeout (hours)
              </label>
              <input
                type="number"
                value={config.verification.reviewTimeout}
                onChange={(e) => setConfig(prev => prev ? {
                  ...prev,
                  verification: {
                    ...prev.verification,
                    reviewTimeout: Number(e.target.value)
                  }
                } : null)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Required Documents
              </label>
              <div className="space-y-2">
                {config.verification.requiredDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={doc}
                      onChange={(e) => {
                        const newDocs = [...config.verification.requiredDocuments];
                        newDocs[index] = e.target.value;
                        setConfig(prev => prev ? {
                          ...prev,
                          verification: {
                            ...prev.verification,
                            requiredDocuments: newDocs
                          }
                        } : null);
                      }}
                      className="flex-1 p-2 border rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newDocs = config.verification.requiredDocuments.filter((_, i) => i !== index);
                        setConfig(prev => prev ? {
                          ...prev,
                          verification: {
                            ...prev.verification,
                            requiredDocuments: newDocs
                          }
                        } : null);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newDocs = [...config.verification.requiredDocuments, ''];
                    setConfig(prev => prev ? {
                      ...prev,
                      verification: {
                        ...prev.verification,
                        requiredDocuments: newDocs
                      }
                    } : null);
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Add Document
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Trial Period (days)
              </label>
              <input
                type="number"
                value={config.subscription.trialPeriod}
                onChange={(e) => setConfig(prev => prev ? {
                  ...prev,
                  subscription: {
                    ...prev.subscription,
                    trialPeriod: Number(e.target.value)
                  }
                } : null)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Grace Period (days)
              </label>
              <input
                type="number"
                value={config.subscription.gracePeriod}
                onChange={(e) => setConfig(prev => prev ? {
                  ...prev,
                  subscription: {
                    ...prev.subscription,
                    gracePeriod: Number(e.target.value)
                  }
                } : null)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Brokerage Fee (%)
              </label>
              <input
                type="number"
                value={config.subscription.brokerageFee}
                onChange={(e) => setConfig(prev => prev ? {
                  ...prev,
                  subscription: {
                    ...prev.subscription,
                    brokerageFee: Number(e.target.value)
                  }
                } : null)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.notifications.emailEnabled}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      emailEnabled: e.target.checked
                    }
                  } : null)}
                  className="mr-2"
                />
                Email Notifications
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.notifications.pushEnabled}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      pushEnabled: e.target.checked
                    }
                  } : null)}
                  className="mr-2"
                />
                Push Notifications
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Reminder Intervals (hours)
              </label>
              <input
                type="text"
                value={config.notifications.reminderIntervals.join(', ')}
                onChange={(e) => {
                  const intervals = e.target.value
                    .split(',')
                    .map(n => parseInt(n.trim()))
                    .filter(n => !isNaN(n));
                  setConfig(prev => prev ? {
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      reminderIntervals: intervals
                    }
                  } : null);
                }}
                placeholder="e.g., 24, 48, 72"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
