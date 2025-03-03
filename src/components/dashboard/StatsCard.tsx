import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = '#1976d2' 
}) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography color="text.secondary" variant="subtitle2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: `${color}20`, // 20% opacity of the color
            color: color
          }}>
            {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 28 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard; 