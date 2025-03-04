import { Redis } from 'ioredis';

class RedisCache {
  private client: Redis;
  private defaultTTL: number;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL!);
    this.defaultTTL = 300; // 5 minutes default TTL

    // Handle Redis connection errors
    this.client.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, stringValue);
      } else {
        await this.client.setex(key, this.defaultTTL, stringValue);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }

  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error('Redis clear pattern error:', error);
    }
  }

  // Used for caching analytics data with specific patterns
  async cacheAnalytics(key: string, data: any, timeframe: string): Promise<void> {
    const ttl = this.getTimeframeTTL(timeframe);
    await this.set(`analytics:${key}`, data, ttl);
  }

  private getTimeframeTTL(timeframe: string): number {
    switch (timeframe) {
      case 'realtime':
        return 60; // 1 minute
      case 'hourly':
        return 3600; // 1 hour
      case 'daily':
        return 86400; // 24 hours
      case 'weekly':
        return 604800; // 7 days
      default:
        return this.defaultTTL;
    }
  }

  async quit(): Promise<void> {
    await this.client.quit();
  }
}

// Export singleton instance
export const redisCache = new RedisCache();