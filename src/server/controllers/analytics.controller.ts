import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics';
import { Redis } from 'ioredis';
import { startOfDay, subDays } from 'date-fns';

const redis = new Redis(process.env.REDIS_URL);
const analyticsService = new AnalyticsService();
const CACHE_TTL = 60 * 5; // 5 minutes cache

interface AuthRequest extends Request {
  user: any;
}

export const getPlatformAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    // Only allow admin access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const { startDate = subDays(new Date(), 30), endDate = new Date() } = req.query;
    
    // Create cache key based on date range
    const cacheKey = `analytics:platform:${startDate}:${endDate}`;
    
    // Try to get from cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Get fresh data if not in cache
    const analytics = await analyticsService.getPlatformAnalytics(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    // Cache the results
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(analytics));

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
};

export const getUserAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { timeframe = 'month' } = req.query;
    const cacheKey = `analytics:user:${req.user.id}:${timeframe}`;

    // Try cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const analytics = await analyticsService.getUserAnalytics(
      req.user.id,
      timeframe as 'week' | 'month' | 'year'
    );

    // Cache the results
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(analytics));

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
};

export const generateReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, reportType } = req.body;
    
    if (!startDate || !endDate || !reportType) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    let report;
    switch (reportType) {
      case 'user':
        report = await analyticsService.generateUserReport(req.user.id, startDate, endDate);
        break;
      case 'subscription':
        if (req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Unauthorized access' });
        }
        report = await analyticsService.generateSubscriptionReport(startDate, endDate);
        break;
      case 'engagement':
        report = await analyticsService.generateEngagementReport(startDate, endDate);
        break;
      case 'revenue':
        if (req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Unauthorized access' });
        }
        report = await analyticsService.generateRevenueReport(startDate, endDate);
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
};

export const invalidateCache = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const keys = await redis.keys('analytics:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    res.json({ message: 'Analytics cache invalidated successfully' });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({ message: 'Error invalidating cache' });
  }
};