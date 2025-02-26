// src/pages/settings/components/PreferenceSettings.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sun, Moon, Download } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

interface PreferenceSettingsProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

interface UserPreferences {
  language: string;
  timezone: string;
  emailFormat: 'html' | 'text';
  darkMode: boolean;
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'British Time (BST)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'zh', label: '中文' },
];

const PreferenceSettings: React.FC<PreferenceSettingsProps> = ({ onError, onSuccess }) => {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'en',
    timezone: 'UTC',
    emailFormat: 'html',
    darkMode: theme === 'dark'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/settings/preferences');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      onError('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setPreferences(prev => ({ ...prev, darkMode: newTheme === 'dark' }));
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error('Failed to update preferences');
      onSuccess('Preferences saved successfully');
    } catch (error) {
      onError('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataExport = async () => {
    try {
      const response = await fetch('/api/settings/export');
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'account-data.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      onSuccess('Data exported successfully');
    } catch (error) {
      onError('Failed to export data');
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 w-1/4 rounded"></div>
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">App Preferences</h3>

      {/* Theme Settings */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Theme</h4>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {preferences.darkMode ? (
                <Moon className="w-5 h-5 text-gray-600" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-gray-500">
                  Toggle between light and dark theme
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.darkMode}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Language</h4>
        <Select
          value={preferences.language}
          onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}
        >
          {LANGUAGES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>

      {/* Timezone Settings */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Timezone</h4>
        <Select
          value={preferences.timezone}
          onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}
        >
          {TIMEZONES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>

      {/* Email Format */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Email Format</h4>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="html"
              name="emailFormat"
              value="html"
              checked={preferences.emailFormat === 'html'}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                emailFormat: e.target.value as 'html' | 'text'
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="html" className="ml-3 block text-sm text-gray-700">
              HTML (Rich text)
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="text"
              name="emailFormat"
              value="text"
              checked={preferences.emailFormat === 'text'}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                emailFormat: e.target.value as 'html' | 'text'
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="text" className="ml-3 block text-sm text-gray-700">
              Plain text
            </label>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Data Export</h4>
        <Button
          variant="outline"
          onClick={handleDataExport}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Account Data
        </Button>
        <p className="mt-2 text-sm text-gray-500">
          Download a copy of your account data in JSON format
        </p>
      </div>

      {/* Save Button */}
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

export default PreferenceSettings;