// src/server/services/VerificationService.ts
import { PrismaClient } from '@prisma/client';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EmailService } from './email/EmailService';
import { SecurityAlertService } from './SecurityAlertService';

const prisma = new PrismaClient();
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

interface VerificationConfig {
  validDuration: number; // Duration in milliseconds
  maxRetries: number;
  requiredDocuments: string[];
}

const VERIFICATION_CONFIGS: Record<string, VerificationConfig> = {
  BusinessPlan: {
    validDuration: 365 * 24 * 60 * 60 * 1000, // 1 year
    maxRetries: 2,
    requiredDocuments: ['businessPlan', 'financialProjections']
  },
  UseCase: {
    validDuration: 180 * 24 * 60 * 60 * 1000, // 6 months
    maxRetries: 3,
    requiredDocuments: ['useCaseDocumentation', 'marketAnalysis']
  },
  DemographicAlignment: {
    validDuration: 180 * 24 * 60 * 60 * 1000, // 6 months
    maxRetries: 2,
    requiredDocuments: ['demographicAnalysis', 'marketResearch']
  },
  AppUXUI: {
    validDuration: 90 * 24 * 60 * 60 * 1000, // 3 months
    maxRetries: 3,
    requiredDocuments: ['designSpecs', 'prototypes', 'userFlows']
  },
  FiscalAnalysis: {
    validDuration: 90 * 24 * 60 * 60 * 1000, // 3 months
    maxRetries: 2,
    requiredDocuments: ['financialStatements', 'auditReports']
  }
};

export class VerificationService {
  private emailService: EmailService;
  private securityAlertService: SecurityAlertService;

  constructor(
    emailService: EmailService,
    securityAlertService: SecurityAlertService
  ) {
    this.emailService = emailService;
    this.securityAlertService = securityAlertService;
  }

  async submitVerificationRequest(
    userId: string,
    type: string,
    documents: string[]
  ) {
    try {
      // Validate request type
      if (!VERIFICATION_CONFIGS[type]) {
        throw new Error('Invalid verification type');
      }

      // Check if user can submit this verification type
      const canSubmit = await this.canSubmitVerification(userId, type);
      if (!canSubmit.allowed) {
        throw new Error(canSubmit.reason);
      }

      // Validate required documents
      const config = VERIFICATION_CONFIGS[type];
      if (documents.length < config.requiredDocuments.length) {
        throw new Error('Missing required documents');
      }

      // Create verification request
      const request = await prisma.verificationRequest.create({
        data: {
          userId,
          type,
          status: 'pending',
          documents,
          metadata: {
            submittedAt: new Date().toISOString(),
            documentCount: documents.length
          }
        }
      });

      // Send notification to admins
      await this.notifyAdmins(request);

      return request;
    } catch (error) {
      console.error('Error submitting verification request:', error);
      throw error;
    }
  }

  async reviewVerificationRequest(
    requestId: string,
    status: 'approved' | 'rejected',
    notes: string,
    reviewerId: string
  ) {
    try {
      const request = await prisma.verificationRequest.findUnique({
        where: { id: requestId },
        include: { user: true }
      });

      if (!request) {
        throw new Error('Verification request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Request has already been reviewed');
      }

      // Update request status
      const updatedRequest = await prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status,
          notes,
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
          metadata: {
            ...request.metadata,
            reviewedAt: new Date().toISOString(),
            reviewerId
          }
        }
      });

      // If approved, update user's verification level
      if (status === 'approved') {
        await prisma.user.update({
          where: { id: request.userId },
          data: { verificationLevel: request.type }
        });

        // Create security log
        await prisma.securityLog.create({
          data: {
            type: 'verification_approval',
            userId: request.userId,
            message: `${request.type} verification approved`,
            severity: 'medium',
            metadata: {
              requestId,
              reviewerId,
              verificationType: request.type
            }
          }
        });
      }

      // Notify user
      await this.notifyUser(updatedRequest);

      return updatedRequest;
    } catch (error) {
      console.error('Error reviewing verification request:', error);
      throw error;
    }
  }

  async getDocumentUrl(documentPath: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: documentPath
      });

      // Generate signed URL valid for 1 hour
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return url;
    } catch (error) {
      console.error('Error generating document URL:', error);
      throw error;
    }
  }

  private async canSubmitVerification(userId: string, type: string) {
    // Get user's current verification level and subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        verificationRequests: {
          where: {
            type,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }
      }
    });

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    // Check if user already has this verification level
    if (user.verificationLevel === type) {
      return { allowed: false, reason: 'Already verified at this level' };
    }

    // Check if there's a pending request
    const pendingRequest = user.verificationRequests.find(r => r.status === 'pending');
    if (pendingRequest) {
      return { allowed: false, reason: 'Already has pending verification request' };
    }

    // Check retry limits
    const rejectedRequests = user.verificationRequests.filter(r => r.status === 'rejected');
    if (rejectedRequests.length >= VERIFICATION_CONFIGS[type].maxRetries) {
      return { allowed: false, reason: 'Maximum retry attempts reached' };
    }

    // Check if user's subscription allows this verification level
    const allowed = await this.checkSubscriptionAccess(user.subscriptionTier, type);
    if (!allowed) {
      return { allowed: false, reason: 'Subscription level does not allow this verification type' };
    }

    return { allowed: true };
  }

  private async checkSubscriptionAccess(subscriptionTier: string, verificationType: string): Promise<boolean> {
    const tierLevels = {
      'Basic': ['None'],
      'Chrome': ['None', 'BusinessPlan'],
      'Bronze': ['None', 'BusinessPlan', 'UseCase'],
      'Silver': ['None', 'BusinessPlan', 'UseCase', 'DemographicAlignment'],
      'Gold': ['None', 'BusinessPlan', 'UseCase', 'DemographicAlignment', 'AppUXUI'],
      'Platinum': ['None', 'BusinessPlan', 'UseCase', 'DemographicAlignment', 'AppUXUI', 'FiscalAnalysis']
    };

    return tierLevels[subscriptionTier as keyof typeof tierLevels].includes(verificationType);
  }

  private async notifyAdmins(request: any) {
    try {
      // Get all admin users
      const admins = await prisma.user.findMany({
        where: { isAdmin: true }
      });

      // Send email notifications
      await Promise.all(
        admins.map(admin =>
          this.emailService.sendEmail({
            to: admin.email,
            template: 'verification-request',
            data: {
              requestId: request.id,
              type: request.type,
              userId: request.userId,
              documentCount: request.documents.length,
              submittedAt: request.metadata.submittedAt
            }
          })
        )
      );

      // Create security alert for high-priority verifications
      if (request.type === 'FiscalAnalysis' || request.type === 'AppUXUI') {
        await this.securityAlertService.createAlert(
          'verification_request',
          {
            requestId: request.id,
            type: request.type,
            userId: request.userId
          },
          {
            title: `New ${request.type} Verification Request`,
            description: 'High-priority verification request requires review',
            severity: 'medium',
            requiresImmediate: true,
            notifyAdmins: true
          }
        );
      }
    } catch (error) {
      console.error('Error notifying admins:', error);
      // Don't throw - we don't want to fail the request if notifications fail
    }
  }

  private async notifyUser(request: any) {
    try {
      await this.emailService.sendEmail({
        to: request.user.email,
        template: 'verification-status',
        data: {
          type: request.type,
          status: request.status,
          notes: request.notes,
          reviewedAt: request.reviewedAt
        }
      });
    } catch (error) {
      console.error('Error notifying user:', error);
    }
  }
}