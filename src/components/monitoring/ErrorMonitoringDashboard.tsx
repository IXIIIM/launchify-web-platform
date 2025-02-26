import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Filter, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import _ from 'lodash';

const ErrorMonitoringDashboard = () => {
  const [errors, setErrors] = useState([]);
  const [filteredErrors, setFilteredErrors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    severity: 'all',
    timeRange: '24h',
    category: 'all'
  });
  const [errorTrends, setErrorTrends] = useState([]);

  useEffect(() => {
    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/errors`);
    
    ws.onmessage = (event) => {
      const newError = JSON.parse(event.data);
      setErrors(prev => [...prev, newError]);
    };

    // Initial data fetch
    fetchErrorData();

    return () => ws.close();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let filtered = errors;

    // Apply severity filter
    if (filters.severity !== 'all') {
      filtered = filtered.filter(error => error.severity === filters.severity);
    }

    // Apply time range filter
    const now = new Date();
    const timeRanges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    if (timeRanges[filters.timeRange]) {
      filtered = filtered.filter(error => 
        new Date(error.timestamp) > new Date(now - timeRanges[filters.timeRange])
      );
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(error => error.category === filters.category);
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(error =>
        error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.stack.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredErrors(filtered);

    // Update error trends
    const trends = _.chain(filtered)
      .groupBy(error => new Date(error.timestamp).toLocaleDateString())
      .map((group, date) => ({
        date,
        count: group.length,
        critical: group.filter(e => e.severity === 'critical').length,
        warning: group.filter(e => e.severity === 'warning').length
      }))
      .value();

    setErrorTrends(trends);
  }, [errors, filters, searchTerm]);

  const fetchErrorData = async () => {
    try {
      const response = await fetch('/api/errors');
      if (!response.ok) throw new Error('Failed to fetch error data');
      const data = await response.json();
      setErrors(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search errors..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        <select
          value={filters.severity}
          onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        
        <select
          value={filters.timeRange}
          onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Error Trends Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Error Trends</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={errorTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="critical" stroke="#EF4444" />
              <Line type="monotone" dataKey="warning" stroke="#F59E0B" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Error List */}
      <div className="space-y-4">
        {filteredErrors.map((error, index) => (
          <Alert key={index} className={getSeverityColor(error.severity)}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-semibold">
              {error.category} Error - {new Date(error.timestamp).toLocaleString()}
            </AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2">
                <p className="font-medium">{error.message}</p>
                <pre className="text-sm overflow-x-auto p-2 bg-white bg-opacity-50 rounded">
                  {error.stack}
                </pre>
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
};

export default ErrorMonitoringDashboard;