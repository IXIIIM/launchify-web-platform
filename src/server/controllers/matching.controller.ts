// src/server/controllers/matching.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { UsageService } from '../services/usage';
import { NotFoundError, ValidationError } from '../utils/errors';

const prisma = new PrismaClient();
const usageService = new UsageService();

interface AuthRequest extends Request {
  user: any;
}

// Validation schemas
const matchPreferencesSchema = z.object({
  industries: z.array(z.string()),
  investmentRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }),
  experienceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }),
  location: z.string().optional(),
  businessType: z.enum(['B2B', 'B2C']).optional()
});

export const getPotentialMatches = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has reached their daily match limit
    const canViewMatches = await usageService.trackMatch(req.user.id);
    if (!canViewMatches) {
      throw new ValidationError('Daily match limit reached', [{
        field: 'matches',
        message: 'You have reached your daily match limit'
      }]);
    }

    const { minCompatibility = 0.6 } = req.query;

    // Get existing matches to exclude
    const existingMatches = await prisma.match.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { matchedWithId: req.user.id }
        ]
      },
      select: { matchedWithId: true, userId: true }
    });

    const excludeUserIds = [
      req.user.id,
      ...existingMatches.map(match => match.matchedWithId),
      ...existingMatches.map(match => match.userId)
    ];

    // Get user's profile and preferences
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        entrepreneurProfile: true,
        funderProfile: true,
        matchPreferences: true,
        location: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get potential matches
    const potentialMatches = await prisma.user.findMany({
      where: {
        AND: [
          { userType: user.userType === 'entrepreneur' ? 'funder' : 'entrepreneur' },
          { id: { notIn: excludeUserIds } },
          { emailVerified: true },
          { phoneVerified: true }
        ]
      },
      include: {
        entrepreneurProfile: true,
        funderProfile: true,
        location: true,
        verificationRequests: {
          where: { status: 'approved' }
        }
      }
    });

    // Calculate compatibility and apply filters
    const compatibilityResults = await Promise.all(
      potentialMatches.map(async (match) => {
        const score = await calculateCompatibility(user, match);
        const factors = await calculateCompatibilityFactors(user, match);
        return {
          match,
          score,
          factors,
          matchQuality: getMatchQuality(score)
        };
      })
    );

    // Filter and sort matches
    const qualifiedMatches = compatibilityResults
      .filter(result => result.score >= Number(minCompatibility) * 100)
      .sort((a, b) => b.score - a.score);

    // Format response
    const matches = qualifiedMatches.map(({ match, score, factors, matchQuality }) => ({
      id: match.id,
      user: {
        type: match.userType,
        ...(match.userType === 'entrepreneur'
          ? match.entrepreneurProfile
          : match.funderProfile)
      },
      compatibility: score,
      matchQuality,
      factors,
      matchReasons: getMatchReasons(user, match),
      location: match.location,
      verificationLevel: match.verificationLevel,
      verifications: match.verificationRequests
    }));

    res.json(matches);
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    console.error('Error getting potential matches:', error);
    res.status(500).json({ message: 'Error fetching matches' });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = matchPreferencesSchema.parse(req.body);

    await prisma.matchPreferences.upsert({
      where: { userId: req.user.id },
      update: validatedData,
      create: {
        ...validatedData,
        userId: req.user.id
      }
    });

    res.json({
      message: 'Match preferences updated successfully',
      preferences: validatedData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
};

export const handleSwipe = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req;
    const { matchId, direction } = req.body;

    if (!['left', 'right'].includes(direction)) {
      throw new ValidationError('Invalid swipe direction', [{
        field: 'direction',
        message: 'Direction must be either left or right'
      }]);
    }

    if (direction === 'left') {
      // Create rejected match record
      await prisma.match.create({
        data: {
          userId: user.id,
          matchedWithId: matchId,
          status: 'rejected',
          compatibility: 0
        }
      });
      return res.json({ success: true });
    }

    // Calculate compatibility score
    const potentialMatch = await prisma.user.findUnique({
      where: { id: matchId },
      include: {
        entrepreneurProfile: true,
        funderProfile: true,
        location: true
      }
    });

    if (!potentialMatch) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const score = await calculateCompatibility(user, potentialMatch);
    const factors = await calculateCompatibilityFactors(user, potentialMatch);
    const matchQuality = getMatchQuality(score / 100);

    // Check for existing match
    const existingMatch = await prisma.match.findFirst({
      where: {
        userId: matchId,
        matchedWithId: user.id,
        status: 'pending'
      }
    });

    if (existingMatch) {
      // Mutual match!
      await prisma.match.update({
        where: { id: existingMatch.id },
        data: { 
          status: 'accepted',
          compatibilityFactors: factors,
          matchQuality
        }
      });

      // Create notifications
      await createMatchNotifications(user.id, matchId, matchQuality);

      // Create chat room for matched users
      await prisma.chatRoom.create({
        data: {
          participants: {
            connect: [
              { id: user.id },
              { id: matchId }
            ]
          }
        }
      });

      return res.json({ 
        isMatch: true, 
        matchDetails: {
          ...existingMatch,
          compatibility: score,
          matchQuality,
          factors
        }
      });
    }

    // Create new pending match
    const newMatch = await prisma.match.create({
      data: {
        userId: user.id,
        matchedWithId: matchId,
        status: 'pending',
        compatibility: score,
        compatibilityFactors: factors,
        matchQuality
      }
    });

    res.json({ isMatch: false, match: newMatch });
  } catch (error) {
    console.error('Error handling swipe:', error);
    res.status(500).json({ message: 'Error processing swipe' });
  }
};

