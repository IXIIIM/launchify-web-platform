import { Request, Response, NextFunction } from 'express';
import { redisCache } from '../services/cache/redis';

interface CacheOptions {
  ttl?: number;
  key?: string | ((req: Request) => string);
}

export const cacheMiddleware = (options: CacheOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate cache key
      const cacheKey = typeof options.key === 'function'
        ? options.key(req)
        : options.key || `${req.originalUrl}`;

      // Try to get from cache
      const cachedData = await redisCache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }

      // If not in cache, store original res.json function
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function (data) {
        // Cache the data
        redisCache.set(cacheKey, data, options.ttl);

        // Call original res.json
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      // If cache fails, continue without caching
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Helper function to generate analytics cache key
export const analyticsKey = (req: Request): string => {
  const { startDate, endDate, timeframe } = req.query;
  return `analytics:${req.path}:${startDate || ''}:${endDate || ''}:${timeframe || ''}`;
};