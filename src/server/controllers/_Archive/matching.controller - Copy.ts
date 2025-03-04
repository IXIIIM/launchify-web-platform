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

export const getMatches = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has reached their daily match limit
    const canViewMatches = await usageService.trackMatch(req.user.id);
    if (!canViewMatches) {
      throw new ValidationError('Daily match limit reached', [{
        field: 'matches',
        message: 'You have reached your daily match limit'
      }]);
    }

    // Get user's profile and preferences
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        entrepreneurProfile: true,
        funderProfile: true,
        matchPreferences: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Build match query based on user type and preferences
    const matchQuery = buildMatchQuery(user);
    
    // Get potential matches with compatibility scores
    const matches = await prisma.user.findMany({
      where: matchQuery,
      include: {
        entrepreneurProfile: true,
        funderProfile: true,
        verificationRequests: {
          where: { status: 'approved' }
        }
      },
      take: 20 // Limit results
    });

    // Calculate compatibility scores and enrich match data
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => ({
        id: match.id,
        compatibility: await calculateCompatibility(user, match),
        profile: match.userType === 'entrepreneur' 
          ? match.entrepreneurProfile 
          : match.funderProfile,
        verificationLevel: match.verificationLevel,
        verifications: match.verificationRequests,
        matchReasons: getMatchReasons(user, match)
      }))
    );

    // Sort by compatibility score
    enrichedMatches.sort((a, b) => b.compatibility - a.compatibility);

    res.json(enrichedMatches);
  } catch (error) {
    throw error;
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

export const swipe = async (req: AuthRequest, res: Response) => {
  try {
    const { targetUserId, direction } = req.body;

    if (!['left', 'right'].includes(direction)) {
      throw new ValidationError('Invalid swipe direction', [{
        field: 'direction',
        message: 'Direction must be either left or right'
      }]);
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      throw new NotFoundError('Target user not found');
    }

    // Handle left swipe (reject)
    if (direction === 'left') {
      await prisma.match.create({
        data: {
          userId: req.user.id,
          targetUserId,
          status: 'rejected'
        }
      });
      return res.json({ message: 'User rejected' });
    }

    // Handle right swipe (like)
    // Check if there's a mutual match
    const existingMatch = await prisma.match.findFirst({
      where: {
        userId: targetUserId,
        targetUserId: req.user.id,
        status: 'pending'
      }
    });

    if (existingMatch) {
      // Create mutual match
      await Promise.all([
        prisma.match.update({
          where: { id: existingMatch.id },
          data: { status: 'matched' }
        }),
        prisma.match.create({
          data: {
            userId: req.user.id,
            targetUserId,
            status: 'matched'
          }
        }),
        // Create chat room for matched users
        prisma.chatRoom.create({
          data: {
            participants: {
              connect: [
                { id: req.user.id },
                { id: targetUserId }
              ]
            }
          }
        })
      ]);

      return res.json({
        message: 'Mutual match created',
        isMatch: true
      });
    }

    // Create pending match
    await prisma.match.create({
      data: {
        userId: req.user.id,
        targetUserId,
        status: 'pending'
      }
    });

    res.json({
      message: 'Like recorded',
      isMatch: false
    });
  } catch (error) {
    throw error;
  }
};

// Helper functions
const buildMatchQuery = (user: any) => {
  const baseQuery = {
    id: { not: user.id },
    userType: user.userType === 'entrepreneur' ? 'funder' : 'entrepreneur',
    emailVerified: true,
    phoneVerified: true,
    NOT: {
      matches: {
        some: {
          targetUserId: user.id
        }
      }
    }
  };

  const preferences = user.matchPreferences;
  if (!preferences) return baseQuery;

  // Add preference-based filters
  const preferenceQuery = {
    ...baseQuery,
    OR: []
  };

  if (preferences.industries?.length > 0) {
    preferenceQuery.OR.push({
      [user.userType === 'entrepreneur' ? 'funderProfile' : 'entrepreneurProfile']: {
        industries: {
          hasSome: preferences.industries
        }
      }
    });
  }

  if (preferences.investmentRange) {
    preferenceQuery.OR.push({
      [user.userType === 'entrepreneur' ? 'funderProfile' : 'entrepreneurProfile']: {
        desiredInvestment: {
          amount: {
            gte: preferences.investmentRange.min,
            lte: preferences.investmentRange.max
          }
        }
      }
    });
  }

  return preferenceQuery;
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

  // Normalize score to percentage
  return Math.round((score / totalFactors) * 100);
};

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

  return reasons;
};

// Add this to the existing controller file

export const handleSuperLike = async (req: AuthRequest, res: Response) => {
  try {
    const { user } = req;
    const { matchId } = req.body;

    // Verify user has super likes available
    const usageService = new UsageService();
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

    const { score, factors } = await calculateCompatibility(user, potentialMatch);
    const boostedScore = Math.min(1, score * 1.2); // 20% compatibility boost
    const matchQuality = getMatchQuality(boostedScore);

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
          compatibility: Math.round(boostedScore * 100),
          compatibilityFactors: factors,
          matchQuality,
          superLiked: true
        }
      });

      // Create priority notifications
      await createSuperMatchNotifications(user.id, matchId, matchQuality);

      return res.json({
        isMatch: true,
        matchDetails: {
          ...existingMatch,
          compatibility: Math.round(boostedScore * 100),
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
        compatibility: Math.round(boostedScore * 100),
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
    const otherProfile = otherUser.type === 'entrepreneur' ? 
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