export const handleSuperLike = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req;
    const { matchId } = req.body;

    // Verify user has super likes available
    const canSuperLike = await usageService.canUseSuperLike(user.id);

    if (!canSuperLike) {
      return res.status(429).json({
        message: 'No super likes remaining for your subscription tier'
      });
    }

    // Calculate match compatibility with boosted score
    const potentialMatch = await prisma.user.findUnique({
      where: { id: matchId },
      include: {
        entrepreneurProfile: true,
        funderProfile: true,
        location: true
      }
    });

    if (!potentialMatch) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const score = await calculateCompatibility(user, potentialMatch);
    const factors = await calculateCompatibilityFactors(user, potentialMatch);
    const boostedScore = Math.min(100, score * 1.2); // 20% compatibility boost
    const matchQuality = getMatchQuality(boostedScore / 100);

    // Check for existing match from other user
    const existingMatch = await prisma.match.findFirst({
      where: {
        userId: matchId,
        matchedWithId: user.id,
        status: 'pending'
      }
    });

    if (existingMatch) {
      // Instant match with boosted score
      await prisma.match.update({
        where: { id: existingMatch.id },
        data: {
          status: 'accepted',
          compatibility: boostedScore,
          compatibilityFactors: factors,
          matchQuality,
          superLiked: true
        }
      });

      // Create priority notifications
      await createSuperMatchNotifications(user.id, matchId, matchQuality);

      // Create chat room for matched users
      await prisma.chatRoom.create({
        data: {
          participants: {
            connect: [
              { id: user.id },
              { id: matchId }
            ]
          }
        }
      });

      return res.json({
        isMatch: true,
        matchDetails: {
          ...existingMatch,
          compatibility: boostedScore,
          matchQuality,
          factors
        }
      });
    }

    // Create new pending match with boosted visibility
    const newMatch = await prisma.match.create({
      data: {
        userId: user.id,
        matchedWithId: matchId,
        status: 'pending',
        compatibility: boostedScore,
        compatibilityFactors: factors,
        matchQuality,
        superLiked: true
      }
    });

    // Track super like usage
    await usageService.trackSuperLike(user.id);

    res.json({ isMatch: false, match: newMatch });
  } catch (error) {
    console.error('Error handling super like:', error);
    res.status(500).json({ message: 'Error processing super like' });
  }
};

// Helper functions
function getMatchQuality(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 0.8) return 'HIGH';
  if (score >= 0.6) return 'MEDIUM';
  return 'LOW';
}

function generateMatchReasons(factors: any): string[] {
  const reasons: string[] = [];

  if (factors.industryAlignment > 0.7) {
    reasons.push('Strong industry alignment');
  }
  
  if (factors.investmentAlignment > 0.8) {
    reasons.push('Investment requirements well matched');
  }

  if (factors.experienceAlignment > 0.7) {
    reasons.push('Compatible experience levels');
  }

  if (factors.geographicAlignment > 0.8) {
    reasons.push('Conveniently located');
  }

  if (factors.verificationScore > 0.7) {
    reasons.push('Both profiles highly verified');
  }

  return reasons;
}

