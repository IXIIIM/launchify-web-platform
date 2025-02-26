<<<<<<< HEAD
// src/server/services/search/FilterOptimizationService.ts
=======
>>>>>>> feature/security-implementation
import { Redis } from 'ioredis';
import { createHash } from 'crypto';

const redis = new Redis(process.env.REDIS_URL);

interface FilterStats {
  count: number;
  lastUsed: number;
  avgResponseTime: number;
}

export class FilterOptimizationService {
  private readonly FILTER_STATS_TTL = 7 * 24 * 60 * 60; // 7 days
  private readonly FILTER_CACHE_TTL = 60 * 60; // 1 hour
  private readonly MAX_CACHED_FILTERS = 1000;

  // Track and optimize filter combinations
  async trackFilterUsage(
    filters: Record<string, any>,
    responseTime: number,
    userType: 'entrepreneur' | 'funder'
  ): Promise<void> {
    const filterHash = this.generateFilterHash(filters);
    const statsKey = `filter:stats:${userType}:${filterHash}`;

    try {
      const existingStats = await redis.get(statsKey);
      let stats: FilterStats;

      if (existingStats) {
        stats = JSON.parse(existingStats);
        stats.count += 1;
        stats.lastUsed = Date.now();
        stats.avgResponseTime = (stats.avgResponseTime * (stats.count - 1) + responseTime) / stats.count;
      } else {
        stats = {
          count: 1,
          lastUsed: Date.now(),
          avgResponseTime: responseTime
        };
      }

      await redis.setex(statsKey, this.FILTER_STATS_TTL, JSON.stringify(stats));

      // Update popular filters set if this is becoming a common filter
      if (stats.count > 10) {
        await redis.zadd(`popular:filters:${userType}`, stats.count, filterHash);
      }
    } catch (error) {
      console.error('Error tracking filter usage:', error);
    }
  }

  // Pre-cache results for popular filters
  async preCachePopularFilters(userType: 'entrepreneur' | 'funder'): Promise<void> {
    try {
      // Get top filters by usage
      const popularFilters = await redis.zrevrange(
        `popular:filters:${userType}`,
        0,
        49,
        'WITHSCORES'
      );

      for (let i = 0; i < popularFilters.length; i += 2) {
        const filterHash = popularFilters[i];
        const filterStatsStr = await redis.get(`filter:stats:${userType}:${filterHash}`);
        
        if (filterStatsStr) {
          const stats: FilterStats = JSON.parse(filterStatsStr);
          
          // Only pre-cache recently used popular filters
          if (Date.now() - stats.lastUsed < 24 * 60 * 60 * 1000) {
            // Trigger cache refresh in background
            this.refreshFilterCache(filterHash, userType).catch(error => {
              console.error('Error refreshing filter cache:', error);
            });
          }
        }
      }
    } catch (error) {
      console.error('Error pre-caching popular filters:', error);
    }
  }

  // Get optimized filters based on usage patterns
  async getOptimizedFilters(
    filters: Record<string, any>,
    userType: 'entrepreneur' | 'funder'
  ): Promise<Record<string, any>> {
    const filterHash = this.generateFilterHash(filters);
    const cacheKey = `filter:cache:${userType}:${filterHash}`;

    try {
      // Check if we have cached results
      const cachedResults = await redis.get(cacheKey);
      if (cachedResults) {
        return JSON.parse(cachedResults);
      }

      // Get filter stats
      const statsKey = `filter:stats:${userType}:${filterHash}`;
      const statsStr = await redis.get(statsKey);
      
      if (statsStr) {
        const stats: FilterStats = JSON.parse(statsStr);
        
        // For frequently used filters, optimize the query
        if (stats.count > 5) {
          filters = await this.optimizeFilterQuery(filters, stats);
        }
      }

      return filters;
    } catch (error) {
      console.error('Error optimizing filters:', error);
      return filters;
    }
  }

