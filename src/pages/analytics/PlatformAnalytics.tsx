// src/pages/analytics/PlatformAnalytics.tsx

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

const PlatformAnalytics = () => {
  const [timeframe, setTimeframe] = useState('30');
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      const startDate = format(subDays(new Date(), parseInt(timeframe)), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');
      
      const response = await fetch(`/api/analytics/platform?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header with time range selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Platform Analytics</h1>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Users</h3>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-bold">{metrics.users.total}</span>
            <span className="ml-2 text-sm text-green-600">
              +{((metrics.users.total - metrics.users.previousTotal) / metrics.users.previousTotal * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Active Subscriptions</h3>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-bold">{metrics.subscriptions.active}</span>
            <span className="ml-2 text-sm text-green-600">
              +{((metrics.subscriptions.active - metrics.subscriptions.previousActive) / metrics.subscriptions.previousActive * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Successful Matches</h3>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-bold">{metrics.matches.successful}</span>
            <span className="ml-2 text-sm text-blue-600">
              {metrics.matches.successRate.toFixed(1)}% rate
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Monthly Revenue</h3>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-bold">${metrics.revenue.monthly.toLocaleString()}</span>
            <span className="ml-2 text-sm text-green-600">
              +{metrics.revenue.monthlyGrowth.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Revenue trends */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Revenue Trends</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.revenue.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#3B82F6" name="Daily Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User acquisition and engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">User Acquisition</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.users.dailySignups}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="entrepreneurs" fill="#3B82F6" name="Entrepreneurs" />
                <Bar dataKey="funders" fill="#10B981" name="Funders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Match Success Rate</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.matches.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="successRate" stroke="#10B981" name="Success Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Subscription distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Subscription Distribution</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={Object.entries(metrics.subscriptions.byTier).map(([tier, count]) => ({ tier, count }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tier" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3B82F6" name="Subscribers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PlatformAnalytics;