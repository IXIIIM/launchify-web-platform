import { WebSocketService } from './WebSocketService';
import { UserRole } from '../../middleware/roleAuth';

/**
 * Admin-specific WebSocket service for real-time admin dashboard updates
 */
export class AdminWebSocketService {
  private wsService: WebSocketService;
  
  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
  }

  /**
   * Send a real-time notification about a new role access attempt
   */
  notifyRoleAccessAttempt(data: {
    id: string;
    userId: string;
    userRole: string;
    requiredRole: string;
    path: string;
    success: boolean;
    timestamp: Date;
    ipAddress?: string;
  }) {
    // Broadcast to all admin users in the admin channel
    this.wsService.sendToRoom('admin:role-access', 'role-access-attempt', {
      type: 'role-access-attempt',
      data
    });
  }

  /**
   * Send a real-time notification about a new verification request
   */
  notifyVerificationRequest(data: {
    id: string;
    userId: string;
    status: string;
    timestamp: Date;
  }) {
    this.wsService.sendToRoom('admin:verification', 'verification-request', {
      type: 'verification-request',
      data
    });
  }

  /**
   * Send a real-time notification about a security event
   */
  notifySecurityEvent(data: {
    id: string;
    eventType: string;
    severity: string;
    message: string;
    timestamp: Date;
  }) {
    this.wsService.sendToRoom('admin:security', 'security-event', {
      type: 'security-event',
      data
    });
  }

  /**
   * Send a real-time update about subscription analytics
   */
  notifySubscriptionUpdate(data: {
    type: 'new' | 'canceled' | 'upgraded' | 'downgraded';
    count: number;
    timestamp: Date;
  }) {
    this.wsService.sendToRoom('admin:analytics', 'subscription-update', {
      type: 'subscription-update',
      data
    });
  }

  /**
   * Send a real-time notification about a permission change
   */
  notifyPermissionChange(data: {
    userId: string;
    oldRole?: string;
    newRole: string;
    changedBy: string;
    timestamp: Date;
  }) {
    this.wsService.sendToRoom('admin:permissions', 'permission-change', {
      type: 'permission-change',
      data
    });
  }

  /**
   * Send a dashboard stats update to all admins
   */
  updateDashboardStats(data: {
    activeUsers: number;
    pendingVerifications: number;
    securityAlerts: number;
    recentTransactions: number;
    timestamp: Date;
  }) {
    this.wsService.sendToRoom('admin:dashboard', 'dashboard-stats', {
      type: 'dashboard-stats',
      data
    });
  }

  /**
   * Add a user to the appropriate admin rooms based on their role
   */
  subscribeUserToAdminChannels(userId: string, userRole: string) {
    // Create a socket room ID for this specific user
    const userSocketRoom = `user:${userId}`;
    
    // Subscribe to channels based on role hierarchy
    switch(userRole) {
      case UserRole.SUPER_ADMIN:
        this.wsService.addToRoom(userSocketRoom, 'admin:permissions');
        // Fall through to include all ADMIN rooms
        
      case UserRole.ADMIN:
        this.wsService.addToRoom(userSocketRoom, 'admin:security');
        this.wsService.addToRoom(userSocketRoom, 'admin:analytics');
        this.wsService.addToRoom(userSocketRoom, 'admin:dashboard');
        this.wsService.addToRoom(userSocketRoom, 'admin:role-access');
        // Fall through to include all MODERATOR rooms
        
      case UserRole.MODERATOR:
        this.wsService.addToRoom(userSocketRoom, 'admin:verification');
        break;
        
      default:
        // Regular users don't get subscribed to admin channels
        break;
    }
  }
} 