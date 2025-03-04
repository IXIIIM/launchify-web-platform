import { PrismaClient } from '@prisma/client';
import { StorageService } from '../storage/StorageService';
import { EmailService } from '../email/EmailService';
import { SubscriptionService } from '../subscription/SubscriptionService';
import { VerificationLevel } from '@/types/user';

const prisma = new PrismaClient();

export class VerificationService {
  private storageService: StorageService;
  private emailService: EmailService;
  private subscriptionService: SubscriptionService;

  constructor(
    storageService: StorageService,
    emailService: EmailService,
    subscriptionService: SubscriptionService
  ) {
    this.storageService = storageService;
    this.emailService = emailService;
    this.subscriptionService = subscriptionService;
  }

  async submitVerification(
    userId: string,
    level: VerificationLevel,
    documents: Express.Multer.File[],
    additionalInfo?: Record<string, any>
  ) {
    // Check if user has access to this verification level
    const canAccess = await this.subscriptionService.canAccessVerificationLevel(userId, level);
    if (!canAccess) {
      throw new Error('Current subscription does not support this verification level');
    }

    // Check if there's already a pending verification
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        userId,
        type: level,
        status: 'pending'
      }
    });

    if (existingRequest) {
      throw new Error('A verification request is already pending for this level');
    }

    // Upload documents to storage
    const documentUrls = await Promise.all(
      documents.map(async (doc) => {
        const url = await this.storageService.uploadVerificationDocument(
          doc.buffer,
          userId,
          level
        );
        return url;
      })
    );

    // Create verification request
    const request = await prisma.verificationRequest.create({
      data: {
        userId,
        type: level,
        status: 'pending',
        documents: documentUrls,
        metadata: additionalInfo || {}
      }
    });

    // Send notification to user
    await prisma.notification.create({
      data: {
        userId,
        type: 'verification_submitted',
        content: `Your verification request for ${level} has been submitted and is under review.`
      }
    });

    return request;
  }

  async approveVerification(requestId: string, reviewerId: string, notes?: string) {
    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true
      }
    });

    if (!request) throw new Error('Verification request not found');

    // Update verification status
    await Promise.all([
      // Update request status
      prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          reviewerId,
          reviewedAt: new Date(),
          notes
        }
      }),
      
      // Update user verification level
      prisma.user.update({
        where: { id: request.userId },
        data: {
          verificationLevel: request.type
        }
      })
    ]);

    // Send email notification
    await this.emailService.sendEmail({
      to: request.user.email,
      template: 'verification-approved',
      data: {
        name: request.user.name,
        level: request.type,
        notes
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'verification_approved',
        content: `Your verification request for ${request.type} has been approved!`
      }
    });

    return {
      success: true,
      message: 'Verification request approved'
    };
  }

  async rejectVerification(requestId: string, reviewerId: string, reason: string) {
    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true
      }
    });

    if (!request) throw new Error('Verification request not found');

    // Update request status
    await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        reviewerId,
        reviewedAt: new Date(),
        notes: reason
      }
    });

    // Send email notification
    await this.emailService.sendEmail({
      to: request.user.email,
      template: 'verification-rejected',
      data: {
        name: request.user.name,
        level: request.type,
        reason
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'verification_rejected',
        content: `Your verification request for ${request.type} has been rejected. Please check your email for details.`
      }
    });

    return {
      success: true,
      message: 'Verification request rejected'
    };
  }

  async getVerificationStatus(userId: string) {
    const requests = await prisma.verificationRequest.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        verificationLevel: true,
        subscriptionTier: true
      }
    });

    const availableLevels = await this.getAvailableVerificationLevels(user!.subscriptionTier);

    return {
      currentLevel: user?.verificationLevel,
      requests,
      availableLevels
    };
  }

  private async getAvailableVerificationLevels(subscriptionTier: string): Promise<VerificationLevel[]> {
    const tierLevels = {
      Basic: ['None'],
      Chrome: ['None', 'BusinessPlan'],
      Bronze: ['None', 'BusinessPlan', 'UseCase'],
      Silver: ['None', 'BusinessPlan', 'UseCase', 'DemographicAlignment'],
      Gold: ['None', 'BusinessPlan', 'UseCase', 'DemographicAlignment', 'AppUXUI'],
      Platinum: ['None', 'BusinessPlan', 'UseCase', 'DemographicAlignment', 'AppUXUI', 'FiscalAnalysis']
    };

    return tierLevels[subscriptionTier as keyof typeof tierLevels] as VerificationLevel[];
  }

  async checkVerificationRequirements(level: VerificationLevel): Promise<string[]> {
    const requirements = {
      BusinessPlan: [
        'Business plan document',
        'Financial projections',
        'Market analysis'
      ],
      UseCase: [
        'Product/service documentation',
        'Target market definition',
        'Competition analysis',
        'Use case scenarios'
      ],
      DemographicAlignment: [
        'Customer demographic data',
        'Market size analysis',
        'Growth potential analysis'
      ],
      AppUXUI: [
        'App screenshots/mockups',
        'User flow documentation',
        'Technical architecture diagram'
      ],
      FiscalAnalysis: [
        'Detailed financial statements',
        'Cash flow projections',
        'Revenue model documentation',
        'Investment timeline'
      ]
    };

    return requirements[level as keyof typeof requirements] || [];
  }
}