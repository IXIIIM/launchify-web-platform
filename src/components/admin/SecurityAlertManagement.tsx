<<<<<<< HEAD
// src/components/admin/SecurityAlertManagement.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, ShieldAlert, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved';
  metadata: any;
  timestamp: string;
}

const SecurityAlertManagement = () => {
  const [activeAlerts, setActiveAlerts] = useState<SecurityAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<SecurityAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: [] as string[],
    status: 'all'
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const [activeResponse, historyResponse] = await Promise.all([
        fetch('/api/alerts/active'),
        fetch('/api/alerts/history')
      ]);

      if (!activeResponse.ok || !historyResponse.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const active = await activeResponse.json();
      const history = await historyResponse.json();

      setActiveAlerts(active);
      setAlertHistory(history.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string, resolution: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution })
      });

      if (!response.ok) throw new Error('Failed to resolve alert');

      // Refresh alerts after resolution
      fetchAlerts();
      setSelectedAlert(null);
    } catch (error) {
      console.error('Error resolving alert:', error);
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

  const AlertDetails = ({ alert }: { alert: SecurityAlert }) => (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold">{alert.title}</h3>
          <p className="text-gray-600">{alert.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${getSeverityColor(alert.severity)}`}>
          {alert.severity}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Reported: {new Date(alert.timestamp).toLocaleString()}
        </p>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Alert Details</h4>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(alert.metadata, null, 2)}
          </pre>
        </div>
      </div>

      {alert.status === 'active' && (
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => setSelectedAlert(null)}
          >
            Dismiss
          </Button>
          <Button
            onClick={() => handleResolveAlert(alert.id, 'Manually resolved by admin')}
          >
            Resolve Alert
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <span>Active Alerts ({activeAlerts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeAlerts.map(alert => (
              <Alert
                key={alert.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedAlert(alert)}
              >
                <AlertTitle className="flex items-center justify-between">
                  <span>{alert.title}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </AlertTitle>
                <AlertDescription>
                  <p>{alert.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </AlertDescription>
              </Alert>
            ))}
            {activeAlerts.length === 0 && (
              <div className="text-center py-6">
                <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No active alerts</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-gray-500" />
              <span>Alert History</span>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="rounded-md border-gray-300"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
              </select>
              <div className="flex items-center space-x-2">
                {['low', 'medium', 'high', 'critical'].map(severity => (
                  <label key={severity} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={filters.severity.includes(severity)}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          severity: e.target.checked
                            ? [...prev.severity, severity]
                            : prev.severity.filter(s => s !== severity)
                        }));
                      }}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm capitalize">{severity}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alertHistory
              .filter(alert => 
                (filters.status === 'all' || alert.status === filters.status) &&
                (filters.severity.length === 0 || filters.severity.includes(alert.severity))
              )
              .map(alert => (
                <div
                  key={alert.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{alert.title}</h4>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        alert.status === 'resolved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl m-4">
            <AlertDetails alert={selectedAlert} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityAlertManagement;
=======
import React, { useState, useEffect } from 'react';
// [Full component code from above...]
>>>>>>> feature/security-implementation
