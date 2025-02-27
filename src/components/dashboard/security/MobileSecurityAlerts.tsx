// src/components/dashboard/security/MobileSecurityAlerts.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  Filter,
  X
} from 'lucide-react';

const MobileSecurityAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    severity: [],
    type: [],
    status: ['active']
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [alerts, activeFilters]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/security/alerts');
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...alerts];

    if (activeFilters.severity.length > 0) {
      filtered = filtered.filter(alert => 
        activeFilters.severity.includes(alert.severity)
      );
    }

    if (activeFilters.type.length > 0) {
      filtered = filtered.filter(alert => 
        activeFilters.type.includes(alert.type)
      );
    }

    if (activeFilters.status.length > 0) {
      filtered = filtered.filter(alert => 
        activeFilters.status.includes(alert.status)
      );
    }

    setFilteredAlerts(filtered);
  };

  const toggleFilter = (category, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      severity: [],
      type: [],
      status: ['active']
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header with Filter Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Security Alerts</h2>
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
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all
              </button>
            </div>

            {/* Severity Filters */}
            <div>
              <h4 className="text-sm font-medium mb-2">Severity</h4>
              <div className="flex flex-wrap gap-2">
                {['critical', 'high', 'medium', 'low'].map(severity => (
                  <button
                    key={severity}
                    onClick={() => toggleFilter('severity', severity)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilters.severity.includes(severity)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filters */}
            <div>
              <h4 className="text-sm font-medium mb-2">Type</h4>
              <div className="flex flex-wrap gap-2">
                {['rotation', 'compliance', 'access', 'system'].map(type => (
                  <button
                    key={type}
                    onClick={() => toggleFilter('type', type)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilters.type.includes(type)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filters */}
            <div>
              <h4 className="text-sm font-medium mb-2">Status</h4>
              <div className="flex flex-wrap gap-2">
                {['active', 'resolved', 'acknowledged'].map(status => (
                  <button
                    key={status}
                    onClick={() => toggleFilter('status', status)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilters.status.includes(status)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert, index) => (
          <AlertCard key={index} alert={alert} />
        ))}
        {filteredAlerts.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-2" />
            <p className="text-gray-600">No active alerts match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AlertCard = ({ alert }) => {
  const severityIcons = {
    critical: <AlertCircle className="w-5 h-5 text-red-600" />,
    high: <AlertTriangle className="w-5 h-5 text-orange-600" />,
    medium: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    low: <Bell className="w-5 h-5 text-blue-600" />
  };

  const severityColors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };

  return (
    <Alert className="relative">
      <div className="flex items-start space-x-3">
        {severityIcons[alert.severity]}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <AlertTitle className="text-sm font-semibold">{alert.title}</AlertTitle>
            <Badge 
              variant="outline" 
              className={severityColors[alert.severity]}
            >
              {alert.severity}
            </Badge>
          </div>
          <AlertDescription className="text-sm">
            {alert.description}
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(alert.timestamp).toLocaleString()}
            </div>
          </AlertDescription>
        </div>
      </div>
      {alert.status === 'resolved' && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
        </div>
      )}
    </Alert>
  );
};

export default MobileSecurityAlerts;