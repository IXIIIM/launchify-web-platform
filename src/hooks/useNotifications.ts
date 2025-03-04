import { useState, useEffect, useCallback } from 'react';
import NotificationService, { Notification as AppNotification, NotificationPreferences } from '../services/NotificationService';
import { NOTIFICATION_REFRESH_INTERVAL } from '../constants';

interface UseNotificationsProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

interface UseNotificationsReturn {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  getNotifications: () => Promise<void>;
  getNotificationPreferences: () => Promise<NotificationPreferences>;
  updateNotificationPreferences: (preferences: NotificationPreferences) => Promise<void>;
}

export const useNotifications = ({
  autoRefresh = false,
  refreshInterval = NOTIFICATION_REFRESH_INTERVAL,
  onSuccess,
  onError
}: UseNotificationsProps = {}): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // For development, use mock data
      const data = NotificationService.getMockNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
      onSuccess?.('Notifications loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      onSuccess?.('Notification marked as read');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onSuccess, onError]);

  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
      onSuccess?.('All notifications marked as read');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onSuccess, onError]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await NotificationService.deleteNotification(id);
      const updatedNotifications = notifications.filter(notification => notification.id !== id);
      setNotifications(updatedNotifications);
      
      // Update unread count if the deleted notification was unread
      const wasUnread = notifications.find(n => n.id === id && !n.isRead);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      onSuccess?.('Notification deleted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [notifications, onSuccess, onError]);

  const deleteAllNotifications = useCallback(async () => {
    try {
      await NotificationService.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      onSuccess?.('All notifications deleted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete all notifications';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onSuccess, onError]);

  const getNotificationPreferences = useCallback(async () => {
    try {
      return await NotificationService.getNotificationPreferences();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get notification preferences';
      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    }
  }, [onError]);

  const updateNotificationPreferences = useCallback(async (preferences: NotificationPreferences) => {
    try {
      await NotificationService.updateNotificationPreferences(preferences);
      onSuccess?.('Notification preferences updated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notification preferences';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onSuccess, onError]);

  // Initial load
  useEffect(() => {
    getNotifications();
  }, [getNotifications]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      getNotifications();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, getNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    getNotifications,
    getNotificationPreferences,
    updateNotificationPreferences
  };
}; 