import express from 'express';
import {
  getSubscriptionMetrics,
  generateSubscriptionReport
} from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth';
import { checkFeatureAccess } from '../middleware/usageLimit';

const router = express.Router();

// Analytics routes
router.get(
  '/subscription-metrics',
  authenticateToken,
  checkFeatureAccess('canAccessAnalytics'),
  getSubscriptionMetrics
);

router.post(
  '/subscription-report',
  authenticateToken,
  checkFeatureAccess('canAccessAnalytics'),
  generateSubscriptionReport
);

export default router;