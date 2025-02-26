// src/server/services/search/SearchCacheService.ts
import { Redis } from 'ioredis';
import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';

const redis = new Redis(process.env.REDIS_URL);
const prisma = new PrismaClient();

interface CacheConfig {
  ttl: number;
  maxSize: number;
  minHits: number;
}

interface CacheStats {
  hits: number;
  lastAccessed: number;
  userSegments: string[];
}

interface UserContext {
  userId: string;
  userType: 'entrepreneur' | 'funder';
  subscriptionTier: string;
  industries?: string[];
  preferences?: Record<string, any>;
}

export class SearchCacheService {
  private readonly cacheConfigs: Record<string, CacheConfig> = {
    default: {
      ttl: 3600,        // 1 hour
      maxSize: 10000,   // Maximum number of cached items
      minHits: 3        // Minimum hits before caching
    },
    premium: {
      ttl: 7200,        // 2 hours
      maxSize: 20000,
      minHits: 2
    }
  };

  // Initialize cache monitoring
  constructor() {
    this.startCacheMonitoring();
  }

  // Get cached results with user context
  async getCachedResults(
    query: string,
    filters: Record<string, any>,
    userContext: UserContext
  ): Promise<any | null> {
    const cacheKey = this.generateCacheKey(query, filters, userContext);
    
    try {
      const cachedData = await redis.get(cacheKey);
      if (!cachedData) return null;

      // Update cache stats
      await this.updateCacheStats(cacheKey, userContext);

      const data = JSON.parse(cachedData);
      
      // Check if cached data is still relevant for user context
      if (await this.isResultRelevant(data, userContext)) {
        return data.results;
      }

      // If not relevant, invalidate cache
      await this.invalidateCache(cacheKey);
      return null;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  // Cache search results with context awareness
  async cacheResults(
    query: string,
    filters: Record<string, any>,
    results: any[],
    userContext: UserContext
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(query, filters, userContext);
    
    try {
      const stats = await this.getCacheStats(cacheKey);
      const config = this.getCacheConfig(userContext);

      // Only cache if meets minimum hits requirement
      if (stats.hits >= config.minHits) {
        const cacheData = {
          results,
          context: {
            timestamp: Date.now(),
            userSegments: await this.getUserSegments(userContext),
            metadata: {
              industries: userContext.industries,
              tier: userContext.subscriptionTier
            }
          }
        };

        await redis.setex(
          cacheKey,
          config.ttl,
          JSON.stringify(cacheData)
        );

        // Update user segments in stats
        await this.updateCacheStats(cacheKey, userContext);
      }
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  // Warm up cache for popular searches
  async warmCache(): Promise<void> {
    try {
      // Get popular searches from analytics
      const popularSearches = await prisma.searchAnalytics.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: {
          count: 'desc'
        },
        take: 100
      });

      // Group by user segments
      const searchesBySegment = this.groupSearchesBySegment(popularSearches);

      // Warm cache for each segment
      for (const [segment, searches] of Object.entries(searchesBySegment)) {
        await Promise.all(
          searches.map(search => 
            this.warmCacheForSegment(search, segment)
          )
        );
      }
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }

  // Invalidate cache based on various triggers
  async invalidateCache(
    key?: string,
    pattern?: string,
    userContext?: UserContext
  ): Promise<void> {
    try {
      if (key) {
        await redis.del(key);
      } else if (pattern) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else if (userContext) {
        // Invalidate all caches related to user context
        const userSegments = await this.getUserSegments(userContext);
        for (const segment of userSegments) {
          const pattern = `search:cache:${segment}:*`;
          const keys = await redis.keys(pattern);
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  // Monitor cache performance
  private startCacheMonitoring(): void {
    setInterval(async () => {
      try {
        const metrics = await this.collectCacheMetrics();
        await this.storeCacheMetrics(metrics);
        await this.optimizeCacheSize();
      } catch (error) {
        console.error('Cache monitoring error:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Helper: Generate cache key
  private generateCacheKey(
    query: string,
    filters: Record<string, any>,
    userContext: UserContext
  ): string {
    const segments = this.getUserSegments(userContext);
    const data = {
      query,
      filters,
      segments
    };
    return `search:cache:${createHash('md5').update(JSON.stringify(data)).digest('hex')}`;
  }

  // Helper: Get cache stats
  private async getCacheStats(key: string): Promise<CacheStats> {
    const statsKey = `stats:${key}`;
    const data = await redis.get(statsKey);
    return data ? JSON.parse(data) : {
      hits: 0,
      lastAccessed: Date.now(),
      userSegments: []
    };
  }

  // Helper: Update cache stats
  private async updateCacheStats(
    key: string,
    userContext: UserContext
  ): Promise<void> {
    const statsKey = `stats:${key}`;
    const stats = await this.getCacheStats(key);
    
    stats.hits += 1;
    stats.lastAccessed = Date.now();
    
    const segments = await this.getUserSegments(userContext);
    stats.userSegments = [...new Set([...stats.userSegments, ...segments])];

    await redis.setex(statsKey, 24 * 60 * 60, JSON.stringify(stats));
  }

  // Helper: Get user segments
  private async getUserSegments(userContext: UserContext): Promise<string[]> {
    const segments = [
      userContext.userType,
      userContext.subscriptionTier,
      ...this.getIndustrySegments(userContext.industries || [])
    ];

    if (userContext.preferences) {
      segments.push(...this.getPreferenceSegments(userContext.preferences));
    }

    return segments;
  }

  // Helper: Get industry segments
  private getIndustrySegments(industries: string[]): string[] {
    return industries.map(industry => `industry:${industry}`);
  }

  // Helper: Get preference segments
  private getPreferenceSegments(preferences: Record<string, any>): string[] {
    return Object.entries(preferences).map(([key, value]) => `pref:${key}:${value}`);
  }

  // Helper: Check result relevance
  private async isResultRelevant(
    data: any,
    userContext: UserContext
  ): Promise<boolean> {
    const currentSegments = await this.getUserSegments(userContext);
    const cachedSegments = data.context.userSegments;

    // Check segment overlap
    const overlap = cachedSegments.filter(segment => 
      currentSegments.includes(segment)
    ).length;

    // Require significant segment overlap for relevance
    return overlap / cachedSegments.length >= 0.7;
  }

  // Helper: Get cache config based on user context
  private getCacheConfig(userContext: UserContext): CacheConfig {
    return ['Gold', 'Platinum'].includes(userContext.subscriptionTier)
      ? this.cacheConfigs.premium
      : this.cacheConfigs.default;
  }

  // Helper: Group searches by segment
  private groupSearchesBySegment(searches: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    for (const search of searches) {
      const segment = this.determineSearchSegment(search);
      if (!grouped[segment]) {
        grouped[segment] = [];
      }
      grouped[segment].push(search);
    }

    return grouped;
  }

  // Helper: Determine search segment
  private determineSearchSegment(search: any): string {
    // Implement segment determination logic based on search patterns
    return 'default';
  }

  // Helper: Warm cache for segment
  private async warmCacheForSegment(
    search: any,
    segment: string
  ): Promise<void> {
    // Implement segment-specific cache warming
  }

  // Helper: Collect cache metrics
  private async collectCacheMetrics(): Promise<any> {
    // Implement cache metrics collection
    return {};
  }

  // Helper: Store cache metrics
  private async storeCacheMetrics(metrics: any): Promise<void> {
    // Implement metrics storage
  }

  // Helper: Optimize cache size
  private async optimizeCacheSize(): Promise<void> {
    try {
      const keys = await redis.keys('search:cache:*');
      
      if (keys.length > this.cacheConfigs.default.maxSize) {
        // Get stats for all cached items
        const stats = await Promise.all(
          keys.map(async key => {
            const statsData = await this.getCacheStats(key);
            return {
              key,
              stats: statsData
            };
          })
        );

        // Sort by hits and recency
        stats.sort((a, b) => {
          const scoreA = this.calculateCacheScore(a.stats);
          const scoreB = this.calculateCacheScore(b.stats);
          return scoreB - scoreA;
        });

        // Remove excess items
        const toRemove = stats.slice(this.cacheConfigs.default.maxSize);
        if (toRemove.length > 0) {
          await redis.del(...toRemove.map(item => item.key));
        }
      }
    } catch (error) {
      console.error('Cache optimization error:', error);
    }
  }

  // Helper: Calculate cache score
  private calculateCacheScore(stats: CacheStats): number {
    const age = (Date.now() - stats.lastAccessed) / (1000 * 60 * 60); // Hours
    return (stats.hits * 10) - age;
  }
}