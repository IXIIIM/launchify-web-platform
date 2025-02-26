// src/components/dashboard/security/MobileComplianceReport.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Shield, Check, X, ChevronRight, AlertTriangle, Clock } from 'lucide-react';

const MobileComplianceReport = () => {
  const [complianceData, setComplianceData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      const response = await fetch('/api/security/compliance');
      const data = await response.json();
      setComplianceData(data);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
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
      {/* Overall Compliance Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="relative inline-block">
              <div className="h-32 w-32 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { value: complianceData?.overallScore || 0 },
                        { value: 100 - (complianceData?.overallScore || 0) }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={40}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#3B82F6" />
                      <Cell fill="#E5E7EB" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <div className="text-3xl font-bold">
                      {complianceData?.overallScore || 0}%
                    </div>
                    <div className="text-sm text-gray-500">Compliant</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Last updated: {new Date(complianceData?.lastUpdated).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Categories */}
      <div className="space-y-4">
        {complianceData?.categories?.map((category, index) => (
          <ComplianceCategory
            key={index}
            category={category}
            isSelected={selectedCategory?.id === category.id}
            onSelect={() => setSelectedCategory(
              selectedCategory?.id === category.id ? null : category
            )}
          />
        ))}
      </div>

      {/* Critical Issues */}
      {complianceData?.criticalIssues?.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-800 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Critical Issues</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complianceData.criticalIssues.map((issue, index) => (
                <CriticalIssue key={index} issue={issue} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceData?.recentChanges?.map((change, index) => (
              <ComplianceChange key={index} change={change} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ComplianceCategory = ({ category, isSelected, onSelect }) => {
  const getStatusColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <Card className="overflow-hidden">
      <div
        onClick={onSelect}
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium">{category.name}</h3>
              <p className="text-sm text-gray-600">
                {category.checksCompleted} of {category.totalChecks} checks passed
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-2 py-1 rounded-full text-sm font-medium ${
              getStatusColor(category.score)
            }`}>
              {category.score}%
            </span>
            <ChevronRight className={`w-5 h-5 transition-transform ${
              isSelected ? 'rotate-90' : ''
            }`} />
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="border-t px-4 py-3 space-y-3 bg-gray-50">
          {category.checks.map((check, index) => (
            <div key={index} className="flex items-start space-x-3">
              {check.passed ? (
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <X className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <div className="font-medium text-sm">{check.name}</div>
                <p className="text-sm text-gray-600">{check.description}</p>
                {!check.passed && check.recommendation && (
                  <div className="mt-2 text-sm text-red-600">
                    Recommendation: {check.recommendation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

const CriticalIssue = ({ issue }) => (
  <div className="flex items-start space-x-3">
    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
    <div>
      <div className="font-medium text-sm">{issue.title}</div>
      <p className="text-sm text-red-600">{issue.description}</p>
      <div className="mt-1 text-sm text-gray-600 flex items-center">
        <Clock className="w-4 h-4 mr-1" />
        Detected {new Date(issue.detectedAt).toLocaleDateString()}
      </div>
    </div>
  </div>
);

const ComplianceChange = ({ change }) => (
  <div className="flex items-start space-x-3">
    <div className={`p-1 rounded-full ${
      change.type === 'improvement' ? 'bg-green-100' : 'bg-yellow-100'
    }`}>
      {change.type === 'improvement' ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-yellow-600" />
      )}
    </div>
    <div>
      <div className="font-medium text-sm">{change.title}</div>
      <p className="text-sm text-gray-600">{change.description}</p>
      <div className="mt-1 text-sm text-gray-500">
        {new Date(change.timestamp).toLocaleString()}
      </div>
    </div>
  </div>
);

export default MobileComplianceReport;