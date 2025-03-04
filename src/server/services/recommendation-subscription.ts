// src/server/services/recommendation-subscription.ts
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { SubscriptionService } from './subscription';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

// Subscription tier limits
const TIER_LIMITS = {
  Basic: {
    dailyRecommendations: 5,
    refreshInterval: 24 * 60 * 60, // 24 hours
    featureAccess: ['hide']
  },
  Chrome: {
    dailyRecommendations: 10,
    refreshInterval: 12 * 60 * 60, // 12 hours
    featureAccess: ['hide', 'report']
  },
  Bronze: {
    dailyRecommendations: 20,
    refreshInterval: 6 * 60 * 60, // 6 hours
    featureAccess: ['hide', 'report', 'customFilters']
  },
  Silver: {
    dailyRecommendations: 30,
    refreshInterval: 3 * 60 * 60, // 3 hours
    featureAccess: ['hide', 'report', 'customFilters', 'priorityMatching']
  },
  Gold: {
    dailyRecommendations: 50,
    refreshInterval: 1 * 60 * 60, // 1 hour
    featureAccess: ['hide', 'report', 'customFilters', 'priorityMatching', 'advancedStats']
  },
  Platinum: {
    dailyRecommendations: Infinity,
    refreshInterval: 15 * 60, // 15 minutes
    featureAccess: ['hide', 'report', 'customFilters', 'priorityMatching', 'advancedStats', 'aiMatching']
  }
};

export class RecommendationSubscriptionService {
  private subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  async validateRecommendationAccess(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    });

    if (!user) return false;

    const key = `recommendations:count:${userId}`;
    const count = await redis.incr(key);

    // Set expiry for first increment
    if (count === 1) {
      await redis.expire(key, 24 * 60 * 60); // 24 hours
    }

    const limit = TIER_LIMITS[user.subscriptionTier].dailyRecommendations;
    return count <= limit;
  }

  async canRefreshRecommendations(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    });

    if (!user) return false;

    const key = `recommendations:refresh:${userId}`;
    const lastRefresh = await redis.get(key);

    if (!lastRefresh) return true;

    const interval = TIER_LIMITS[user.subscriptionTier].refreshInterval;
    const timeSinceLastRefresh = Math.floor(Date.now() / 1000) - parseInt(lastRefresh);

    return timeSinceLastRefresh >= interval;
  }

  async trackRefresh(userId: string): Promise<void> {
    const key = `recommendations:refresh:${userId}`;
    await redis.set(key, Math.floor(Date.now() / 1000));
  }

  async getFeatureAccess(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    });

    if (!user) return [];

    return TIER_LIMITS[user.subscriptionTier].featureAccess;
  }

  async applyTierBonuses(userId: string, score: number): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    });

    if (!user) return score;

    // Apply tier-specific bonuses
    switch (user.subscriptionTier) {
      case 'Silver':
        score *= 1.1; // 10% bonus
        break;
      case 'Gold':
        score *= 1.2; // 20% bonus
        break;
      case 'Platinum':
        score *= 1.3; // 30% bonus
        break;
    }

    return Math.min(100, score); // Cap at 100
  }

  async applyCustomFilters(userId: string, query: any): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    });

    if (!user) return query;

    const features = TIER_LIMITS[user.subscriptionTier].featureAccess;
    if (!features.includes('customFilters')) return query;

    // Get user's custom filters
    const filters = await prisma.userFilters.findFirst({
      where: { userId }
    });

    if (!filters) return query;

    // Apply custom filters to query
    return {
      ...query,
      AND: [
        ...query.AND || [],
        ...this.buildCustomFilterQuery(filters)
      ]
    };
  }

  private buildCustomFilterQuery(filters: any): any[] {
    const conditions = [];

    if (filters.verificationLevels?.length) {
      conditions.push({
        verificationLevel: { in: filters.verificationLevels }
      });
    }

    if (filters.activityLevel) {
      conditions.push({
        lastActive: {
          gte: new Date(Date.now() - filters.activityLevel * 24 * 60 * 60 * 1000)
        }
      });
    }

    // Add more custom filter conditions

    return conditions;
  }
}