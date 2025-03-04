import { API_BASE_URL } from '../constants';
import { getAuthToken } from '../utils/auth';
import { useNotification, Notification } from '../context/NotificationContext';

export type NotificationType = 
  | 'document_created'
  | 'document_updated'
  | 'document_shared'
  | 'document_deleted'
  | 'signature_requested'
  | 'signature_completed'
  | 'signature_declined'
  | 'signature_expired'
  | 'message_received'
  | 'message_read'
  | 'verification_requested'
  | 'verification_approved'
  | 'verification_rejected'
  | 'payment_received'
  | 'payment_sent'
  | 'payment_failed'
  | 'system_announcement';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  email: {
    documents: boolean;
    signatures: boolean;
    messages: boolean;
    verification: boolean;
    payments: boolean;
    system: boolean;
  };
  push: {
    documents: boolean;
    signatures: boolean;
    messages: boolean;
    verification: boolean;
    payments: boolean;
    system: boolean;
  };
  inApp: {
    documents: boolean;
    signatures: boolean;
    messages: boolean;
    verification: boolean;
    payments: boolean;
    system: boolean;
  };
}

class NotificationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/notifications`;
  }

  private async getHeaders() {
    const token = await getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getNotifications(): Promise<Notification[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/unread/count`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unread count: ${response.statusText}`);
      }

      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/${id}/read`, {
        method: 'PUT',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/read-all`, {
        method: 'PUT',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async deleteAllNotifications(): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/delete-all`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to delete all notifications: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/preferences`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notification preferences: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/preferences`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error(`Failed to update notification preferences: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // For development purposes only
  getMockNotifications(): Notification[] {
    const now = new Date();
    return [
      {
        id: '1',
        userId: 'user123',
        title: 'Document Created',
        message: 'Your NDA document has been created successfully.',
        type: 'document_created',
        isRead: false,
        link: '/documents/doc123',
        createdAt: new Date(now.getTime() - 5 * 60000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 60000).toISOString()
      },
      {
        id: '2',
        userId: 'user123',
        title: 'Signature Request',
        message: 'John Doe has requested your signature on the Investment Agreement.',
        type: 'signature_requested',
        isRead: false,
        link: '/documents/signatures/sig456',
        createdAt: new Date(now.getTime() - 30 * 60000).toISOString(),
        updatedAt: new Date(now.getTime() - 30 * 60000).toISOString()
      },
      {
        id: '3',
        userId: 'user123',
        title: 'New Message',
        message: 'You have a new message from Sarah Smith.',
        type: 'message_received',
        isRead: true,
        link: '/messages/msg789',
        createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * 3600000).toISOString()
      },
      {
        id: '4',
        userId: 'user123',
        title: 'Verification Approved',
        message: 'Your identity verification has been approved.',
        type: 'verification_approved',
        isRead: true,
        link: '/verification/ver321',
        createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 86400000).toISOString()
      },
      {
        id: '5',
        userId: 'user123',
        title: 'Payment Received',
        message: 'You have received a payment of $5,000 for Project Alpha.',
        type: 'payment_received',
        isRead: false,
        link: '/payments/pay654',
        createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * 86400000).toISOString()
      }
    ];
  }
}

export default new NotificationService();

// Type for notification options without the 'type' field
export type NotificationOptions = Omit<Omit<Notification, 'id'>, 'type'>;

/**
 * Hook that provides notification service functions
 * This must be used within a component that is a child of NotificationProvider
 */
export const useNotificationService = () => {
  const { addNotification, removeNotification, clearAllNotifications } = useNotification();

  /**
   * Show a success notification
   * @param message The notification message
   * @param options Additional notification options
   * @returns The notification ID
   */
  const showSuccess = (message: string, options?: NotificationOptions) => {
    return addNotification({
      message,
      type: 'success',
      ...options
    });
  };

  /**
   * Show an error notification
   * @param message The notification message
   * @param options Additional notification options
   * @returns The notification ID
   */
  const showError = (message: string, options?: NotificationOptions) => {
    return addNotification({
      message,
      type: 'error',
      ...options
    });
  };

  /**
   * Show a warning notification
   * @param message The notification message
   * @param options Additional notification options
   * @returns The notification ID
   */
  const showWarning = (message: string, options?: NotificationOptions) => {
    return addNotification({
      message,
      type: 'warning',
      ...options
    });
  };

  /**
   * Show an info notification
   * @param message The notification message
   * @param options Additional notification options
   * @returns The notification ID
   */
  const showInfo = (message: string, options?: NotificationOptions) => {
    return addNotification({
      message,
      type: 'info',
      ...options
    });
  };

  /**
   * Show a notification for API errors
   * Attempts to extract a meaningful error message from various API error formats
   * @param error The error object from the API
   * @param fallbackMessage A fallback message if no error message can be extracted
   * @param options Additional notification options
   * @returns The notification ID
   */
  const showApiError = (
    error: any, 
    fallbackMessage: string = 'An unexpected error occurred', 
    options?: NotificationOptions
  ) => {
    let errorMessage = fallbackMessage;

    // Try to extract error message from different error formats
    if (error) {
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (error.response) {
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          }
        } else if (error.response.status) {
          // Handle common HTTP error codes
          switch (error.response.status) {
            case 400:
              errorMessage = 'Bad request';
              break;
            case 401:
              errorMessage = 'Unauthorized - Please log in again';
              break;
            case 403:
              errorMessage = 'Forbidden - You do not have permission to access this resource';
              break;
            case 404:
              errorMessage = 'Resource not found';
              break;
            case 500:
              errorMessage = 'Server error - Please try again later';
              break;
            default:
              errorMessage = `Error ${error.response.status}: ${fallbackMessage}`;
          }
        }
      }
    }

    return showError(errorMessage, {
      title: 'Error',
      ...options
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showApiError,
    removeNotification,
    clearAllNotifications
  };
}; 