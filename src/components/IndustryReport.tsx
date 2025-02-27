// src/components/IndustryReport.tsx

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown, Activity, DollarSign, Users, TrendingUp } from 'lucide-react';

const IndustryReport = ({ industry }) => {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [industry]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/industry-reports/${industry}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading industry report...</div>;
  }

  if (!report) return null;

  const formatCurrency = (value) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">{industry} Industry Report</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Investments</p>
              <p className="text-2xl font-bold">
                {formatCurrency(report.totalInvestments)}
              </p>
            </div>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold">
                {report.successRate.toFixed(1)}%
              </p>
            </div>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Growth Rate</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold">
                  {Math.abs(report.growthRate).toFixed(1)}%
                </p>
                {report.growthRate > 0 ? (
                  <ArrowUp className="w-5 h-5 text-green-500 ml-2" />
                ) : (
                  <ArrowDown className="w-5 h-5 text-red-500 ml-2" />
                )}
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Active Projects</p>
              <p className="text-2xl font-bold">{report.activeProjects}</p>
            </div>
            <Users className="w-5 h-5 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Average Investment */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Average Investment</h3>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold">
            {formatCurrency(report.averageInvestment)}
          </span>
          <span className="text-sm text-gray-500">per project</span>
        </div>
      </Card>

      {/* Top Subsectors */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Subsectors</h3>
        <div className="space-y-2">
          {report.topSubsectors.map((subsector, index) => (
            <div 
              key={subsector} 
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <span className="font-medium">{subsector}</span>
              <span className="text-sm text-gray-500">#{index + 1}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default IndustryReport;