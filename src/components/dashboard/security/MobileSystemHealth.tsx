// src/components/dashboard/security/MobileSystemHealth.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Server, 
  Database, 
  Cpu,
  Memory,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const MobileSystemHealth = () => {
  const [healthData, setHealthData] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/system/health');
      const data = await response.json();
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header with Refresh Rate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">System Health</h2>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="text-sm rounded-md border-gray-300"
          >
            <option value={15}>15s</option>
            <option value={30}>30s</option>
            <option value={60}>1m</option>
          </select>
          <button
            onClick={fetchHealthData}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overall System Status */}
      <Card className={healthData?.status === 'healthy' ? 'bg-green-50' : 'bg-red-50'}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {healthData?.status === 'healthy' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">
                {healthData?.status === 'healthy' ? 'All Systems Operational' : 'System Issues Detected'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <div className="grid grid-cols-2 gap-4">
        <ResourceCard
          title="CPU Usage"
          value={healthData?.cpu?.usage || 0}
          icon={<Cpu className="w-5 h-5" />}
          trend={healthData?.cpu?.trend || []}
          unit="%"
          threshold={80}
        />
        <ResourceCard
          title="Memory Usage"
          value={healthData?.memory?.usage || 0}
          icon={<Memory className="w-5 h-5" />}
          trend={healthData?.memory?.trend || []}
          unit="%"
          threshold={90}
        />
        <ResourceCard
          title="Storage"
          value={healthData?.storage?.usage || 0}
          icon={<HardDrive className="w-5 h-5" />}
          trend={healthData?.storage?.trend || []}
          unit="%"
          threshold={85}
        />
        <ResourceCard
          title="Database Load"
          value={healthData?.database?.load || 0}
          icon={<Database className="w-5 h-5" />}
          trend={healthData?.database?.trend || []}
          unit="%"
          threshold={75}
        />
      </div>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthData?.metrics || []}>
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis fontSize={12} width={30} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#3B82F6" 
                  name="Response Time"
                />
                <Line 
                  type="monotone" 
                  dataKey="throughput" 
                  stroke="#10B981" 
                  name="Throughput"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Active Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthData?.services?.map((service, index) => (
              <ServiceStatus key={index} service={service} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Issues */}
      {healthData?.issues?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthData.issues.map((issue, index) => (
                <Alert
                  key={index}
                  variant={issue.severity === 'critical' ? 'destructive' : 'default'}
                >
                  <AlertTitle className="text-sm font-semibold">{issue.title}</AlertTitle>
                  <AlertDescription className="text-sm">
                    {issue.description}
                    <div className="mt-1 text-xs opacity-75">
                      {new Date(issue.timestamp).toLocaleString()}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const ResourceCard = ({ title, value, icon, trend, unit, threshold }) => {
  const getStatusColor = (value) => {
    if (value >= threshold) return 'text-red-600';
    if (value >= threshold * 0.8) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          {icon}
          <span className={`text-sm font-medium ${getStatusColor(value)}`}>
            {value}{unit}
          </span>
        </div>
        <div className="text-sm font-medium mb-2">{title}</div>
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <Area
                type="monotone"
                dataKey="value"
                stroke={value >= threshold ? '#DC2626' : '#3B82F6'}
                fill={value >= threshold ? '#FEE2E2' : '#EFF6FF'}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

const ServiceStatus = ({ service }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <Server className="w-4 h-4 text-gray-600" />
      <div>
        <div className="font-medium text-sm">{service.name}</div>
        <div className="text-xs text-gray-500">{service.region}</div>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <span className={`w-2 h-2 rounded-full ${
        service.status === 'healthy' ? 'bg-green-500' :
        service.status === 'degraded' ? 'bg-yellow-500' :
        'bg-red-500'
      }`} />
      <span className="text-sm text-gray-600">
        {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
      </span>
    </div>
  </div>
);

export default MobileSystemHealth;