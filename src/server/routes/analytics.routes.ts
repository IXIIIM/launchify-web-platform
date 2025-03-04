// src/server/routes/analytics.routes.ts
import express from 'express';
import {
  getSubscriptionMetrics,
  generateSubscriptionReport
} from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth';
import { roleAuth } from '../middleware/roleAuth';

const router = express.Router();

// Get subscription metrics with enhanced filtering
router.get(
  '/subscription-metrics',
  authenticateToken,
  roleAuth(['admin', 'manager', 'analyst']),
  getSubscriptionMetrics
);

// Generate subscription report
router.post(
  '/subscription-report',
  authenticateToken,
  roleAuth(['admin', 'manager', 'analyst']),
  generateSubscriptionReport
);

export default router;