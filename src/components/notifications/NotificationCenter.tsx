import React, { useState, useEffect, useRef } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Divider,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Description as DocumentIcon,
  Assignment as SignatureIcon,
  Message as MessageIcon,
  Verified as VerifiedIcon,
  Payment as PaymentIcon,
  Announcement as AnnouncementIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification, NotificationType } from '../../services/NotificationService';
import useSafeNavigation from '../../hooks/useSafeNavigation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `notification-tab-${index}`,
    'aria-controls': `notification-tabpanel-${index}`,
  };
};

const NotificationCenter: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  
  // Use our safe navigation hook instead of useNavigate directly
  const navigate = useSafeNavigation();
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotifications
  } = useNotifications();

  // Filter notifications based on tab
  const filteredNotifications = tabValue === 0 
    ? notifications 
    : notifications.filter(notification => !notification.isRead);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate to the related entity if available
    if (notification.link) {
      navigate(notification.link);
      handleClose();
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleDeleteNotification = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    deleteNotification(id);
  };

  const handleSettingsClick = () => {
    navigate('/settings/notifications');
    handleClose();
  };

  const getNotificationIcon = (type: NotificationType) => {
    if (type.includes('document')) {
      return <DocumentIcon />;
    } else if (type.includes('signature')) {
      return <SignatureIcon />;
    } else if (type.includes('message')) {
      return <MessageIcon />;
    } else if (type.includes('verification')) {
      return <VerifiedIcon />;
    } else if (type.includes('payment')) {
      return <PaymentIcon />;
    } else {
      return <AnnouncementIcon />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    if (type.includes('document')) {
      return '#2196f3'; // blue
    } else if (type.includes('signature')) {
      return '#4caf50'; // green
    } else if (type.includes('message')) {
      return '#9c27b0'; // purple
    } else if (type.includes('verification')) {
      return '#ff9800'; // orange
    } else if (type.includes('payment')) {
      return '#f44336'; // red
    } else {
      return '#757575'; // grey
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  // Effect to refresh notifications when the popover is opened
  useEffect(() => {
    if (open) {
      getNotifications();
    }
  }, [open, getNotifications]);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          ref={notificationButtonRef}
          aria-describedby={id}
          onClick={handleClick}
          size="large"
          color="inherit"
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 500,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="notification tabs"
            sx={{ flexGrow: 1 }}
          >
            <Tab label="All" {...a11yProps(0)} />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Unread
                  {unreadCount > 0 && (
                    <Badge 
                      badgeContent={unreadCount} 
                      color="error" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              } 
              {...a11yProps(1)} 
            />
          </Tabs>
          
          <Box sx={{ display: 'flex' }}>
            {unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <IconButton onClick={handleMarkAllAsRead} size="small">
                  <MarkReadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Notification settings">
              <IconButton onClick={handleSettingsClick} size="small">
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
          <TabPanel value={tabValue} index={0}>
            {renderNotificationList(filteredNotifications)}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {renderNotificationList(filteredNotifications)}
          </TabPanel>
        </Box>
        
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            onClick={() => {
              navigate('/notifications');
              handleClose();
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Popover>
    </>
  );

  function renderNotificationList(notificationList: Notification[]) {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="error">
            Failed to load notifications
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => getNotifications()}
            sx={{ mt: 1 }}
          >
            Retry
          </Button>
        </Box>
      );
    }

    if (notificationList.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            {tabValue === 0 ? 'No notifications' : 'No unread notifications'}
          </Typography>
        </Box>
      );
    }

    return (
      <List sx={{ p: 0 }}>
        {notificationList.map((notification, index) => (
          <React.Fragment key={notification.id}>
            <ListItem 
              alignItems="flex-start"
              onClick={() => handleNotificationClick(notification)}
              sx={{
                backgroundColor: notification.isRead ? 'inherit' : 'action.hover',
                '&:hover': {
                  backgroundColor: 'action.selected',
                },
                cursor: 'pointer'
              }}
              secondaryAction={
                <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  onClick={(e) => handleDeleteNotification(e, notification.id)}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: getNotificationColor(notification.type) }}>
                  {getNotificationIcon(notification.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle2"
                    color="textPrimary"
                    sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                  >
                    {notification.title}
                  </Typography>
                }
                secondary={
                  <>
                    <Typography
                      variant="body2"
                      color="textPrimary"
                      component="span"
                      sx={{ display: 'block' }}
                    >
                      {notification.message}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      component="span"
                    >
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </Typography>
                  </>
                }
              />
            </ListItem>
            {index < notificationList.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    );
  }
};

export default NotificationCenter;