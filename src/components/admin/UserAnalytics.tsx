import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { useMediaQuery } from '@/hooks/use-media-query';

// Mock data for initial development
const MOCK_USER_DEMOGRAPHICS = [
  { name: 'Entrepreneurs', value: 65 },
  { name: 'Investors', value: 25 },
  { name: 'Advisors', value: 10 },
];

const MOCK_USER_GROWTH = Array.from({ length: 30 }, (_, i) => ({
  date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
  entrepreneurs: 650 + Math.floor(Math.random() * 30) + i * 7,
  investors: 250 + Math.floor(Math.random() * 15) + i * 3,
  advisors: 100 + Math.floor(Math.random() * 5) + i * 1,
}));

const MOCK_USER_RETENTION = [
  { month: 'Jan', retention: 95 },
  { month: 'Feb', retention: 92 },
  { month: 'Mar', retention: 88 },
  { month: 'Apr', retention: 91 },
  { month: 'May', retention: 85 },
  { month: 'Jun', retention: 87 },
];

const MOCK_USER_ENGAGEMENT = [
  { name: 'Daily Active', value: 35 },
  { name: 'Weekly Active', value: 25 },
  { name: 'Monthly Active', value: 20 },
  { name: 'Inactive', value: 20 },
];

const MOCK_USER_LOCATIONS = [
  { name: 'United States', value: 45 },
  { name: 'Europe', value: 25 },
  { name: 'Asia', value: 15 },
  { name: 'Other', value: 15 },
];

const MOCK_USER_ACQUISITION = [
  { name: 'Jan', organic: 400, paid: 240, referral: 180 },
  { name: 'Feb', organic: 300, paid: 198, referral: 280 },
  { name: 'Mar', organic: 200, paid: 980, referral: 390 },
  { name: 'Apr', organic: 278, paid: 390, referral: 430 },
  { name: 'May', organic: 189, paid: 480, referral: 380 },
  { name: 'Jun', organic: 239, paid: 380, referral: 230 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const UserAnalytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-2xl font-bold">User Analytics</h1>
        
        <Select value={timeframe} onValueChange={setTimeframe} className="mt-2 md:mt-0">
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* User Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Type Distribution</CardTitle>
              <CardDescription>Breakdown of user types on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={isMobile ? "h-64" : "h-72"}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={MOCK_USER_DEMOGRAPHICS}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={isMobile ? 80 : 100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {MOCK_USER_DEMOGRAPHICS.map((entry, index) => (
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

          {/* User Growth Trends */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth by Type</CardTitle>
              <CardDescription>Growth trends for different user types</CardDescription>
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
                      dataKey="entrepreneurs" 
                      stroke="#8884d8" 
                      name="Entrepreneurs" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="investors" 
                      stroke="#82ca9d" 
                      name="Investors" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="advisors" 
                      stroke="#ffc658" 
                      name="Advisors" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* User Acquisition */}
          <Card>
            <CardHeader>
              <CardTitle>User Acquisition</CardTitle>
              <CardDescription>How users are being acquired over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={isMobile ? "h-64" : "h-72"}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_USER_ACQUISITION}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="organic" stackId="a" fill="#8884d8" name="Organic" />
                    <Bar dataKey="paid" stackId="a" fill="#82ca9d" name="Paid" />
                    <Bar dataKey="referral" stackId="a" fill="#ffc658" name="Referral" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Locations */}
            <Card>
              <CardHeader>
                <CardTitle>User Locations</CardTitle>
                <CardDescription>Geographic distribution of users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isMobile ? "h-64" : "h-72"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={MOCK_USER_LOCATIONS}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={isMobile ? 80 : 100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {MOCK_USER_LOCATIONS.map((entry, index) => (
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

            {/* User Types */}
            <Card>
              <CardHeader>
                <CardTitle>User Types</CardTitle>
                <CardDescription>Distribution of user roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isMobile ? "h-64" : "h-72"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={MOCK_USER_DEMOGRAPHICS}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={isMobile ? 80 : 100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {MOCK_USER_DEMOGRAPHICS.map((entry, index) => (
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
          </div>

          {/* Additional Demographics Information */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Demographics</CardTitle>
              <CardDescription>Additional user demographic information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Detailed demographic information will be implemented here, including age ranges, 
                industry sectors, company sizes, and other relevant demographic data.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          {/* User Engagement Overview */}
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Overview</CardTitle>
              <CardDescription>Breakdown of user engagement levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={isMobile ? "h-64" : "h-72"}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={MOCK_USER_ENGAGEMENT}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={isMobile ? 80 : 100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {MOCK_USER_ENGAGEMENT.map((entry, index) => (
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

          {/* Feature Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage</CardTitle>
              <CardDescription>Most used features on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Feature usage metrics will be implemented here, showing which platform features 
                are most frequently used by different user types.
              </p>
            </CardContent>
          </Card>

          {/* Session Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Session Metrics</CardTitle>
              <CardDescription>User session duration and frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Session metrics will be implemented here, including average session duration, 
                sessions per user, and time of day usage patterns.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="space-y-4">
          {/* Retention Rate */}
          <Card>
            <CardHeader>
              <CardTitle>User Retention Rate</CardTitle>
              <CardDescription>Monthly user retention rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={isMobile ? "h-64" : "h-72"}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_USER_RETENTION}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <YAxis 
                      tick={{ fontSize: isMobile ? 10 : 12 }} 
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip formatter={(value) => [`${value}%`, 'Retention Rate']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="retention" 
                      stroke="#8884d8" 
                      name="Retention Rate" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Cohort Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Cohort Analysis</CardTitle>
              <CardDescription>User retention by signup cohort</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Cohort analysis will be implemented here, showing how different user cohorts 
                retain over time, based on when they signed up.
              </p>
            </CardContent>
          </Card>

          {/* Churn Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Churn Analysis</CardTitle>
              <CardDescription>Understanding why users leave</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Churn analysis will be implemented here, including churn rates by user type, 
                common reasons for churn, and predictive churn indicators.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserAnalytics; 