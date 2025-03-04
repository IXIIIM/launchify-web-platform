import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  Paper,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import SecurityIcon from '@mui/icons-material/Security';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PaymentIcon from '@mui/icons-material/Payment';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';

interface ActivityHistoryListProps {
  userId: string;
}

interface ActivityItem {
  id: string;
  type: 'login' | 'logout' | 'security' | 'profile' | 'email' | 'connection' | 'payment' | 'document' | 'other';
  description: string;
  timestamp: string;
  ipAddress?: string;
  device?: string;
  location?: string;
  details?: string;
}

const ActivityHistoryList: React.FC<ActivityHistoryListProps> = ({ userId }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchActivityHistory = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, you would call the API to get the activity history
        // For now, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Generate mock activity data
        const mockActivities: ActivityItem[] = generateMockActivities(50);
        
        setActivities(mockActivities);
        setTotalPages(Math.ceil(mockActivities.length / itemsPerPage));
      } catch (err) {
        setError('Failed to load activity history');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivityHistory();
  }, [userId]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'login':
        return <LoginIcon color="primary" />;
      case 'logout':
        return <LogoutIcon color="action" />;
      case 'security':
        return <SecurityIcon color="error" />;
      case 'profile':
        return <EditIcon color="secondary" />;
      case 'email':
        return <EmailIcon color="info" />;
      case 'connection':
        return <PersonAddIcon color="success" />;
      case 'payment':
        return <PaymentIcon color="primary" />;
      case 'document':
        return <DownloadIcon color="action" />;
      default:
        return <InfoIcon color="disabled" />;
    }
  };

  const getActivityTypeLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'login':
        return 'Login';
      case 'logout':
        return 'Logout';
      case 'security':
        return 'Security';
      case 'profile':
        return 'Profile';
      case 'email':
        return 'Email';
      case 'connection':
        return 'Connection';
      case 'payment':
        return 'Payment';
      case 'document':
        return 'Document';
      default:
        return 'Other';
    }
  };

  const getActivityTypeColor = (type: ActivityItem['type']): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (type) {
      case 'login':
        return 'primary';
      case 'logout':
        return 'default';
      case 'security':
        return 'error';
      case 'profile':
        return 'secondary';
      case 'email':
        return 'info';
      case 'connection':
        return 'success';
      case 'payment':
        return 'primary';
      case 'document':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Generate mock activity data
  const generateMockActivities = (count: number): ActivityItem[] => {
    const types: ActivityItem['type'][] = [
      'login', 'logout', 'security', 'profile', 'email', 'connection', 'payment', 'document', 'other'
    ];
    
    const descriptions = {
      login: ['Logged in successfully', 'New device login', 'Login from new location'],
      logout: ['Logged out', 'Session expired', 'Automatic logout due to inactivity'],
      security: ['Password changed', 'Two-factor authentication enabled', 'Security settings updated'],
      profile: ['Profile information updated', 'Profile picture changed', 'Account settings modified'],
      email: ['Email address verified', 'Email preferences updated', 'Notification email sent'],
      connection: ['New connection request sent', 'Connection request accepted', 'Connection removed'],
      payment: ['Subscription payment processed', 'Payment method added', 'Invoice generated'],
      document: ['Document uploaded', 'Document signed', 'Document shared'],
      other: ['Account created', 'Feedback submitted', 'Support ticket opened']
    };
    
    const devices = ['Chrome on Windows', 'Safari on macOS', 'Firefox on Windows', 'Chrome on Android', 'Safari on iOS'];
    const locations = ['New York, USA', 'London, UK', 'Tokyo, Japan', 'Sydney, Australia', 'Berlin, Germany'];
    
    const activities: ActivityItem[] = [];
    
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const typeDescriptions = descriptions[type];
      const description = typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
      
      // Generate a random date within the last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      activities.push({
        id: `activity-${i}`,
        type,
        description,
        timestamp: date.toISOString(),
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        device: devices[Math.floor(Math.random() * devices.length)],
        location: locations[Math.floor(Math.random() * locations.length)]
      });
    }
    
    // Sort by timestamp (newest first)
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Get paginated activities
  const getPaginatedActivities = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return activities.slice(startIndex, endIndex);
  };

  if (isLoading && activities.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Activity History
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <List>
          {getPaginatedActivities().map((activity, index) => (
            <React.Fragment key={activity.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  <Tooltip title="View Details">
                    <IconButton edge="end" aria-label="details">
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemIcon>
                  {getActivityIcon(activity.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      {activity.description}
                      <Chip 
                        label={getActivityTypeLabel(activity.type)} 
                        color={getActivityTypeColor(activity.type)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {new Date(activity.timestamp).toLocaleString()}
                      </Typography>
                      {!isMobile && activity.device && activity.ipAddress && (
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          {activity.device} • IP: {activity.ipAddress}
                          {activity.location && ` • ${activity.location}`}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={handlePageChange} 
          color="primary" 
        />
      </Box>
    </Box>
  );
};

export default ActivityHistoryList; 