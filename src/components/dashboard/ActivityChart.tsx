import React from 'react';
import { Box, Card, CardContent, CardHeader, Divider, Typography, useTheme } from '@mui/material';

// Mock data for development
const MOCK_ACTIVITY_DATA = [
  { day: 'Mon', matches: 2, messages: 5, documents: 1 },
  { day: 'Tue', matches: 3, messages: 8, documents: 0 },
  { day: 'Wed', matches: 1, messages: 12, documents: 2 },
  { day: 'Thu', matches: 4, messages: 7, documents: 1 },
  { day: 'Fri', matches: 2, messages: 10, documents: 3 },
  { day: 'Sat', matches: 0, messages: 4, documents: 0 },
  { day: 'Sun', matches: 1, messages: 3, documents: 0 },
];

interface ActivityChartProps {
  title?: string;
}

const ActivityChart: React.FC<ActivityChartProps> = ({ title = 'Weekly Activity' }) => {
  const theme = useTheme();
  
  // Find the maximum value to scale the chart properly
  const maxValue = Math.max(
    ...MOCK_ACTIVITY_DATA.map(day => Math.max(day.matches, day.messages, day.documents))
  );
  
  // Calculate bar heights as percentages of the maximum value
  const getBarHeight = (value: number) => {
    return value === 0 ? 0 : Math.max(10, (value / maxValue) * 100);
  };

  return (
    <Card>
      <CardHeader title={title} />
      <Divider />
      <CardContent>
        <Box sx={{ height: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {MOCK_ACTIVITY_DATA.map((day, index) => (
            <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '14%' }}>
              {/* Matches Bar */}
              <Box 
                sx={{ 
                  width: '30%', 
                  height: `${getBarHeight(day.matches)}%`,
                  bgcolor: theme.palette.primary.main,
                  borderRadius: '2px 2px 0 0',
                  mx: 0.5,
                }}
              />
              
              {/* Messages Bar */}
              <Box 
                sx={{ 
                  width: '30%', 
                  height: `${getBarHeight(day.messages)}%`,
                  bgcolor: theme.palette.secondary.main,
                  borderRadius: '2px 2px 0 0',
                  mx: 0.5,
                }}
              />
              
              {/* Documents Bar */}
              <Box 
                sx={{ 
                  width: '30%', 
                  height: `${getBarHeight(day.documents)}%`,
                  bgcolor: theme.palette.success.main,
                  borderRadius: '2px 2px 0 0',
                  mx: 0.5,
                }}
              />
              
              {/* Day Label */}
              <Typography variant="caption" sx={{ mt: 1 }}>
                {day.day}
              </Typography>
            </Box>
          ))}
        </Box>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.primary.main, mr: 0.5 }} />
            <Typography variant="caption">Matches</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.secondary.main, mr: 0.5 }} />
            <Typography variant="caption">Messages</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.success.main, mr: 0.5 }} />
            <Typography variant="caption">Documents</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ActivityChart; 