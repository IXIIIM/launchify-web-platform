import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
import { config } from '../../config/environment';

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Redis client for caching
const redis = new Redis(config.redis.url);

interface UserTypeMetricsOptions {
  startDate?: Date;
  endDate?: Date;
  userTypes?: string[];
  subscriptionTiers?: string[];
  includeTrials?: boolean;
}

interface UserTypeDistribution {
  userType: string;
  count: number;
  percentage: number;
  subscriptions: {
    tier: string;
    count: number;
    percentage: number;
  }[];
  revenue: {
    mrr: number;
    percentage: number;
  };
}

interface UserTypeMetrics {
  distribution: UserTypeDistribution[];
  totalUsers: number;
  totalRevenue: number;
  timestamp: Date;
}

/**
 * Service for analyzing user metrics by user type
 */
export class UserTypeAnalytics {
  /**
   * Get metrics segmented by user type
   * @param timeframe Timeframe for metrics (e.g., '1d', '1w', '1m', '3m', '6m', '1y', 'custom')
   * @param options Additional filtering options
   * @returns User type metrics
   */
  async getUserTypeMetrics(
    timeframe: string = '1m',
    options: UserTypeMetricsOptions = {}
  ): Promise<UserTypeMetrics> {
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(timeframe, options);
      
      // Try to get from cache
      const cachedMetrics = await this.getCachedMetrics(cacheKey);
      if (cachedMetrics) {
        return cachedMetrics;
      }
      
      // Calculate date range based on timeframe
      const { startDate, endDate } = this.calculateDateRange(timeframe, options);
      
      // Get user type distribution
      const distribution = await this.calculateUserTypeDistribution(
        startDate,
        endDate,
        options
      );
      
      // Calculate totals
      const totalUsers = distribution.reduce((sum, type) => sum + type.count, 0);
      const totalRevenue = distribution.reduce((sum, type) => sum + type.revenue.mrr, 0);
      
      // Create metrics object
      const metrics: UserTypeMetrics = {
        distribution,
        totalUsers,
        totalRevenue,
        timestamp: new Date()
      };
      
      // Cache metrics
      await this.cacheMetrics(cacheKey, metrics);
      
      return metrics;
    } catch (error) {
      logger.error('Error calculating user type metrics:', error);
      throw new Error('Failed to calculate user type metrics');
    }
  }
  
  /**
   * Calculate user type distribution
   * @param startDate Start date for metrics
   * @param endDate End date for metrics
   * @param options Additional filtering options
   * @returns Array of user type distributions
   */
  private async calculateUserTypeDistribution(
    startDate: Date,
    endDate: Date,
    options: UserTypeMetricsOptions
  ): Promise<UserTypeDistribution[]> {
    try {
      // Define user types to include
      const userTypes = options.userTypes || ['entrepreneur', 'funder', 'other'];
      
      // Build subscription filter
      const subscriptionFilter: any = {
        createdAt: {
          lte: endDate
        },
        OR: [
          { canceledAt: null },
          { canceledAt: { gt: startDate } }
        ]
      };
      
      // Add tier filter if specified
      if (options.subscriptionTiers && options.subscriptionTiers.length > 0) {
        subscriptionFilter.tier = {
          in: options.subscriptionTiers
        };
      }
      
      // Add trial filter if specified
      if (options.includeTrials === false) {
        subscriptionFilter.isTrial = false;
      }
      
      // Get users with subscriptions
      const users = await prisma.user.findMany({
        where: {
          userType: {
            in: userTypes
          },
          subscriptions: {
            some: subscriptionFilter
          }
        },
        include: {
          subscriptions: {
            where: subscriptionFilter,
            include: {
              plan: true
            }
          }
        }
      });
      
      // Group users by type
      const usersByType: Record<string, any[]> = {};
      let totalUsers = 0;
      
      users.forEach(user => {
        const userType = user.userType || 'other';
        if (!usersByType[userType]) {
          usersByType[userType] = [];
        }
        usersByType[userType].push(user);
        totalUsers++;
      });
      
      // Calculate distribution for each user type
      const distribution: UserTypeDistribution[] = [];
      
      for (const userType of userTypes) {
        const usersOfType = usersByType[userType] || [];
        const count = usersOfType.length;
        const percentage = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
        
        // Group subscriptions by tier
        const subscriptionsByTier: Record<string, any[]> = {};
        let totalSubscriptions = 0;
        let totalMrr = 0;
        
        usersOfType.forEach((user: any) => {
          user.subscriptions.forEach((subscription: any) => {
            const tier = subscription.tier;
            if (!subscriptionsByTier[tier]) {
              subscriptionsByTier[tier] = [];
            }
            subscriptionsByTier[tier].push(subscription);
            totalSubscriptions++;
            totalMrr += subscription.plan.price;
          });
        });
        
        // Calculate subscription distribution by tier
        const subscriptions = Object.entries(subscriptionsByTier).map(([tier, subs]) => {
          const tierCount = subs.length;
          const tierPercentage = totalSubscriptions > 0 ? (tierCount / totalSubscriptions) * 100 : 0;
          
          return {
            tier,
            count: tierCount,
            percentage: parseFloat(tierPercentage.toFixed(2))
          };
        });
        
        // Add to distribution
        distribution.push({
          userType,
          count,
          percentage: parseFloat(percentage.toFixed(2)),
          subscriptions,
          revenue: {
            mrr: totalMrr,
            percentage: 0 // Will be calculated after all types are processed
          }
        });
      }
      
      // Calculate total MRR across all user types
      const totalMrr = distribution.reduce((sum, type) => sum + type.revenue.mrr, 0);
      
      // Calculate revenue percentage for each user type
      distribution.forEach(type => {
        type.revenue.percentage = totalMrr > 0 
          ? parseFloat(((type.revenue.mrr / totalMrr) * 100).toFixed(2)) 
          : 0;
      });
      
      return distribution;
    } catch (error) {
      logger.error('Error calculating user type distribution:', error);
      throw new Error('Failed to calculate user type distribution');
    }
  }
  
  /**
   * Calculate date range based on timeframe
   * @param timeframe Timeframe string
   * @param options Options containing custom date range
   * @returns Object with start and end dates
   */
  private calculateDateRange(
    timeframe: string,
    options: UserTypeMetricsOptions
  ): { startDate: Date; endDate: Date } {
    const endDate = options.endDate || new Date();
    let startDate: Date;
    
    if (timeframe === 'custom' && options.startDate) {
      startDate = options.startDate;
    } else {
      startDate = new Date(endDate);
      
      switch (timeframe) {
        case '1d':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '1w':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '1m':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1); // Default to 1 month
      }
    }
    
    return { startDate, endDate };
  }
  
  /**
   * Generate cache key for metrics
   * @param timeframe Timeframe string
   * @param options Options for filtering
   * @returns Cache key string
   */
  private generateCacheKey(
    timeframe: string,
    options: UserTypeMetricsOptions
  ): string {
    const parts = [
      'user-type-metrics',
      timeframe,
      options.userTypes?.join(',') || 'all',
      options.subscriptionTiers?.join(',') || 'all',
      options.includeTrials === false ? 'no-trials' : 'with-trials'
    ];
    
    if (timeframe === 'custom' && options.startDate && options.endDate) {
      parts.push(options.startDate.toISOString().split('T')[0]);
      parts.push(options.endDate.toISOString().split('T')[0]);
    }
    
    return parts.join(':');
  }
  
  /**
   * Get cached metrics
   * @param cacheKey Cache key
   * @returns Cached metrics or null
   */
  private async getCachedMetrics(cacheKey: string): Promise<UserTypeMetrics | null> {
    try {
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        const metrics = JSON.parse(cached);
        
        // Convert string dates back to Date objects
        metrics.timestamp = new Date(metrics.timestamp);
        
        return metrics;
      }
      
      return null;
    } catch (error) {
      logger.warn('Error getting cached user type metrics:', error);
      return null;
    }
  }
  
  /**
   * Cache metrics
   * @param cacheKey Cache key
   * @param metrics Metrics to cache
   */
  private async cacheMetrics(cacheKey: string, metrics: UserTypeMetrics): Promise<void> {
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(metrics));
    } catch (error) {
      logger.warn('Error caching user type metrics:', error);
    }
  }
} 