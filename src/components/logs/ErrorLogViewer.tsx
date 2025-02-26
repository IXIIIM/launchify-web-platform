import React, { useState, useEffect } from 'react';
import { AlertTriangle, Filter, Download, RefreshCcw, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'critical';
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

const ErrorLogViewer = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    level: 'all',
    timeRange: '24h',
    component: 'all'
  });
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [components, setComponents] = useState<string[]>([]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchLogs();
      }
    }, 30000); // Refresh every 30 seconds if auto-refresh is enabled

    return () => clearInterval(interval);
  }, [autoRefresh, filters]);

  useEffect(() => {
    applyFilters();
  }, [logs, searchTerm, filters]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        timeRange: filters.timeRange,
        level: filters.level !== 'all' ? filters.level : '',
        component: filters.component !== 'all' ? filters.component : ''
      });

      const response = await fetch(`/api/logs/errors?${params}`);
      if (!response.ok) throw new Error('Failed to fetch error logs');
      
      const data = await response.json();
      setLogs(data.logs);
      setComponents(data.components);
    } catch (error) {
      setError('Failed to load error logs');
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) ||
        log.component?.toLowerCase().includes(term) ||
        log.userId?.toLowerCase().includes(term)
      );
    }

    // Apply level filter
    if (filters.level !== 'all') {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    // Apply component filter
    if (filters.component !== 'all') {
      filtered = filtered.filter(log => log.component === filters.component);
    }

    setFilteredLogs(filtered);
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/logs/errors/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: filteredLogs })
      });

      if (!response.ok) throw new Error('Failed to export logs');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Failed to export logs');
      console.error('Error exporting logs:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Error Log Viewer</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md ${
              autoRefresh ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
            }`}
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="text-sm">Auto-refresh</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded-md"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Search logs..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Level
            </label>
            <select
              value={filters.level}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                level: e.target.value
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="all">All Levels</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Time Range
            </label>
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                timeRange: e.target.value
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Component
            </label>
            <select
              value={filters.component}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                component: e.target.value
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="all">All Components</option>
              {components.map(component => (
                <option key={component} value={component}>
                  {component}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Component
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      log.level === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : log.level === 'error'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.component || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {log.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">Error Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Timestamp
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {format(new Date(selectedLog.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Level
                  </label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedLog.level === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : selectedLog.level === 'error'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedLog.level}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Component
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedLog.component || 'N/A'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedLog.message}
                  </div>
                </div>

                {selectedLog.stack && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Stack Trace
                    </label>
                    <pre className="mt-1 p-4 bg-gray-50 rounded-md text-sm overflow-x-auto">
                      {selectedLog.stack}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Additional Data
                    </label>
                    <pre className="mt-1 p-4 bg-gray-50 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorLogViewer;