import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AccessLogService } from '../services/AccessLogService';
import { SNS } from 'aws-sdk';

interface AuthRequest extends Request {
  user: any;
}

export class VerificationController {
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
}
