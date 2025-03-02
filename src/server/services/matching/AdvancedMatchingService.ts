// src/server/services/matching/AdvancedMatchingService.ts
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import * as math from 'mathjs';
import _ from 'lodash';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

interface MatchCriteria {
  industries: string[];
  investmentRange: { min: number; max: number };
  experienceYears: number;
  businessType?: 'B2B' | 'B2C';
  timeline?: string;
  verificationLevel: string;
  location?: string;
  teamSize?: number;
  previousSuccesses?: number;
}

interface MatchWeights {
  industryAlignment: number;
  investmentFit: number;
  experienceMatch: number;
  verificationLevel: number;
  successHistory: number;
  teamCompatibility: number;
  businessModelFit: number;
  timelineAlignment: number;
}

export class AdvancedMatchingService {
  private readonly weights: MatchWeights = {
    industryAlignment: 0.25,
    investmentFit: 0.20,
    experienceMatch: 0.15,
    verificationLevel: 0.15,
    successHistory: 0.10,
    teamCompatibility: 0.05,
    businessModelFit: 0.05,
    timelineAlignment: 0.05
  };

  async findMatches(userId: string, criteria: MatchCriteria): Promise<any[]> {
    // Get user profile and type
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        entrepreneurProfile: true,
        funderProfile: true
      }
    });

    if (!user) throw new Error('User not found');

    // Get potential matches based on user type
    const potentialMatches = await this.getPotentialMatches(user);
    
    // Calculate compatibility scores
    const scoredMatches = await Promise.all(
      potentialMatches.map(async match => ({
        ...match,
        compatibilityScore: await this.calculateCompatibilityScore(user, match, criteria),
        matchReasons: await this.generateMatchReasons(user, match, criteria)
      }))
    );

    // Sort by compatibility score and apply smart filtering
    return this.applySmartFiltering(scoredMatches);
  }

  private async getPotentialMatches(user: any) {
    const matchType = user.userType === 'entrepreneur' ? 'funder' : 'entrepreneur';
    
    // Get existing matches to exclude
    const existingMatches = await prisma.match.findMany({
      where: {
        OR: [
          { userId: user.id },
          { matchedWithId: user.id }
        ]
      },
      select: { userId: true, matchedWithId: true }
    });

    const excludeIds = [
      user.id,
      ...existingMatches.map(m => m.userId),
      ...existingMatches.map(m => m.matchedWithId)
    ];

    // Get potential matches with sophisticated filtering
    return await prisma.user.findMany({
      where: {
        AND: [
          { userType: matchType },
          { id: { notIn: excludeIds } },
          { emailVerified: true },
          { subscriptionTier: { not: 'Basic' } }
        ]
      },
      include: {
        entrepreneurProfile: true,
        funderProfile: true,
        matches: {
          where: {
            status: 'accepted'
          },
          include: {
            messages: true
          }
        }
      }
    });
  }

  private async calculateCompatibilityScore(user: any, match: any, criteria: MatchCriteria): Promise<number> {
    const scores = {
      industryAlignment: await this.calculateIndustryAlignment(user, match),
      investmentFit: this.calculateInvestmentFit(user, match),
      experienceMatch: this.calculateExperienceMatch(user, match),
      verificationLevel: this.calculateVerificationScore(user, match),
      successHistory: await this.calculateSuccessHistory(match),
      teamCompatibility: await this.calculateTeamCompatibility(user, match),
      businessModelFit: this.calculateBusinessModelFit(user, match),
      timelineAlignment: this.calculateTimelineAlignment(user, match)
    };

    // Apply machine learning adjustments if available
    const mlAdjustments = await this.getMLAdjustments(user.id, match.id);
    
    // Calculate weighted sum
    return Object.entries(scores).reduce((total, [key, score]) => {
      const weight = this.weights[key as keyof MatchWeights];
      const mlAdjustment = mlAdjustments[key] || 1;
      return total + (score * weight * mlAdjustment);
    }, 0);
  }

  private async calculateIndustryAlignment(user: any, match: any): Promise<number> {
    const userIndustries = user.userType === 'entrepreneur'
      ? user.entrepreneurProfile.industries
      : user.funderProfile.areasOfInterest;

    const matchIndustries = match.userType === 'entrepreneur'
      ? match.entrepreneurProfile.industries
      : match.funderProfile.areasOfInterest;

    // Calculate Jaccard similarity
    const intersection = _.intersection(userIndustries, matchIndustries).length;
    const union = _.union(userIndustries, matchIndustries).length;

    // Get industry relationship scores from our knowledge base
    const relationshipScores = await this.getIndustryRelationshipScores(userIndustries, matchIndustries);

    return (intersection / union) * 0.7 + relationshipScores * 0.3;
  }

  private calculateInvestmentFit(user: any, match: any): number {
    if (user.userType === 'entrepreneur') {
      const desired = user.entrepreneurProfile.desiredInvestment.amount;
      const available = match.funderProfile.availableFunds;
      const min = match.funderProfile.investmentPreferences.minAmount || 0;
      const max = match.funderProfile.investmentPreferences.maxAmount || Infinity;

      if (desired < min || desired > max) return 0;
      return math.exp(-math.abs(desired - available) / available);
    } else {
      const available = user.funderProfile.availableFunds;
      const desired = match.entrepreneurProfile.desiredInvestment.amount;
      return math.exp(-math.abs(desired - available) / available);
    }
  }

  private calculateExperienceMatch(user: any, match: any): number {
    const userExp = user.userType === 'entrepreneur'
      ? user.entrepreneurProfile.yearsExperience
      : user.funderProfile.yearsExperience;

    const matchExp = match.userType === 'entrepreneur'
      ? match.entrepreneurProfile.yearsExperience
      : match.funderProfile.yearsExperience;

    // Consider experience complementarity
    const expDiff = math.abs(userExp - matchExp);
    const complementaryBonus = user.userType !== match.userType && matchExp > userExp ? 0.2 : 0;

    return math.exp(-expDiff / 10) + complementaryBonus;
  }

  private async calculateSuccessHistory(match: any): Promise<number> {
    // Consider various success indicators
    const successfulMatches = await prisma.match.count({
      where: {
        OR: [
          { userId: match.id },
          { matchedWithId: match.id }
        ],
        status: 'accepted',
        // Additional criteria for "successful" matches
        messages: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
            }
          }
        }
      }
    });

    const profile = match.entrepreneurProfile || match.funderProfile;
    const verificationScore = this.calculateVerificationScore(null, match);
    const activeTime = Date.now() - profile.createdAt.getTime();
    const activityScore = math.min(1, activeTime / (365 * 24 * 60 * 60 * 1000));

    return (successfulMatches * 0.4 + verificationScore * 0.4 + activityScore * 0.2);
  }

  private calculateVerificationScore(user: any | null, match: any): number {
    const levels = [
      'None',
      'BusinessPlan',
      'UseCase',
      'DemographicAlignment',
      'AppUXUI',
      'FiscalAnalysis'
    ];

    const levelScore = levels.indexOf(match.verificationLevel) / (levels.length - 1);
    
    // If comparing two users, consider verification level compatibility
    if (user) {
      const userLevel = levels.indexOf(user.verificationLevel);
      const matchLevel = levels.indexOf(match.verificationLevel);
      const levelDiff = math.abs(userLevel - matchLevel);
      return (levelScore * 0.7 + (1 - levelDiff / levels.length) * 0.3);
    }

    return levelScore;
  }

  private async calculateTeamCompatibility(user: any, match: any): Promise<number> {
    // Consider team size, roles, and skills complementarity
    const userProfile = user.entrepreneurProfile || user.funderProfile;
    const matchProfile = match.entrepreneurProfile || match.funderProfile;

    // Team size compatibility
    const sizeDiff = math.abs(userProfile.teamSize - matchProfile.teamSize);
    const sizeScore = math.exp(-sizeDiff / 5);

    // Skills complementarity (if available)
    const skillsScore = await this.calculateSkillsComplementarity(userProfile, matchProfile);

    return (sizeScore * 0.4 + skillsScore * 0.6);
  }

  private calculateBusinessModelFit(user: any, match: any): number {
    if (user.userType === 'entrepreneur' && match.userType === 'funder') {
      const entrepreneur = user.entrepreneurProfile;
      const funder = match.funderProfile;

      // Consider business type preferences
      const businessTypeMatch = funder.preferredBusinessTypes.includes(entrepreneur.businessType);
      
      // Consider market size alignment
      const marketSizeMatch = this.calculateMarketSizeAlignment(
        entrepreneur.targetMarketSize,
        funder.preferredMarketSize
      );

      return (businessTypeMatch ? 0.6 : 0) + (marketSizeMatch * 0.4);
    }

    return 1; // Default for other combinations
  }

  private calculateTimelineAlignment(user: any, match: any): number {
    if (user.userType === 'entrepreneur') {
      const entrepreneur = user.entrepreneurProfile;
      const funder = match.funderProfile;

      // Convert timeline strings to normalized numbers for comparison
      const timelineMap = {
        'immediate': 0,
        '0-6 months': 0.2,
        '6-12 months': 0.4,
        '1-2 years': 0.6,
        '2-3 years': 0.8,
        '3+ years': 1
      };

      const entrepreneurTimeline = timelineMap[entrepreneur.timeline];
      const funderTimeline = timelineMap[funder.preferredTimeline];

      return 1 - math.abs(entrepreneurTimeline - funderTimeline);
    }

    return 1; // Default for other combinations
  }

  private async getMLAdjustments(userId: string, matchId: string): Promise<Record<string, number>> {
    // In a real implementation, this would call our ML service
    // For now, return default values
    return {
      industryAlignment: 1,
      investmentFit: 1,
      experienceMatch: 1,
      verificationLevel: 1,
      successHistory: 1,
      teamCompatibility: 1,
      businessModelFit: 1,
      timelineAlignment: 1
    };
  }

  private async getIndustryRelationshipScores(
    industries1: string[],
    industries2: string[]
  ): Promise<number> {
    // Get industry relationship scores from cache or calculate
    const cacheKey = `industry_rel:${industries1.sort().join(',')}:${industries2.sort().join(',')}`;
    let score = await redis.get(cacheKey);

    if (!score) {
      // Calculate based on historical successful matches
      score = await this.calculateIndustryRelationships(industries1, industries2);
      await redis.set(cacheKey, score, 'EX', 24 * 60 * 60); // Cache for 24 hours
    }

    return parseFloat(score);
  }

  private async calculateIndustryRelationships(
    industries1: string[],
    industries2: string[]
  ): Promise<number> {
    // Get successful matches involving these industries
    const successfulMatches = await prisma.match.findMany({
      where: {
        status: 'accepted',
        AND: [
          {
            OR: [
              {
                user: {
                  entrepreneurProfile: {
                    industries: {
                      hasSome: industries1
                    }
                  }
                }
              },
              {
                user: {
                  funderProfile: {
                    areasOfInterest: {
                      hasSome: industries1
                    }
                  }
                }
              }
            ]
          },
          {
            OR: [
              {
                matchedWith: {
                  entrepreneurProfile: {
                    industries: {
                      hasSome: industries2
                    }
                  }
                }
              },
              {
                matchedWith: {
                  funderProfile: {
                    areasOfInterest: {
                      hasSome: industries2
                    }
                  }
                }
              }
            ]
          }
        ]
      },
      include: {
        messages: true
      }
    });

    // Calculate relationship score based on match success
    let totalScore = 0;
    let matches = 0;

    for (const match of successfulMatches) {
      const messageCount = match.messages.length;
      const lastMessage = match.messages[match.messages.length - 1];
      const duration = lastMessage 
        ? lastMessage.createdAt.getTime() - match.createdAt.getTime()
        : 0;

      // Score based on engagement level
      const engagementScore = math.min(messageCount / 100, 1) * 0.5 +
        math.min(duration / (90 * 24 * 60 * 60 * 1000), 1) * 0.5;

      totalScore += engagementScore;
      matches++;
    }

    return matches > 0 ? totalScore / matches : 0.5;
  }

  private async calculateSkillsComplementarity(
    profile1: any,
    profile2: any
  ): Promise<number> {
    const skills1 = profile1.skills || [];
    const skills2 = profile2.skills || [];

    // Group skills by category
    const categories1 = _.groupBy(skills1, 'category');
    const categories2 = _.groupBy(skills2, 'category');

    // Calculate complementarity score for each category
    let totalScore = 0;
    let categories = 0;

    const allCategories = _.union(
      Object.keys(categories1),
      Object.keys(categories2)
    );

    for (const category of allCategories) {
      const catSkills1 = categories1[category] || [];
      const catSkills2 = categories2[category] || [];

      // Calculate overlap and unique skills
      const overlap = _.intersectionBy(catSkills1, catSkills2, 'name').length;
      const unique = _.unionBy(catSkills1, catSkills2, 'name').length;

      // Higher score for complementary skills (less overlap)
      const categoryScore = 1 - (overlap / unique);
      totalScore += categoryScore;
      categories++;
    }

    return categories > 0 ? totalScore / categories : 0.5;
  }

  private async generateMatchReasons(
    user: any,
    match: any,
    criteria: MatchCriteria
  ): Promise<string[]> {
    const reasons: string[] = [];

    // Industry alignment reasons
    const commonIndustries = await this.getCommonIndustries(user, match);
    if (commonIndustries.length > 0) {
      reasons.push(
        `Aligned industries: ${commonIndustries.slice(0, 3).join(', ')}${
          commonIndustries.length > 3 ? ' and more' : ''
        }`
      );
    }

    // Investment fit reasons
    const investmentFit = this.calculateInvestmentFit(user, match);
    if (investmentFit > 0.7) {
      const profile = match.userType === 'entrepreneur' 
        ? match.entrepreneurProfile 
        : match.funderProfile;
      reasons.push(
        `Strong investment alignment with ${profile.name}`
      );
    }

    // Experience match reasons
    const expMatch = this.calculateExperienceMatch(user, match);
    if (expMatch > 0.8) {
      reasons.push('Highly compatible experience levels');
    } else if (expMatch > 0.6) {
      reasons.push('Complementary experience levels');
    }

    // Success history reasons
    const successHistory = await this.calculateSuccessHistory(match);
    if (successHistory > 0.7) {
      reasons.push('Strong track record of successful collaborations');
    }

    // Verification level reasons
    const verificationScore = this.calculateVerificationScore(user, match);
    if (verificationScore > 0.8) {
      reasons.push('High verification level indicating trustworthiness');
    }

    // Team compatibility reasons
    const teamCompat = await this.calculateTeamCompatibility(user, match);
    if (teamCompat > 0.7) {
      reasons.push('Strong team composition compatibility');
    }

    // Timeline alignment reasons
    const timelineAlign = this.calculateTimelineAlignment(user, match);
    if (timelineAlign > 0.8) {
      reasons.push('Highly aligned investment timelines');
    }

    return reasons;
  }

  private async getCommonIndustries(user: any, match: any): Promise<string[]> {
    const userIndustries = user.userType === 'entrepreneur'
      ? user.entrepreneurProfile.industries
      : user.funderProfile.areasOfInterest;

    const matchIndustries = match.userType === 'entrepreneur'
      ? match.entrepreneurProfile.industries
      : match.funderProfile.areasOfInterest;

    return _.intersection(userIndustries, matchIndustries);
  }

  private applySmartFiltering(matches: any[]): any[] {
    // Sort by compatibility score
    let filteredMatches = _.orderBy(matches, ['compatibilityScore'], ['desc']);

    // Apply diversity filtering to ensure variety in matches
    filteredMatches = this.applyDiversityFiltering(filteredMatches);

    // Apply recency bias for newer profiles with high potential
    filteredMatches = this.applyRecencyBias(filteredMatches);

    return filteredMatches;
  }

  private applyDiversityFiltering(matches: any[]): any[] {
    const industries = new Set<string>();
    const sizes = new Set<string>();
    const filtered: any[] = [];

    for (const match of matches) {
      const profile = match.entrepreneurProfile || match.funderProfile;
      const primaryIndustry = profile.industries[0];
      const size = profile.teamSize;

      // Add some matches even if they're from represented categories
      // to maintain quality while ensuring diversity
      if (
        filtered.length < 10 ||
        !industries.has(primaryIndustry) ||
        !sizes.has(size) ||
        match.compatibilityScore > 0.8
      ) {
        filtered.push(match);
        industries.add(primaryIndustry);
        sizes.add(size);
      }
    }

    return filtered;
  }

  private applyRecencyBias(matches: any[]): any[] {
    // Calculate recency scores
    const scoredMatches = matches.map(match => {
      const profile = match.entrepreneurProfile || match.funderProfile;
      const ageInDays = (Date.now() - profile.createdAt.getTime()) / (24 * 60 * 60 * 1000);
      const recencyScore = math.exp(-ageInDays / 30); // Exponential decay over 30 days
      
      return {
        ...match,
        finalScore: match.compatibilityScore * (0.8 + 0.2 * recencyScore)
      };
    });

    return _.orderBy(scoredMatches, ['finalScore'], ['desc']);
  }
}