import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MetricBreakdownProps {
  title: string;
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  total: number;
}

const MetricBreakdown: React.FC<MetricBreakdownProps> = ({ title, data, total }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                `${value} (${((value / total) * 100).toFixed(1)}%)`,
                'Count'
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-2 gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.value.toLocaleString()} ({((item.value / total) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetricBreakdown;

// Usage example:
/*
<MetricBreakdown
  title="User Distribution"
  data={[
    { name: 'Entrepreneurs', value: metrics.users.byType.entrepreneurs, color: '#3B82F6' },
    { name: 'Funders', value: metrics.users.byType.funders, color: '#10B981' }
  ]}
  total={metrics.users.total}
/>
*/