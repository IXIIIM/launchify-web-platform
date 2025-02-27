<<<<<<< HEAD
// src/controllers/match.controller.ts
=======
>>>>>>> feature/security-implementation
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AccessLogService } from '../services/AccessLogService';
import { SNS } from 'aws-sdk';

interface AuthRequest extends Request {
  user: any;
}

export class MatchController {
  private prisma: PrismaClient;
  private accessLogger: AccessLogService;

  constructor(prisma: PrismaClient, sns: SNS) {
    this.prisma = prisma;
    this.accessLogger = new AccessLogService(prisma, sns);
  }

  getPotentialMatches = async (req: AuthRequest, res: Response) => {
    try {
      const matches = await this.prisma.match.findMany({
        where: {
          OR: [
            { userId: req.user.id },
            { matchedWithId: req.user.id }
          ],
          status: 'PENDING'
        },
        include: {
          user: true,
          matchedWith: true
        }
      });

      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'READ',
        resource: 'matches',
        success: true,
        metadata: { count: matches.length }
      });

      res.json(matches);
    } catch (error) {
      console.error('Error getting matches:', error);
      
      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'READ',
        resource: 'matches',
        success: false,
        reason: 'Internal error',
        metadata: { error: error.message }
      });

      res.status(500).json({ message: 'Error fetching matches' });
    }
  };
<<<<<<< HEAD

  getRecommendedMatches = async (req: AuthRequest, res: Response) => {
    try {
      // Get user's industry and preferences
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          entrepreneurProfile: true,
          funderProfile: true
        }
      });

      // Build recommendation criteria
      const criteria = this.buildMatchingCriteria(user);

      // Get recommended matches
      const matches = await this.prisma.user.findMany({
        where: criteria,
        include: {
          entrepreneurProfile: true,
          funderProfile: true
        },
        take: 10
      });

      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'READ',
        resource: 'recommended_matches',
        success: true,
        metadata: { count: matches.length }
      });

      res.json(matches);
    } catch (error) {
      console.error('Error getting recommended matches:', error);
      
      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'READ',
        resource: 'recommended_matches',
        success: false,
        reason: 'Internal error',
        metadata: { error: error.message }
      });

      res.status(500).json({ message: 'Error fetching recommendations' });
    }
  };

  connectWithMatch = async (req: AuthRequest, res: Response) => {
    const { id: matchId } = req.params;

    try {
      const match = await this.prisma.match.update({
        where: {
          id: matchId,
          OR: [
            { userId: req.user.id },
            { matchedWithId: req.user.id }
          ]
        },
        data: {
          status: 'CONNECTED',
          connectedAt: new Date()
        }
      });

      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'CONNECT',
        resource: 'match',
        resourceId: matchId,
        success: true,
        metadata: { matchId }
      });

      res.json(match);
    } catch (error) {
      console.error('Error connecting with match:', error);
      
      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'CONNECT',
        resource: 'match',
        resourceId: matchId,
        success: false,
        reason: 'Internal error',
        metadata: { error: error.message }
      });

      res.status(500).json({ message: 'Error establishing connection' });
    }
  };

  private buildMatchingCriteria(user: any) {
    const baseEntrepreneurCriteria = {
      userType: 'entrepreneur',
      entrepreneurProfile: {
        industries: {
          hasSome: user.funderProfile?.areasOfInterest || []
        },
        desiredInvestment: {
          amount: {
            lte: user.funderProfile?.maxInvestmentAmount || 0
          }
        }
      }
    };

    const baseFunderCriteria = {
      userType: 'funder',
      funderProfile: {
        areasOfInterest: {
          hasSome: user.entrepreneurProfile?.industries || []
        },
        minInvestmentAmount: {
          lte: user.entrepreneurProfile?.desiredInvestment?.amount || 0
        }
      }
    };

    return user.userType === 'entrepreneur' ? baseFunderCriteria : baseEntrepreneurCriteria;
  }
}

// src/controllers/message.controller.ts
export class MessageController {
  private prisma: PrismaClient;
  private accessLogger: AccessLogService;

  constructor(prisma: PrismaClient, sns: SNS) {
    this.prisma = prisma;
    this.accessLogger = new AccessLogService(prisma, sns);
  }

  getConversations = async (req: AuthRequest, res: Response) => {
    try {
      const conversations = await this.prisma.conversation.findMany({
        where: {
          OR: [
            { userId: req.user.id },
            { participantId: req.user.id }
          ]
        },
        include: {
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            }
          },
          user: true,
          participant: true
        }
      });

      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'READ',
        resource: 'conversations',
        success: true,
        metadata: { count: conversations.length }
      });

      res.json(conversations);
    } catch (error) {
      console.error('Error getting conversations:', error);
      
      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'READ',
        resource: 'conversations',
        success: false,
        reason: 'Internal error',
        metadata: { error: error.message }
      });

      res.status(500).json({ message: 'Error fetching conversations' });
    }
  };

  sendMessage = async (req: AuthRequest, res: Response) => {
    const { matchId } = req.params;
    const { content } = req.body;

    try {
      const message = await this.prisma.message.create({
        data: {
          content,
          senderId: req.user.id,
          matchId
        },
        include: {
          sender: true,
          match: true
        }
      });

      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'SEND',
        resource: 'message',
        resourceId: message.id,
        success: true,
        metadata: { matchId }
      });

      res.json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      
      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'SEND',
        resource: 'message',
        success: false,
        reason: 'Internal error',
        metadata: { matchId, error: error.message }
      });

      res.status(500).json({ message: 'Error sending message' });
    }
  };
}

// Additional controllers for verification, analytics, and profile...
=======
}
>>>>>>> feature/security-implementation
