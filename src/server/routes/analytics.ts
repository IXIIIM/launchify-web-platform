import express from 'express';
import {
  getPlatformAnalytics,
  getUserAnalytics,
  generateReport,
  invalidateCache,
  getSubscriptionMetrics,
  generateSubscriptionReport
} from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth';
import { checkUsageLimit } from '../middleware/usageLimit';
import { checkFeatureAccess } from '../middleware/usageLimit';
import { roleAuth } from '../middleware/roleAuth';
import { checkRoleAccess } from '../middleware/roleAuth';
import { cacheMiddleware } from '../middleware/cache';

const router = express.Router();

// Platform-wide analytics (admin only)
router.get('/platform',
  authenticateToken,
  roleAuth(['admin']),
  cacheMiddleware('platform-analytics', 3600),
  getPlatformAnalytics
);

// User-specific analytics
router.get('/user',
  authenticateToken, 
  checkFeatureAccess('analytics'),
  cacheMiddleware('user-analytics', 1800, (req) => `${req.user.id}-${req.query.timeframe || '1m'}`),
  getUserAnalytics
);

// Subscription analytics
router.get('/subscription-metrics',
  authenticateToken,
  checkRoleAccess(['admin', 'manager', 'analyst']),
  cacheMiddleware('subscription-analytics', 3600, (req) => {
    const { timeframe, userTypes, subscriptionTiers, includeTrials } = req.query;
    return `subscription-metrics-${timeframe || '1m'}-${userTypes || 'all'}-${subscriptionTiers || 'all'}-${includeTrials || 'true'}`;
  }),
  getSubscriptionMetrics
);

// Generate reports
router.post('/report',
  authenticateToken,
  checkFeatureAccess('reports'),
  generateReport
);

// Generate subscription reports
router.post('/subscription-report',
  authenticateToken,
  checkRoleAccess(['admin', 'manager', 'analyst']),
  generateSubscriptionReport
);

// Cache invalidation (admin only)
router.post('/cache/invalidate',
  authenticateToken,
  roleAuth(['admin']),
  invalidateCache
);

export default router;