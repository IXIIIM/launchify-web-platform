import express from 'express';
import {
  getMatches,
  updatePreferences,
  swipe
} from '../controllers/matching.controller';
import { authenticateToken } from '../middleware/auth';
import { 
  checkMatchLimit, 
  checkProfileCompletion,
  checkSubscriptionStatus
} from '../middleware/matching';

const router = express.Router();

// Middleware to ensure user can access matching features
const matchingMiddleware = [
  authenticateToken,
  checkSubscriptionStatus,
  checkProfileCompletion
];

// Get potential matches
router.get('/matches', 
  matchingMiddleware,
  checkMatchLimit,
  getMatches
);

// Update match preferences
router.put('/preferences',
  matchingMiddleware,
  updatePreferences
);

// Handle swipe action
router.post('/swipe',
  matchingMiddleware,
  checkMatchLimit,
  swipe
);

export default router;