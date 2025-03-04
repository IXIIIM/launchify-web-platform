import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth';
import { container } from '../container';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const notificationController = container.resolve<NotificationController>('notificationController');

// Rate limiting for notification endpoints
const notificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all notification routes
router.use(notificationRateLimit);

// Get all notifications for the authenticated user
router.get('/', authMiddleware, notificationController.getNotifications);

// Mark a notification as read
router.put('/:notificationId/read', authMiddleware, notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', authMiddleware, notificationController.markAllAsRead);

// Delete a notification
router.delete('/:notificationId', authMiddleware, notificationController.deleteNotification);

// Get unread notification count
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);

export default router;