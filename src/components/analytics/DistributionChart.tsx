import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Box, useTheme } from '@mui/material';

interface DistributionChartProps {
  data: any[];
  nameKey: string;
  dataKey: string;
  height?: number | string;
  innerRadius?: number;
  outerRadius?: number;
  colors?: string[];
}

const DistributionChart: React.FC<DistributionChartProps> = ({
  data,
  nameKey,
  dataKey,
  height = '100%',
  innerRadius = 60,
  outerRadius = 80,
  colors
}) => {
  const theme = useTheme();
  
  // Default colors from theme
  const defaultColors = colors || [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    theme.palette.primary.light,
    theme.palette.secondary.light,
    theme.palette.success.light,
    theme.palette.warning.light
  ];
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
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
            {data[nameKey]}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: payload[0].color,
                mr: 1,
                borderRadius: '50%'
              }} 
            />
            <Box sx={{ mr: 1 }}>
              Value:
            </Box>
            <Box sx={{ fontWeight: 'bold' }}>
              {typeof data[dataKey] === 'number' ? data[dataKey].toLocaleString() : data[dataKey]}
            </Box>
          </Box>
        </Box>
      );
    }
    return null;
  };
  
  // Custom legend
  const renderCustomizedLegend = ({ payload }: any) => {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mt: 2 }}>
        {payload.map((entry: any, index: number) => (
          <Box 
            key={`legend-item-${index}`}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mr: 3,
              mb: 1
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
            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              {entry.value}
            </Box>
          </Box>
        ))}
      </Box>
    );
  };
  
  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill={theme.palette.primary.main}
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={defaultColors[index % defaultColors.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderCustomizedLegend} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default DistributionChart; 