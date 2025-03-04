// src/server/services/recommendation.ts
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { calculateCompatibility } from '../utils/matching';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

// Constants for recommendation weights
const WEIGHTS = {
  INDUSTRY_MATCH: 0.35,
  INVESTMENT_MATCH: 0.25,
  EXPERIENCE_MATCH: 0.15,
  HISTORICAL_SUCCESS: 0.15,
  ACTIVITY_SCORE: 0.10
};

// Cache TTL in seconds
const CACHE_TTL = 3600; // 1 hour

export class RecommendationService {
  async getRecommendations(userId: string, limit: number = 10) {
    try {
      // Check cache first
      const cacheKey = `recommendations:${userId}`;
      const cachedRecommendations = await redis.get(cacheKey);
      
      if (cachedRecommendations) {
        return JSON.parse(cachedRecommendations);
      }

      // Get user profile
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          entrepreneurProfile: true,
          funderProfile: true,
          matches: {
            where: { status: 'matched' },
            include: {
              matchedWith: {
                include: {
                  entrepreneurProfile: true,
                  funderProfile: true
                }
              }
            }
          }
        }
      });

      if (!user) throw new Error('User not found');

      // Get potential matches
      const potentialMatches = await this.getPotentialMatches(user);
      
      // Calculate recommendation scores
      const recommendations = await Promise.all(
        potentialMatches.map(async match => {
          const score = await this.calculateRecommendationScore(user, match);
          return {
            user: match,
            score,
            reasons: await this.getRecommendationReasons(user, match, score)
          };
        })
      );

      // Sort by score and limit results
      const sortedRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Cache results
      await redis.setex(
        cacheKey,
        CACHE_TTL,
        JSON.stringify(sortedRecommendations)
      );

      return sortedRecommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  private async getPotentialMatches(user: any) {
    // Get users who haven't been matched or rejected
    const matches = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: user.id } },
          { userType: user.userType === 'entrepreneur' ? 'funder' : 'entrepreneur' },
          {
            NOT: {
              OR: [
                {
                  matches: {
                    some: {
                      targetUserId: user.id
                    }
                  }
                },
                {
                  matchedWith: {
                    some: {
                      userId: user.id
                    }
                  }
                }
              ]
            }
          }
        ]
      },
      include: {
        entrepreneurProfile: true,
        funderProfile: true,
        matches: {
          where: { status: 'matched' }
        }
      }
    });

    return matches;
  }

  private async calculateRecommendationScore(user: any, match: any): Promise<number> {
    const scores = await Promise.all([
      this.calculateIndustryScore(user, match),
      this.calculateInvestmentScore(user, match),
      this.calculateExperienceScore(user, match),
      this.calculateHistoricalSuccessScore(match),
      this.calculateActivityScore(match)
    ]);

    // Weighted average of all scores
    return scores.reduce((total, score, index) => {
      return total + score * Object.values(WEIGHTS)[index];
    }, 0);
  }

  private async calculateIndustryScore(user: any, match: any): Promise<number> {
    const userIndustries = user.userType === 'entrepreneur'
      ? user.entrepreneurProfile?.industries
      : user.funderProfile?.areasOfInterest;

    const matchIndustries = match.userType === 'entrepreneur'
      ? match.entrepreneurProfile?.industries
      : match.funderProfile?.areasOfInterest;

    if (!userIndustries || !matchIndustries) return 0;

    const commonIndustries = userIndustries.filter(i => matchIndustries.includes(i));
    return commonIndustries.length / Math.max(userIndustries.length, matchIndustries.length);
  }

  private async calculateInvestmentScore(user: any, match: any): Promise<number> {
    if (user.userType === 'entrepreneur') {
      const desiredAmount = user.entrepreneurProfile?.desiredInvestment.amount;
      const funderRange = match.funderProfile?.investmentPreferences;

      if (!desiredAmount || !funderRange) return 0;

      if (desiredAmount >= funderRange.min && desiredAmount <= funderRange.max) {
        // Score based on where amount falls within range
        return 1 - ((funderRange.max - desiredAmount) / (funderRange.max - funderRange.min));
      }
    } else {
      const desiredAmount = match.entrepreneurProfile?.desiredInvestment.amount;
      const funderRange = user.funderProfile?.investmentPreferences;

      if (!desiredAmount || !funderRange) return 0;

      if (desiredAmount >= funderRange.min && desiredAmount <= funderRange.max) {
        return 1 - ((funderRange.max - desiredAmount) / (funderRange.max - funderRange.min));
      }
    }

    return 0;
  }

  private async calculateExperienceScore(user: any, match: any): Promise<number> {
    const userExp = user.userType === 'entrepreneur'
      ? user.entrepreneurProfile?.yearsExperience
      : user.funderProfile?.yearsExperience;

    const matchExp = match.userType === 'entrepreneur'
      ? match.entrepreneurProfile?.yearsExperience
      : match.funderProfile?.yearsExperience;

    if (!userExp || !matchExp) return 0;

    // Score based on experience difference
    const expDiff = Math.abs(userExp - matchExp);
    return Math.max(0, 1 - (expDiff / 10)); // Normalize to 0-1 range
  }

  private async calculateHistoricalSuccessScore(match: any): Promise<number> {
    const successfulMatches = match.matches.filter(m => m.status === 'matched');
    const totalMatches = match.matches.length;

    if (totalMatches === 0) return 0.5; // Neutral score for new users

    return successfulMatches.length / totalMatches;
  }

  private async calculateActivityScore(match: any): Promise<number> {
    // Calculate score based on recent activity
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentActivity = await prisma.activity.count({
      where: {
        userId: match.id,
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Normalize activity score (assuming 30 activities per month is very active)
    return Math.min(1, recentActivity / 30);
  }

  private async getRecommendationReasons(user: any, match: any, score: number): Promise<string[]> {
    const reasons: string[] = [];

    // Add reasons based on high scores in specific areas
    const industryScore = await this.calculateIndustryScore(user, match);
    if (industryScore > 0.7) {
      reasons.push('Strong industry alignment');
    }

    const investmentScore = await this.calculateInvestmentScore(user, match);
    if (investmentScore > 0.7) {
      reasons.push('Ideal investment match');
    }

    const experienceScore = await this.calculateExperienceScore(user, match);
    if (experienceScore > 0.7) {
      reasons.push('Similar experience level');
    }

    const historicalScore = await this.calculateHistoricalSuccessScore(match);
    if (historicalScore > 0.7) {
      reasons.push('High success rate with matches');
    }

    const activityScore = await this.calculateActivityScore(match);
    if (activityScore > 0.7) {
      reasons.push('Very active on platform');
    }

    // Add verification level comparison
    if (user.verificationLevel !== 'None' && match.verificationLevel !== 'None') {
      reasons.push('Both profiles verified');
    }

    return reasons;
  }
}