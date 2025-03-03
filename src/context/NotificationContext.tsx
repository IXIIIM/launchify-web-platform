import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Snackbar, 
  Alert, 
  AlertProps, 
  AlertColor, 
  SnackbarOrigin,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// Notification types
export interface Notification {
  id: string;
  message: string;
  type: AlertColor;
  title?: string;
  autoHideDuration?: number;
  showIcon?: boolean;
  anchorOrigin?: SnackbarOrigin;
  action?: React.ReactNode;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
  defaultAutoHideDuration?: number;
  defaultAnchorOrigin?: SnackbarOrigin;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  defaultAutoHideDuration = 5000,
  defaultAnchorOrigin = { vertical: 'top', horizontal: 'right' }
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id'>): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newNotification: Notification = {
      id,
      ...notification,
      type: notification.type || 'info',
      autoHideDuration: notification.autoHideDuration || defaultAutoHideDuration,
      anchorOrigin: notification.anchorOrigin || defaultAnchorOrigin,
      showIcon: notification.showIcon !== undefined ? notification.showIcon : true
    };
    
    setNotifications(prev => {
      // If we have reached the max number of notifications, remove the oldest one
      const updatedNotifications = prev.length >= maxNotifications 
        ? [...prev.slice(1), newNotification] 
        : [...prev, newNotification];
      
      return updatedNotifications;
    });
    
    return id;
  }, [defaultAutoHideDuration, defaultAnchorOrigin, maxNotifications]);

  // Remove a notification by ID
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Auto-remove notifications after their duration
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    notifications.forEach(notification => {
      if (notification.autoHideDuration) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.autoHideDuration);
        
        timers.push(timer);
      }
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications
      }}
    >
      {children}
      
      {/* Render all active notifications */}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.autoHideDuration}
          onClose={() => removeNotification(notification.id)}
          anchorOrigin={notification.anchorOrigin}
          sx={{
            // Stack notifications with a slight offset
            top: notification.anchorOrigin?.vertical === 'top' 
              ? `${(index * 10) + 24}px !important` 
              : undefined,
            bottom: notification.anchorOrigin?.vertical === 'bottom' 
              ? `${(index * 10) + 24}px !important` 
              : undefined,
          }}
        >
          <Alert
            severity={notification.type}
            variant="filled"
            icon={notification.showIcon ? undefined : false}
            action={
              <>
                {notification.action}
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={() => removeNotification(notification.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            }
            sx={{ width: '100%', boxShadow: 2 }}
          >
            {notification.title && (
              <Typography variant="subtitle2" component="div" fontWeight="bold">
                {notification.title}
              </Typography>
            )}
            <Typography variant="body2">
              {notification.message}
            </Typography>
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 