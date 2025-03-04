import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'WARNING' | 'CRITICAL';
  details: Record<string, any>;
  timestamp: string;
}

interface AlertsPanelProps {
  alerts: SecurityAlert[];
  onAlertResolved: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onAlertResolved
}) => {
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolution, setResolution] = useState('');

  const handleResolveAlert = async () => {
    if (!selectedAlert) return;

    setIsResolving(true);
    try {
      const response = await fetch(`/api/security/alerts/${selectedAlert.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution })
      });

      if (!response.ok) throw new Error('Failed to resolve alert');
      
      onAlertResolved();
      setSelectedAlert(null);
      setResolution('');
    } catch (error) {
      console.error('Error resolving alert:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const formatAlertDetails = (details: Record<string, any>): string => {
    const keyHighlights = {
      keyType: 'Key Type',
      keyAge: 'Key Age',
      failureCount: 'Failure Count',
      delay: 'Delay'
    };

    return Object.entries(details)
      .filter(([key]) => keyHighlights[key as keyof typeof keyHighlights])
      .map(([key, value]) => {
        const label = keyHighlights[key as keyof typeof keyHighlights];
        if (key === 'keyAge' || key === 'delay') {
          const days = Math.floor(value / (24 * 60 * 60 * 1000));
          return `${label}: ${days} days`;
        }
        return `${label}: ${value}`;
      })
      .join(' | ');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Alerts</span>
            <span className="text-sm font-normal">
              {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No active alerts</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                        alert.severity === 'CRITICAL'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`} />
                      <div>
                        <h4 className={`font-medium ${
                          alert.severity === 'CRITICAL'
                            ? 'text-red-900'
                            : 'text-yellow-900'
                        }`}>
                          {alert.type}
                        </h4>
                        <p className={`text-sm ${
                          alert.severity === 'CRITICAL'
                            ? 'text-red-700'
                            : 'text-yellow-700'
                        }`}>
                          {formatAlertDetails(alert.details)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      }`}
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Resolution Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-50">
              <h4 className="font-medium">{selectedAlert?.type}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {selectedAlert?.details && formatAlertDetails(selectedAlert.details)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Resolution Notes
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full h-24 p-2 border rounded-md"
                placeholder="Describe how the alert was resolved..."
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setSelectedAlert(null)}
              className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleResolveAlert}
              disabled={isResolving || !resolution.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isResolving ? 'Resolving...' : 'Resolve Alert'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};