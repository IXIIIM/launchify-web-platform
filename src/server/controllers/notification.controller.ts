import { Request, Response } from 'express';
import { NotificationService } from '../services/notifications/NotificationService';
import { AuthRequest } from '../middleware/auth';

export class NotificationController {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Get notifications for the authenticated user
   */
  getNotifications = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const includeRead = req.query.includeRead === 'true';

      const result = await this.notificationService.getNotifications(userId, page, limit, includeRead);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return res.status(500).json({ error: 'Failed to get notifications' });
    }
  };

  /**
   * Mark a notification as read
   */
  markAsRead = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { notificationId } = req.params;
      if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID is required' });
      }

      const result = await this.notificationService.markAsRead(notificationId, userId);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      if (error instanceof Error && error.message.includes('Notification not found')) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: 'Unauthorized to mark this notification as read' });
      }
      
      return res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  };

  /**
   * Mark all notifications as read for the authenticated user
   */
  markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await this.notificationService.markAllAsRead(userId);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  };

  /**
   * Delete a notification
   */
  deleteNotification = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { notificationId } = req.params;
      if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID is required' });
      }

      const result = await this.notificationService.deleteNotification(notificationId, userId);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error deleting notification:', error);
      
      if (error instanceof Error && error.message.includes('Notification not found')) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: 'Unauthorized to delete this notification' });
      }
      
      return res.status(500).json({ error: 'Failed to delete notification' });
    }
  };

  /**
   * Get unread notification count for the authenticated user
   */
  getUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await this.notificationService.getUnreadCount(userId);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return res.status(500).json({ error: 'Failed to get unread notification count' });
    }
  };
} 