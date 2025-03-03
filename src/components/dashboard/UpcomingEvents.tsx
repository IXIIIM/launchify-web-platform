import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Typography 
} from '@mui/material';
import {
  Event as EventIcon,
  VideoCall as VideoCallIcon,
  Payment as PaymentIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

// Mock data for development
const MOCK_EVENTS = [
  { 
    id: '1', 
    title: 'Meeting with John Doe', 
    type: 'meeting', 
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
    description: 'Discuss investment opportunity'
  },
  { 
    id: '2', 
    title: 'Video Call with Jane Smith', 
    type: 'call', 
    date: new Date(Date.now() + 1000 * 60 * 60 * 3), // 3 hours from now
    description: 'Project update call'
  },
  { 
    id: '3', 
    title: 'Subscription Renewal', 
    type: 'payment', 
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
    description: 'Premium plan renewal'
  },
  { 
    id: '4', 
    title: 'Document Deadline', 
    type: 'document', 
    date: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day from now
    description: 'Sign investment contract'
  },
];

interface UpcomingEventsProps {
  title?: string;
  maxItems?: number;
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ 
  title = 'Upcoming Events', 
  maxItems = 4 
}) => {
  // Sort events by date (closest first)
  const sortedEvents = [...MOCK_EVENTS].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Limit to maxItems
  const displayEvents = sortedEvents.slice(0, maxItems);
  
  // Get icon based on event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <EventIcon color="primary" />;
      case 'call':
        return <VideoCallIcon color="info" />;
      case 'payment':
        return <PaymentIcon color="success" />;
      case 'document':
        return <AssignmentIcon color="warning" />;
      default:
        return <ScheduleIcon color="action" />;
    }
  };

  return (
    <Card>
      <CardHeader title={title} />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        {displayEvents.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No upcoming events
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {displayEvents.map((event) => (
              <React.Fragment key={event.id}>
                <ListItem>
                  <ListItemIcon>
                    {getEventIcon(event.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={event.title}
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {event.description}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {formatDistanceToNow(event.date, { addSuffix: true })}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents; 