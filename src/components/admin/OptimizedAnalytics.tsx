import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { PaginationControls } from '@/components/ui/pagination';
import { useCachedData } from '@/utils/caching/clientCache';
import { IntersectionObserverComponent } from '@/components/performance/LazyLoadedComponent';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';

// Mock data for initial development
const generateMockData = (days: number) => {
  return Array.from({ length: days }, (_, i) => ({
    date: format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd'),
    responseTime: 150 + Math.floor(Math.random() * 100 - 50),
    errorRate: Math.max(0, Math.min(5, 1 + Math.floor(Math.random() * 2 - 1) + (i > days * 0.7 ? 2 : 0))),
    requests: 10000 + Math.floor(Math.random() * 5000) + (i > days * 0.5 ? 3000 : 0),
  }));
};

const generateMockServerMetrics = (days: number) => {
  return Array.from({ length: days }, (_, i) => ({
    date: format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd'),
    cpu: 30 + Math.floor(Math.random() * 40),
    memory: 40 + Math.floor(Math.random() * 30),
    disk: 50 + Math.floor(Math.random() * 20),
  }));
};

const MOCK_ERROR_DISTRIBUTION = [
  { name: '400 Bad Request', value: 45 },
  { name: '401 Unauthorized', value: 20 },
  { name: '404 Not Found', value: 15 },
  { name: '500 Server Error', value: 10 },
  { name: 'Other', value: 10 },
];

const generateMockEndpointPerformance = (count: number) => {
  const endpoints = [
    '/api/users',
    '/api/matches',
    '/api/analytics',
    '/api/verification',
    '/api/subscriptions',
    '/api/payments',
    '/api/notifications',
    '/api/messages',
    '/api/profiles',
    '/api/search',
  ];
  
  return Array.from({ length: Math.min(count, endpoints.length) }, (_, i) => ({
    name: endpoints[i],
    requests: 1000 + Math.floor(Math.random() * 5000),
    responseTime: 100 + Math.floor(Math.random() * 200),
    errorRate: Math.random() * 3,
  }));
};

// Custom media query hook
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

/**
 * An optimized version of the PlatformPerformance component
 * This component uses various performance optimizations:
 * - Client-side caching for data
 * - Pagination for large datasets
 * - Lazy loading for components
 * - Intersection Observer for deferred rendering
 */
