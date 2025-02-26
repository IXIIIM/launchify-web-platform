// src/server/routes/search.routes.ts
import express from 'express';
import {
  searchProfiles,
  reindexProfile,
  reindexAll,
  getSearchSuggestions
} from '../controllers/search.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Search routes
router.get('/profiles', authenticateToken, searchProfiles);
router.get('/suggestions', authenticateToken, getSearchSuggestions);

// Indexing routes
router.post('/reindex', authenticateToken, reindexProfile);
router.post('/reindex-all', authenticateToken, reindexAll);

export default router;