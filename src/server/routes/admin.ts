import express from 'express';
import {
  getDashboardStats,
  getVerificationRequests,
  updateVerificationRequest,
  getSecurityLogs
} from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/adminAuth';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authenticateToken, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/verification-requests', getVerificationRequests);
router.put('/verification-requests/:id', updateVerificationRequest);
router.get('/security-logs', getSecurityLogs);

export default router;