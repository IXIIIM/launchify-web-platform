import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend 
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface MetricsPanelProps {
  keyAgeDistribution: Record<string, number>;
  failedRotations: number;
  pendingRotations: number;
}

const COLORS = {
  healthy: '#10b981',
  warning: '#f59e0b',
  critical: '#dc2626',
  info: '#3b82f6'
};

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  keyAgeDistribution,
  failedRotations,
  pendingRotations
}) => {
  const pieChartData = Object.entries(keyAgeDistribution).map(([range, count]) => ({
    name: range,
    value: count
  }));

  const getKeyAgeColor = (name: string) => {
    switch (name) {
      case '0-30':
        return COLORS.healthy;
      case '31-60':
        return COLORS.info;
      case '61-90':
        return COLORS.warning;
      default:
        return COLORS.critical;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Rotation Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Age Distribution Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({name, value}) => `${name} days: ${value}`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={getKeyAgeColor(entry.name)}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Failed Rotations</div>
              <div className="mt-1">
                <span className={`text-2xl font-bold ${
                  failedRotations > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {failedRotations}
                </span>
                <span className="text-sm text-gray-500 ml-2">in last 24h</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Pending Rotations</div>
              <div className="mt-1">
                <span className={`text-2xl font-bold ${
                  pendingRotations > 0 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {pendingRotations}
                </span>
              </div>
            </div>
          </div>

          {/* Distribution Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500">Key Age Distribution</h4>
            {Object.entries(keyAgeDistribution).map(([range, count]) => (
              <div 
                key={range}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <span className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: getKeyAgeColor(range) }}
                  />
                  {range} days
                </span>
                <span className="font-medium">{count} keys</span>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {(failedRotations > 0 || pendingRotations > 0 || keyAgeDistribution['90+'] > 0) && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Recommendations</h4>
              <ul className="space-y-2 text-sm text-yellow-700">
                {failedRotations > 0 && (
                  <li>• Investigate and resolve failed key rotations</li>
                )}
                {pendingRotations > 0 && (
                  <li>• Process pending key rotations to maintain security</li>
                )}
                {keyAgeDistribution['90+'] > 0 && (
                  <li>• Rotate keys that are over 90 days old immediately</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};