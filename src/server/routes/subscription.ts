import express from 'express';
import {
  createSubscription,
  cancelSubscription,
  updateSubscription,
  getSubscription,
  handleWebhook
} from '../controllers/subscription.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public webhook endpoint (no authentication)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected subscription endpoints
router.post('/create', authenticateToken, createSubscription);
router.post('/cancel', authenticateToken, cancelSubscription);
router.post('/update', authenticateToken, updateSubscription);
router.get('/details', authenticateToken, getSubscription);

export default router;