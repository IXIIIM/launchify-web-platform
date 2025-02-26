// src/server/services/search/SearchService.ts
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

interface SearchFilters {
  industries: string[];
  investmentRange: [number, number];
  experienceYears: number;
  verificationLevel: string[];
  sortBy: 'relevance' | 'experience' | 'investment' | 'verification';
  sortDirection: 'asc' | 'desc';
}

export class SearchService {
  // Cache search results for 5 minutes
  private static readonly CACHE_TTL = 300;

  async search(term: string, filters: SearchFilters, userType: 'entrepreneur' | 'funder') {
    const cacheKey = this.generateCacheKey(term, filters, userType);
    
    // Try to get cached results
    const cachedResults = await redis.get(cacheKey);
    if (cachedResults) {
      return JSON.parse(cachedResults);
    }

    // Build base query
    const baseQuery: any = {
      where: {
        OR: [
          { projectName: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
          { industries: { hasSome: term.split(' ') } },
          { areasOfInterest: { hasSome: term.split(' ') } }
        ]
      },
      include: {
        user: {
          select: {
            verificationLevel: true,
            subscriptionTier: true
          }
        }
      }
    };

    // Apply filters
    if (filters.industries.length > 0) {
      baseQuery.where.AND = baseQuery.where.AND || [];
      baseQuery.where.AND.push({
        OR: [
          { industries: { hasSome: filters.industries } },
          { areasOfInterest: { hasSome: filters.industries } }
        ]
      });
    }

    if (filters.experienceYears > 0) {
      baseQuery.where.yearsExperience = {
        gte: filters.experienceYears
      };
    }

    if (filters.verificationLevel.length > 0) {
      baseQuery.where.user.verificationLevel = {
        in: filters.verificationLevel
      };
    }

    // Apply investment range filter based on user type
    if (userType === 'funder') {
      baseQuery.where.desiredInvestment = {
        amount: {
          gte: filters.investmentRange[0],
          lte: filters.investmentRange[1]
        }
      };
    } else {
      baseQuery.where.availableFunds = {
        gte: filters.investmentRange[0]
      };
    }

    // Apply sorting
    const orderBy: any = {};
    switch (filters.sortBy) {
      case 'experience':
        orderBy.yearsExperience = filters.sortDirection;
        break;
      case 'investment':
        if (userType === 'funder') {
          orderBy.desiredInvestment = { amount: filters.sortDirection };
        } else {
          orderBy.availableFunds = filters.sortDirection;
        }
        break;
      case 'verification':
        orderBy.user = { verificationLevel: filters.sortDirection };
        break;
      case 'relevance':
      default:
        // Custom relevance scoring
        orderBy.relevanceScore = filters.sortDirection;
        break;
    }

    baseQuery.orderBy = orderBy;

    // Execute search
    const results = userType === 'entrepreneur'
      ? await prisma.funderProfile.findMany(baseQuery)
      : await prisma.entrepreneurProfile.findMany(baseQuery);

    // Calculate relevance scores
    const scoredResults = this.calculateRelevanceScores(results, term);

    // Cache results
    await redis.setex(
      cacheKey,
      SearchService.CACHE_TTL,
      JSON.stringify(scoredResults)
    );

    return scoredResults;
  }

  private generateCacheKey(term: string, filters: SearchFilters, userType: string): string {
    return `search:${userType}:${term}:${JSON.stringify(filters)}`;
  }

  private calculateRelevanceScores(results: any[], term: string): any[] {
    const terms = term.toLowerCase().split(' ');
    
    return results.map(result => {
      let score = 0;
      const searchableText = [
        result.projectName,
        result.name,
        ...(result.industries || []),
        ...(result.areasOfInterest || [])
      ].join(' ').toLowerCase();

      // Calculate term frequency
      terms.forEach(term => {
        const regex = new RegExp(term, 'g');
        const matches = searchableText.match(regex);
        if (matches) {
          score += matches.length;
        }
      });

      // Boost score based on verification level
      const verificationBoost = {
        None: 1,
        BusinessPlan: 1.2,
        UseCase: 1.4,
        DemographicAlignment: 1.6,
        AppUXUI: 1.8,
        FiscalAnalysis: 2
      };
      score *= verificationBoost[result.user.verificationLevel as keyof typeof verificationBoost];

      // Boost score based on subscription tier
      const subscriptionBoost = {
        Basic: 1,
        Chrome: 1.1,
        Bronze: 1.2,
        Silver: 1.3,
        Gold: 1.4,
        Platinum: 1.5
      };
      score *= subscriptionBoost[result.user.subscriptionTier as keyof typeof subscriptionBoost];

      // Additional scoring factors
      score += result.yearsExperience * 0.1; // Experience bonus
      
      return {
        ...result,
        relevanceScore: score
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  async getPopularSearches(userType: 'entrepreneur' | 'funder'): Promise<string[]> {
    const cacheKey = `popular-searches:${userType}`;
    
    // Try to get cached popular searches
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get searches from the last 7 days
    const searches = await prisma.searchLog.groupBy({
      by: ['term'],
      where: {
        userType,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      _count: {
        term: true
      },
      orderBy: {
        _count: {
          term: 'desc'
        }
      },
      take: 10
    });

    const popularSearches = searches.map(s => s.term);
    
    // Cache popular searches for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(popularSearches));
    
    return popularSearches;
  }

  async getSuggestedSearches(
    term: string,
    userType: 'entrepreneur' | 'funder'
  ): Promise<string[]> {
    if (!term || term.length < 2) return [];

    const cacheKey = `suggestions:${userType}:${term}`;
    
    // Try to get cached suggestions
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get partial matches from search history
    const historySuggestions = await prisma.searchLog.findMany({
      where: {
        userType,
        term: {
          startsWith: term
        }
      },
      distinct: ['term'],
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get industry/area suggestions
    const fieldSuggestions = userType === 'entrepreneur'
      ? await prisma.funderProfile.findMany({
          where: {
            areasOfInterest: {
              hasSome: [term]
            }
          },
          distinct: ['areasOfInterest'],
          take: 5
        })
      : await prisma.entrepreneurProfile.findMany({
          where: {
            industries: {
              hasSome: [term]
            }
          },
          distinct: ['industries'],
          take: 5
        });

    const suggestions = [
      ...historySuggestions.map(s => s.term),
      ...fieldSuggestions.flatMap(s => 
        userType === 'entrepreneur' ? s.areasOfInterest : s.industries
      )
    ].filter((s, i, arr) => arr.indexOf(s) === i).slice(0, 5);

    // Cache suggestions for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(suggestions));
    
    return suggestions;
  }

  async logSearch(term: string, userType: string, userId: string): Promise<void> {
    await prisma.searchLog.create({
      data: {
        term,
        userType,
        userId
      }
    });
  }
}