  // Clean up old or unused filter caches
  async cleanupFilterCache(): Promise<void> {
    try {
      const types = ['entrepreneur', 'funder'];
      
      for (const userType of types) {
        // Get all cached filter keys
        const cacheKeys = await redis.keys(`filter:cache:${userType}:*`);
        
        if (cacheKeys.length > this.MAX_CACHED_FILTERS) {
          // Get stats for all cached filters
          const filterStats = await Promise.all(
            cacheKeys.map(async key => {
              const filterHash = key.split(':').pop()!;
              const statsStr = await redis.get(`filter:stats:${userType}:${filterHash}`);
              return {
                key,
                stats: statsStr ? JSON.parse(statsStr) : null
              };
            })
          );

          // Sort by usage and recency
          filterStats.sort((a, b) => {
            if (!a.stats) return 1;
            if (!b.stats) return -1;
            
            // Calculate score based on usage count and recency
            const scoreA = a.stats.count * (1 / (1 + (Date.now() - a.stats.lastUsed) / (24 * 60 * 60 * 1000)));
            const scoreB = b.stats.count * (1 / (1 + (Date.now() - b.stats.lastUsed) / (24 * 60 * 60 * 1000)));
            
            return scoreB - scoreA;
          });

          // Remove excess caches
          const toRemove = filterStats.slice(this.MAX_CACHED_FILTERS);
          if (toRemove.length > 0) {
            await redis.del(...toRemove.map(item => item.key));
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up filter cache:', error);
    }
  }

  private generateFilterHash(filters: Record<string, any>): string {
    const normalized = JSON.stringify(filters, Object.keys(filters).sort());
    return createHash('md5').update(normalized).digest('hex');
  }

  private async refreshFilterCache(
    filterHash: string,
    userType: 'entrepreneur' | 'funder'
  ): Promise<void> {
    // Implementation will depend on your search service
    // This is where you'd re-run the search with these filters
    // and cache the results
  }

  private async optimizeFilterQuery(
    filters: Record<string, any>,
    stats: FilterStats
  ): Promise<Record<string, any>> {
    const optimizedFilters = { ...filters };

    // Optimize range queries
    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        if ('min' in value || 'max' in value) {
          // Round range boundaries to improve cache hits
          if ('min' in value) {
            optimizedFilters[key].min = this.roundRangeBoundary(value.min, 'min');
          }
          if ('max' in value) {
            optimizedFilters[key].max = this.roundRangeBoundary(value.max, 'max');
          }
        }
      }
    }

    // If the filter is frequently used with poor performance,
    // add index hints or adjust query parameters
    if (stats.count > 100 && stats.avgResponseTime > 1000) {
      optimizedFilters._indexHints = this.generateIndexHints(filters);
    }

    return optimizedFilters;
  }

  private roundRangeBoundary(value: number, type: 'min' | 'max'): number {
    // Round values to improve cache hit rates
    // The rounding strategy depends on the typical value ranges
    // This is a simple example:
    if (value >= 1000000) {
      return type === 'min' 
        ? Math.floor(value / 100000) * 100000
        : Math.ceil(value / 100000) * 100000;
    } else if (value >= 100000) {
      return type === 'min'
        ? Math.floor(value / 10000) * 10000
        : Math.ceil(value / 10000) * 10000;
    } else if (value >= 10000) {
      return type === 'min'
        ? Math.floor(value / 1000) * 1000
        : Math.ceil(value / 1000) * 1000;
    }
    return value;
  }

  private generateIndexHints(filters: Record<string, any>): string[] {
    const hints: string[] = [];
    
    // Add index hints based on filter fields
    // This is highly dependent on your database schema and indexing strategy
    for (const field of Object.keys(filters)) {
      if (this.shouldUseIndex(field)) {
        hints.push(field);
      }
    }

    return hints;
  }

  private shouldUseIndex(field: string): boolean {
    // Define fields that should use indexes
    const indexedFields = [
      'industries',
      'businessType',
      'yearsExperience',
      'verificationLevel',
      'subscriptionTier'
    ];
    return indexedFields.includes(field);
  }
}