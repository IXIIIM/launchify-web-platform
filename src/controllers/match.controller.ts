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
}