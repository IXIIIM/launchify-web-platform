import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AccessLogService } from '../services/AccessLogService';
import { SNS } from 'aws-sdk';

export class AnalyticsController {
  // Rest of the file content...
interface AuthRequest extends Request {
  user: any;
}

export class AnalyticsController {
  private prisma: PrismaClient;
  private accessLogger: AccessLogService;

  constructor(prisma: PrismaClient, sns: SNS) {
    this.prisma = prisma;
    this.accessLogger = new AccessLogService(prisma, sns);
  }

  getBasicAnalytics = async (req: AuthRequest, res: Response) => {
    try {
      const { timeframe = '30d' } = req.query;
      const startDate = this.getStartDateForTimeframe(timeframe as string);

      const analytics = await this.prisma.$transaction([
        this.prisma.match.count({
          where: {
            OR: [{ userId: req.user.id }, { matchedWithId: req.user.id }],
            createdAt: { gte: startDate }
          }
        }),
        this.prisma.message.count({
          where: {
            OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
            createdAt: { gte: startDate }
          }
        }),
        this.prisma.profileView.count({
          where: {
            profileId: req.user.id,
            createdAt: { gte: startDate }
          }
        })
      ]);

      const [matchCount, messageCount, viewCount] = analytics;

      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'READ',
        resource: 'basic_analytics',
        success: true,
        metadata: { timeframe }
      });

      res.json({
        matches: matchCount,
        messages: messageCount,
        profileViews: viewCount,
        timeframe
      });
    } catch (error) {
      console.error('Error fetching basic analytics:', error);
      
      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'READ',
        resource: 'basic_analytics',
        success: false,
        reason: 'Internal error',
        metadata: { error: error.message }
      });

      res.status(500).json({ message: 'Error fetching analytics' });
    }
  };

  private getStartDateForTimeframe(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case '7d':
        return new Date(now.setDate(now.getDate() - 7));
      case '30d':
        return new Date(now.setDate(now.getDate() - 30));
      case '90d':
        return new Date(now.setDate(now.getDate() - 90));
      default:
        return new Date(now.setDate(now.getDate() - 30));
    }
  }
}
