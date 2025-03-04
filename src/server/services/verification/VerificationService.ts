// src/server/services/verification/VerificationService.ts
import { PrismaClient } from '@prisma/client';
import { StorageService } from '../storage/StorageService';
import { EmailService } from '../email/EmailService';
import { SubscriptionService } from '../subscription/SubscriptionService';
import { VerificationLevel } from '../../types/user';

const prisma = new PrismaClient();

interface VerificationConfig {
  validDuration: number; // in milliseconds
  maxRetries: number;
  requiredDocuments: string[];
  price?: number; // for certified validation
}

const VERIFICATION_CONFIGS: Record<string, VerificationConfig> = {
  BusinessPlan: {
    validDuration: 365 * 24 * 60 * 60 * 1000, // 1 year
    maxRetries: 2,
    requiredDocuments: ['businessPlan', 'financialProjections'],
    price: 5000 // $5,000 for certified validation
  },
  UseCase: {
    validDuration: 180 * 24 * 60 * 60 * 1000, // 6 months
    maxRetries: 3,
    requiredDocuments: ['useCaseDocumentation', 'marketAnalysis'],
    price: 5000
  },
  DemographicAlignment: {
    validDuration: 180 * 24 * 60 * 60 * 1000, // 6 months
    maxRetries: 2,
    requiredDocuments: ['demographicAnalysis', 'marketResearch'],
    price: 5000
  },
  AppUXUI: {
    validDuration: 90 * 24 * 60 * 60 * 1000, // 3 months
    maxRetries: 3,
    requiredDocuments: ['designSpecs', 'prototypes', 'userFlows'],
    price: 5000
  },
  FiscalAnalysis: {
    validDuration: 90 * 24 * 60 * 60 * 1000, // 3 months
    maxRetries: 2,
    requiredDocuments: ['financialStatements', 'auditReports'],
    price: 5000
  }
};

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
    additionalInfo?: Record<string, any>,
    isCertified: boolean = false
  ) {
    // Check if user has access to this verification level
    const canAccess = await this.canSubmitVerification(userId, level);
    if (!canAccess.allowed) {
      throw new Error(canAccess.reason || 'Cannot submit verification');
    }

    // Upload documents to storage
    const documentUrls = await Promise.all(
      documents.map(async (doc) => {
        const url = await this.storageService.uploadVerificationDocument(
          doc.buffer,
          userId,
          level,
          doc.originalname
        );
        return {
          name: doc.originalname,
          url,
          type: doc.mimetype,
          size: doc.size
        };
      })
    );

    // Create verification request
    const request = await prisma.verificationRequest.create({
      data: {
        userId,
        type: level,
        status: 'pending',
        documents: documentUrls,
        metadata: additionalInfo || {},
        isCertified
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

    // Send email to user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user) {
      await this.emailService.sendEmail({
        to: user.email,
        template: 'verification-submitted',
        data: {
          name: user.name || 'User',
          type: level,
          documents: documentUrls,
          isCertified
        }
      });
    }

    // If certified validation, create payment intent
    if (isCertified) {
      // TODO: Create payment intent for certified validation
      // This would integrate with the payment service
    }

    // Notify admins about new verification request
    await this.notifyAdminsAboutVerification(request.id, level, isCertified);

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
        name: request.user.name || 'User',
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
        name: request.user.name || 'User',
        level: request.type,
        reason
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'verification_rejected',
        content: `Your verification request for ${request.type} has been rejected.`
      }
    });

    return {
      success: true,
      message: 'Verification request rejected'
    };
  }

  async requestAdditionalInfo(requestId: string, reviewerId: string, questions: string[]) {
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
        status: 'info_requested',
        reviewerId,
        reviewedAt: new Date(),
        notes: `Additional information requested: ${questions.join(', ')}`
      }
    });

    // Send email notification
    await this.emailService.sendEmail({
      to: request.user.email,
      template: 'verification-info-requested',
      data: {
        name: request.user.name || 'User',
        level: request.type,
        questions
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'verification_info_requested',
        content: `Additional information requested for your ${request.type} verification.`
      }
    });

    return {
      success: true,
      message: 'Additional information requested'
    };
  }

  async getVerificationRequests(filters: any = {}) {
    return prisma.verificationRequest.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            userType: true,
            subscriptionTier: true
          }
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getVerificationRequest(requestId: string) {
    return prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            userType: true,
            subscriptionTier: true,
            entrepreneurProfile: true,
            funderProfile: true
          }
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
  }

  async getUserVerificationStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        verificationLevel: true,
        verificationRequests: {
          where: {
            status: 'pending'
          }
        }
      }
    });

    if (!user) throw new Error('User not found');

    const pendingRequests = user.verificationRequests.map(req => req.type);
    
    // Get available verification levels based on subscription
    const availableLevels = await this.getAvailableVerificationLevels(userId);

    return {
      currentLevel: user.verificationLevel,
      pendingRequests,
      availableLevels
    };
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
    const allowed = await this.subscriptionService.canAccessVerificationLevel(userId, type);
    if (!allowed) {
      return { allowed: false, reason: 'Subscription level does not allow this verification type' };
    }

    return { allowed: true };
  }

  private async getAvailableVerificationLevels(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        verificationLevel: true
      }
    });

    if (!user) throw new Error('User not found');

    const allLevels = [
      'None',
      'BusinessPlan',
      'UseCase',
      'DemographicAlignment',
      'AppUXUI',
      'FiscalAnalysis'
    ];

    // Get current level index
    const currentLevelIndex = allLevels.indexOf(user.verificationLevel);
    
    // Get available levels based on subscription tier
    const availableLevels = [];
    
    for (let i = currentLevelIndex + 1; i < allLevels.length; i++) {
      const level = allLevels[i];
      const canAccess = await this.subscriptionService.canAccessVerificationLevel(userId, level);
      if (canAccess) {
        availableLevels.push({
          level,
          requiredDocuments: VERIFICATION_CONFIGS[level].requiredDocuments,
          price: VERIFICATION_CONFIGS[level].price
        });
      }
    }

    return availableLevels;
  }

  private async notifyAdminsAboutVerification(requestId: string, level: string, isCertified: boolean) {
    // Get admin users
    const admins = await prisma.user.findMany({
      where: {
        role: 'admin'
      }
    });

    // Send notifications to all admins
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'new_verification_request',
          content: `New ${isCertified ? 'certified ' : ''}verification request for ${level}`,
          metadata: {
            requestId,
            level,
            isCertified
          }
        }
      });

      // Send email to admin
      await this.emailService.sendEmail({
        to: admin.email,
        template: 'verification-request-admin',
        data: {
          requestId,
          level,
          isCertified,
          reviewUrl: `/admin/verifications/${requestId}`
        }
      });
    }
  }
}
}