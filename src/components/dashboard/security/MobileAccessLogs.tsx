// src/components/dashboard/security/MobileAccessLogs.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  UserCheck, 
  UserX, 
  Filter, 
  Clock, 
  Shield,
  AlertTriangle,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';

const MobileAccessLogs = () => {
  const [accessLogs, setAccessLogs] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: [],
    status: ['failed'],
    timeframe: '24h'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccessLogs();
  }, [filters]);

  const fetchAccessLogs = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        type: filters.type.join(','),
        status: filters.status.join(',')
      });
      
      const response = await fetch(`/api/security/access-logs?${queryParams}`);
      const data = await response.json();
      setAccessLogs(data);
    } catch (error) {
      console.error('Error fetching access logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
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
      {/* Header with Filter Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Access Logs</h2>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-100 text-sm"
        >
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="shadow-lg">
          <CardContent className="p-4 space-y-4">
            {/* Timeframe Filter */}
            <div>
              <h3 className="text-sm font-medium mb-2">Time Range</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '24 Hours', value: '24h' },
                  { label: '7 Days', value: '7d' },
                  { label: '30 Days', value: '30d' }
                ].map(timeframe => (
                  <button
                    key={timeframe.value}
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      timeframe: timeframe.value
                    }))}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.timeframe === timeframe.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {timeframe.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Type Filter */}
            <div>
              <h3 className="text-sm font-medium mb-2">Event Type</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Login', value: 'login' },
                  { label: 'API Access', value: 'api' },
                  { label: 'Key Usage', value: 'key' },
                  { label: 'Admin', value: 'admin' }
                ].map(type => (
                  <button
                    key={type.value}
                    onClick={() => toggleFilter('type', type.value)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.type.includes(type.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <h3 className="text-sm font-medium mb-2">Status</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Success', value: 'success' },
                  { label: 'Failed', value: 'failed' },
                  { label: 'Suspicious', value: 'suspicious' }
                ].map(status => (
                  <button
                    key={status.value}
                    onClick={() => toggleFilter('status', status.value)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.status.includes(status.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <UserX className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-600">Failed Access</span>
            </div>
            <div className="text-2xl font-bold">{accessLogs?.stats?.failedCount || 0}</div>
            <div className="text-sm text-gray-600">Last 24 hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-600">Suspicious</span>
            </div>
            <div className="text-2xl font-bold">{accessLogs?.stats?.suspiciousCount || 0}</div>
            <div className="text-sm text-gray-600">Last 24 hours</div>
          </CardContent>
        </Card>
      </div>

      {/* Access Log Entries */}
      <div className="space-y-4">
        {accessLogs?.entries?.map((entry, index) => (
          <AccessLogEntry key={index} entry={entry} />
        ))}
        {(!accessLogs?.entries || accessLogs.entries.length === 0) && (
          <div className="text-center py-8 text-gray-600">
            No access logs found for the selected filters
          </div>
        )}
      </div>
    </div>
  );
};

const AccessLogEntry = ({ entry }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <UserCheck className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <UserX className="w-5 h-5 text-red-600" />;
      case 'suspicious':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'suspicious':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className={`border ${getStatusColor(entry.status)}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {getStatusIcon(entry.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">
                {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)} Attempt
              </h3>
              <span className="text-xs text-gray-500">
                {format(new Date(entry.timestamp), 'HH:mm:ss')}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <div>User: {entry.user}</div>
              <div>IP: {entry.ipAddress}</div>
              <div>Location: {entry.location}</div>
            </div>
            {entry.metadata && (
              <div className="mt-2 p-2 bg-white rounded-md text-xs font-mono overflow-x-auto">
                {JSON.stringify(entry.metadata, null, 2)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileAccessLogs;