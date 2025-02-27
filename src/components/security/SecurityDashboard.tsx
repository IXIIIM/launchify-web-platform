// src/components/security/SecurityDashboard.tsx

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

const COLORS = {
  warning: '#f59e0b',
  critical: '#dc2626',
  success: '#10b981',
  info: '#3b82f6'
};

const SecurityDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [activeAlerts, setActiveAlerts] = useState([]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [timeframe]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/security/metrics?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
      setActiveAlerts(data.activeAlerts || []);
    } catch (error) {
      console.error('Error fetching security metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Security Monitoring Dashboard</h1>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Critical Alerts</CardTitle>
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {activeAlerts.filter(a => a.severity === 'CRITICAL').length}
            </div>
            <CardDescription>Active critical alerts</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Warning Alerts</CardTitle>
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {activeAlerts.filter(a => a.severity === 'WARNING').length}
            </div>
            <CardDescription>Active warning alerts</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Compliance Rate</CardTitle>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.complianceRate.toFixed(1)}%
            </div>
            <CardDescription>Overall compliance rate</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Key Age Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Key Age Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(metrics?.keyAgeDistribution || {}).map(([range, count]) => ({
                    name: range,
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({name, value}) => `${name}: ${value}`}
                >
                  {Object.entries(metrics?.keyAgeDistribution || {}).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={index === 3 ? COLORS.critical : COLORS.info}
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

      {/* Active Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left">Type</th>
                  <th className="py-2 px-4 text-left">Severity</th>
                  <th className="py-2 px-4 text-left">Age</th>
                  <th className="py-2 px-4 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {activeAlerts.map((alert) => (
                  <tr key={alert.id} className="border-b">
                    <td className="py-2 px-4">{alert.type}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        alert.severity === 'CRITICAL' 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      {formatAlertAge(alert.timestamp)}
                    </td>
                    <td className="py-2 px-4">
                      {formatAlertDetails(alert.details)}
                    </td>
                  </tr>
                ))}
                {activeAlerts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      No active alerts
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rotation Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Key Rotation Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Failed Rotations</div>
              <div className="text-2xl font-bold text-red-600">
                {metrics?.failedRotations}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Pending Rotations</div>
              <div className="text-2xl font-bold text-yellow-600">
                {metrics?.pendingRotations}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Successful Rotations</div>
              <div className="text-2xl font-bold text-green-600">
                {metrics?.successfulRotations}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions
const formatAlertAge = (timestamp: string) => {
  const age = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(age / (60 * 60 * 1000));
  
  if (hours < 24) {
    return `${hours} hours ago`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }
};

const formatAlertDetails = (details: Record<string, any>) => {
  if (!details) return 'No details available';
  
  const keyHighlights = {
    keyType: 'Key Type',
    keyAge: 'Key Age',
    failureCount: 'Failure Count',
    delay: 'Delay'
  };

  return Object.entries(details)
    .filter(([key]) => keyHighlights[key])
    .map(([key, value]) => {
      if (key === 'keyAge' || key === 'delay') {
        const days = Math.floor(value / (24 * 60 * 60 * 1000));
        return `${keyHighlights[key]}: ${days} days`;
      }
      return `${keyHighlights[key]}: ${value}`;
    })
    .join(' | ');
};

export default SecurityDashboard;