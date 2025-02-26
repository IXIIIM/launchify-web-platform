<<<<<<< HEAD
// src/server/services/search/SearchIndexService.ts
=======
>>>>>>> feature/security-implementation
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { createHash } from 'crypto';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

interface SearchableField {
  field: string;
  weight: number;
  type: 'text' | 'number' | 'array' | 'range';
}

interface SearchOptions {
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
  userType?: 'entrepreneur' | 'funder';
}

export class SearchIndexService {
  private readonly searchableFields: Record<string, SearchableField[]> = {
    entrepreneur: [
      { field: 'projectName', weight: 2.0, type: 'text' },
      { field: 'industries', weight: 1.5, type: 'array' },
      { field: 'businessType', weight: 1.0, type: 'text' },
      { field: 'yearsExperience', weight: 0.8, type: 'number' },
      { field: 'desiredInvestment.amount', weight: 1.2, type: 'range' },
      { field: 'features', weight: 1.0, type: 'array' },
      { field: 'verificationLevel', weight: 0.5, type: 'text' }
    ],
    funder: [
      { field: 'name', weight: 2.0, type: 'text' },
      { field: 'areasOfInterest', weight: 1.5, type: 'array' },
      { field: 'availableFunds', weight: 1.2, type: 'range' },
      { field: 'yearsExperience', weight: 0.8, type: 'number' },
      { field: 'certifications', weight: 1.0, type: 'array' },
      { field: 'verificationLevel', weight: 0.5, type: 'text' }
    ]
  };

  private readonly cacheTTL = 3600; // 1 hour cache expiry

  // Index a single profile
  async indexProfile(userId: string, userType: 'entrepreneur' | 'funder'): Promise<void> {
    try {
      // Get profile data
      const profile = await this.getProfileData(userId, userType);
      if (!profile) return;

      // Generate search tokens
      const searchTokens = this.generateSearchTokens(profile, userType);

      // Store in Redis
      const indexKey = `search:${userType}:${userId}`;
      await redis.hmset(indexKey, {
        tokens: JSON.stringify(searchTokens),
        profile: JSON.stringify(profile),
        timestamp: Date.now()
      });

      // Update search index
      for (const token of searchTokens) {
        await redis.zadd(`search:${userType}:index:${token.field}`, token.score, userId);
      }
    } catch (error) {
      console.error('Error indexing profile:', error);
      throw error;
    }
  }

