// src/server/controllers/recommendation.controller.ts
import { Request, Response } from 'express';
import { RecommendationService } from '../services/recommendation';
import { RecommendationSubscriptionService } from '../services/recommendation-subscription';
import { ValidationError } from '../utils/errors';

interface AuthRequest extends Request {
  user: any;
}

const recommendationService = new RecommendationService();
const subscriptionService = new RecommendationSubscriptionService();

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    // Validate access based on subscription
    const hasAccess = await subscriptionService.validateRecommendationAccess(req.user.id);
    if (!hasAccess) {
      throw new ValidationError('Daily recommendation limit reached', [{
        field: 'recommendations',
        message: 'Upgrade your subscription to see more recommendations'
      }]);
    }

    // Get feature access
    const features = await subscriptionService.getFeatureAccess(req.user.id);

    // Apply subscription-based query modifications
    let baseQuery = {};
    if (features.includes('customFilters')) {
      baseQuery = await subscriptionService.applyCustomFilters(req.user.id, baseQuery);
    }

    // Get recommendations
    const recommendations = await recommendationService.getRecommendations(
      req.user.id,
      baseQuery
    );

    // Apply tier bonuses to scores
    const enhancedRecommendations = await Promise.all(
      recommendations.map(async rec => ({
        ...rec,
        score: await subscriptionService.applyTierBonuses(req.user.id, rec.score)
      }))
    );

    res.json({
      recommendations: enhancedRecommendations,
      features
    });
  } catch (error) {
    throw error;
  }
};

export const refreshRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const canRefresh = await subscriptionService.canRefreshRecommendations(req.user.id);
    if (!canRefresh) {
      const features = await subscriptionService.getFeatureAccess(req.user.id);
      throw new ValidationError('Refresh cooldown active', [{
        field: 'refresh',
        message: features.includes('priorityMatching')
          ? 'Please wait a few minutes before refreshing'
          : 'Please wait a few hours before refreshing'
      }]);
    }

    await subscriptionService.trackRefresh(req.user.id);
    await recommendationService.clearCache(req.user.id);

    const recommendations = await recommendationService.getRecommendations(req.user.id);
    
    res.json(recommendations);
  } catch (error) {
    throw error;
  }
};