// src/server/controllers/super-like.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { NotFoundError, ValidationError } from '../utils/errors';
import { UsageService } from '../services/usage';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);
const usageService = new UsageService();

interface AuthRequest extends Request {
  user: any;
}

// Super Like limits per subscription tier
const SUPER_LIKE_LIMITS = {
  Basic: 1,
  Chrome: 3,
  Bronze: 5,
  Silver: 7,
  Gold: 10,
  Platinum: Infinity
};

// Reset period in seconds (24 hours)
const RESET_PERIOD = 24 * 60 * 60;

export const checkSuperLikeStatus = async (req: AuthRequest, res: Response) => {
  try {
    const key = `super_likes:${req.user.id}`;
    const [remaining, ttl] = await Promise.all([
      redis.get(key),
      redis.ttl(key)
    ]);

    const limit = SUPER_LIKE_LIMITS[req.user.subscriptionTier];
    const used = remaining ? limit - parseInt(remaining) : 0;

    res.json({
      limit,
      remaining: remaining ? parseInt(remaining) : limit,
      used,
      resetsIn: ttl > 0 ? ttl : 0
    });
  } catch (error) {
    throw error;
  }
};

export const superLike = async (req: AuthRequest, res: Response) => {
  try {
    const { targetUserId } = req.body;

    // Check target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      throw new NotFoundError('Target user not found');
    }

    // Check remaining super likes
    const key = `super_likes:${req.user.id}`;
    const remaining = await redis.get(key);
    const limit = SUPER_LIKE_LIMITS[req.user.subscriptionTier];

    if (!remaining) {
      // First super like of the period
      await redis.setex(key, RESET_PERIOD, limit - 1);
    } else if (parseInt(remaining) <= 0) {
      throw new ValidationError('No super likes remaining', [{
        field: 'superLike',
        message: 'You have used all your super likes for today'
      }]);
    } else {
      await redis.decr(key);
    }

    // Create super like match with higher priority
    const match = await prisma.match.create({
      data: {
        userId: req.user.id,
        targetUserId,
        status: 'pending',
        isSuperLike: true,
        compatibility: await calculateSuperLikeCompatibility(req.user.id, targetUserId)
      }
    });

    // Create notification for target user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'SUPER_LIKE',
        content: 'Someone has super liked your profile!',
        metadata: {
          matchId: match.id,
          senderId: req.user.id
        }
      }
    });

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
        prisma.match.update({
          where: { id: match.id },
          data: { status: 'matched' }
        }),
        // Create chat room
        prisma.chatRoom.create({
          data: {
            participants: {
              connect: [
                { id: req.user.id },
                { id: targetUserId }
              ]
            },
            priorityLevel: 'high' // Super like matches get priority
          }
        })
      ]);

      return res.json({
        message: 'Super like successful - It\'s a match!',
        isMatch: true,
        match
      });
    }

    res.json({
      message: 'Super like sent successfully',
      isMatch: false,
      match
    });
  } catch (error) {
    throw error;
  }
};

// Helper function to calculate enhanced compatibility for super likes
const calculateSuperLikeCompatibility = async (userId: string, targetUserId: string): Promise<number> => {
  const [user1, user2] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        entrepreneurProfile: true,
        funderProfile: true
      }
    }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        entrepreneurProfile: true,
        funderProfile: true
      }
    })
  ]);

  if (!user1 || !user2) throw new Error('Users not found');

  // Start with base compatibility score
  let score = 0;
  let totalFactors = 0;

  // Industry alignment (40% weight for super likes)
  const industries1 = user1.userType === 'entrepreneur'
    ? user1.entrepreneurProfile?.industries
    : user1.funderProfile?.areasOfInterest;
  
  const industries2 = user2.userType === 'entrepreneur'
    ? user2.entrepreneurProfile?.industries
    : user2.funderProfile?.areasOfInterest;

  if (industries1 && industries2) {
    const commonIndustries = industries1.filter(i => industries2.includes(i));
    score += (commonIndustries.length / Math.max(industries1.length, industries2.length)) * 40;
    totalFactors += 40;
  }

  // Investment alignment (30% weight)
  if (user1.userType === 'entrepreneur' && user2.userType === 'funder') {
    const desiredAmount = user1.entrepreneurProfile?.desiredInvestment.amount;
    const funderRange = user2.funderProfile?.investmentPreferences;
    if (desiredAmount && funderRange) {
      if (desiredAmount >= funderRange.min && desiredAmount <= funderRange.max) {
        score += 30;
      }
    }
  } else if (user1.userType === 'funder' && user2.userType === 'entrepreneur') {
    const desiredAmount = user2.entrepreneurProfile?.desiredInvestment.amount;
    const funderRange = user1.funderProfile?.investmentPreferences;
    if (desiredAmount && funderRange) {
      if (desiredAmount >= funderRange.min && desiredAmount <= funderRange.max) {
        score += 30;
      }
    }
  }
  totalFactors += 30;

  // Verification alignment (30% weight)
  const verificationBonus = Math.min(
    getVerificationScore(user1.verificationLevel),
    getVerificationScore(user2.verificationLevel)
  ) * 30;
  score += verificationBonus;
  totalFactors += 30;

  // Super likes get a minimum 80% compatibility score
  return Math.max(80, Math.round((score / totalFactors) * 100));
};

const getVerificationScore = (level: string): number => {
  const levels = ['None', 'BusinessPlan', 'UseCase', 'DemographicAlignment', 'AppUXUI', 'FiscalAnalysis'];
  return levels.indexOf(level) / (levels.length - 1);
};