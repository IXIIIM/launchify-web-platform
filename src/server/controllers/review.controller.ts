// src/server/controllers/review.controller.ts

import { Request, Response } from 'express';
import { ReviewService } from '../services/review';

const reviewService = new ReviewService();

interface AuthRequest extends Request {
  user: any;
}

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { reviewedId, rating, categories, content } = req.body;

    const review = await reviewService.createReview(req.user.id, reviewedId, {
      rating,
      categories,
      content
    });

    res.json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: error.message || 'Error creating review' });
  }
};

export const getReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { page, limit, status } = req.query;

    const result = await reviewService.getReviews(userId, {
      page: Number(page),
      limit: Number(limit),
      status: status as string
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

export const flagReview = async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    const flag = await reviewService.flagReview(reviewId, req.user.id, reason);
    res.json(flag);
  } catch (error) {
    console.error('Error flagging review:', error);
    res.status(500).json({ message: error.message || 'Error flagging review' });
  }
};

export const moderateReview = async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { action } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await reviewService.moderateReview(reviewId, action, req.user.id);
    res.json({ message: 'Review moderated successfully' });
  } catch (error) {
    console.error('Error moderating review:', error);
    res.status(500).json({ message: 'Error moderating review' });
  }
};

// src/server/routes/review.ts

import express from 'express';
import {
  createReview,
  getReviews,
  flagReview,
  moderateReview
} from '../controllers/review.controller';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticateToken, createReview);
router.get('/user/:userId', authenticateToken, getReviews);
router.post('/:reviewId/flag', authenticateToken, flagReview);
router.post('/:reviewId/moderate', authenticateToken, isAdmin, moderateReview);

export default router;