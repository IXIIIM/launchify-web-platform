import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  Grid, 
  LinearProgress, 
  Typography, 
  useTheme 
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

// Mock data for development
const MOCK_ANALYTICS = {
  profileViews: {
    value: 124,
    change: 12,
    period: 'week',
  },
  matchRate: {
    value: 68,
    change: -3,
    period: 'week',
  },
  responseTime: {
    value: 4.2,
    change: -0.8,
    period: 'week',
    unit: 'hours',
  },
  engagementScore: {
    value: 82,
    change: 5,
    period: 'week',
    max: 100,
  },
};

interface AnalyticsSummaryProps {
  title?: string;
}

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ 
  title = 'Analytics Summary' 
}) => {
  const theme = useTheme();

  // Helper function to format change values
  const formatChange = (change: number) => {
    const isPositive = change > 0;
    const icon = isPositive ? 
      <TrendingUpIcon fontSize="small" color="success" /> : 
      <TrendingDownIcon fontSize="small" color="error" />;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {icon}
        <Typography 
          variant="caption" 
          color={isPositive ? 'success.main' : 'error.main'}
          sx={{ ml: 0.5 }}
        >
          {isPositive ? '+' : ''}{change}%
        </Typography>
      </Box>
    );
  };

  return (
    <Card>
      <CardHeader title={title} />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          {/* Profile Views */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Profile Views
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
                <Typography variant="h4">
                  {MOCK_ANALYTICS.profileViews.value}
                </Typography>
                <Box sx={{ ml: 2 }}>
                  {formatChange(MOCK_ANALYTICS.profileViews.change)}
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                vs previous {MOCK_ANALYTICS.profileViews.period}
              </Typography>
            </Box>
          </Grid>

          {/* Match Rate */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Match Rate
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
                <Typography variant="h4">
                  {MOCK_ANALYTICS.matchRate.value}%
                </Typography>
                <Box sx={{ ml: 2 }}>
                  {formatChange(MOCK_ANALYTICS.matchRate.change)}
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                vs previous {MOCK_ANALYTICS.matchRate.period}
              </Typography>
            </Box>
          </Grid>

          {/* Response Time */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Avg. Response Time
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
                <Typography variant="h4">
                  {MOCK_ANALYTICS.responseTime.value} {MOCK_ANALYTICS.responseTime.unit}
                </Typography>
                <Box sx={{ ml: 2 }}>
                  {formatChange(-MOCK_ANALYTICS.responseTime.change)}
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                vs previous {MOCK_ANALYTICS.responseTime.period}
              </Typography>
            </Box>
          </Grid>

          {/* Engagement Score */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Engagement Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
                <Typography variant="h4">
                  {MOCK_ANALYTICS.engagementScore.value}
                </Typography>
                <Box sx={{ ml: 2 }}>
                  {formatChange(MOCK_ANALYTICS.engagementScore.change)}
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={MOCK_ANALYTICS.engagementScore.value} 
                sx={{ mt: 1, mb: 1, height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                vs previous {MOCK_ANALYTICS.engagementScore.period}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AnalyticsSummary; 