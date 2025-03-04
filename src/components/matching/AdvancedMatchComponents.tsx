import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Filter, MapPin, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UsageService } from '@/services/usage';

interface BoostStats {
  active: boolean;
  remainingTime?: number;
  viewsReceived: number;
  matchIncrease: number;
}

interface FilterOptions {
  verificationLevel: string[];
  location: string;
  radius: number;
  investmentRange: {
    min: number;
    max: number;
  };
  industries: string[];
}

const AdvancedMatching = () => {
  const [boostStats, setBoostStats] = useState<BoostStats>({
    active: false,
    viewsReceived: 0,
    matchIncrease: 0
  });
  
  const [filters, setFilters] = useState<FilterOptions>({
    verificationLevel: [],
    location: '',
    radius: 50,
    investmentRange: { min: 0, max: 1000000 },
    industries: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canBoost, setCanBoost] = useState(false);

  useEffect(() => {
    checkBoostAccess();
    fetchBoostStats();
  }, []);

  const checkBoostAccess = async () => {
    try {
      const response = await fetch('/api/matches/boost/access');
      if (!response.ok) throw new Error('Failed to check boost access');
      const { canAccess } = await response.json();
      setCanBoost(canAccess);
    } catch (err) {
      console.error('Error checking boost access:', err);
    }
  };

  const fetchBoostStats = async () => {
    try {
      const response = await fetch('/api/matches/boost/stats');
      if (!response.ok) throw new Error('Failed to fetch boost stats');
      const data = await response.json();
      setBoostStats(data);
    } catch (err) {
      setError('Failed to load boost statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activateBoost = async () => {
    try {
      const response = await fetch('/api/matches/boost/activate', {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to activate boost');
      
      const data = await response.json();
      setBoostStats(prev => ({
        ...prev,
        active: true,
        remainingTime: data.duration
      }));
    } catch (err) {
      setError('Failed to activate boost');
      console.error(err);
    }
  };

  const updateFilters = async (newFilters: Partial<FilterOptions>) => {
    try {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);

      const response = await fetch('/api/matches/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFilters)
      });

      if (!response.ok) throw new Error('Failed to update filters');
    } catch (err) {
      setError('Failed to update filters');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Boost Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
            Profile Boost
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!canBoost ? (
            <Alert>
              <AlertDescription>
                Profile boost is available with Gold and Platinum subscriptions.
                Upgrade your plan to access this feature.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {boostStats.viewsReceived}
                  </div>
                  <div className="text-sm text-gray-600">Profile Views</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {boostStats.matchIncrease}%
                  </div>
                  <div className="text-sm text-gray-600">Match Increase</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {boostStats.remainingTime ? 
                      `${Math.ceil(boostStats.remainingTime / 60)}m` : 
                      'Ready'
                    }
                  </div>
                  <div className="text-sm text-gray-600">Time Left</div>
                </div>
              </div>

              <button
                onClick={activateBoost}
                disabled={boostStats.active}
                className="w-full py-2 px-4 bg-gradient-to-r from-yellow-400 to-orange-500 
                         text-white rounded-lg font-semibold hover:from-yellow-500 
                         hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {boostStats.active ? 'Boost Active' : 'Activate 30min Boost'}
              </button>

              <p className="text-sm text-gray-600 text-center">
                Get up to 10x more profile views for 30 minutes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Advanced Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Verification Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['BusinessPlan', 'UseCase', 'FiscalAnalysis'].map(level => (
                <button
                  key={level}
                  onClick={() => {
                    const newLevels = filters.verificationLevel.includes(level)
                      ? filters.verificationLevel.filter(l => l !== level)
                      : [...filters.verificationLevel, level];
                    updateFilters({ verificationLevel: newLevels });
                  }}
                  className={`p-2 rounded-lg border text-sm ${
                    filters.verificationLevel.includes(level)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => updateFilters({ location: e.target.value })}
                  placeholder="Enter city or region"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="w-32">
                <select
                  value={filters.radius}
                  onChange={(e) => updateFilters({ radius: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value={25}>25 miles</option>
                  <option value={50}>50 miles</option>
                  <option value={100}>100 miles</option>
                  <option value={0}>Any</option>
                </select>
              </div>
            </div>
          </div>

          {/* Investment Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  value={filters.investmentRange.min}
                  onChange={(e) => updateFilters({
                    investmentRange: {
                      ...filters.investmentRange,
                      min: Number(e.target.value)
                    }
                  })}
                  placeholder="Min amount"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={filters.investmentRange.max}
                  onChange={(e) => updateFilters({
                    investmentRange: {
                      ...filters.investmentRange,
                      max: Number(e.target.value)
                    }
                  })}
                  placeholder="Max amount"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Reset Filters */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setFilters({
                  verificationLevel: [],
                  location: '',
                  radius: 50,
                  investmentRange: { min: 0, max: 1000000 },
                  industries: []
                });
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Reset Filters
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedMatching;