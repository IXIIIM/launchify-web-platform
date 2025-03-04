// src/server/routes/advanced-matching.ts
import express from 'express';
import {
  checkBoostAccess,
  getBoostStats,
  activateBoost,
  updateFilters,
  getFilters
} from '../controllers/advanced-matching.controller';
import { authenticateToken } from '../middleware/auth';
import { checkProfileCompletion } from '../middleware/profile';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const filterSchema = z.object({
  verificationLevel: z.array(z.string()),
  location: z.string(),
  radius: z.number().min(0),
  investmentRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }),
  industries: z.array(z.string())
});

// Boost routes
router.get(
  '/boost/access',
  authenticateToken,
  checkBoostAccess
);

router.get(
  '/boost/stats',
  authenticateToken,
  getBoostStats
);

router.post(
  '/boost/activate',
  authenticateToken,
  checkProfileCompletion,
  activateBoost
);

// Filter routes
router.get(
  '/filters',
  authenticateToken,
  getFilters
);

router.post(
  '/filters',
  authenticateToken,
  validateRequest(filterSchema),
  updateFilters
);

export default router;