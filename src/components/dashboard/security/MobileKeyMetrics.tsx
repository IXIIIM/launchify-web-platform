// src/components/dashboard/security/MobileKeyMetrics.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const MobileKeyMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [selectedTimeframe]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/security/key-metrics?timeframe=${selectedTimeframe}`);
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching key metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Timeframe Selection */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['day', 'week', 'month', 'quarter'].map((timeframe) => (
          <button
            key={timeframe}
            onClick={() => setSelectedTimeframe(timeframe)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              selectedTimeframe === timeframe
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          </button>
        ))}
      </div>

      {/* Key Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <HealthIndicator
              label="Master Keys"
              value={metrics?.masterKeyHealth || 0}
              type={metrics?.masterKeyHealth >= 90 ? 'good' : 'warning'}
            />
            <HealthIndicator
              label="Document Keys"
              value={metrics?.documentKeyHealth || 0}
              type={metrics?.documentKeyHealth >= 90 ? 'good' : 'warning'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Rotation Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rotation Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.rotationTrends || []}>
                <defs>
                  <linearGradient id="colorRotations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis fontSize={12} width={30} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="rotations"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorRotations)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Failures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics?.recentFailures?.map((failure, index) => (
            <Alert
              key={index}
              variant={failure.severity === 'critical' ? 'destructive' : 'warning'}
              className="text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle className="text-sm font-semibold">
                {failure.type}
              </AlertTitle>
              <AlertDescription className="text-sm">
                {failure.message}
                <span className="block text-xs mt-1 opacity-75">
                  {new Date(failure.timestamp).toLocaleString()}
                </span>
              </AlertDescription>
            </Alert>
          ))}
          {(!metrics?.recentFailures || metrics.recentFailures.length === 0) && (
            <Alert className="text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertTitle className="text-sm font-semibold text-green-600">
                All Systems Normal
              </AlertTitle>
              <AlertDescription className="text-sm">
                No recent key rotation failures detected.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics?.complianceChecks?.map((check, index) => (
              <ComplianceCheck
                key={index}
                label={check.label}
                status={check.status}
                message={check.message}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const HealthIndicator = ({ label, value, type }) => (
  <div className="text-center p-4 rounded-lg bg-gray-50">
    <div 
      className={`text-2xl font-bold mb-1 ${
        type === 'good' ? 'text-green-600' : 'text-yellow-600'
      }`}
    >
      {value}%
    </div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

const ComplianceCheck = ({ label, status, message }) => (
  <div className="flex items-start space-x-3">
    <div className={`mt-1 rounded-full p-1 ${
      status === 'passed' ? 'bg-green-100' : 'bg-yellow-100'
    }`}>
      {status === 'passed' ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-yellow-600" />
      )}
    </div>
    <div>
      <div className="font-medium text-sm">{label}</div>
      <div className="text-sm text-gray-600">{message}</div>
    </div>
  </div>
);

export default MobileKeyMetrics;