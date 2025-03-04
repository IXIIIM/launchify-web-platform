import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExportMenu, ExportButton } from '@/components/analytics/ExportMenu';
import { prepareTimeSeriesForExport, prepareDistributionForExport } from '@/utils/exportUtils';

// Sample data
const timeSeriesData = [
  { date: '2023-01-01', users: 120, revenue: 1500 },
  { date: '2023-01-02', users: 145, revenue: 1750 },
  { date: '2023-01-03', users: 132, revenue: 1600 },
  { date: '2023-01-04', users: 160, revenue: 1900 },
  { date: '2023-01-05', users: 175, revenue: 2100 },
  { date: '2023-01-06', users: 190, revenue: 2300 },
  { date: '2023-01-07', users: 185, revenue: 2250 },
];

const distributionData = [
  { category: 'Basic', count: 450, percentage: 45 },
  { category: 'Premium', count: 320, percentage: 32 },
  { category: 'Enterprise', count: 230, percentage: 23 },
];

const userTypeData = [
  { type: 'Entrepreneur', count: 620, percentage: 62 },
  { type: 'Investor', count: 380, percentage: 38 },
];

/**
 * Example component demonstrating the export functionality
 */
export function ExportExample() {
  const [timeframe, setTimeframe] = useState('week');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Prepare data for export based on the active tab
  const getExportData = () => {
    switch (activeTab) {
      case 'overview':
        return prepareTimeSeriesForExport(timeSeriesData, 'date', ['users', 'revenue']);
      case 'subscriptions':
        return prepareDistributionForExport(distributionData, 'category', ['count', 'percentage']);
      case 'users':
        return prepareDistributionForExport(userTypeData, 'type', ['count', 'percentage']);
      default:
        return [];
    }
  };
  
  // Get appropriate filename based on the active tab and timeframe
  const getFilename = () => {
    const date = new Date().toISOString().split('T')[0];
    return `launchify-${activeTab}-${timeframe}-${date}`;
  };
  
  // Get appropriate headers based on the active tab
  const getHeaders = () => {
    switch (activeTab) {
      case 'overview':
        return [
          { key: 'date', label: 'Date' },
          { key: 'users', label: 'Active Users' },
          { key: 'revenue', label: 'Revenue ($)' }
        ];
      case 'subscriptions':
        return [
          { key: 'category', label: 'Subscription Tier' },
          { key: 'count', label: 'Number of Subscribers' },
          { key: 'percentage', label: 'Percentage (%)' }
        ];
      case 'users':
        return [
          { key: 'type', label: 'User Type' },
          { key: 'count', label: 'Count' },
          { key: 'percentage', label: 'Percentage (%)' }
        ];
      default:
        return [];
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Analytics Export Example</CardTitle>
          <CardDescription>
            Demonstrates how to use the export functionality in different contexts
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={timeframe}
            onValueChange={(value) => setTimeframe(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last 90 Days</SelectItem>
              <SelectItem value="year">Last 365 Days</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Export Menu Dropdown */}
          <ExportMenu
            data={getExportData()}
            filename={getFilename()}
            headers={getHeaders()}
            buttonText="Export Data"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="users">User Types</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Platform Overview</h3>
              
              {/* Export Button for specific format */}
              <ExportButton
                data={prepareTimeSeriesForExport(timeSeriesData, 'date', ['users', 'revenue'])}
                filename={`launchify-overview-${timeframe}-${new Date().toISOString().split('T')[0]}`}
                headers={[
                  { key: 'date', label: 'Date' },
                  { key: 'users', label: 'Active Users' },
                  { key: 'revenue', label: 'Revenue ($)' }
                ]}
                format="excel"
                buttonText="Export as Excel"
              />
            </div>
            
            <div className="border rounded-md p-4">
              <p className="text-sm text-muted-foreground mb-2">Sample time series data that would be visualized here:</p>
              <pre className="text-xs overflow-auto p-2 bg-muted rounded-md">
                {JSON.stringify(timeSeriesData, null, 2)}
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="subscriptions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Subscription Distribution</h3>
              
              {/* Export Button for specific format */}
              <ExportButton
                data={prepareDistributionForExport(distributionData, 'category', ['count', 'percentage'])}
                filename={`launchify-subscriptions-${timeframe}-${new Date().toISOString().split('T')[0]}`}
                headers={[
                  { key: 'category', label: 'Subscription Tier' },
                  { key: 'count', label: 'Number of Subscribers' },
                  { key: 'percentage', label: 'Percentage (%)' }
                ]}
                format="csv"
                buttonText="Export as CSV"
              />
            </div>
            
            <div className="border rounded-md p-4">
              <p className="text-sm text-muted-foreground mb-2">Sample distribution data that would be visualized here:</p>
              <pre className="text-xs overflow-auto p-2 bg-muted rounded-md">
                {JSON.stringify(distributionData, null, 2)}
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">User Type Distribution</h3>
              
              {/* Export Button for specific format */}
              <ExportButton
                data={prepareDistributionForExport(userTypeData, 'type', ['count', 'percentage'])}
                filename={`launchify-users-${timeframe}-${new Date().toISOString().split('T')[0]}`}
                headers={[
                  { key: 'type', label: 'User Type' },
                  { key: 'count', label: 'Count' },
                  { key: 'percentage', label: 'Percentage (%)' }
                ]}
                format="json"
                buttonText="Export as JSON"
              />
            </div>
            
            <div className="border rounded-md p-4">
              <p className="text-sm text-muted-foreground mb-2">Sample user type data that would be visualized here:</p>
              <pre className="text-xs overflow-auto p-2 bg-muted rounded-md">
                {JSON.stringify(userTypeData, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 