const getMatchReasons = (user1: any, user2: any): string[] => {
  const reasons: string[] = [];

  // Compare industries
  const industries1 = user1.userType === 'entrepreneur'
    ? user1.entrepreneurProfile.industries
    : user1.funderProfile.areasOfInterest;
  
  const industries2 = user2.userType === 'entrepreneur'
    ? user2.entrepreneurProfile.industries
    : user2.funderProfile.areasOfInterest;

  const commonIndustries = industries1.filter((i: string) => industries2.includes(i));
  if (commonIndustries.length > 0) {
    reasons.push(`Matching industries: ${commonIndustries.join(', ')}`);
  }

  // Compare investment preferences
  if (user1.userType === 'entrepreneur') {
    const amount = user1.entrepreneurProfile.desiredInvestment.amount;
    const range = user2.funderProfile.investmentPreferences;
    if (amount >= range.min && amount <= range.max) {
      reasons.push('Investment amount aligns with preferences');
    }
  }

  // Compare experience levels
  const expDiff = Math.abs(
    user1[user1.userType + 'Profile'].yearsExperience -
    user2[user2.userType + 'Profile'].yearsExperience
  );
  if (expDiff <= 5) {
    reasons.push('Similar experience levels');
  }

  // Compare verification levels
  if (user1.verificationLevel !== 'None' && user2.verificationLevel !== 'None') {
    reasons.push('Both profiles are verified');
  }

  // Add geographic proximity
  if (user1.location && user2.location) {
    // This would be calculated with actual distance logic
    reasons.push('Geographic proximity');
  }

  return reasons;
};

const calculateCompatibility = async (user1: any, user2: any): Promise<number> => {
  let score = 0;
  let totalFactors = 0;

  // Industry alignment (30%)
  const industries1 = user1.userType === 'entrepreneur'
    ? user1.entrepreneurProfile.industries
    : user1.funderProfile.areasOfInterest;
  
  const industries2 = user2.userType === 'entrepreneur'
    ? user2.entrepreneurProfile.industries
    : user2.funderProfile.areasOfInterest;

  const commonIndustries = industries1.filter((i: string) => industries2.includes(i));
  score += (commonIndustries.length / Math.max(industries1.length, industries2.length)) * 30;
  totalFactors += 30;

  // Investment alignment (25%)
  if (user1.userType === 'entrepreneur') {
    const desiredAmount = user1.entrepreneurProfile.desiredInvestment.amount;
    const funderRange = user2.funderProfile.investmentPreferences;
    if (desiredAmount >= funderRange.min && desiredAmount <= funderRange.max) {
      score += 25;
    }
  } else {
    const desiredAmount = user2.entrepreneurProfile.desiredInvestment.amount;
    const funderRange = user1.funderProfile.investmentPreferences;
    if (desiredAmount >= funderRange.min && desiredAmount <= funderRange.max) {
      score += 25;
    }
  }
  totalFactors += 25;

  // Experience level (15%)
  const experienceDiff = Math.abs(
    user1[user1.userType + 'Profile'].yearsExperience -
    user2[user2.userType + 'Profile'].yearsExperience
  );
  score += Math.max(0, (15 - experienceDiff)) * 1.5;
  totalFactors += 15;

  // Verification level (20%)
  const verificationScore = (level: string): number => {
    const levels = ['None', 'BusinessPlan', 'UseCase', 'DemographicAlignment', 'AppUXUI', 'FiscalAnalysis'];
    return (levels.indexOf(level) / (levels.length - 1)) * 20;
  };
  score += verificationScore(user1.verificationLevel);
  score += verificationScore(user2.verificationLevel);
  totalFactors += 20;

  // Geographic alignment (10%)
  if (user1.location && user2.location) {
    const distance = calculateDistance(user1.location, user2.location);
    const maxDistance = 1000000; // 1000km in meters
    score += Math.max(0, 1 - (distance / maxDistance)) * 10;
  }
  totalFactors += 10;

  // Normalize score to percentage
  return Math.round((score / totalFactors) * 100);
};

