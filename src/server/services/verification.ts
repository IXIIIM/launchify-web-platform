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

  // ... rest of the verification service implementation
}