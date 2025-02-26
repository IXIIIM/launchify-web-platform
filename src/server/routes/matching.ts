// src/server/routes/matching.ts
import express from 'express';
import { getMatches, updatePreferences, swipe } from '../controllers/matching.controller';
import { authenticateToken } from '../middleware/auth';
import { checkProfileCompletion } from '../middleware/profile';
import { checkMatchLimit } from '../middleware/usageLimit';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const swipeSchema = z.object({
  targetUserId: z.string().uuid(),
  direction: z.enum(['left', 'right'])
});

const preferencesSchema = z.object({
  industries: z.array(z.string()),
  investmentRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }),
  experienceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }),
  location: z.string().optional(),
  businessType: z.enum(['B2B', 'B2C']).optional()
});

// Routes
router.get(
  '/potential',
  authenticateToken,
  checkProfileCompletion,
  checkMatchLimit,
  getMatches
);

router.post(
  '/preferences',
  authenticateToken,
  validateRequest(preferencesSchema),
  updatePreferences
);

router.post(
  '/swipe',
  authenticateToken,
  checkProfileCompletion,
  checkMatchLimit,
  validateRequest(swipeSchema),
  swipe
);

export default router;