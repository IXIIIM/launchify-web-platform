import React, { useState, useEffect } from 'react';
import {
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface MetricCard {
  title: string;
  value: number;
  change: number;
  format?: (value: number) => string;
}

interface AdminAnalytics {
  users: {
    total: number;
    active: number;
    growth: number;
    byType: {
      entrepreneurs: number;
      funders: number;
    };
    byTier: Record<string, number>;
  };
  matches: {
    total: number;
    successful: number;
    rate: number;
    averageTime: number;
  };
  revenue: {
    total: number;
    mrr: number;
    growth: number;
    byTier: Record<string, number>;
  };
  trends: {
    signups: Array<{ date: string; count: number }>;
    revenue: Array<{ date: string; amount: number }>;
    matches: Array<{ date: string; count: number }>;
  };
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return <div>Loading...</div>;

  const metrics: MetricCard[] = [
    {
      title: 'Total Users',
      value: data.users.total,
      change: data.users.growth,
    },
    {
      title: 'Monthly Revenue',
      value: data.revenue.mrr,
      change: data.revenue.growth,
      format: (value) => `$${value.toLocaleString()}`
    },
    {
      title: 'Match Rate',
      value: data.matches.rate,
      change: 0,
      format: (value) => `${value.toFixed(1)}%`
    },
    {
      title: 'Active Users',
      value: data.users.active,
      change: 0,
      format: (value) => `${value.toLocaleString()}`
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Platform Analytics</h1>
        <div className="flex space-x-2">
          {['day', 'week', 'month', 'year'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t as typeof timeframe)}
              className={`px-3 py-1 rounded ${
                timeframe === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.format ? metric.format(metric.value) : metric.value}
              </div>
              {metric.change !== 0 && (
                <p className={`text-xs ${
                  metric.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change > 0 ? '↑' : '↓'} {Math.abs(metric.change)}%
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trends.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trends.signups}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="New Users"
                    stroke="#16a34a"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  {
                    name: 'By Type',
                    Entrepreneurs: data.users.byType.entrepreneurs,
                    Funders: data.users.byType.funders
                  }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Entrepreneurs" fill="#2563eb" />
                  <Bar dataKey="Funders" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(data.users.byTier).map(([tier, count]) => ({
                  name: tier,
                  Users: count
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Users" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Matching Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt>Total Matches</dt>
                <dd className="font-medium">{data.matches.total.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Successful Matches</dt>
                <dd className="font-medium">{data.matches.successful.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Average Match Time</dt>
                <dd className="font-medium">{data.matches.averageTime} days</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              {Object.entries(data.revenue.byTier).map(([tier, amount]) => (
                <div key={tier} className="flex justify-between">
                  <dt>{tier}</dt>
                  <dd className="font-medium">${amount.toLocaleString()}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt>Active Users</dt>
                <dd className="font-medium">{data.users.active.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Activity Rate</dt>
                <dd className="font-medium">
                  {((data.users.active / data.users.total) * 100).toFixed(1)}%
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}