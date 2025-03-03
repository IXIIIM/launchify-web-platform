import { PrismaClient } from '@prisma/client';
import { UsageService } from '../usage/UsageService';

const prisma = new PrismaClient();

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

interface MatchCriteria {
  industries?: string[];
  investmentRange?: {
    min: number;
    max: number;
  };
  experienceYears?: number;
  verificationLevel?: string;
  businessType?: string[];
  marketSize?: string;
  timeline?: string;
  includeVerifiedOnly?: boolean;
}

export class MatchingService {
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

  private usageService: UsageService;

  constructor(usageService: UsageService) {
    this.usageService = usageService;
  }

  async findMatches(userId: string, criteria: MatchCriteria = {}) {
    // Get user profile and type
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        entrepreneurProfile: true,
        funderProfile: true,
        subscription: {
          where: {
            status: { in: ['active', 'trialing'] }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!user) throw new Error('User not found');

    // Check usage limits based on subscription tier
    const canViewMoreMatches = await this.usageService.canViewMoreMatches(userId);
    if (!canViewMoreMatches) {
      throw new Error('Daily match limit reached for your subscription tier');
    }

    // Get potential matches based on user type
    const potentialMatches = await this.getPotentialMatches(user, criteria);
    
    // Calculate compatibility scores
    const scoredMatches = await Promise.all(
      potentialMatches.map(async match => ({
        ...match,
        compatibilityScore: await this.calculateCompatibilityScore(user, match, criteria),
        matchReasons: await this.generateMatchReasons(user, match, criteria)
      }))
    );

    // Sort by compatibility score and apply smart filtering
    const filteredMatches = this.applySmartFiltering(scoredMatches);

    // Record match view in usage
    await this.usageService.recordMatchView(userId, filteredMatches.length);

    return filteredMatches;
  }

  private async getPotentialMatches(user: any, criteria: MatchCriteria) {
    const oppositeType = user.userType === 'entrepreneur' ? 'funder' : 'entrepreneur';
    const subscriptionTier = user.subscription?.[0]?.tier || 'Basic';
    
    // Get accessible tiers based on user's subscription
    const accessibleTiers = this.getAccessibleTiers(subscriptionTier);

    // Build query filters
    const filters: any = {
      userType: oppositeType,
      subscriptionTier: { in: accessibleTiers },
      id: { not: user.id }
    };

    // Add verification filter if requested
    if (criteria.includeVerifiedOnly) {
      filters.verificationLevel = { not: 'None' };
    }

    // Add industry filter if provided
    if (criteria.industries && criteria.industries.length > 0) {
      if (oppositeType === 'entrepreneur') {
        filters.entrepreneurProfile = {
          industries: { hasSome: criteria.industries }
        };
      } else {
        filters.funderProfile = {
          areasOfInterest: { hasSome: criteria.industries }
        };
      }
    }

    // Add business type filter if provided
    if (criteria.businessType && criteria.businessType.length > 0 && oppositeType === 'entrepreneur') {
      filters.entrepreneurProfile = {
        ...filters.entrepreneurProfile,
        businessType: { in: criteria.businessType }
      };
    }

    // Query potential matches
    const matches = await prisma.user.findMany({
      where: filters,
      include: {
        entrepreneurProfile: oppositeType === 'entrepreneur',
        funderProfile: oppositeType === 'funder',
        matches: {
          where: {
            OR: [
              { userId: user.id },
              { matchedWithId: user.id }
            ]
          }
        }
      }
    });

    // Filter out already matched users
    return matches.filter(match => match.matches.length === 0);
  }

  private async calculateCompatibilityScore(user: any, match: any, criteria: MatchCriteria) {
    // Calculate individual factor scores
    const industryScore = this.calculateIndustryAlignment(user, match);
    const investmentScore = this.calculateInvestmentFit(user, match);
    const experienceScore = this.calculateExperienceMatch(user, match);
    const verificationScore = this.calculateVerificationScore(user, match);
    const successScore = this.calculateSuccessHistory(user, match);
    const teamScore = this.calculateTeamCompatibility(user, match);
    const businessModelScore = this.calculateBusinessModelFit(user, match);
    const timelineScore = this.calculateTimelineAlignment(user, match);

    // Apply weights to each factor
    const weightedScore = 
      (industryScore * this.weights.industryAlignment) +
      (investmentScore * this.weights.investmentFit) +
      (experienceScore * this.weights.experienceMatch) +
      (verificationScore * this.weights.verificationLevel) +
      (successScore * this.weights.successHistory) +
      (teamScore * this.weights.teamCompatibility) +
      (businessModelScore * this.weights.businessModelFit) +
      (timelineScore * this.weights.timelineAlignment);

    // Convert to percentage
    return Math.round(weightedScore * 100);
  }

  private calculateIndustryAlignment(user: any, match: any): number {
    const userIndustries = user.userType === 'entrepreneur'
      ? user.entrepreneurProfile?.industries || []
      : user.funderProfile?.areasOfInterest || [];
    
    const matchIndustries = match.userType === 'entrepreneur'
      ? match.entrepreneurProfile?.industries || []
      : match.funderProfile?.areasOfInterest || [];

    if (userIndustries.length === 0 || matchIndustries.length === 0) {
      return 0;
    }

    const commonIndustries = userIndustries.filter((i: string) => 
      matchIndustries.includes(i)
    );

    return commonIndustries.length / Math.max(userIndustries.length, matchIndustries.length);
  }

  private calculateInvestmentFit(user: any, match: any): number {
    if (user.userType === 'entrepreneur' && match.userType === 'funder') {
      const desiredAmount = user.entrepreneurProfile?.desiredInvestment?.amount || 0;
      const funderRange = match.funderProfile?.investmentPreferences || { min: 0, max: 0 };

      if (desiredAmount === 0 || funderRange.max === 0) {
        return 0;
      }

      if (desiredAmount >= funderRange.min && desiredAmount <= funderRange.max) {
        return 1;
      } else if (desiredAmount < funderRange.min) {
        return Math.max(0, 1 - (funderRange.min - desiredAmount) / funderRange.min);
      } else {
        return Math.max(0, 1 - (desiredAmount - funderRange.max) / funderRange.max);
      }
    } else if (user.userType === 'funder' && match.userType === 'entrepreneur') {
      const desiredAmount = match.entrepreneurProfile?.desiredInvestment?.amount || 0;
      const funderRange = user.funderProfile?.investmentPreferences || { min: 0, max: 0 };

      if (desiredAmount === 0 || funderRange.max === 0) {
        return 0;
      }

      if (desiredAmount >= funderRange.min && desiredAmount <= funderRange.max) {
        return 1;
      } else if (desiredAmount < funderRange.min) {
        return Math.max(0, 1 - (funderRange.min - desiredAmount) / funderRange.min);
      } else {
        return Math.max(0, 1 - (desiredAmount - funderRange.max) / funderRange.max);
      }
    }

    return 0.5; // Default for entrepreneur-entrepreneur or funder-funder matches
  }

  private calculateExperienceMatch(user: any, match: any): number {
    const userExperience = user.userType === 'entrepreneur'
      ? user.entrepreneurProfile?.yearsExperience || 0
      : user.funderProfile?.yearsExperience || 0;
    
    const matchExperience = match.userType === 'entrepreneur'
      ? match.entrepreneurProfile?.yearsExperience || 0
      : match.funderProfile?.yearsExperience || 0;

    // For entrepreneur-funder matches, some experience gap is acceptable
    if (user.userType !== match.userType) {
      const gap = Math.abs(userExperience - matchExperience);
      return Math.max(0, 1 - (gap / 15)); // Scale down score for gaps up to 15 years
    }

    // For same-type matches, prefer closer experience levels
    const gap = Math.abs(userExperience - matchExperience);
    return Math.max(0, 1 - (gap / 5)); // More stringent for peer matches
  }

  private calculateVerificationScore(user: any, match: any): number {
    const levels = [
      'None',
      'BusinessPlan',
      'UseCase',
      'DemographicAlignment',
      'AppUXUI',
      'FiscalAnalysis'
    ];

    const userLevel = levels.indexOf(user.verificationLevel);
    const matchLevel = levels.indexOf(match.verificationLevel);
    
    // Higher verification levels get better scores
    const baseScore = matchLevel / (levels.length - 1);
    
    // Bonus for similar verification levels
    const levelDiff = Math.abs(userLevel - matchLevel);
    const similarityBonus = (1 - levelDiff / levels.length) * 0.3;
    
    return baseScore * 0.7 + similarityBonus;
  }

  private calculateSuccessHistory(user: any, match: any): number {
    // This would be based on past successful matches, reviews, etc.
    // For now, return a placeholder score
    return 0.7;
  }

  private calculateTeamCompatibility(user: any, match: any): number {
    if (user.userType === 'entrepreneur' && match.userType === 'funder') {
      const entrepreneur = user.entrepreneurProfile;
      const funder = match.funderProfile;
      
      if (!entrepreneur?.preferredTeamSize || !funder?.preferredTeamSize) {
        return 0.5;
      }
      
      // Calculate team size compatibility
      const teamSizeDiff = Math.abs(entrepreneur.preferredTeamSize - funder.preferredTeamSize);
      const teamSizeScore = Math.max(0, 1 - (teamSizeDiff / 10));
      
      // Calculate skill match if data available
      let skillMatchScore = 0.5;
      if (entrepreneur.preferredSkills && funder.skills) {
        const matchingSkills = entrepreneur.preferredSkills.filter((skill: string) => 
          funder.skills.includes(skill)
        );
        skillMatchScore = matchingSkills.length / entrepreneur.preferredSkills.length;
      }
      
      return (teamSizeScore + skillMatchScore) / 2;
    }
    
    return 0.5; // Default score
  }

  private calculateBusinessModelFit(user: any, match: any): number {
    if (user.userType === 'entrepreneur' && match.userType === 'funder') {
      const entrepreneur = user.entrepreneurProfile;
      const funder = match.funderProfile;
      
      if (!entrepreneur?.businessType || !funder?.preferredBusinessTypes) {
        return 0.5;
      }

      // Consider business type preferences
      const businessTypeMatch = funder.preferredBusinessTypes.includes(entrepreneur.businessType);
      
      // Consider market size alignment
      const marketSizeMatch = this.calculateMarketSizeAlignment(
        entrepreneur.targetMarketSize,
        funder.preferredMarketSize
      );

      return (businessTypeMatch ? 0.6 : 0) + (marketSizeMatch * 0.4);
    } else if (user.userType === 'funder' && match.userType === 'entrepreneur') {
      const entrepreneur = match.entrepreneurProfile;
      const funder = user.funderProfile;
      
      if (!entrepreneur?.businessType || !funder?.preferredBusinessTypes) {
        return 0.5;
      }

      // Consider business type preferences
      const businessTypeMatch = funder.preferredBusinessTypes.includes(entrepreneur.businessType);
      
      // Consider market size alignment
      const marketSizeMatch = this.calculateMarketSizeAlignment(
        entrepreneur.targetMarketSize,
        funder.preferredMarketSize
      );

      return (businessTypeMatch ? 0.6 : 0) + (marketSizeMatch * 0.4);
    }

    return 0.5; // Default for other combinations
  }

  private calculateMarketSizeAlignment(entrepreneurMarketSize: string, funderPreference: string): number {
    if (!entrepreneurMarketSize || !funderPreference) {
      return 0.5;
    }
    
    const marketSizes = ['small', 'medium', 'large', 'enterprise'];
    const entrepreneurIndex = marketSizes.indexOf(entrepreneurMarketSize.toLowerCase());
    const funderIndex = marketSizes.indexOf(funderPreference.toLowerCase());
    
    if (entrepreneurIndex === -1 || funderIndex === -1) {
      return 0.5;
    }
    
    const diff = Math.abs(entrepreneurIndex - funderIndex);
    return 1 - (diff / marketSizes.length);
  }

  private calculateTimelineAlignment(user: any, match: any): number {
    if (user.userType === 'entrepreneur' && match.userType === 'funder') {
      const entrepreneur = user.entrepreneurProfile;
      const funder = match.funderProfile;
      
      if (!entrepreneur?.timeline || !funder?.preferredTimeline) {
        return 0.5;
      }

      // Convert timeline strings to normalized numbers for comparison
      const timelineMap: {[key: string]: number} = {
        'immediate': 0,
        '0-6 months': 0.2,
        '6-12 months': 0.4,
        '1-2 years': 0.6,
        '2-3 years': 0.8,
        '3+ years': 1
      };

      const entrepreneurTimeline = timelineMap[entrepreneur.timeline.toLowerCase()] || 0.5;
      const funderTimeline = timelineMap[funder.preferredTimeline.toLowerCase()] || 0.5;

      return 1 - Math.abs(entrepreneurTimeline - funderTimeline);
    } else if (user.userType === 'funder' && match.userType === 'entrepreneur') {
      const entrepreneur = match.entrepreneurProfile;
      const funder = user.funderProfile;
      
      if (!entrepreneur?.timeline || !funder?.preferredTimeline) {
        return 0.5;
      }

      // Convert timeline strings to normalized numbers for comparison
      const timelineMap: {[key: string]: number} = {
        'immediate': 0,
        '0-6 months': 0.2,
        '6-12 months': 0.4,
        '1-2 years': 0.6,
        '2-3 years': 0.8,
        '3+ years': 1
      };

      const entrepreneurTimeline = timelineMap[entrepreneur.timeline.toLowerCase()] || 0.5;
      const funderTimeline = timelineMap[funder.preferredTimeline.toLowerCase()] || 0.5;

      return 1 - Math.abs(entrepreneurTimeline - funderTimeline);
    }

    return 0.5; // Default for other combinations
  }

  private async generateMatchReasons(user: any, match: any, criteria: MatchCriteria) {
    const reasons = [];
    
    // Industry alignment
    const industryScore = this.calculateIndustryAlignment(user, match);
    if (industryScore > 0.5) {
      const userIndustries = user.userType === 'entrepreneur'
        ? user.entrepreneurProfile?.industries || []
        : user.funderProfile?.areasOfInterest || [];
      
      const matchIndustries = match.userType === 'entrepreneur'
        ? match.entrepreneurProfile?.industries || []
        : match.funderProfile?.areasOfInterest || [];
      
      const commonIndustries = userIndustries.filter((i: string) => 
        matchIndustries.includes(i)
      );
      
      if (commonIndustries.length > 0) {
        reasons.push(`Shared interest in ${commonIndustries.slice(0, 3).join(', ')}`);
      }
    }
    
    // Investment fit
    if (user.userType === 'entrepreneur' && match.userType === 'funder') {
      const desiredAmount = user.entrepreneurProfile?.desiredInvestment?.amount;
      const funderRange = match.funderProfile?.investmentPreferences;
      
      if (desiredAmount && funderRange && desiredAmount >= funderRange.min && desiredAmount <= funderRange.max) {
        reasons.push(`Investment needs align with funder's range`);
      }
    } else if (user.userType === 'funder' && match.userType === 'entrepreneur') {
      const desiredAmount = match.entrepreneurProfile?.desiredInvestment?.amount;
      const funderRange = user.funderProfile?.investmentPreferences;
      
      if (desiredAmount && funderRange && desiredAmount >= funderRange.min && desiredAmount <= funderRange.max) {
        reasons.push(`Entrepreneur's funding needs match your investment range`);
      }
    }
    
    // Experience match
    const experienceScore = this.calculateExperienceMatch(user, match);
    if (experienceScore > 0.7) {
      reasons.push(`Similar industry experience levels`);
    }
    
    // Verification level
    if (match.verificationLevel !== 'None') {
      reasons.push(`${match.verificationLevel} verification completed`);
    }
    
    // Business model fit
    if (user.userType === 'entrepreneur' && match.userType === 'funder') {
      const entrepreneur = user.entrepreneurProfile;
      const funder = match.funderProfile;
      
      if (entrepreneur?.businessType && funder?.preferredBusinessTypes && 
          funder.preferredBusinessTypes.includes(entrepreneur.businessType)) {
        reasons.push(`Your ${entrepreneur.businessType} business matches funder's interests`);
      }
    } else if (user.userType === 'funder' && match.userType === 'entrepreneur') {
      const entrepreneur = match.entrepreneurProfile;
      const funder = user.funderProfile;
      
      if (entrepreneur?.businessType && funder?.preferredBusinessTypes && 
          funder.preferredBusinessTypes.includes(entrepreneur.businessType)) {
        reasons.push(`Entrepreneur's ${entrepreneur.businessType} business matches your interests`);
      }
    }
    
    // Timeline alignment
    const timelineScore = this.calculateTimelineAlignment(user, match);
    if (timelineScore > 0.7) {
      reasons.push(`Timeline expectations are well-aligned`);
    }
    
    return reasons;
  }

  private applySmartFiltering(matches: any[]) {
    // Sort by compatibility score (highest first)
    const sortedMatches = [...matches].sort((a, b) => 
      b.compatibilityScore - a.compatibilityScore
    );
    
    // Apply diversity filtering to ensure variety
    // For now, just return the top matches
    return sortedMatches.slice(0, 20);
  }

  private getAccessibleTiers(userTier: string): string[] {
    const tierHierarchy = [
      'Basic',
      'Chrome',
      'Bronze',
      'Silver',
      'Gold',
      'Platinum'
    ];
    
    const userTierIndex = tierHierarchy.indexOf(userTier);
    if (userTierIndex === -1) return ['Basic']; // Fallback
    
    // User can access their tier and all tiers below
    return tierHierarchy.slice(0, userTierIndex + 1);
  }
} 