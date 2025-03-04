// src/components/dashboard/security/MobileComplianceHistory.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar, ChevronDown, Filter, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';

const MobileComplianceHistory = () => {
  const [historyData, setHistoryData] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistoryData();
  }, [timeRange, selectedCategory]);

  const fetchHistoryData = async () => {
    try {
      const response = await fetch(
        `/api/security/compliance/history?timeRange=${timeRange}&category=${selectedCategory}`
      );
      const data = await response.json();
      setHistoryData(data);
    } catch (error) {
      console.error('Error fetching compliance history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Compliance History</h2>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-100 text-sm"
        >
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </button>
      </div>

      {showFilters && (
        <Card className="shadow-lg">
          <CardContent className="p-4 space-y-4">
            {/* Time Range Filter */}
            <div>
              <h3 className="text-sm font-medium mb-2">Time Range</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '7 Days', value: '7d' },
                  { label: '30 Days', value: '30d' },
                  { label: '90 Days', value: '90d' },
                  { label: '1 Year', value: '1y' }
                ].map(range => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      timeRange === range.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-medium mb-2">Category</h3>
              <div className="flex flex-wrap gap-2">
                {['all', 'keyRotation', 'access', 'encryption', 'monitoring'].map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData?.trend || []}>
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => format(new Date(value), 'MMM d')}
                />
                <YAxis 
                  fontSize={12}
                  width={30}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                  formatter={(value) => [`${value}%`, 'Compliance']}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Key Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historyData?.changes?.map((change, index) => (
              <ComplianceChange key={index} change={change} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historical Checks */}
      <div className="space-y-4">
        {historyData?.checks?.map((check, index) => (
          <HistoricalCheck key={index} check={check} />
        ))}
      </div>
    </div>
  );
};

const ComplianceChange = ({ change }) => (
  <div className="flex items-start space-x-3">
    <div className={`p-1 rounded-full ${
      change.impact === 'positive' ? 'bg-green-100' : 'bg-red-100'
    }`}>
      {change.impact === 'positive' ? (
        <TrendingUp className="w-4 h-4 text-green-600" />
      ) : (
        <TrendingDown className="w-4 h-4 text-red-600" />
      )}
    </div>
    <div>
      <div className="font-medium text-sm">{change.title}</div>
      <p className="text-sm text-gray-600">{change.description}</p>
      <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
        <Clock className="w-4 h-4" />
        <span>{format(new Date(change.timestamp), 'MMM d, yyyy HH:mm')}</span>
      </div>
    </div>
  </div>
);

const HistoricalCheck = ({ check }) => (
  <Card>
    <div className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium">{check.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{check.description}</p>
          {check.failures > 0 && (
            <div className="mt-2 text-sm text-red-600">
              Failed {check.failures} times in the last {check.period}
            </div>
          )}
        </div>
        <div className={`px-2 py-1 rounded-full text-sm font-medium ${
          check.currentStatus === 'passed'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {check.currentStatus.charAt(0).toUpperCase() + check.currentStatus.slice(1)}
        </div>
      </div>

      {/* Last Check Results */}
      <div className="mt-4 space-y-2">
        {check.lastResults?.map((result, index) => (
          <div 
            key={index}
            className="flex items-center justify-between text-sm text-gray-600"
          >
            <span>{format(new Date(result.timestamp), 'MMM d, HH:mm')}</span>
            <span className={result.status === 'passed' ? 'text-green-600' : 'text-red-600'}>
              {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  </Card>
);

export default MobileComplianceHistory;