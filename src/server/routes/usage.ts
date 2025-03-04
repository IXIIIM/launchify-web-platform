import express from 'express';
import {
  getUserUsage,
  checkFeatureAccess
} from '../controllers/usage.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// ... [Rest of the usage routes implementation] ...