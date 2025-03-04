import express from 'express';
import {
  getMatches,
  createMatch,
  respondToMatch,
  getUserMatches
} from '../controllers/match.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get potential matches
router.get('/potential', getMatches);

// Get user's matches
router.get('/user', getUserMatches);

// Create a new match
router.post('/create', createMatch);

// Respond to a match request
router.post('/respond/:matchId', respondToMatch);

export default router; 