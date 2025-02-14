import express from 'express';
import {
  getSecuritySettings,
  updateSecuritySettings,
  getSecurityLogs,
  validateSecuritySettings
} from '../controllers/security.controller';
import { authenticateToken } from '../middleware/auth';
import { checkFeatureAccess } from '../middleware/usageLimit';

const router = express.Router();

// Security settings routes
router.get(
  '/settings',
  authenticateToken,
  checkFeatureAccess('canAccessSecuritySettings'),
  getSecuritySettings
);

router.put(
  '/settings',
  authenticateToken,
  checkFeatureAccess('canAccessSecuritySettings'),
  updateSecuritySettings
);

router.post(
  '/settings/validate',
  authenticateToken,
  checkFeatureAccess('canAccessSecuritySettings'),
  validateSecuritySettings
);

// Security logs routes
router.get(
  '/logs',
  authenticateToken,
  checkFeatureAccess('canAccessSecurityLogs'),
  getSecurityLogs
);

export default router;