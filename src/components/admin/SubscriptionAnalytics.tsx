// src/components/admin/SubscriptionAnalytics.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { UserRole } from '@/services/AdminService';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert, DollarSign, TrendingUp, RefreshCw, Users, Filter, Download } from 'lucide-react';
import { MetricCard } from '@/components/analytics/MetricCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ExportMenu } from '@/components/analytics/ExportMenu';

// Enhanced interface with user type segmentation
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
  userTypeMetrics?: {
    distribution: Array<{
      userType: string;
      count: number;
      percentage: number;
    }>;
    revenueByUserType: Array<{
      userType: string;
      revenue: number;
      percentage: number;
    }>;
    retentionByUserType: Array<{
      userType: string;
      churnRate: number;
      averageLifetime: number;
    }>;
  };
}

// Filter interface
interface AnalyticsFilters {
  timeframe: string;
  userTypes: string[];
  subscriptionTiers: string[];
  startDate: string;
  endDate: string;
  includeTrials: boolean;
  minRevenueValue: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const SubscriptionAnalytics: React.FC = () => {
  // Enhanced state with filters
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeframe: '1m',
    userTypes: ['entrepreneur', 'funder'],
    subscriptionTiers: ['Basic', 'Premium', 'Enterprise'],
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    includeTrials: true,
    minRevenueValue: '0'
  });
  
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);
  const { hasAccess, isLoading: accessLoading } = useRoleAccess(UserRole.ADMIN);

  useEffect(() => {
    if (hasAccess) {
      fetchMetrics();
    }
  }, [filters.timeframe, hasAccess]);

  const fetchMetrics = async () => {
    try {
      // Build query params from filters
      const queryParams = new URLSearchParams({
        timeframe: filters.timeframe,
        userTypes: filters.userTypes.join(','),
        subscriptionTiers: filters.subscriptionTiers.join(','),
        startDate: filters.startDate,
        endDate: filters.endDate,
        includeTrials: filters.includeTrials.toString(),
        minRevenueValue: filters.minRevenueValue
      });
      
      const response = await fetch(`/api/analytics/subscription-metrics?${queryParams.toString()}`);
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

  const handleFilterChange = (name: keyof AnalyticsFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserTypeToggle = (userType: string) => {
    setFilters(prev => {
      const userTypes = prev.userTypes.includes(userType)
        ? prev.userTypes.filter(type => type !== userType)
        : [...prev.userTypes, userType];
      
      return {
        ...prev,
        userTypes
      };
    });
  };

  const handleTierToggle = (tier: string) => {
    setFilters(prev => {
      const subscriptionTiers = prev.subscriptionTiers.includes(tier)
        ? prev.subscriptionTiers.filter(t => t !== tier)
        : [...prev.subscriptionTiers, tier];
      
      return {
        ...prev,
        subscriptionTiers
      };
    });
  };

  const applyFilters = () => {
    fetchMetrics();
    setShowFilters(false);
  };

  // Access denied component
  if (!hasAccess && !accessLoading) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don't have permission to view subscription analytics.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading || accessLoading) {
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
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Subscription Analytics</h1>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Select value={filters.timeframe} onValueChange={(value) => handleFilterChange('timeframe', value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          <ExportMenu 
            data={metrics} 
            filename="subscription-analytics" 
            buttonProps={{ variant: "outline", size: "sm" }}
          />
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Date Range */}
              {filters.timeframe === 'custom' && (
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <div>
                      <Label htmlFor="startDate" className="text-xs">Start</Label>
                      <Input 
                        id="startDate"
                        type="date" 
                        value={filters.startDate} 
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="text-xs">End</Label>
                      <Input 
                        id="endDate"
                        type="date" 
                        value={filters.endDate} 
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* User Types */}
              <div className="space-y-2">
                <Label>User Types</Label>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="entrepreneur" 
                      checked={filters.userTypes.includes('entrepreneur')}
                      onCheckedChange={() => handleUserTypeToggle('entrepreneur')}
                    />
                    <Label htmlFor="entrepreneur" className="text-sm">Entrepreneurs</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="funder" 
                      checked={filters.userTypes.includes('funder')}
                      onCheckedChange={() => handleUserTypeToggle('funder')}
                    />
                    <Label htmlFor="funder" className="text-sm">Funders</Label>
                  </div>
                </div>
              </div>
              
              {/* Subscription Tiers */}
              <div className="space-y-2">
                <Label>Subscription Tiers</Label>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="basic" 
                      checked={filters.subscriptionTiers.includes('Basic')}
                      onCheckedChange={() => handleTierToggle('Basic')}
                    />
                    <Label htmlFor="basic" className="text-sm">Basic</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="premium" 
                      checked={filters.subscriptionTiers.includes('Premium')}
                      onCheckedChange={() => handleTierToggle('Premium')}
                    />
                    <Label htmlFor="premium" className="text-sm">Premium</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="enterprise" 
                      checked={filters.subscriptionTiers.includes('Enterprise')}
                      onCheckedChange={() => handleTierToggle('Enterprise')}
                    />
                    <Label htmlFor="enterprise" className="text-sm">Enterprise</Label>
                  </div>
                </div>
              </div>
              
              {/* Additional Filters */}
              <div className="space-y-2">
                <Label>Additional Filters</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="includeTrials" 
                      checked={filters.includeTrials}
                      onCheckedChange={(checked) => handleFilterChange('includeTrials', checked)}
                    />
                    <Label htmlFor="includeTrials" className="text-sm">Include Trial Subscriptions</Label>
                  </div>
                  <div>
                    <Label htmlFor="minRevenue" className="text-sm">Minimum Revenue Value</Label>
                    <Input 
                      id="minRevenue"
                      type="number" 
                      value={filters.minRevenueValue} 
                      onChange={(e) => handleFilterChange('minRevenueValue', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" onClick={() => setShowFilters(false)}>Cancel</Button>
              <Button onClick={applyFilters}>Apply Filters</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different analytics views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="userTypes">User Types</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <MetricCard
              title="Monthly Recurring Revenue"
              value={formatCurrency(metrics.revenueMetrics.mrr)}
              icon={<DollarSign className="h-5 w-5 text-green-500" />}
              trend={{
                value: 5.2, // Example trend value
                label: "vs last month"
              }}
            />
            <MetricCard
              title="Net Growth"
              value={`${metrics.subscriptionGrowth.netGrowth}`}
              icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
              trend={{
                value: metrics.subscriptionGrowth.growthRate,
                label: "growth rate"
              }}
            />
            <MetricCard
              title="Churn Rate"
              value={`${metrics.retentionMetrics.churnRate.toFixed(1)}%`}
              icon={<RefreshCw className="h-5 w-5 text-amber-500" />}
              trend={{
                value: -0.5, // Example trend value (negative is good for churn)
                label: "vs last month"
              }}
            />
            <MetricCard
              title="Active Subscriptions"
              value={metrics.tierDistribution.distribution.reduce((sum, tier) => sum + tier.count, 0).toString()}
              icon={<Users className="h-5 w-5 text-purple-500" />}
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
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Tier */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.revenueMetrics.revenueByTier}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                        nameKey="tier"
                        label={({ tier, percentage }) => `${tier}: ${percentage.toFixed(1)}%`}
                      >
                        {metrics.revenueMetrics.revenueByTier.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {metrics.revenueMetrics.revenueByTier.map((tier, index) => (
                    <div key={tier.tier} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{tier.tier}</span>
                        <div className="text-sm text-gray-500 ml-2">
                          {tier.percentage.toFixed(1)}%
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

            {/* Monthly Revenue Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.revenueMetrics.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line type="monotone" dataKey="mrr" stroke="#8884d8" name="Monthly Recurring Revenue" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Churn Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Churn Rate Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="text-6xl font-bold text-amber-500">
                    {metrics.retentionMetrics.churnRate.toFixed(1)}%
                  </div>
                  <div className="text-gray-500 mt-2">
                    Monthly Churn Rate
                  </div>
                  <div className="mt-6 text-center">
                    <div className="text-sm text-gray-600">Average Customer Lifetime</div>
                    <div className="text-2xl font-semibold">
                      {formatDuration(metrics.retentionMetrics.averageLifetime)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cohort Retention */}
            <Card>
              <CardHeader>
                <CardTitle>Cohort Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 h-64 flex items-center justify-center">
                  {metrics.retentionMetrics.cohortRetention.length === 0 ? (
                    <p>No cohort data available for the selected period</p>
                  ) : (
                    <div>Cohort visualization would go here</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Types Tab */}
        <TabsContent value="userTypes">
          {metrics.userTypeMetrics ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>User Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.userTypeMetrics.distribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="userType"
                          label={({ userType, percentage }) => `${userType}: ${percentage.toFixed(1)}%`}
                        >
                          {metrics.userTypeMetrics.distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {metrics.userTypeMetrics.distribution.map((type, index) => (
                      <div key={type.userType} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium capitalize">{type.userType}</span>
                          <div className="text-sm text-gray-500 ml-2">
                            {type.percentage.toFixed(1)}%
                          </div>
                        </div>
                        <div className="font-medium">
                          {type.count} users
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Revenue by User Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by User Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.userTypeMetrics.revenueByUserType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                          nameKey="userType"
                          label={({ userType, percentage }) => `${userType}: ${percentage.toFixed(1)}%`}
                        >
                          {metrics.userTypeMetrics.revenueByUserType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {metrics.userTypeMetrics.revenueByUserType.map((type, index) => (
                      <div key={type.userType} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium capitalize">{type.userType}</span>
                          <div className="text-sm text-gray-500 ml-2">
                            {type.percentage.toFixed(1)}%
                          </div>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(type.revenue)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Retention by User Type */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Retention Metrics by User Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {metrics.userTypeMetrics.retentionByUserType.map((type) => (
                      <div key={type.userType} className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-lg font-medium capitalize mb-2">{type.userType}</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Churn Rate</div>
                            <div className="text-xl font-semibold text-amber-500">
                              {type.churnRate.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Avg. Lifetime</div>
                            <div className="text-xl font-semibold">
                              {formatDuration(type.averageLifetime)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <p>User type segmentation data is not available for the selected filters.</p>
                  <p className="mt-2">Try adjusting your filters or timeframe.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDuration = (months: number): string => {
  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);
  
  if (years === 0) {
    return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  } else if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  } else {
    return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  }
};

export default SubscriptionAnalytics;