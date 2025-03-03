import React from 'react';
import { Box, Card, CardContent, Typography, SvgIcon } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

export type ChangeDirection = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeDirection?: ChangeDirection;
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeDirection = 'neutral',
  icon
}) => {
  // Determine color based on change direction
  const getChangeColor = () => {
    switch (changeDirection) {
      case 'up':
        return 'success.main';
      case 'down':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  // Get appropriate icon based on change direction
  const getChangeIcon = () => {
    switch (changeDirection) {
      case 'up':
        return <TrendingUpIcon fontSize="small" />;
      case 'down':
        return <TrendingDownIcon fontSize="small" />;
      default:
        return <TrendingFlatIcon fontSize="small" />;
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          {icon && (
            <SvgIcon color="primary" fontSize="small">
              {icon}
            </SvgIcon>
          )}
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ color: getChangeColor(), display: 'flex', alignItems: 'center', mr: 1 }}>
              {getChangeIcon()}
            </Box>
            <Typography 
              variant="body2" 
              component="span"
              color={getChangeColor()}
            >
              {change > 0 ? '+' : ''}{change}%
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              vs previous period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard; 