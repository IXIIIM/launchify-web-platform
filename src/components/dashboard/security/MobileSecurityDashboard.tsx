// src/components/dashboard/security/MobileSecurityDashboard.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Bell, Shield, Key, Clock } from 'lucide-react';

const MobileSecurityDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/security/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Mobile Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold">Security Dashboard</h1>
        <p className="text-gray-600 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <QuickStatCard
          title="Key Age"
          value={`${metrics?.averageKeyAge || 0} days`}
          icon={<Key className="w-5 h-5" />}
          trend={metrics?.keyAgeTrend || 0}
        />
        <QuickStatCard
          title="Alerts"
          value={metrics?.activeAlerts || 0}
          icon={<Bell className="w-5 h-5" />}
          trend={metrics?.alertTrend || 0}
        />
        <QuickStatCard
          title="Compliance"
          value={`${metrics?.complianceScore || 0}%`}
          icon={<Shield className="w-5 h-5" />}
          trend={metrics?.complianceTrend || 0}
        />
        <QuickStatCard
          title="Rotations"
          value={metrics?.pendingRotations || 0}
          icon={<Clock className="w-5 h-5" />}
          trend={metrics?.rotationTrend || 0}
        />
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Key Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.keyAgeDistribution || []}>
                    <XAxis dataKey="range" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.recentAlerts?.map((alert, index) => (
                  <AlertCard
                    key={index}
                    severity={alert.severity}
                    message={alert.message}
                    timestamp={alert.timestamp}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ComplianceItem
                  label="Key Rotation"
                  percentage={metrics?.keyRotationCompliance || 0}
                />
                <ComplianceItem
                  label="Access Control"
                  percentage={metrics?.accessControlCompliance || 0}
                />
                <ComplianceItem
                  label="Monitoring"
                  percentage={metrics?.monitoringCompliance || 0}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const QuickStatCard = ({ title, value, icon, trend }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600">{icon}</span>
        <span className={`text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-bold">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </CardContent>
  </Card>
);

const AlertCard = ({ severity, message, timestamp }) => (
  <div className={`p-4 rounded-lg ${
    severity === 'critical' ? 'bg-red-50 border-red-200' :
    severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
    'bg-blue-50 border-blue-200'
  } border`}>
    <div className="flex justify-between items-start">
      <div>
        <span className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${
          severity === 'critical' ? 'bg-red-100 text-red-800' :
          severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {severity.toUpperCase()}
        </span>
        <p className="text-sm">{message}</p>
      </div>
      <span className="text-xs text-gray-500">
        {new Date(timestamp).toLocaleTimeString()}
      </span>
    </div>
  </div>
);

const ComplianceItem = ({ label, percentage }) => (
  <div className="space-y-2">
    <div className="flex justify-between">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm text-gray-600">{percentage}%</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full">
      <div
        className={`h-full rounded-full ${
          percentage >= 90 ? 'bg-green-500' :
          percentage >= 70 ? 'bg-yellow-500' :
          'bg-red-500'
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

export default MobileSecurityDashboard;