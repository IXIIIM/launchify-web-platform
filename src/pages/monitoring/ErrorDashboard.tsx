import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorStats {
  totalErrors: number;
  byComponent: Record<string, number>;
  bySeverity: Record<string, number>;
  dailyTrend: Record<string, number>;
}

const SEVERITY_COLORS = {
  INFO: '#3498db',
  WARNING: '#f1c40f',
  ERROR: '#e67e22',
  CRITICAL: '#e74c3c'
};

const COMPONENT_COLORS = [
  '#2ecc71', '#9b59b6', '#1abc9c', '#34495e', '#16a085',
  '#27ae60', '#2980b9', '#8e44ad', '#2c3e50', '#f1c40f'
];

const ErrorDashboard: React.FC = () => {
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(7); // days

  useEffect(() => {
    fetchErrorStats();
    const interval = setInterval(fetchErrorStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchErrorStats = async () => {
    try {
      const response = await fetch(`/api/errors/stats/overview?days=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch error statistics');
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Error fetching statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
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

  if (!stats) return null;

  // Prepare chart data
  const trendData = Object.entries(stats.dailyTrend).map(([date, count]) => ({
    date: format(new Date(date), 'MMM dd'),
    count
  }));

  const severityData = Object.entries(stats.bySeverity).map(([severity, count]) => ({
    name: severity,
    value: count
  }));

  const componentData = Object.entries(stats.byComponent)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // Top 10 components
    .map(([component, count]) => ({
      name: component,
      count
    }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Error Monitoring Dashboard</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="p-2 border rounded-md"
        >
          <option value={1}>Last 24 Hours</option>
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalErrors}</div>
          </CardContent>
        </Card>
        
        {Object.entries(stats.bySeverity).map(([severity, count]) => (
          <Card key={severity}>
            <CardHeader>
              <CardTitle>{severity}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: SEVERITY_COLORS[severity] }}>
                {count}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Error Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3498db" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {severityData.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={SEVERITY_COLORS[entry.name]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Error Components */}
        <Card>
          <CardHeader>
            <CardTitle>Top Error Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={componentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count">
                    {componentData.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={COMPONENT_COLORS[index % COMPONENT_COLORS.length]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ErrorDashboard;