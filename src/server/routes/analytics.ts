import express from 'express';
import {
  getUserAnalytics,
  getPlatformAnalytics,
  generateReport
} from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth';
import { checkFeatureAccess } from '../middleware/usageLimit';

const router = express.Router();

// ... [Rest of the routes implementation] ...