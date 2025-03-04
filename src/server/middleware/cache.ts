import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

// Create Redis client
const redis = new Redis(config.redis.url, {
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Log Redis connection events
redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('error', (err: Error) => {
  logger.error('Redis client error:', err);
});

/**
 * Generate a cache key for analytics requests
 * @param req The request object
 * @param userId Optional user ID to include in the key
 * @returns A cache key string
 */
export const analyticsKey = (req: Request, userId?: string): string => {
  const { timeframe, userTypes, subscriptionTiers, includeTrials, startDate, endDate } = req.query;
  
  return [
    'analytics',
    userId || 'platform',
    timeframe || '1m',
    userTypes || 'all',
    subscriptionTiers || 'all',
    includeTrials || 'true',
    startDate || '',
    endDate || ''
  ].filter(Boolean).join(':');
};

/**
 * Middleware to cache API responses
 * @param prefix Cache key prefix
 * @param ttl Time to live in seconds
 * @param keyGenerator Optional function to generate a custom cache key
 * @returns Express middleware
 */
export const cacheMiddleware = (
  prefix: string,
  ttl: number = 3600,
  keyGenerator?: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate cache key
    const key = keyGenerator 
      ? keyGenerator(req) 
      : `${prefix}:${req.originalUrl}`;
    
    try {
      // Try to get cached response
      const cachedResponse = await redis.get(key);
      
      if (cachedResponse) {
        const data = JSON.parse(cachedResponse);
        
        // Add cache header
        res.setHeader('X-Cache', 'HIT');
        
        // Return cached response
        return res.json(data);
      }
      
      // Cache miss - add header
      res.setHeader('X-Cache', 'MISS');
      
      // Store original res.json method
      const originalJson = res.json.bind(res);
      
      // Override res.json method to cache the response
      res.json = ((data: any) => {
        // Restore original method
        res.json = originalJson;
        
        // Cache the response
        try {
          redis.setex(key, ttl, JSON.stringify(data));
        } catch (err) {
          logger.error('Error caching response:', err);
        }
        
        // Call original method
        return originalJson(data);
      }) as any;
      
      next();
    } catch (err) {
      logger.error('Cache middleware error:', err);
      next();
    }
  };
};

/**
 * Invalidate cache entries by pattern
 * @param patterns Array of patterns to match cache keys
 * @returns Number of deleted keys
 */
export const invalidateCache = async (patterns: string[]): Promise<number> => {
  try {
    let totalDeleted = 0;
    
    for (const pattern of patterns) {
      // Find keys matching pattern
      const keys = await redis.keys(`*${pattern}*`);
      
      if (keys.length > 0) {
        // Delete keys
        const deleted = await redis.del(...keys);
        totalDeleted += deleted;
        
        logger.info(`Invalidated ${deleted} cache entries matching pattern: ${pattern}`);
      }
    }
    
    return totalDeleted;
  } catch (err) {
    logger.error('Error invalidating cache:', err);
    throw err;
  }
};

/**
 * Clear cache entries by patterns
 * @param patterns Array of patterns to match cache keys
 * @returns Number of deleted keys
 */
export const clearCache = async (patterns: string[]): Promise<number> => {
  return invalidateCache(patterns);
};