const calculateCompatibilityFactors = async (user1: any, user2: any): Promise<any> => {
  const factors = {
    industryAlignment: 0,
    investmentAlignment: 0,
    experienceAlignment: 0,
    geographicAlignment: 0,
    verificationScore: 0,
    fraudRiskScore: 0 // Placeholder for future implementation
  };

  // Industry alignment
  const industries1 = user1.userType === 'entrepreneur'
    ? user1.entrepreneurProfile.industries
    : user1.funderProfile.areasOfInterest;
  
  const industries2 = user2.userType === 'entrepreneur'
    ? user2.entrepreneurProfile.industries
    : user2.funderProfile.areasOfInterest;

  const commonIndustries = industries1.filter((i: string) => industries2.includes(i));
  factors.industryAlignment = commonIndustries.length / Math.max(industries1.length, industries2.length);

  // Investment alignment
  if (user1.userType === 'entrepreneur') {
    const desiredAmount = user1.entrepreneurProfile.desiredInvestment.amount;
    const funderRange = user2.funderProfile.investmentPreferences;
    if (desiredAmount >= funderRange.min && desiredAmount <= funderRange.max) {
      factors.investmentAlignment = 1;
    } else if (desiredAmount < funderRange.min) {
      factors.investmentAlignment = Math.max(0, 1 - (funderRange.min - desiredAmount) / funderRange.min);
    } else {
      factors.investmentAlignment = Math.max(0, 1 - (desiredAmount - funderRange.max) / funderRange.max);
    }
  } else {
    const desiredAmount = user2.entrepreneurProfile.desiredInvestment.amount;
    const funderRange = user1.funderProfile.investmentPreferences;
    if (desiredAmount >= funderRange.min && desiredAmount <= funderRange.max) {
      factors.investmentAlignment = 1;
    } else if (desiredAmount < funderRange.min) {
      factors.investmentAlignment = Math.max(0, 1 - (funderRange.min - desiredAmount) / funderRange.min);
    } else {
      factors.investmentAlignment = Math.max(0, 1 - (desiredAmount - funderRange.max) / funderRange.max);
    }
  }

  // Experience alignment
  const experienceDiff = Math.abs(
    user1[user1.userType + 'Profile'].yearsExperience -
    user2[user2.userType + 'Profile'].yearsExperience
  );
  factors.experienceAlignment = Math.max(0, 1 - (experienceDiff / 15));

  // Geographic alignment
  if (user1.location && user2.location) {
    const distance = calculateDistance(user1.location, user2.location);
    const maxDistance = 1000000; // 1000km in meters
    factors.geographicAlignment = Math.max(0, 1 - (distance / maxDistance));
  }

  // Verification score
  const verificationLevels = ['None', 'BusinessPlan', 'UseCase', 'DemographicAlignment', 'AppUXUI', 'FiscalAnalysis'];
  const score1 = verificationLevels.indexOf(user1.verificationLevel) / (verificationLevels.length - 1);
  const score2 = verificationLevels.indexOf(user2.verificationLevel) / (verificationLevels.length - 1);
  factors.verificationScore = (score1 + score2) / 2;

  return factors;
};

// Placeholder function for distance calculation
function calculateDistance(location1: any, location2: any): number {
  // In a real implementation, this would use the getDistance function from geolib
  // For now, we'll return a placeholder value
  return 50000; // 50km in meters
}

async function createMatchNotifications(userId1: string, userId2: string, matchQuality: string) {
  const users = await prisma.user.findMany({
    where: { id: { in: [userId1, userId2] }},
    include: {
      entrepreneurProfile: true,
      funderProfile: true
    }
  });

  for (const user of users) {
    const otherUser = users.find(u => u.id !== user.id)!;
    const otherProfile = otherUser.userType === 'entrepreneur' ? 
      otherUser.entrepreneurProfile : 
      otherUser.funderProfile;

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'match',
        content: `New ${matchQuality.toLowerCase()} quality match with ${otherProfile.name || otherProfile.projectName}!`
      }
    });
  }
}

async function createSuperMatchNotifications(userId1: string, userId2: string, matchQuality: string) {
  const users = await prisma.user.findMany({
    where: { id: { in: [userId1, userId2] }},
    include: {
      entrepreneurProfile: true,
      funderProfile: true
    }
  });

  for (const user of users) {
    const otherUser = users.find(u => u.id !== user.id)!;
    const otherProfile = otherUser.userType === 'entrepreneur' ? 
      otherUser.entrepreneurProfile : 
      otherUser.funderProfile;

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'superMatch',
        content: `⭐ Super Match! ${otherProfile.name || otherProfile.projectName} is very interested in connecting!`,
        priority: 'high'
      }
    });
  }
}