  // Search profiles with filtering and sorting
  async searchProfiles(query: string, options: SearchOptions = {}): Promise<any[]> {
    try {
      const {
        filters = {},
        sort,
        page = 1,
        limit = 20,
        userType = 'entrepreneur'
      } = options;

      const cacheKey = this.generateCacheKey(query, options);
      const cachedResults = await redis.get(cacheKey);

      if (cachedResults) {
        return JSON.parse(cachedResults);
      }

      // Get relevant profile IDs from index
      const matchingIds = await this.findMatchingProfiles(query, userType, filters);

      // Sort results
      let sortedIds = matchingIds;
      if (sort) {
        sortedIds = await this.sortResults(matchingIds, sort, userType);
      }

      // Paginate
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedIds = sortedIds.slice(start, end);

      // Get full profile data
      const results = await Promise.all(
        paginatedIds.map(id => this.getProfileData(id, userType))
      );

      // Cache results
      await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(results));

      return results;
    } catch (error) {
      console.error('Error searching profiles:', error);
      throw error;
    }
  }

  // Reindex all profiles
  async reindexAll(): Promise<void> {
    try {
      const entrepreneurs = await prisma.entrepreneurProfile.findMany({
        select: { userId: true }
      });

      const funders = await prisma.funderProfile.findMany({
        select: { userId: true }
      });

      await Promise.all([
        ...entrepreneurs.map(e => this.indexProfile(e.userId, 'entrepreneur')),
        ...funders.map(f => this.indexProfile(f.userId, 'funder'))
      ]);
    } catch (error) {
      console.error('Error reindexing all profiles:', error);
      throw error;
    }
  }

  // Helper: Get profile data
  private async getProfileData(userId: string, userType: 'entrepreneur' | 'funder'): Promise<any> {
    const profile = await prisma[`${userType}Profile`].findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            verificationLevel: true,
            subscriptionTier: true
          }
        }
      }
    });

    return profile ? { ...profile, ...profile.user } : null;
  }

  // Helper: Generate search tokens
  private generateSearchTokens(profile: any, userType: 'entrepreneur' | 'funder'): Array<{ field: string; score: number }> {
    const tokens: Array<{ field: string; score: number }> = [];
    const fields = this.searchableFields[userType];

    for (const { field, weight, type } of fields) {
      const value = this.getNestedValue(profile, field);
      if (value === undefined) continue;

      switch (type) {
        case 'text':
          tokens.push({
            field: this.normalizeText(value),
            score: weight
          });
          break;
        case 'array':
          if (Array.isArray(value)) {
            value.forEach(item => {
              tokens.push({
                field: this.normalizeText(item),
                score: weight
              });
            });
          }
          break;
        case 'number':
        case 'range':
          tokens.push({
            field: `${field}:${value}`,
            score: weight
          });
          break;
      }
    }

    return tokens;
  }

  // Helper: Find matching profiles
  private async findMatchingProfiles(
    query: string,
    userType: 'entrepreneur' | 'funder',
    filters: Record<string, any>
  ): Promise<string[]> {
    const searchTerms = this.normalizeText(query).split(' ');
    const matchingSets: string[][] = [];

    // Search by terms
    for (const term of searchTerms) {
      const matches = await redis.zrange(`search:${userType}:index:${term}`, 0, -1);
      if (matches.length > 0) {
        matchingSets.push(matches);
      }
    }

    // Apply filters
    let matchingIds = this.intersectSets(matchingSets);
    if (Object.keys(filters).length > 0) {
      matchingIds = await this.applyFilters(matchingIds, filters, userType);
    }

    return matchingIds;
  }

  // Helper: Sort results
  private async sortResults(
    ids: string[],
    sort: { field: string; direction: 'asc' | 'desc' },
    userType: 'entrepreneur' | 'funder'
  ): Promise<string[]> {
    const profiles = await Promise.all(
      ids.map(id => this.getProfileData(id, userType))
    );

    return profiles
      .sort((a, b) => {
        const aValue = this.getNestedValue(a, sort.field);
        const bValue = this.getNestedValue(b, sort.field);
        return sort.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      })
      .map(p => p.userId);
  }

  // Helper: Apply filters
  private async applyFilters(
    ids: string[],
    filters: Record<string, any>,
    userType: 'entrepreneur' | 'funder'
  ): Promise<string[]> {
    const profiles = await Promise.all(
      ids.map(id => this.getProfileData(id, userType))
    );

    return profiles
      .filter(profile => {
        return Object.entries(filters).every(([field, value]) => {
          const profileValue = this.getNestedValue(profile, field);
          if (Array.isArray(value)) {
            return value.some(v => Array.isArray(profileValue)
              ? profileValue.includes(v)
              : profileValue === v);
          }
          if (typeof value === 'object' && value !== null) {
            const { min, max } = value;
            if (min !== undefined && profileValue < min) return false;
            if (max !== undefined && profileValue > max) return false;
            return true;
          }
          return profileValue === value;
        });
      })
      .map(p => p.userId);
  }

  // Helper: Generate cache key
  private generateCacheKey(query: string, options: SearchOptions): string {
    const key = `search:cache:${query}:${JSON.stringify(options)}`;
    return createHash('md5').update(key).digest('hex');
  }

  // Helper: Get nested object value
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => 
      current && current[key] !== undefined ? current[key] : undefined, obj);
  }

  // Helper: Normalize text for search
  private normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  // Helper: Intersect multiple sets
  private intersectSets(sets: string[][]): string[] {
    if (sets.length === 0) return [];
    if (sets.length === 1) return sets[0];

    return sets.reduce((a, b) => {
      return a.filter(value => b.includes(value));
    });
  }
}