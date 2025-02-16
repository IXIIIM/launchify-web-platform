import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface SubscriptionMetrics {
  subscriptionGrowth: {
    newSubscriptions: number;
    canceledSubscriptions: number;
    netGrowth: number;
    growthRate: number;
    dailyTrends: Array<{
      date: string;
      new: number;
      canceled: number;
      net: number;
    }>;
  };
  revenueMetrics: {
    mrr: number;
    arr: number;
    revenueByTier: Array<{
      tier: string;
      revenue: number;
      percentage: number;
    }>;
    monthlyTrends: Array<{
      month: string;
      mrr: number;
    }>;
  };
  retentionMetrics: {
    cohortRetention: any[];
    churnRate: number;
    averageLifetime: number;
  };
  tierDistribution: {
    distribution: Array<{
      tier: string;
      count: number;
      percentage: number;
    }>;
    upgradeRates: any[];
  };
}

const SubscriptionAnalytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState('1m');
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMetrics();
  }, [timeframe]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/analytics/subscription-metrics?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 rounded-lg bg-red-50">
        {error}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Subscription Analytics</h1>
        <Select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="w-48"
        >
          <option value="1m">Last Month</option>
          <option value="3m">Last 3 Months</option>
          <option value="6m">Last 6 Months</option>
          <option value="12m">Last 12 Months</option>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(metrics.revenueMetrics.mrr)}
          subValue={`ARR: ${formatCurrency(metrics.revenueMetrics.arr)}`}
        />
        <MetricCard
          title="Net Growth"
          value={`${metrics.subscriptionGrowth.netGrowth}`}
          subValue={`${metrics.subscriptionGrowth.growthRate.toFixed(1)}% growth rate`}
        />
        <MetricCard
          title="Churn Rate"
          value={`${metrics.retentionMetrics.churnRate.toFixed(1)}%`}
          subValue={`Avg lifetime: ${formatDuration(metrics.retentionMetrics.averageLifetime)}`}
        />
        <MetricCard
          title="Active Subscriptions"
          value={metrics.tierDistribution.distribution.reduce((sum, tier) => sum + tier.count, 0).toString()}
          subValue="Across all tiers"
        />
      </div>

      {/* Growth Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Growth Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.subscriptionGrowth.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM d')} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="new" stroke="#4CAF50" name="New Subscriptions" />
                <Line type="monotone" dataKey="canceled" stroke="#f44336" name="Cancellations" />
                <Line type="monotone" dataKey="net" stroke="#2196F3" name="Net Growth" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.revenueMetrics.revenueByTier.map((tier) => (
              <div key={tier.tier} className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{tier.tier}</span>
                  <div className="text-sm text-gray-500">
                    {tier.percentage.toFixed(1)}% of total revenue
                  </div>
                </div>
                <div className="font-medium">
                  {formatCurrency(tier.revenue)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tier Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Tier Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.tierDistribution.distribution.map((tier) => (
              <div key={tier.tier} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{tier.tier}</span>
                  <span>{tier.count} subscribers</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 rounded-full h-2"
                    style={{ width: `${tier.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  subValue: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subValue }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-2 flex items-baseline">
        <div className="text-2xl font-semibold">{value}</div>
      </div>
      <div className="text-sm text-gray-500 mt-1">{subValue}</div>
    </CardContent>
  </Card>
);

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDuration = (ms: number): string => {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${days} days`;
};

export default SubscriptionAnalytics;