import React, { useState, ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

// Mock data for initial development
const MOCK_API_PERFORMANCE = Array.from({ length: 30 }, (_, i) => ({
  date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
  responseTime: 150 + Math.floor(Math.random() * 100 - 50),
  errorRate: Math.max(0, Math.min(5, 1 + Math.floor(Math.random() * 2 - 1) + (i > 20 ? 2 : 0))),
  requests: 10000 + Math.floor(Math.random() * 5000) + (i > 15 ? 3000 : 0),
}));

const MOCK_SERVER_METRICS = Array.from({ length: 30 }, (_, i) => ({
  date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
  cpu: 30 + Math.floor(Math.random() * 40),
  memory: 40 + Math.floor(Math.random() * 30),
  disk: 50 + Math.floor(Math.random() * 20),
}));

const MOCK_ERROR_DISTRIBUTION = [
  { name: '400 Bad Request', value: 45 },
  { name: '401 Unauthorized', value: 20 },
  { name: '404 Not Found', value: 15 },
  { name: '500 Server Error', value: 10 },
  { name: 'Other', value: 10 },
];

const MOCK_ENDPOINT_PERFORMANCE = [
  { name: '/api/users', requests: 5200, responseTime: 120, errorRate: 0.8 },
  { name: '/api/matches', requests: 4800, responseTime: 180, errorRate: 1.2 },
  { name: '/api/analytics', requests: 3200, responseTime: 250, errorRate: 0.5 },
  { name: '/api/verification', requests: 2800, responseTime: 200, errorRate: 1.5 },
  { name: '/api/subscriptions', requests: 2400, responseTime: 150, errorRate: 0.9 },
];

// Custom Select components with proper TypeScript types
interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => (
  <select 
    value={value} 
    onChange={(e) => onValueChange(e.target.value)}
    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
  >
    {children}
  </select>
);

interface SelectTriggerProps {
  className?: string;
  children: ReactNode;
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({ className, children }) => (
  <div className={className}>{children}</div>
);

interface SelectValueProps {
  placeholder: string;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => (
  <span className="text-gray-500">{placeholder}</span>
);

interface SelectContentProps {
  children: ReactNode;
}

const SelectContent: React.FC<SelectContentProps> = ({ children }) => (
  <div>{children}</div>
);

interface SelectItemProps {
  value: string;
  children: ReactNode;
}

const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => (
  <option value={value}>{children}</option>
);

// Custom media query hook with proper TypeScript types
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

const PlatformPerformance: React.FC = () => {
  const [timeframe, setTimeframe] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-2xl font-bold">Platform Performance</h1>
        
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectItem value="1d">Last 24 hours</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api">API Performance</TabsTrigger>
          <TabsTrigger value="server">Server Metrics</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4 mt-4">
            {/* API Response Time */}
            <Card>
              <CardHeader>
                <CardTitle>API Response Time</CardTitle>
                <CardDescription>Average response time in milliseconds</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isMobile ? "h-64" : "h-80"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MOCK_API_PERFORMANCE}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), 'MMM d')}
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: isMobile ? 10 : 12 }} 
                        domain={['dataMin - 50', 'dataMax + 50']}
                      />
                      <Tooltip formatter={(value) => [`${value} ms`, 'Response Time']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="responseTime" 
                        stroke="#8884d8" 
                        name="Response Time (ms)" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Request Volume */}
            <Card>
              <CardHeader>
                <CardTitle>API Request Volume</CardTitle>
                <CardDescription>Number of API requests per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isMobile ? "h-64" : "h-72"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_API_PERFORMANCE}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), 'MMM d')}
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Requests']} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="requests" 
                        stroke="#82ca9d" 
                        fill="#82ca9d" 
                        name="API Requests" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Error Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
                <CardDescription>Percentage of requests resulting in errors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isMobile ? "h-64" : "h-72"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MOCK_API_PERFORMANCE}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), 'MMM d')}
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        domain={[0, 'dataMax + 1']}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip formatter={(value) => [`${value}%`, 'Error Rate']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="errorRate" 
                        stroke="#ff7300" 
                        name="Error Rate (%)" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api">
          <div className="space-y-4 mt-4">
            {/* Endpoint Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Endpoint Performance</CardTitle>
                <CardDescription>Performance metrics by API endpoint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isMobile ? "h-64" : "h-80"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={MOCK_ENDPOINT_PERFORMANCE}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        width={100}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="responseTime" fill="#8884d8" name="Avg Response Time (ms)" />
                      <Bar dataKey="errorRate" fill="#ff7300" name="Error Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Request Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Request Distribution</CardTitle>
                <CardDescription>Number of requests by endpoint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isMobile ? "h-64" : "h-72"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_ENDPOINT_PERFORMANCE}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <YAxis 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Requests']} />
                      <Legend />
                      <Bar dataKey="requests" fill="#82ca9d" name="Requests" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* API Latency Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>API Latency Analysis</CardTitle>
                <CardDescription>Detailed analysis of API response times</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Detailed API latency analysis will be implemented here, including percentile 
                  distributions, peak latency periods, and latency by geographic region.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="server">
          <div className="space-y-4 mt-4">
            {/* Server Resource Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Server Resource Usage</CardTitle>
                <CardDescription>CPU, memory, and disk usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isMobile ? "h-64" : "h-80"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MOCK_SERVER_METRICS}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), 'MMM d')}
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="cpu" 
                        stroke="#8884d8" 
                        name="CPU Usage" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="memory" 
                        stroke="#82ca9d" 
                        name="Memory Usage" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="disk" 
                        stroke="#ffc658" 
                        name="Disk Usage" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Database Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Database Performance</CardTitle>
                <CardDescription>Database query performance and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Database performance metrics will be implemented here, including query response times, 
                  connection pool usage, and slow query analysis.
                </p>
              </CardContent>
            </Card>

            {/* Scaling Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Scaling Metrics</CardTitle>
                <CardDescription>Auto-scaling events and resource allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Scaling metrics will be implemented here, showing when auto-scaling events occurred, 
                  resource allocation changes, and cost implications.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors">
          <div className="space-y-4 mt-4">
            {/* Error Rate Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Error Rate Trend</CardTitle>
                <CardDescription>Error rate percentage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isMobile ? "h-64" : "h-72"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MOCK_API_PERFORMANCE}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), 'MMM d')}
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        domain={[0, 'dataMax + 1']}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip formatter={(value) => [`${value}%`, 'Error Rate']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="errorRate" 
                        stroke="#ff7300" 
                        name="Error Rate (%)" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Error Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Error Distribution</CardTitle>
                <CardDescription>Breakdown of errors by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isMobile ? "h-64" : "h-72"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_ERROR_DISTRIBUTION} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        width={120}
                      />
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                      <Legend />
                      <Bar dataKey="value" fill="#ff7300" name="Percentage" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Error Details */}
            <Card>
              <CardHeader>
                <CardTitle>Error Details</CardTitle>
                <CardDescription>Detailed error logs and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Detailed error logs and analysis will be implemented here, including stack traces, 
                  error frequencies, and affected users.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlatformPerformance; 