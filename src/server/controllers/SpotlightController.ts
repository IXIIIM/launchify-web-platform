// src/server/controllers/SpotlightController.ts

import { Request, Response } from 'express';
import { SpotlightService } from '../services/SpotlightService';
import { StripeService } from '../services/stripe';

const spotlightService = new SpotlightService();
const stripeService = new StripeService();

interface AuthRequest extends Request {
  user: any;
}

export const createSpotlight = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.body;
    const spotlight = await spotlightService.createSpotlight(req.user.id, type);
    res.json(spotlight);
  } catch (error) {
    console.error('Error creating spotlight:', error);
    res.status(500).json({ message: error.message });
  }
};

export const purchaseCredits = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentMethodId } = req.body;
    
    // Process payment
    const paymentIntent = await stripeService.createPaymentIntent(
      amount * 5, // $5 per credit
      req.user.id,
      'Boost Credits Purchase'
    );

    await spotlightService.purchaseBoostCredits(req.user.id, amount);
    
    res.json({ success: true, credits: amount });
  } catch (error) {
    console.error('Error purchasing credits:', error);
    res.status(500).json({ message: 'Error processing purchase' });
  }
};

export const getActiveSpotlights = async (req: Request, res: Response) => {
  try {
    const spotlights = await spotlightService.getActiveSpotlights();
    res.json(spotlights);
  } catch (error) {
    console.error('Error fetching spotlights:', error);
    res.status(500).json({ message: 'Error fetching spotlights' });
  }
};

// src/server/routes/spotlight.ts

import express from 'express';
import {
  createSpotlight,
  purchaseCredits,
  getActiveSpotlights
} from '../controllers/SpotlightController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticateToken, createSpotlight);
router.post('/purchase-credits', authenticateToken, purchaseCredits);
router.get('/active', authenticateToken, getActiveSpotlights);

export default router;