const OptimizedAnalytics: React.FC = () => {
  // State
  const [timeframe, setTimeframe] = useState<'1d' | '7d' | '30d' | '90d'>('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const [endpointPage, setEndpointPage] = useState(1);
  const [endpointPageSize, setEndpointPageSize] = useState(5);
  
  // Responsive design
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Memoized data based on timeframe
  const daysInTimeframe = useMemo(() => {
    switch (timeframe) {
      case '1d': return 1;
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 7;
    }
  }, [timeframe]);
  
  // Use cached data with automatic revalidation
  const { data: apiPerformanceData, loading: apiDataLoading } = useCachedData(
    `api-performance-${timeframe}`,
    async () => generateMockData(daysInTimeframe),
    { ttl: 5 * 60 * 1000, revalidateInterval: 5 * 60 * 1000 } // 5 minutes
  );
  
  const { data: serverMetricsData, loading: serverDataLoading } = useCachedData(
    `server-metrics-${timeframe}`,
    async () => generateMockServerMetrics(daysInTimeframe),
    { ttl: 5 * 60 * 1000, revalidateInterval: 5 * 60 * 1000 } // 5 minutes
  );
  
  const { data: endpointPerformanceData, loading: endpointDataLoading } = useCachedData(
    'endpoint-performance',
    async () => generateMockEndpointPerformance(10),
    { ttl: 5 * 60 * 1000 }
  );
  
  // Paginated endpoint data
  const paginatedEndpointData = useMemo(() => {
    if (!endpointPerformanceData) return [];
    const startIndex = (endpointPage - 1) * endpointPageSize;
    return endpointPerformanceData.slice(startIndex, startIndex + endpointPageSize);
  }, [endpointPerformanceData, endpointPage, endpointPageSize]);
  
  // Handle timeframe change
  const handleTimeframeChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeframe(event.target.value as '1d' | '7d' | '30d' | '90d');
  }, []);
  
  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);
  
  // Handle endpoint page change
  const handleEndpointPageChange = useCallback((page: number) => {
    setEndpointPage(page);
  }, []);
  
  // Handle endpoint page size change
  const handleEndpointPageSizeChange = useCallback((pageSize: number) => {
    setEndpointPageSize(pageSize);
    setEndpointPage(1); // Reset to first page when changing page size
  }, []);
  
  // Export data as CSV
  const exportData = useCallback(() => {
    if (!apiPerformanceData) return;
    
    const headers = ['Date', 'Response Time (ms)', 'Error Rate (%)', 'Requests'];
    const csvData = apiPerformanceData.map(item => [
      item.date,
      item.responseTime,
      item.errorRate,
      item.requests
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `api-performance-${timeframe}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [apiPerformanceData, timeframe]);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-2xl font-bold">Platform Performance</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 md:mt-0">
          <select
            value={timeframe}
            onChange={handleTimeframeChange}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange}>
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
                    {apiDataLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <p>Loading data...</p>
                      </div>
                    ) : (
                      <LineChart data={apiPerformanceData || []}>
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
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Request Volume - Lazy loaded when visible */}
            <IntersectionObserverComponent>
              <Card>
                <CardHeader>
                  <CardTitle>API Request Volume</CardTitle>
                  <CardDescription>Number of API requests per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={isMobile ? "h-64" : "h-72"}>
                    <ResponsiveContainer width="100%" height="100%">
                      {apiDataLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <p>Loading data...</p>
                        </div>
                      ) : (
                        <AreaChart data={apiPerformanceData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => format(new Date(date), 'MMM d')}
                            tick={{ fontSize: isMobile ? 10 : 12 }}
                          />
                          <YAxis 
                            tick={{ fontSize: isMobile ? 10 : 12 }}
                            tickFormatter={(value) => formatNumber(value)}
                          />
                          <Tooltip formatter={(value) => [formatNumber(value as number), 'Requests']} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="requests" 
                            stroke="#82ca9d" 
                            fill="#82ca9d" 
                            name="API Requests" 
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </IntersectionObserverComponent>

            {/* Error Rate - Lazy loaded when visible */}
            <IntersectionObserverComponent>
              <Card>
                <CardHeader>
                  <CardTitle>Error Rate</CardTitle>
                  <CardDescription>Percentage of requests resulting in errors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={isMobile ? "h-64" : "h-72"}>
                    <ResponsiveContainer width="100%" height="100%">
                      {apiDataLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <p>Loading data...</p>
                        </div>
                      ) : (
                        <LineChart data={apiPerformanceData || []}>
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
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </IntersectionObserverComponent>
          </div>
        </TabsContent>

        <TabsContent value="api">
          <div className="space-y-4 mt-4">
            {/* Endpoint Performance with Pagination */}
            <Card>
              <CardHeader>
                <CardTitle>Endpoint Performance</CardTitle>
                <CardDescription>Performance metrics by API endpoint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={isMobile ? "h-64" : "h-80"}>
                  <ResponsiveContainer width="100%" height="100%">
                    {endpointDataLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <p>Loading data...</p>
                      </div>
                    ) : (
                      <BarChart 
                        data={paginatedEndpointData}
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
                    )}
                  </ResponsiveContainer>
                </div>
                
                {/* Pagination Controls */}
                {endpointPerformanceData && (
                  <div className="mt-4">
                    <PaginationControls
                      currentPage={endpointPage}
                      totalItems={endpointPerformanceData.length}
                      pageSize={endpointPageSize}
                      onPageChange={handleEndpointPageChange}
                      onPageSizeChange={handleEndpointPageSizeChange}
                      pageSizeOptions={[5, 10, 20]}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional API Performance Metrics - Lazy loaded when visible */}
            <IntersectionObserverComponent>
              <Card>
                <CardHeader>
                  <CardTitle>API Latency Analysis</CardTitle>
                  <CardDescription>Detailed analysis of API response times</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Detailed API latency analysis will be implemented here, including percentile 
                    distributions, peak latency periods, and latency by geographic region.
                  </p>
                </CardContent>
              </Card>
            </IntersectionObserverComponent>
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
                    {serverDataLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <p>Loading data...</p>
                      </div>
                    ) : (
                      <LineChart data={serverMetricsData || []}>
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
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Additional Server Metrics - Lazy loaded when visible */}
            <IntersectionObserverComponent>
              <Card>
                <CardHeader>
                  <CardTitle>Database Performance</CardTitle>
                  <CardDescription>Database query performance and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Database performance metrics will be implemented here, including query response times, 
                    connection pool usage, and slow query analysis.
                  </p>
                </CardContent>
              </Card>
            </IntersectionObserverComponent>
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
                    {apiDataLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <p>Loading data...</p>
                      </div>
                    ) : (
                      <LineChart data={apiPerformanceData || []}>
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
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Error Distribution - Lazy loaded when visible */}
            <IntersectionObserverComponent>
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
            </IntersectionObserverComponent>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OptimizedAnalytics; 