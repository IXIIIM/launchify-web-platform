import { Redis } from 'ioredis';
import { format } from 'date-fns';

export class AnalyticsCache {
  private redis: Redis;
  private readonly PREFIX = 'analytics:';
  private readonly DEFAULT_TTL = 300; // 5 minutes

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);

    // Handle Redis errors
    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  private generateKey(type: string, params: Record<string, any>): string {
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}:${value}`)
      .join(':');
    return `${this.PREFIX}${type}:${paramString}`;
  }

  async getMetrics(type: string, params: Record<string, any>): Promise<any | null> {
    try {
      const key = this.generateKey(type, params);
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting metrics from cache:', error);
      return null;
    }
  }

  async setMetrics(type: string, params: Record<string, any>, data: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const key = this.generateKey(type, params);
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting metrics in cache:', error);
    }
  }

  async invalidateMetrics(type: string, params?: Record<string, any>): Promise<void> {
    try {
      if (params) {
        const key = this.generateKey(type, params);
        await this.redis.del(key);
      } else {
        const pattern = `${this.PREFIX}${type}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (error) {
      console.error('Error invalidating metrics cache:', error);
    }
  }

  async invalidateAll(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.PREFIX}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Error invalidating all metrics cache:', error);
    }
  }

  async getTimeSeriesData(type: string, startDate: Date, endDate: Date): Promise<any | null> {
    const key = this.generateKey(type, {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting time series data from cache:', error);
      return null;
    }
  }

  async setTimeSeriesData(type: string, startDate: Date, endDate: Date, data: any): Promise<void> {
    const key = this.generateKey(type, {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
    try {
      await this.redis.setex(key, this.DEFAULT_TTL, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting time series data in cache:', error);
    }
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}