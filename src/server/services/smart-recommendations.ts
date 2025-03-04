// src/server/services/smart-recommendations.ts
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { analyzeUserBehavior } from '../utils/analytics';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

interface BehaviorPattern {
  preferredIndustries: string[];
  investmentRange: { min: number; max: number };
  activityTimes: string[];
  responseRate: number;
  successfulMatchRate: number;
}

interface MatchPattern {
  industryAlignment: number;
  experienceGap: number;
  investmentAlignment: number;
  verificationLevel: string;
  conversionRate: number;
}

export class SmartRecommendationService {
  async getSmartRecommendations(userId: string) {
    const [
      userBehavior,
      successfulMatches,
      recentInteractions
    ] = await Promise.all([
      this.getUserBehaviorPattern(userId),
      this.getSuccessfulMatchPatterns(userId),
      this.getRecentInteractions(userId)
    ]);

    const potentialMatches = await this.getPotentialMatches(userId);
    const rankedMatches = await this.rankMatchesByPattern(
      potentialMatches,
      userBehavior,
      successfulMatches
    );

    return this.applyContextualBoosts(rankedMatches, recentInteractions);
  }

  private async getUserBehaviorPattern(userId: string): Promise<BehaviorPattern> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        matches: {
          include: {
            matchedWith: true
          }
        },
        swipeHistory: true,
        messageHistory: true
      }
    });

    if (!user) throw new Error('User not found');

    const swipeData = user.swipeHistory;
    const messageData = user.messageHistory;
    
    return {
      preferredIndustries: this.analyzeIndustryPreferences(swipeData),
      investmentRange: this.analyzeInvestmentPreferences(swipeData),
      activityTimes: this.analyzeActivityPatterns(messageData),
      responseRate: this.calculateResponseRate(messageData),
      successfulMatchRate: this.calculateMatchRate(user.matches)
    };
  }

  private async getSuccessfulMatchPatterns(userId: string): Promise<MatchPattern[]> {
    const successfulMatches = await prisma.match.findMany({
      where: {
        OR: [
          { userId, status: 'matched' },
          { matchedWithId: userId, status: 'matched' }
        ]
      },
      include: {
        user: {
          include: {
            entrepreneurProfile: true,
            funderProfile: true
          }
        },
        matchedWith: {
          include: {
            entrepreneurProfile: true,
            funderProfile: true
          }
        }
      }
    });

    return successfulMatches.map(match => ({
      industryAlignment: this.calculateIndustryAlignment(match),
      experienceGap: this.calculateExperienceGap(match),
      investmentAlignment: this.calculateInvestmentAlignment(match),
      verificationLevel: match.matchedWith.verificationLevel,
      conversionRate: this.calculateConversionRate(match)
    }));
  }

  private async rankMatchesByPattern(
    matches: any[],
    behavior: BehaviorPattern,
    patterns: MatchPattern[]
  ) {
    return matches.map(match => {
      const baseScore = this.calculateBaseScore(match);
      const behaviorScore = this.calculateBehaviorScore(match, behavior);
      const patternScore = this.calculatePatternScore(match, patterns);
      
      const finalScore = (baseScore * 0.4) + (behaviorScore * 0.3) + (patternScore * 0.3);
      
      return {
        ...match,
        smartScore: finalScore,
        insights: this.generateInsights(match, behavior, patterns)
      };
    }).sort((a, b) => b.smartScore - a.smartScore);
  }

  private async applyContextualBoosts(matches: any[], recentInteractions: any[]) {
    const timeOfDay = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    return matches.map(match => {
      let boostScore = match.smartScore;

      // Boost based on time patterns
      if (this.isOptimalTime(match, timeOfDay, dayOfWeek)) {
        boostScore *= 1.1; // 10% boost
      }

      // Boost based on recent activity
      if (this.hasRecentActivity(match.user.id, recentInteractions)) {
        boostScore *= 1.15; // 15% boost
      }

      // Boost based on mutual connections
      const mutualConnections = this.findMutualConnections(match);
      if (mutualConnections > 0) {
        boostScore *= (1 + (mutualConnections * 0.05)); // 5% per connection
      }

      return {
        ...match,
        smartScore: Math.min(boostScore, 100), // Cap at 100
        contextualFactors: {
          optimalTime: this.isOptimalTime(match, timeOfDay, dayOfWeek),
          recentlyActive: this.hasRecentActivity(match.user.id, recentInteractions),
          mutualConnections
        }
      };
    });
  }

  private generateInsights(
    match: any,
    behavior: BehaviorPattern,
    patterns: MatchPattern[]
  ) {
    const insights = [];

    // Industry alignment insights
    if (this.hasHighIndustryAlignment(match, behavior.preferredIndustries)) {
      insights.push({
        type: 'industry',
        confidence: 'high',
        message: 'Strong industry match based on your preferences'
      });
    }

    // Investment pattern insights
    if (this.matchesInvestmentPattern(match, behavior.investmentRange)) {
      insights.push({
        type: 'investment',
        confidence: 'high',
        message: 'Investment range aligns with your successful matches'
      });
    }

    // Activity pattern insights
    if (this.hasActivityOverlap(match, behavior.activityTimes)) {
      insights.push({
        type: 'activity',
        confidence: 'medium',
        message: 'Active during similar times as you'
      });
    }

    // Success pattern insights
    const successPattern = this.findMatchingPattern(match, patterns);
    if (successPattern) {
      insights.push({
        type: 'success',
        confidence: 'high',
        message: 'Similar to your successful matches',
        details: this.getPatternDetails(successPattern)
      });
    }

    return insights;
  }

  private async getRecentInteractions(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return prisma.interaction.findMany({
      where: {
        OR: [
          { userId },
          { targetUserId: userId }
        ],
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Helper methods for analysis
  private analyzeIndustryPreferences(swipeData: any[]): string[] {
    const industryScores = new Map<string, { likes: number; total: number }>();
    
    swipeData.forEach(swipe => {
      const industries = swipe.targetIndustries || [];
      industries.forEach(industry => {
        const current = industryScores.get(industry) || { likes: 0, total: 0 };
        industryScores.set(industry, {
          likes: current.likes + (swipe.direction === 'right' ? 1 : 0),
          total: current.total + 1
        });
      });
    });

    return Array.from(industryScores.entries())
      .filter(([_, scores]) => scores.total >= 5) // Minimum sample size
      .filter(([_, scores]) => (scores.likes / scores.total) > 0.6) // >60% like rate
      .map(([industry]) => industry);
  }

  private calculateResponseRate(messageData: any[]): number {
    if (messageData.length === 0) return 0;

    const conversations = messageData.reduce((acc, msg) => {
      const convId = msg.conversationId;
      if (!acc[convId]) acc[convId] = [];
      acc[convId].push(msg);
      return acc;
    }, {});

    let respondedCount = 0;
    const totalCount = Object.keys(conversations).length;

    Object.values(conversations).forEach((msgs: any[]) => {
      if (msgs.length > 1) respondedCount++;
    });

    return respondedCount / totalCount;
  }

  private isOptimalTime(match: any, hour: number, day: number): boolean {
    const activityPattern = match.activityPattern || {};
    return activityPattern.optimalHours?.includes(hour) && 
           activityPattern.activeDays?.includes(day);
  }

  private hasRecentActivity(userId: string, interactions: any[]): boolean {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return interactions.some(interaction => 
      interaction.userId === userId && 
      new Date(interaction.createdAt) >= twentyFourHoursAgo
    );
  }

  private findMutualConnections(match: any): number {
    return match.mutualConnections?.length || 0;
  }
}