// src/server/routes/admin.ts
import express from 'express';
import {
  getDashboardStats,
  getVerificationRequests,
  updateVerificationRequest,
  getSecurityLogs,
  getRoleAccessLogs
} from '../controllers/admin.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole, UserRole } from '../middleware/roleAuth';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authenticateToken);

// Dashboard stats - requires ADMIN role
router.get('/dashboard', requireRole(UserRole.ADMIN) as express.RequestHandler, getDashboardStats);

// Verification requests - requires MODERATOR role
router.get('/verification-requests', requireRole(UserRole.MODERATOR) as express.RequestHandler, getVerificationRequests);
router.put('/verification-requests/:id', requireRole(UserRole.MODERATOR) as express.RequestHandler, updateVerificationRequest);

// Security logs - requires ADMIN role (more sensitive)
router.get('/security-logs', requireRole(UserRole.ADMIN) as express.RequestHandler, getSecurityLogs);

// Role-based access logs - requires SUPER_ADMIN role (most sensitive)
router.get('/role-access-logs', requireRole(UserRole.SUPER_ADMIN) as express.RequestHandler, getRoleAccessLogs);

export default router;