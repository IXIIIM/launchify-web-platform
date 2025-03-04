// src/server/services/verification.ts

import { PrismaClient } from '@prisma/client';
import { StorageService } from './storage';
import { StripeService } from './stripe';

const prisma = new PrismaClient();
const storageService = new StorageService();
const stripeService = new StripeService();

const VERIFICATION_FEE = 5000; // $5,000 per verification

export class VerificationService {
  async requestVerification(userId: string, level: string, documents: Buffer[], metadata: any) {
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        userId,
        type: level,
        status: { in: ['PENDING', 'IN_REVIEW'] }
      }
    });

    if (existingRequest) {
      throw new Error('Verification request already pending');
    }

    const documentUrls = await Promise.all(
      documents.map(doc => storageService.uploadVerificationDocument(doc, userId, level))
    );

    const paymentIntent = await stripeService.createPaymentIntent(
      VERIFICATION_FEE,
      userId,
      `Verification: ${level}`
    );

    return prisma.verificationRequest.create({
      data: {
        userId,
        type: level,
        status: 'PENDING',
        documents: documentUrls,
        metadata,
        paymentIntentId: paymentIntent.id
      }
    });
  }

  async approveVerification(requestId: string, reviewerId: string, notes?: string) {
    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!request) throw new Error('Verification request not found');
    if (request.status !== 'IN_REVIEW') throw new Error('Request not in review');

    await prisma.$transaction([
      prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewerId,
          reviewedAt: new Date(),
          notes
        }
      }),
      prisma.user.update({
        where: { id: request.userId },
        data: {
          verificationLevel: request.type,
          verificationHistory: {
            push: {
              level: request.type,
              approvedAt: new Date(),
              reviewerId
            }
          }
        }
      })
    ]);

    // Notify user of approval
    await prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'VERIFICATION_APPROVED',
        content: `Your ${request.type} verification has been approved!`,
        metadata: { level: request.type }
      }
    });
  }

  async rejectVerification(requestId: string, reviewerId: string, reason: string) {
    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) throw new Error('Verification request not found');
    if (request.status !== 'IN_REVIEW') throw new Error('Request not in review');

    await prisma.$transaction([
      prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewerId,
          reviewedAt: new Date(),
          notes: reason
        }
      }),
      prisma.notification.create({
        data: {
          userId: request.userId,
          type: 'VERIFICATION_REJECTED',
          content: `Your ${request.type} verification was not approved`,
          metadata: { level: request.type, reason }
        }
      })
    ]);

    // Process refund
    if (request.paymentIntentId) {
      await stripeService.refundPayment(request.paymentIntentId);
    }
  }

  async getVerificationRequests(filters: {
    status?: string;
    type?: string;
    userId?: string;
  }) {
    return prisma.verificationRequest.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            userType: true,
            entrepreneurProfile: true,
            funderProfile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async assignReviewer(requestId: string, reviewerId: string) {
    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) throw new Error('Verification request not found');
    if (request.status !== 'PENDING') throw new Error('Request not pending');

    return prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: 'IN_REVIEW',
        reviewerId,
        reviewStartedAt: new Date()
      }
    });
  }

  async addReviewNote(requestId: string, note: string, reviewerId: string) {
    return prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        reviewNotes: {
          push: {
            note,
            reviewerId,
            timestamp: new Date()
          }
        }
      }
    });
  }

  async requestAdditionalDocuments(requestId: string, documentTypes: string[], message: string) {
    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) throw new Error('Verification request not found');

    await prisma.$transaction([
      prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: 'PENDING_DOCUMENTS',
          additionalDocumentsRequested: documentTypes
        }
      }),
      prisma.notification.create({
        data: {
          userId: request.userId,
          type: 'VERIFICATION_DOCUMENTS_REQUESTED',
          content: message,
          metadata: { documentTypes }
        }
      })
    ]);
  }

  async submitAdditionalDocuments(requestId: string, documents: Buffer[]) {
    const request = await prisma.verificationRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) throw new Error('Verification request not found');
    if (request.status !== 'PENDING_DOCUMENTS') {
      throw new Error('Request not awaiting documents');
    }

    const documentUrls = await Promise.all(
      documents.map(doc => 
        storageService.uploadVerificationDocument(doc, request.userId, request.type)
      )
    );

    return prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: 'IN_REVIEW',
        documents: {
          push: documentUrls
        }
      }
    });
  }
}