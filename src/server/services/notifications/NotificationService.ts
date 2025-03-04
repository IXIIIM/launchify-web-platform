// src/services/notifications/NotificationService.ts
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { PrismaClient } from '@prisma/client';
import { WebSocketService } from '../websocket/WebSocketService';
import { EmailService } from '../email/EmailService';

const prisma = new PrismaClient();

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

export enum NotificationType {
  MATCH = 'match',
  CHAT = 'chat',
  DOCUMENT = 'document',
  ESCROW = 'escrow',
  VERIFICATION = 'verification',
  SYSTEM = 'system'
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
  
  private wsService: WebSocketService;
  private emailService: EmailService;

  constructor(wsService: WebSocketService, emailService: EmailService) {
    this.wsService = wsService;
    this.emailService = emailService;
  }

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

  /**
   * Create a notification
   */
  async createNotification(
    userId: string,
    type: string,
    content: string,
    metadata: Record<string, any> = {},
    sendRealTime: boolean = true,
    sendEmail: boolean = false
  ) {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          content,
          metadata,
          isRead: false
        }
      });

      // Send real-time notification via WebSocket
      if (sendRealTime) {
        this.wsService.sendToUser(userId, {
          type: 'NEW_NOTIFICATION',
          data: notification
        });
      }

      // Send email notification if requested
      if (sendEmail) {
        await this.sendEmailNotification(userId, type, content, metadata);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string, page = 1, limit = 20, includeRead = false) {
    try {
      const where: any = {
        userId
      };

      if (!includeRead) {
        where.isRead = false;
      }

      const [notifications, totalCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: {
            createdAt: 'desc'
          },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.notification.count({
          where
        })
      ]);

      return {
        notifications,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.userId !== userId) {
        throw new Error('Unauthorized to mark this notification as read');
      }

      return prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.userId !== userId) {
        throw new Error('Unauthorized to delete this notification');
      }

      await prisma.notification.delete({
        where: { id: notificationId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });

      return { count };
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      throw error;
    }
  }

  /**
   * Send a notification to multiple users
   */
  async notifyMultipleUsers(
    userIds: string[],
    type: string,
    content: string,
    metadata: Record<string, any> = {},
    sendRealTime: boolean = true,
    sendEmail: boolean = false
  ) {
    try {
      const notifications = await Promise.all(
        userIds.map(userId =>
          this.createNotification(userId, type, content, metadata, sendRealTime, sendEmail)
        )
      );

      return notifications;
    } catch (error) {
      console.error('Error notifying multiple users:', error);
      throw error;
    }
  }

  /**
   * Send an email notification
   */
  private async sendEmailNotification(
    userId: string,
    type: string,
    content: string,
    metadata: Record<string, any>
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      // Determine email template based on notification type
      let template = 'general-notification';
      let subject = 'New Notification from Launchify';

      switch (type) {
        case 'match_request':
          template = 'match-request';
          subject = 'New Match Request on Launchify';
          break;
        case 'match_accepted':
          template = 'match-accepted';
          subject = 'Your Match Request was Accepted';
          break;
        case 'new_message':
          template = 'new-message';
          subject = 'New Message on Launchify';
          break;
        case 'document_signature_required':
          template = 'document-signature';
          subject = 'Document Requires Your Signature';
          break;
        case 'escrow_funded':
          template = 'escrow-funded';
          subject = 'Escrow Account Funded';
          break;
        case 'milestone_completed':
          template = 'milestone-completed';
          subject = 'Milestone Completed';
          break;
        case 'verification_status':
          template = 'verification-status';
          subject = 'Verification Status Update';
          break;
      }

      // Send email
      await this.emailService.sendEmail({
        to: user.email,
        template,
        subject,
        data: {
          name: user.name || 'User',
          content,
          ...metadata
        }
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
      // Don't throw, just log the error to prevent notification creation failure
    }
  }

  /**
   * Create a match notification
   */
  async createMatchNotification(
    userId: string,
    matchId: string,
    otherUserName: string,
    action: 'request' | 'accepted' | 'rejected'
  ) {
    let content = '';
    let type = '';
    let metadata = { matchId };

    switch (action) {
      case 'request':
        content = `${otherUserName} has requested to match with you`;
        type = 'match_request';
        break;
      case 'accepted':
        content = `${otherUserName} has accepted your match request`;
        type = 'match_accepted';
        break;
      case 'rejected':
        content = `${otherUserName} has declined your match request`;
        type = 'match_rejected';
        break;
    }

    return this.createNotification(userId, type, content, metadata, true, true);
  }

  /**
   * Create a chat notification
   */
  async createChatNotification(
    userId: string,
    chatRoomId: string,
    senderName: string,
    messagePreview: string
  ) {
    const content = `New message from ${senderName}: ${messagePreview.substring(0, 50)}${
      messagePreview.length > 50 ? '...' : ''
    }`;
    const type = 'new_message';
    const metadata = { chatRoomId };

    return this.createNotification(userId, type, content, metadata, true, false);
  }

  /**
   * Create a document notification
   */
  async createDocumentNotification(
    userId: string,
    documentId: string,
    documentName: string,
    action: 'created' | 'signed' | 'signature_required'
  ) {
    let content = '';
    let type = '';
    let metadata = { documentId };
    let sendEmail = false;

    switch (action) {
      case 'created':
        content = `New document created: ${documentName}`;
        type = 'document_created';
        break;
      case 'signed':
        content = `Document has been signed: ${documentName}`;
        type = 'document_signed';
        break;
      case 'signature_required':
        content = `Your signature is required on document: ${documentName}`;
        type = 'document_signature_required';
        sendEmail = true;
        break;
    }

    return this.createNotification(userId, type, content, metadata, true, sendEmail);
  }

  /**
   * Create an escrow notification
   */
  async createEscrowNotification(
    userId: string,
    escrowId: string,
    amount: number,
    action: 'created' | 'funded' | 'milestone_completed' | 'funds_released'
  ) {
    let content = '';
    let type = '';
    let metadata = { escrowId, amount };
    let sendEmail = false;

    switch (action) {
      case 'created':
        content = `New escrow account created with amount $${amount.toLocaleString()}`;
        type = 'escrow_created';
        break;
      case 'funded':
        content = `Escrow account funded with $${amount.toLocaleString()}`;
        type = 'escrow_funded';
        sendEmail = true;
        break;
      case 'milestone_completed':
        content = `Milestone completed for $${amount.toLocaleString()}`;
        type = 'milestone_completed';
        sendEmail = true;
        break;
      case 'funds_released':
        content = `Funds released: $${amount.toLocaleString()}`;
        type = 'funds_released';
        sendEmail = true;
        break;
    }

    return this.createNotification(userId, type, content, metadata, true, sendEmail);
  }

  /**
   * Create a verification notification
   */
  async createVerificationNotification(
    userId: string,
    verificationId: string,
    level: string,
    status: 'submitted' | 'approved' | 'rejected' | 'info_requested'
  ) {
    let content = '';
    let type = '';
    let metadata = { verificationId, level };
    let sendEmail = true;

    switch (status) {
      case 'submitted':
        content = `Your verification request for ${level} has been submitted`;
        type = 'verification_submitted';
        break;
      case 'approved':
        content = `Your verification request for ${level} has been approved`;
        type = 'verification_approved';
        break;
      case 'rejected':
        content = `Your verification request for ${level} has been rejected`;
        type = 'verification_rejected';
        break;
      case 'info_requested':
        content = `Additional information requested for your ${level} verification`;
        type = 'verification_info_requested';
        break;
    }

    return this.createNotification(userId, type, content, metadata, true, sendEmail);
  }
}

// Create singleton instance
export const notificationService = new NotificationService();