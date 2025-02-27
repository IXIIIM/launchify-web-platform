import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface CompliancePanelProps {
  complianceRate: number;
  keyAgeDistribution: Record<string, number>;
  timeframe: string;
}

export const CompliancePanel: React.FC<CompliancePanelProps> = ({
  complianceRate,
  keyAgeDistribution,
  timeframe
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getComplianceStatus = (rate: number): {
    status: 'critical' | 'warning' | 'good';
    message: string;
    color: string;
  } => {
    if (rate < 70) {
      return {
        status: 'critical',
        message: 'Critical: Immediate action required',
        color: 'text-red-600'
      };
    }
    if (rate < 90) {
      return {
        status: 'warning',
        message: 'Warning: Room for improvement',
        color: 'text-yellow-600'
      };
    }
    return {
      status: 'good',
      message: 'Good: Meeting compliance targets',
      color: 'text-green-600'
    };
  };

  const compliance = getComplianceStatus(complianceRate);

  // Generate compliance data for visualization
  const complianceData = [
    {
      category: '0-30 days',
      value: keyAgeDistribution['0-30'],
      status: 'Compliant'
    },
    {
      category: '31-60 days',
      value: keyAgeDistribution['31-60'],
      status: 'Compliant'
    },
    {
      category: '61-90 days',
      value: keyAgeDistribution['61-90'],
      status: 'Warning'
    },
    {
      category: '90+ days',
      value: keyAgeDistribution['90+'],
      status: 'Non-Compliant'
    }
  ];

  const generateRecommendations = () => {
    const recommendations: { text: string; priority: 'high' | 'medium' | 'low' }[] = [];

    if (keyAgeDistribution['90+'] > 0) {
      recommendations.push({
        text: `${keyAgeDistribution['90+']} keys are over 90 days old and require immediate rotation`,
        priority: 'high'
      });
    }

    if (keyAgeDistribution['61-90'] > 0) {
      recommendations.push({
        text: `${keyAgeDistribution['61-90']} keys are approaching expiration and should be scheduled for rotation`,
        priority: 'medium'
      });
    }

    if (complianceRate < 90) {
      recommendations.push({
        text: 'Implement automated key rotation to improve compliance rate',
        priority: 'medium'
      });
    }

    if (complianceRate < 70) {
      recommendations.push({
        text: 'Review and update key management policies',
        priority: 'high'
      });
    }

    return recommendations;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Compliance Overview</span>
          <Shield className={`h-6 w-6 ${compliance.color}`} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Compliance Rate Display */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overall Compliance Rate</p>
              <p className={`text-3xl font-bold ${compliance.color}`}>
                {complianceRate.toFixed(1)}%
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full ${
              compliance.status === 'critical'
                ? 'bg-red-100 text-red-800'
                : compliance.status === 'warning'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {compliance.message}
            </div>
          </div>

          {/* Compliance Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill={(entry) => {
                    const data = entry as typeof complianceData[0];
                    return data.status === 'Non-Compliant'
                      ? '#dc2626'
                      : data.status === 'Warning'
                      ? '#f59e0b'
                      : '#10b981';
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Breakdown */}
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>

            {showDetails && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700">Compliant Keys</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {keyAgeDistribution['0-30'] + keyAgeDistribution['31-60']}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700">Non-Compliant Keys</h4>
                    <p className="text-2xl font-bold text-red-600">
                      {keyAgeDistribution['90+']}
                    </p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Recommendations
                  </h4>
                  <div className="space-y-3">
                    {generateRecommendations().map((rec, index) => (
                      <div
                        key={index}
                        className={`flex items-start space-x-2 p-2 rounded ${
                          rec.priority === 'high'
                            ? 'bg-red-50 text-red-700'
                            : rec.priority === 'medium'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {rec.priority === 'high' ? (
                          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="h-5 w-5 flex-shrink-0" />
                        )}
                        <span className="text-sm">{rec.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};