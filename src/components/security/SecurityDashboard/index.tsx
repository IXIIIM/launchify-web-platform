import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { MetricsPanel } from './MetricsPanel';
import { AlertsPanel } from './AlertsPanel';
import { CompliancePanel } from './CompliancePanel';

interface SecurityMetrics {
  keyAgeDistribution: Record<string, number>;
  failedRotations: number;
  pendingRotations: number;
  complianceRate: number;
  activeAlerts: SecurityAlert[];
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'WARNING' | 'CRITICAL';
  details: Record<string, any>;
  timestamp: string;
}

const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [timeframe]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/security/metrics?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch security metrics');
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching security metrics:', error);
      setError('Failed to load security metrics');
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Critical Alerts</CardTitle>
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.activeAlerts.filter(a => a.severity === 'CRITICAL').length || 0}
            </div>
            <CardDescription>Active critical alerts</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Rotations</CardTitle>
            <Clock className="h-6 w-6 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.pendingRotations || 0}
            </div>
            <CardDescription>Keys awaiting rotation</CardDescription>
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

      {/* Detailed Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metrics && (
          <>
            <MetricsPanel
              keyAgeDistribution={metrics.keyAgeDistribution}
              failedRotations={metrics.failedRotations}
              pendingRotations={metrics.pendingRotations}
            />
            <AlertsPanel
              alerts={metrics.activeAlerts}
              onAlertResolved={fetchMetrics}
            />
          </>
        )}
      </div>

      {/* Compliance Panel */}
      {metrics && (
        <CompliancePanel
          complianceRate={metrics.complianceRate}
          keyAgeDistribution={metrics.keyAgeDistribution}
          timeframe={timeframe}
        />
      )}
    </div>
  );
};

export default SecurityDashboard;