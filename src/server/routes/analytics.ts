import express from 'express';
import {
  getPlatformAnalytics,
  getUserAnalytics,
  generateReport,
  invalidateCache
} from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth';
import { checkFeatureAccess } from '../middleware/usageLimit';

const router = express.Router();

// Platform-wide analytics (admin only)
router.get('/platform',
  authenticateToken,
  getPlatformAnalytics
);

// User-specific analytics
router.get('/user', 
  authenticateToken, 
  checkFeatureAccess('canAccessAnalytics'),
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