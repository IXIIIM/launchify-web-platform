import express from 'express';
import { matchController } from '../controllers/match';
import { authenticateToken } from '../middleware/auth';
import {
  requireFeatureAccess,
  requireResourceAccess,
  requireVerifiedAccess
} from '../middleware/accessControl';

const router = express.Router();

// Basic matching features
router.get('/potential',
  authenticateToken,
  requireFeatureAccess('read_basic_matches'),
  matchController.getPotentialMatches
);

// Advanced matching features
router.get('/recommended',
  authenticateToken,
  requireFeatureAccess('read_advanced_matches'),
  requireVerifiedAccess('advanced_matching'),
  matchController.getRecommendedMatches
);

// Match interactions
router.post('/:id/connect',
  authenticateToken,
  requireResourceAccess('match'),
  requireFeatureAccess('write_connections'),
  matchController.connectWithMatch
);

router.get('/:id',
  authenticateToken,
  requireResourceAccess('match'),
  matchController.getMatch
);

export default router;