import express from 'express';
import {
  getPlatformAnalytics,
  getUserAnalytics,
  generateReport,
  invalidateCache
} from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth';
import { checkFeatureAccess } from '../middleware/usageLimit';
import { cacheMiddleware, analyticsKey } from '../middleware/cache';

const router = express.Router();

// Platform-wide analytics (admin only)
router.get('/platform',
  authenticateToken,
  cacheMiddleware({
    key: analyticsKey,
    ttl: 300 // 5 minutes cache
  }),
  getPlatformAnalytics
);

// User-specific analytics
router.get('/user', 
  authenticateToken, 
  checkFeatureAccess('canAccessAnalytics'),
  cacheMiddleware({
    key: (req) => `analytics:user:${req.user.id}:${req.query.timeframe || ''}`,
    ttl: 300
  }),
  getUserAnalytics
);

// Report generation
router.post('/report',
  authenticateToken,
  checkFeatureAccess('canAccessAnalytics'),
  generateReport
);

// Cache invalidation (admin only)
router.post('/cache/invalidate',
  authenticateToken,
  invalidateCache
);

export default router;