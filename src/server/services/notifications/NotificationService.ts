// src/services/notifications/NotificationService.ts
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  userId: string;
  type: 'match' | 'message' | 'system';
  title: string;
  content: string;
  read: boolean;
  createdAt: Date;
  data?: Record<string, any>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  connected: boolean;
}

export class NotificationService {
  private socket: Socket | null = null;
  private pushEnabled = false;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private deviceToken: string | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 5000;
  private readonly initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    connected: false
  };
  
  private state$ = new BehaviorSubject<NotificationState>(this.initialState);
  
  // Expose observable for components to subscribe to
  public get state(): Observable<NotificationState> {
    return this.state$.asObservable();
  }

  // Initialize the notification service
  async initialize(userId: string, token: string): Promise<void> {
    // Close existing connection if any
    this.disconnect();
    
    // Initialize WebSocket connection with optimized parameters
    this.socket = io(process.env.WEBSOCKET_URL || 'wss://api.launchify.app', {
      auth: { token },
      query: { userId },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectInterval,
      timeout: 10000,
      transports: ['websocket'], // Skip polling for efficiency
      upgrade: false, // Prevent transport upgrades
      path: '/notifications',
      forceNew: true
    });

    // Connection management
    this.socket.on('connect', this.handleConnect);
    this.socket.on('disconnect', this.handleDisconnect);
    this.socket.on('error', this.handleError);
    this.socket.on('reconnect_attempt', this.handleReconnectAttempt);
    this.socket.on('reconnect_failed', this.handleReconnectFailed);

    // Notification events
    this.socket.on('notification', this.handleNotification);
    this.socket.on('read_receipt', this.handleReadReceipt);
    this.socket.on('notification_count', this.handleNotificationCount);

    // Register for push notifications if possible
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      await this.registerServiceWorker();
    }

    // Load initial notifications from REST API
    await this.fetchInitialNotifications(userId, token);
  }

  // Clean up and disconnect WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.off();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.state$.next({
      ...this.state$.value,
      connected: false
    });
  }

  // Send read receipt for notification
  markAsRead(notificationId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected, using fallback REST API call');
      this.markAsReadViaREST(notificationId);
      return;
    }

    this.socket.emit('mark_read', { id: notificationId }, (response: any) => {
      if (response.success) {
        this.updateLocalReadStatus(notificationId);
      } else {
        console.error('Failed to mark notification as read:', response.error);
        // Fallback to REST API
        this.markAsReadViaREST(notificationId);
      }
    });
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket not connected, using fallback REST API call');
      this.markAllAsReadViaREST();
      return;
    }

    this.socket.emit('mark_all_read', {}, (response: any) => {
      if (response.success) {
        const updatedNotifications = this.state$.value.notifications.map(
          notification => ({ ...notification, read: true })
        );
        
        this.state$.next({
          notifications: updatedNotifications,
          unreadCount: 0,
          connected: this.state$.value.connected
        });
      } else {
        console.error('Failed to mark all notifications as read:', response.error);
        // Fallback to REST API
        this.markAllAsReadViaREST();
      }
    });
  }

  // Update push notification preferences
  async updatePushPreferences(enabled: boolean): Promise<boolean> {
    this.pushEnabled = enabled;
    
    if (enabled) {
      if (!this.swRegistration) {
        await this.registerServiceWorker();
      }
      
      if (this.swRegistration) {
        return this.subscribeToPushNotifications();
      }
      return false;
    } else {
      return this.unsubscribeFromPushNotifications();
    }
  }

  // Private methods
  private async fetchInitialNotifications(userId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${process.env.API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.state$.next({
          notifications: data.notifications,
          unreadCount: data.unreadCount,
          connected: this.state$.value.connected
        });
      } else {
        console.error('Failed to fetch notifications:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }

  private markAsReadViaREST(notificationId: string): void {
    // Optimistic UI update
    this.updateLocalReadStatus(notificationId);
    
    // REST API fallback
    fetch(`${process.env.API_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).catch(error => {
      console.error('REST API fallback for mark as read failed:', error);
    });
  }

  private markAllAsReadViaREST(): void {
    // Optimistic UI update
    const updatedNotifications = this.state$.value.notifications.map(
      notification => ({ ...notification, read: true })
    );
    
    this.state$.next({
      notifications: updatedNotifications,
      unreadCount: 0,
      connected: this.state$.value.connected
    });
    
    // REST API fallback
    fetch(`${process.env.API_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).catch(error => {
      console.error('REST API fallback for mark all read failed:', error);
    });
  }

  private updateLocalReadStatus(notificationId: string): void {
    const updatedNotifications = this.state$.value.notifications.map(notification => 
      notification.id === notificationId 
      ? { ...notification, read: true } 
      : notification
    );
    
    const unreadCount = updatedNotifications.filter(n => !n.read).length;
    
    this.state$.next({
      notifications: updatedNotifications,
      unreadCount,
      connected: this.state$.value.connected
    });
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      this.swRegistration = await navigator.serviceWorker.register('/notification-sw.js');
      
      // Check existing subscription
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        this.deviceToken = JSON.stringify(subscription);
        this.pushEnabled = true;
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  private async subscribeToPushNotifications(): Promise<boolean> {
    if (!this.swRegistration) return false;
    
    try {
      const applicationServerKey = this.urlBase64ToUint8Array(
        process.env.VAPID_PUBLIC_KEY || ''
      );
      
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      
      this.deviceToken = JSON.stringify(subscription);
      
      // Send subscription to server
      await this.saveSubscriptionToServer(this.deviceToken);
      return true;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return false;
    }
  }

  private async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.swRegistration) return true;
    
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify server about unsubscription
        await this.deleteSubscriptionFromServer();
      }
      
      this.deviceToken = null;
      return true;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      return false;
    }
  }

  private async saveSubscriptionToServer(subscription: string): Promise<void> {
    await fetch(`${process.env.API_URL}/notifications/push-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ subscription })
    });
  }

  private async deleteSubscriptionFromServer(): Promise<void> {
    await fetch(`${process.env.API_URL}/notifications/push-subscription`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  // Event handlers
  private handleConnect = (): void => {
    this.reconnectAttempts = 0;
    this.state$.next({
      ...this.state$.value,
      connected: true
    });
  };

  private handleDisconnect = (): void => {
    this.state$.next({
      ...this.state$.value,
      connected: false
    });
  };

  private handleError = (error: Error): void => {
    console.error('WebSocket error:', error);
  };

  private handleReconnectAttempt = (attemptNumber: number): void => {
    this.reconnectAttempts = attemptNumber;
    console.log(`Attempting to reconnect: ${attemptNumber}/${this.maxReconnectAttempts}`);
  };

  private handleReconnectFailed = (): void => {
    console.error('WebSocket reconnection failed after maximum attempts');
  };

  private handleNotification = (notification: Notification): void => {
    // Update state with new notification
    const currentNotifications = this.state$.value.notifications;
    const updatedNotifications = [notification, ...currentNotifications];
    
    this.state$.next({
      notifications: updatedNotifications,
      unreadCount: this.state$.value.unreadCount + 1,
      connected: this.state$.value.connected
    });
  };

  private handleReadReceipt = (data: { id: string }): void => {
    this.updateLocalReadStatus(data.id);
  };

  private handleNotificationCount = (data: { count: number }): void => {
    this.state$.next({
      ...this.state$.value,
      unreadCount: data.count
    });
  };
}

// Create singleton instance
export const notificationService = new NotificationService();