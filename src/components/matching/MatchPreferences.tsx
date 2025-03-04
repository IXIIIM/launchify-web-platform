import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface MatchPreferences {
  industries: string[];
  investmentRange: {
    min: number;
    max: number;
  };
  experienceRange: {
    min: number;
    max: number;
  };
  location?: string;
  businessType?: 'B2B' | 'B2C';
}

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Real Estate',
  'Manufacturing',
  'Retail',
  'Energy',
  'Transportation',
  'Agriculture'
];

const investmentRanges = [
  { label: '$50k - $250k', min: 50000, max: 250000 },
  { label: '$250k - $1M', min: 250000, max: 1000000 },
  { label: '$1M - $5M', min: 1000000, max: 5000000 },
  { label: '$5M+', min: 5000000, max: Number.MAX_SAFE_INTEGER }
];

const experienceRanges = [
  { label: '0-2 years', min: 0, max: 2 },
  { label: '3-5 years', min: 3, max: 5 },
  { label: '6-10 years', min: 6, max: 10 },
  { label: '10+ years', min: 10, max: Number.MAX_SAFE_INTEGER }
];

const MatchPreferences = () => {
  const [preferences, setPreferences] = useState<MatchPreferences>({
    industries: [],
    investmentRange: { min: 0, max: Number.MAX_SAFE_INTEGER },
    experienceRange: { min: 0, max: Number.MAX_SAFE_INTEGER }
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
      const response = await fetch('/api/matches/preferences');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError('Failed to load preferences');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/matches/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) throw new Error('Failed to save preferences');
      setSuccess('Preferences saved successfully');
    } catch (err) {
      setError('Failed to save preferences');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleIndustry = (industry: string) => {
    setPreferences(prev => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry]
    }));
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Industries */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Industries</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {industries.map(industry => (
              <button
                key={industry}
                onClick={() => toggleIndustry(industry)}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  preferences.industries.includes(industry)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                {industry}
              </button>
            ))}
          </div>
        </div>

        {/* Investment Range */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Investment Range</h3>
          <Select
            value={`${preferences.investmentRange.min}-${preferences.investmentRange.max}`}
            onValueChange={(value) => {
              const [min, max] = value.split('-').map(Number);
              setPreferences(prev => ({
                ...prev,
                investmentRange: { min, max }
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select investment range" />
            </SelectTrigger>
            <SelectContent>
              {investmentRanges.map(range => (
                <SelectItem
                  key={range.label}
                  value={`${range.min}-${range.max}`}
                >
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Experience Range */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Experience Level</h3>
          <Select
            value={`${preferences.experienceRange.min}-${preferences.experienceRange.max}`}
            onValueChange={(value) => {
              const [min, max] = value.split('-').map(Number);
              setPreferences(prev => ({
                ...prev,
                experienceRange: { min, max }
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select experience range" />
            </SelectTrigger>
            <SelectContent>
              {experienceRanges.map(range => (
                <SelectItem
                  key={range.label}
                  value={`${range.min}-${range.max}`}
                >
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Business Type Preference */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Business Type</h3>
          <Select
            value={preferences.businessType}
            onValueChange={(value: 'B2B' | 'B2C') => {
              setPreferences(prev => ({
                ...prev,
                businessType: value
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="B2B">B2B</SelectItem>
              <SelectItem value="B2C">B2C</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchPreferences;