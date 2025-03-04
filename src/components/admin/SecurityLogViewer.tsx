// src/components/admin/SecurityLogViewer.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Clock, Filter, Download, ShieldAlert } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { UserRole } from '@/services/AdminService';

interface SecurityMetrics {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  topIPs: Record<string, number>;
  activePatterns: Record<string, number>;
}

interface SecurityLog {
  id: string;
  timestamp: string;
  severity: string;
  type: string;
  message: string;
  ip?: string;
  userId?: string;
  metadata: Record<string, any>;
}

const SecurityLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: [] as string[],
    type: [] as string[],
    timeframe: '24h',
    search: ''
  });
  const [showMetrics, setShowMetrics] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
  const { hasAccess, isLoading: accessLoading } = useRoleAccess(UserRole.ADMIN);

  useEffect(() => {
    if (hasAccess) {
      fetchLogs();
      fetchMetrics();
    }
  }, [filters, hasAccess]);

  const fetchLogs = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        severity: filters.severity.join(','),
        type: filters.type.join(',')
      });

      const response = await fetch(`/api/admin/security-logs?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch security logs');
      
      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Error fetching security logs:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/security-metrics');
      if (!response.ok) throw new Error('Failed to fetch security metrics');
      
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching security metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const response = await fetch('/api/admin/security-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });

      if (!response.ok) throw new Error('Failed to export logs');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-logs-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const MetricsOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Events</p>
              <h3 className="text-2xl font-bold">{metrics?.total || 0}</h3>
            </div>
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">High Severity</p>
              <h3 className="text-2xl font-bold">{metrics?.bySeverity.high || 0}</h3>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Active Patterns</p>
              <h3 className="text-2xl font-bold">
                {Object.keys(metrics?.activePatterns || {}).length}
              </h3>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Unique IPs</p>
              <h3 className="text-2xl font-bold">
                {Object.keys(metrics?.topIPs || {}).length}
              </h3>
            </div>
            <Shield className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const LogDetails = ({ log }: { log: SecurityLog }) => (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold">{log.message}</h3>
          <p className="text-gray-600">{log.type}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${getSeverityColor(log.severity)}`}>
          {log.severity}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Time</p>
          <p className="font-medium">{new Date(log.timestamp).toLocaleString()}</p>
        </div>
        {log.ip && (
          <div>
            <p className="text-sm text-gray-600">IP Address</p>
            <p className="font-medium">{log.ip}</p>
          </div>
        )}
        {log.userId && (
          <div>
            <p className="text-sm text-gray-600">User ID</p>
            <p className="font-medium">{log.userId}</p>
          </div>
        )}
      </div>

      {Object.keys(log.metadata).length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Additional Details</h4>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  // Access denied component
  if (!hasAccess && !accessLoading) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
        <div className="flex items-center">
          <ShieldAlert className="h-4 w-4 mr-2" />
          <h3 className="font-medium">Access Denied</h3>
        </div>
        <p className="mt-2 text-sm">
          You don't have permission to view security logs. This feature requires admin privileges.
        </p>
      </div>
    );
  }

  if (isLoading || accessLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      {showMetrics && <MetricsOverview />}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
            <Button
              variant="outline"
              onClick={exportLogs}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Severity</label>
              <select
                multiple
                value={filters.severity}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFilters(prev => ({ ...prev, severity: selected }));
                }}
                className="mt-1 block w-full rounded-md border-gray-300"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Event Type</label>
              <select
                multiple
                value={filters.type}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFilters(prev => ({ ...prev, type: selected }));
                }}
                className="mt-1 block w-full rounded-md border-gray-300"
              >
                <option value="auth_attempt">Authentication</option>
                <option value="api_rate_limit">Rate Limit</option>
                <option value="profile_update">Profile Changes</option>
                <option value="admin_action">Admin Actions</option>
                <option value="verification_action">Verifications</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Timeframe</label>
              <select
                value={filters.timeframe}
                onChange={(e) => setFilters(prev => ({ ...prev, timeframe: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search logs..."
                className="mt-1 block w-full rounded-md border-gray-300"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log List */}
      <Card>
        <CardHeader>
          <CardTitle>Security Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map(log => (
              <div
                key={log.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{log.message}</p>
                    <p className="text-sm text-gray-600">{log.type}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No security logs found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl m-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Log Details</h2>
              <Button
                variant="ghost"
                onClick={() => setSelectedLog(null)}
              >
                ×
              </Button>
            </div>
            <LogDetails log={selectedLog} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityLogViewer;