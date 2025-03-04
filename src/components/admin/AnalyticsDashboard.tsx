import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert, Download, RefreshCw, Calendar, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { UserRole } from '@/services/AdminService';
import SubscriptionAnalytics from './SubscriptionAnalytics';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ExportMenu } from '@/components/analytics/ExportMenu';
import { MetricCard } from '@/components/analytics/MetricCard';

// Mock data for initial development
const MOCK_USER_GROWTH = Array.from({ length: 30 }, (_, i) => ({
  date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
  users: 1000 + Math.floor(Math.random() * 50) + i * 10,
  activeUsers: 800 + Math.floor(Math.random() * 40) + i * 8,
}));

const MOCK_PLATFORM_METRICS = {
  totalUsers: 12543,
  activeUsers: 8721,
  totalMatches: 3254,
  successfulMatches: 1876,
  averageResponseTime: 2.3,
  verificationRate: 68,
};

const MOCK_TRAFFIC_SOURCES = [
  { name: 'Direct', value: 40 },
  { name: 'Organic Search', value: 30 },
  { name: 'Referral', value: 20 },
  { name: 'Social Media', value: 10 },
];

const MOCK_USER_ACTIVITY = [
  { name: 'Mon', active: 4000, new: 2400 },
  { name: 'Tue', active: 3000, new: 1398 },
  { name: 'Wed', active: 2000, new: 9800 },
  { name: 'Thu', active: 2780, new: 3908 },
  { name: 'Fri', active: 1890, new: 4800 },
  { name: 'Sat', active: 2390, new: 3800 },
  { name: 'Sun', active: 3490, new: 4300 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { hasAccess, isLoading: accessLoading } = useRoleAccess(UserRole.ADMIN);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (hasAccess) {
      fetchAnalyticsData();
    }
  }, [timeframe, activeTab, hasAccess]);

  const fetchAnalyticsData = async () => {
    // This would be replaced with actual API calls
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Failed to load analytics data');
      setIsLoading(false);
    }
  };

  // Prepare data for export based on active tab
  const getExportData = () => {
    switch (activeTab) {
      case 'overview':
        return [
          ...MOCK_USER_GROWTH.map(data => ({ ...data, section: 'User Growth' })),
          { section: 'Platform Metrics', ...MOCK_PLATFORM_METRICS },
          ...MOCK_TRAFFIC_SOURCES.map(source => ({ section: 'Traffic Sources', ...source })),
          ...MOCK_USER_ACTIVITY.map(activity => ({ section: 'User Activity', ...activity }))
        ];
      case 'users':
        return MOCK_USER_GROWTH.map(data => ({ ...data, section: 'User Growth' }));
      case 'subscriptions':
        // This would be replaced with actual subscription data
        return [];
      case 'performance':
        return [
          { section: 'Platform Metrics', ...MOCK_PLATFORM_METRICS },
          ...MOCK_USER_ACTIVITY.map(activity => ({ section: 'User Activity', ...activity }))
        ];
      default:
        return [];
    }
  };

  // Access denied component
  if (!hasAccess && !accessLoading) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don't have permission to view the analytics dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading || accessLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={fetchAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <ExportMenu 
            data={getExportData()} 
            filename={`launchify-analytics-${activeTab}-${timeframe}`}
            variant="outline"
            size="sm"
            buttonText="Export Data"
          />
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscription Analytics</TabsTrigger>
          <TabsTrigger value="performance">Platform Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
            <MetricCard 
              title="Total Users" 
              value={MOCK_PLATFORM_METRICS.totalUsers.toLocaleString()} 
              icon={<Users className="h-5 w-5 text-blue-500" />} 
            />
            <MetricCard 
              title="Active Users" 
              value={MOCK_PLATFORM_METRICS.activeUsers.toLocaleString()} 
              icon={<Activity className="h-5 w-5 text-green-500" />} 
            />
            <MetricCard 
              title="Total Matches" 
              value={MOCK_PLATFORM_METRICS.totalMatches.toLocaleString()} 
              icon={<TrendingUp className="h-5 w-5 text-purple-500" />} 
            />
            <MetricCard 
              title="Successful Matches" 
              value={MOCK_PLATFORM_METRICS.successfulMatches.toLocaleString()} 
              icon={<TrendingUp className="h-5 w-5 text-indigo-500" />} 
            />
            <MetricCard 
              title="Avg Response Time" 
              value={`${MOCK_PLATFORM_METRICS.averageResponseTime} days`} 
              icon={<Calendar className="h-5 w-5 text-amber-500" />} 
            />
            <MetricCard 
              title="Verification Rate" 
              value={`${MOCK_PLATFORM_METRICS.verificationRate}%`} 
              icon={<ShieldAlert className="h-5 w-5 text-red-500" />} 
            />
          </div>

          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>Total and active users over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={isMobile ? "h-64" : "h-80"}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_USER_GROWTH}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'MMM d')}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                    />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#8884d8" 
                      name="Total Users" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="activeUsers" 
                      stroke="#82ca9d" 
                      name="Active Users" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Traffic Sources and User Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where users are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isMobile ? "h-64" : "h-72"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={MOCK_TRAFFIC_SOURCES}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={isMobile ? 80 : 100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {MOCK_TRAFFIC_SOURCES.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Active and new users by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isMobile ? "h-64" : "h-72"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_USER_ACTIVITY}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="active" fill="#8884d8" name="Active Users" />
                      <Bar dataKey="new" fill="#82ca9d" name="New Users" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Analytics Tab */}
        <TabsContent value="users">
          <UserAnalytics />
        </TabsContent>

        {/* Subscription Analytics Tab */}
        <TabsContent value="subscriptions">
          <SubscriptionAnalytics />
        </TabsContent>

        {/* Platform Performance Tab */}
        <TabsContent value="performance">
          <PlatformPerformance />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Placeholder components for the other tabs
const UserAnalytics: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Demographics</CardTitle>
          <CardDescription>Breakdown of user types and characteristics</CardDescription>
        </CardHeader>
        <CardContent>
          <p>User demographics content will be implemented here.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>User Engagement</CardTitle>
          <CardDescription>Metrics on how users interact with the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <p>User engagement metrics will be implemented here.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>User Retention</CardTitle>
          <CardDescription>Analysis of user retention over time</CardDescription>
        </CardHeader>
        <CardContent>
          <p>User retention analysis will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

const PlatformPerformance: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>System Performance</CardTitle>
          <CardDescription>Key performance indicators for the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <p>System performance metrics will be implemented here.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>API Usage</CardTitle>
          <CardDescription>Analysis of API calls and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <p>API usage metrics will be implemented here.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Error Rates</CardTitle>
          <CardDescription>Tracking of errors and issues</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Error rate tracking will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
