<<<<<<< HEAD
=======
<<<<<<< HEAD
// src/controllers/verification.controller.ts
=======
>>>>>>> feature/security-implementation
>>>>>>> main
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AccessLogService } from '../services/AccessLogService';
import { SNS } from 'aws-sdk';

interface AuthRequest extends Request {
  user: any;
}

export class VerificationController {
<<<<<<< HEAD
  // Rest of the file content...
=======
  private prisma: PrismaClient;
  private accessLogger: AccessLogService;

  constructor(prisma: PrismaClient, sns: SNS) {
    this.prisma = prisma;
    this.accessLogger = new AccessLogService(prisma, sns);
  }

  submitBusinessPlan = async (req: AuthRequest, res: Response) => {
    try {
      const verification = await this.prisma.verificationRequest.create({
        data: {
          userId: req.user.id,
          type: 'BusinessPlan',
          status: 'PENDING',
          documents: req.body.documents,
          metadata: req.body.metadata
        }
      });

      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'SUBMIT',
        resource: 'business_plan_verification',
        resourceId: verification.id,
        success: true,
        metadata: { documentCount: req.body.documents.length }
      });

      res.json(verification);
    } catch (error) {
      console.error('Error submitting business plan:', error);
      
      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'SUBMIT',
        resource: 'business_plan_verification',
        success: false,
        reason: 'Internal error',
        metadata: { error: error.message }
      });

      res.status(500).json({ message: 'Error submitting verification' });
    }
  };
<<<<<<< HEAD

  submitTechnicalReview = async (req: AuthRequest, res: Response) => {
    try {
      const verification = await this.prisma.verificationRequest.create({
        data: {
          userId: req.user.id,
          type: 'AppUXUI',
          status: 'PENDING',
          documents: req.body.documents,
          metadata: {
            appUrl: req.body.appUrl,
            githubRepo: req.body.githubRepo,
            techStack: req.body.techStack
          }
        }
      });

      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'SUBMIT',
        resource: 'technical_verification',
        resourceId: verification.id,
        success: true,
        metadata: { documentCount: req.body.documents.length }
      });

      res.json(verification);
    } catch (error) {
      console.error('Error submitting technical review:', error);
      
      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'SUBMIT',
        resource: 'technical_verification',
        success: false,
        reason: 'Internal error',
        metadata: { error: error.message }
      });

      res.status(500).json({ message: 'Error submitting verification' });
    }
  };

  submitFiscalAnalysis = async (req: AuthRequest, res: Response) => {
    try {
      const verification = await this.prisma.verificationRequest.create({
        data: {
          userId: req.user.id,
          type: 'FiscalAnalysis',
          status: 'PENDING',
          documents: req.body.documents,
          metadata: {
            financialProjections: req.body.financialProjections,
            historicalData: req.body.historicalData,
            marketAnalysis: req.body.marketAnalysis
          }
        }
      });

      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'SUBMIT',
        resource: 'fiscal_verification',
        resourceId: verification.id,
        success: true,
        metadata: { documentCount: req.body.documents.length }
      });

      res.json(verification);
    } catch (error) {
      console.error('Error submitting fiscal analysis:', error);
      
      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'SUBMIT',
        resource: 'fiscal_verification',
        success: false,
        reason: 'Internal error',
        metadata: { error: error.message }
      });

      res.status(500).json({ message: 'Error submitting verification' });
    }
  };
}

// src/controllers/analytics.controller.ts
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
        // Match statistics
        this.prisma.match.count({
          where: {
            OR: [{ userId: req.user.id }, { matchedWithId: req.user.id }],
            createdAt: { gte: startDate }
          }
        }),
        // Message statistics
        this.prisma.message.count({
          where: {
            OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
            createdAt: { gte: startDate }
          }
        }),
        // Profile views
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

  getDemographicInsights = async (req: AuthRequest, res: Response) => {
    try {
      const { timeframe = '30d' } = req.query;
      const startDate = this.getStartDateForTimeframe(timeframe as string);

      const insights = await this.prisma.match.groupBy({
        by: ['industry', 'location'],
        where: {
          OR: [{ userId: req.user.id }, { matchedWithId: req.user.id }],
          createdAt: { gte: startDate }
        },
        _count: true,
        orderBy: {
          _count: {
            industry: 'desc'
          }
        }
      });

      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'READ',
        resource: 'demographic_insights',
        success: true,
        metadata: { timeframe }
      });

      res.json(insights);
    } catch (error) {
      console.error('Error fetching demographic insights:', error);
      
      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'READ',
        resource: 'demographic_insights',
        success: false,
        reason: 'Internal error',
        metadata: { error: error.message }
      });

      res.status(500).json({ message: 'Error fetching insights' });
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

// src/controllers/profile.controller.ts
export class ProfileController {
  private prisma: PrismaClient;
  private accessLogger: AccessLogService;

  constructor(prisma: PrismaClient, sns: SNS) {
    this.prisma = prisma;
    this.accessLogger = new AccessLogService(prisma, sns);
  }

  getProfile = async (req: AuthRequest, res: Response) => {
    const { id: profileId } = req.params;

    try {
      const profile = await this.prisma.user.findUnique({
        where: { id: profileId },
        include: {
          entrepreneurProfile: true,
          funderProfile: true,
          verificationRequests: {
            where: { status: 'APPROVED' }
          }
        }
      });

      if (!profile) {
        await this.accessLogger.logAccess({
          userId: req.user.id,
          action: 'READ',
          resource: 'profile',
          resourceId: profileId,
          success: false,
          reason: 'Profile not found'
        });

        return res.status(404).json({ message: 'Profile not found' });
      }

      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'READ',
        resource: 'profile',
        resourceId: profileId,
        success: true
      });

      res.json(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'READ',
        resource: 'profile',
        resourceId: profileId,
        success: false,
        reason: 'Internal error',
        metadata: { error: error.message }
      });

      res.status(500).json({ message: 'Error fetching profile' });
    }
  };

  updateProfile = async (req: AuthRequest, res: Response) => {
    const { id: profileId } = req.params;

    try {
      // Update user profile based on user type
      if (req.user.userType === 'entrepreneur') {
        await this.prisma.entrepreneurProfile.update({
          where: { userId: profileId },
          data: req.body
        });
      } else {
        await this.prisma.funderProfile.update({
          where: { userId: profileId },
          data: req.body
        });
      }

      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'UPDATE',
        resource: 'profile',
        resourceId: profileId,
        success: true,
        metadata: { updatedFields: Object.keys(req.body) }
      });

      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      
      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'UPDATE',
        resource: 'profile',
        resourceId: profileId,
        success: false,
        reason: 'Internal error',
        metadata: { error: error.message }
      });

      res.status(500).json({ message: 'Error updating profile' });
    }
  };

  boostProfile = async (req: AuthRequest, res: Response) => {
    const { id: profileId } = req.params;

    try {
      await this.prisma.profileBoost.create({
        data: {
          userId: profileId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: 'ACTIVE'
        }
      });

      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'BOOST',
        resource: 'profile',
        resourceId: profileId,
        success: true,
        metadata: { duration: '7 days' }
      });

      res.json({ message: 'Profile boost activated' });
    } catch (error) {
      console.error('Error boosting profile:', error);
      
      await this.accessLogger.logAccess({
        userId: req.user.id,
        action: 'BOOST',
        resource: 'profile',
        resourceId: profileId,
        success: false,
        reason: 'Internal error',
        metadata: { error: error.message }
      });

      res.status(500).json({ message: 'Error activating profile boost' });
    }
  };
}
=======
}
>>>>>>> feature/security-implementation
>>>>>>> main
