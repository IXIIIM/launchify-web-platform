import express from 'express';
import {
  createSubscription,
  cancelSubscription,
  updateSubscription
} from '../controllers/subscription.controller';
import { handleStripeWebhook } from '../webhooks/stripe';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// ... [Rest of the subscription routes implementation] ...