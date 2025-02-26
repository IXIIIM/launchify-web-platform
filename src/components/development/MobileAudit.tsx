// src/components/development/MobileAudit.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, AlertTriangle } from 'lucide-react';

interface ResponsivenessIssue {
  component: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  status: 'fixed' | 'in-progress' | 'pending';
  fixDescription?: string;
}

const MobileAudit = () => {
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [showFixedIssues, setShowFixedIssues] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const issues: ResponsivenessIssue[] = [
    {
      component: 'AdvancedSearch',
      issue: 'Filter menu overflows on mobile screens',
      severity: 'high',
      status: 'pending',
      fixDescription: 'Convert filter menu to bottom sheet on mobile'
    },
    {
      component: 'MatchFeed',
      issue: 'Swipe gestures not optimized for touch',
      severity: 'high',
      status: 'in-progress',
      fixDescription: 'Implement touch-friendly swipe handling'
    },
    {
      component: 'ChatWindow',
      issue: 'Input field covered by keyboard on mobile',
      severity: 'medium',
      status: 'pending',
      fixDescription: 'Adjust layout when virtual keyboard is visible'
    },
    {
      component: 'Navbar',
      issue: 'Menu items stack poorly on narrow screens',
      severity: 'medium',
      status: 'fixed',
      fixDescription: 'Implemented responsive hamburger menu'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fixed':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'pending':
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const filteredIssues = issues.filter(issue => 
    (showFixedIssues || issue.status !== 'fixed') &&
    (!selectedComponent || issue.component === selectedComponent)
  );

  const uniqueComponents = [...new Set(issues.map(issue => issue.component))];
  
  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <h1 className="text-2xl font-bold mb-2">Mobile Responsiveness Audit</h1>
        <p className="text-gray-600">Current Viewport Width: {viewportWidth}px</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="md:w-64 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Component
                  </label>
                  <select
                    value={selectedComponent || ''}
                    onChange={(e) => setSelectedComponent(e.target.value || null)}
                    className="w-full rounded-md border-gray-300"
                  >
                    <option value="">All Components</option>
                    {uniqueComponents.map(component => (
                      <option key={component} value={component}>
                        {component}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showFixed"
                    checked={showFixedIssues}
                    onChange={(e) => setShowFixedIssues(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="showFixed" className="ml-2 text-sm text-gray-700">
                    Show Fixed Issues
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Total Issues: {issues.length}
                </p>
                <p className="text-sm text-green-600">
                  Fixed: {issues.filter(i => i.status === 'fixed').length}
                </p>
                <p className="text-sm text-yellow-600">
                  In Progress: {issues.filter(i => i.status === 'in-progress').length}
                </p>
                <p className="text-sm text-red-600">
                  Pending: {issues.filter(i => i.status === 'pending').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 space-y-4">
          {filteredIssues.map((issue, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {issue.component}
                    </h3>
                    <p className="text-gray-700 mb-2">{issue.issue}</p>
                    {issue.fixDescription && (
                      <p className="text-sm text-gray-600">
                        Fix: {issue.fixDescription}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm font-medium ${getSeverityColor(issue.severity)}`}>
                      {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                    </span>
                    {getStatusIcon(issue.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileAudit;