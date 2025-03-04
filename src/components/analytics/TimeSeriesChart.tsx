import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Box, useTheme } from '@mui/material';

interface SeriesConfig {
  dataKey: string;
  name: string;
  color?: string;
}

interface TimeSeriesChartProps {
  data: any[];
  xAxisKey: string;
  series: SeriesConfig[];
  height?: number | string;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  xAxisKey,
  series,
  height = '100%'
}) => {
  const theme = useTheme();
  
  // Default colors from theme
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];
  
  // Format date for tooltip
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 1
          }}
        >
          <Box sx={{ fontWeight: 'bold', mb: 1 }}>
            {formatDate(label)}
          </Box>
          {payload.map((entry: any, index: number) => (
            <Box 
              key={`tooltip-item-${index}`}
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                mb: 0.5
              }}
            >
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  backgroundColor: entry.color,
                  mr: 1,
                  borderRadius: '50%'
                }} 
              />
              <Box sx={{ mr: 1 }}>
                {entry.name}:
              </Box>
              <Box sx={{ fontWeight: 'bold' }}>
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </Box>
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };
  
  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fill: theme.palette.text.secondary }}
            tickFormatter={formatDate}
          />
          <YAxis tick={{ fill: theme.palette.text.secondary }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {series.map((item, index) => (
            <Line
              key={item.dataKey}
              type="monotone"
              dataKey={item.dataKey}
              name={item.name}
              stroke={item.color || defaultColors[index % defaultColors.length]}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default TimeSeriesChart; 