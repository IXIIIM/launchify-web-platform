import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { ValidationError } from '../middleware/error';
import { MatchingService } from '../../services/matching/MatchingService';
import { UsageService } from '../../services/usage/UsageService';
import { WebSocketServer } from '../../services/websocket';

const prisma = new PrismaClient();
const wsServer = new WebSocketServer(server);
const usageService = new UsageService();
const matchingService = new MatchingService(wsServer);

interface AuthRequest extends Request {
  user: any;
}

// Validation schemas
const swipeSchema = z.object({
  matchId: z.string().uuid(),
  direction: z.enum(['left', 'right'])
});

const filterSchema = z.object({
  industries: z.array(z.string()).optional(),
  minInvestment: z.number().optional(),
  maxInvestment: z.number().optional(),
  businessType: z.enum(['B2B', 'B2C']).optional(),
  experience: z.number().optional(),
  verificationLevel: z.array(z.string()).optional()
});

export const getPotentialMatches = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user can get more matches today
    const canGetMatches = await usageService.canCreateMatch(req.user.id);
    if (!canGetMatches) {
      throw new ValidationError('Daily match limit reached', [{
        field: 'matches',
        message: 'You have reached your daily match limit for your subscription tier'
      }]);
    }

    // Get filter preferences if any
    const filters = req.query.filters 
      ? filterSchema.parse(JSON.parse(req.query.filters as string))
      : undefined;

    const matches = await matchingService.getPotentialMatches(
      req.user.id,
      filters
    );

    // Track match request
    await usageService.trackMatch(req.user.id);

    res.json(matches);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid filter parameters', error.errors);
    }
    throw error;
  }
};

export const handleSwipe = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = swipeSchema.parse(req.body);

    // Check if user can swipe
    const canSwipe = await usageService.canCreateMatch(req.user.id);
    if (!canSwipe) {
      throw new ValidationError('Daily match limit reached', [{
        field: 'matches',
        message: 'You have reached your daily match limit for your subscription tier'
      }]);
    }

    const result = await matchingService.handleSwipe(
      req.user.id,
      validatedData.matchId,
      validatedData.direction
    );

    if (result.isMatch) {
      // Create a conversation for the match
      const conversation = await prisma.conversation.create({
        data: {
          matchId: result.matchDetails.id,
          participants: {
            connect: [
              { id: req.user.id },
              { id: validatedData.matchId }
            ]
          }
        }
      });

      // Add conversation ID to result
      result.matchDetails.conversationId = conversation.id;
    }

    // Track match creation
    await usageService.trackMatch(req.user.id);

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid swipe data', error.errors);
    }
    throw error;
  }
};

export const getMatches = async (req: AuthRequest, res: Response) => {
  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { matchedWithId: req.user.id }
        ],
        status: 'accepted'
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
        },
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Format matches
    const formattedMatches = matches.map(match => {
      const otherUser = match.userId === req.user.id
        ? match.matchedWith
        : match.user;

      return {
        id: match.id,
        matchedAt: match.createdAt,
        compatibility: match.compatibility,
        user: {
          id: otherUser.id,
          type: otherUser.userType,
          profile: otherUser.userType === 'entrepreneur'
            ? otherUser.entrepreneurProfile
            : otherUser.funderProfile
        },
        conversation: match.conversation ? {
          id: match.conversation.id,
          lastMessage: match.conversation.messages[0] || null
        } : null
      };
    });

    res.json(formattedMatches);
  } catch (error) {
    throw error;
  }
};

export const updateMatchPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = filterSchema.parse(req.body);

    await prisma.matchPreferences.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        ...validatedData
      },
      update: validatedData
    });

    res.json({ message: 'Match preferences updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid preferences data', error.errors);
    }
    throw error;
  }
};

export const getMatchStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await matchingService.getMatchingStatistics(req.user.id);
    res.json(stats);
  } catch (error) {
    throw error;
  }
};