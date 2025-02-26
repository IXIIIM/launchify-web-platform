import express from 'express';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  testNotification
} from '../controllers/notifications.controller';
import { authenticateToken } from '../middleware/auth';
import { checkFeatureAccess } from '../middleware/usageLimit';

const router = express.Router();

// Notification preferences routes
router.get(
  '/preferences',
  authenticateToken,
  checkFeatureAccess('canAccessNotificationSettings'),
  getNotificationPreferences
);

router.put(
  '/preferences',
  authenticateToken,
  checkFeatureAccess('canAccessNotificationSettings'),
  updateNotificationPreferences
);

// Test notification route
router.post(
  '/test',
  authenticateToken,
  checkFeatureAccess('canTestNotifications'),
  testNotification
);

export default router;