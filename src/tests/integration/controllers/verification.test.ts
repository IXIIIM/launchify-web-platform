import { VerificationController } from '@/controllers/verification.controller';
import { PrismaClient } from '@prisma/client';
import { SNS } from 'aws-sdk';
import { createMockContext } from '../helpers/context';
import { setupTestDatabase } from '../helpers/database';
import { createTestUser } from '../helpers/factories';

describe('VerificationController Integration Tests', () => {
  let prisma: PrismaClient;
  let controller: VerificationController;
  let mockSNS: jest.Mocked<SNS>;
  let testUser: any;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    mockSNS = {
      publish: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ MessageId: '123' })
      })
    } as any;
    controller = new VerificationController(prisma, mockSNS);
  });

  beforeEach(async () => {
    await prisma.clearDatabase();
    testUser = await createTestUser(prisma, {
      userType: 'entrepreneur',
      subscriptionTier: 'Gold'
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('submitBusinessPlan', () => {
    it('should create verification request', async () => {
      const { req, res } = createMockContext({
        user: testUser,
        body: {
          documents: ['doc1.pdf', 'doc2.pdf'],
          metadata: { industry: 'Tech' }
        }
      });

      await controller.submitBusinessPlan(req, res);

      const verification = await prisma.verificationRequest.findFirst({
        where: {
          userId: testUser.id,
          type: 'BusinessPlan'
        }
      });

      expect(verification).toBeTruthy();
      expect(verification?.status).toBe('PENDING');
      expect(verification?.documents).toHaveLength(2);
    });

    it('should log verification attempt', async () => {
      const { req, res } = createMockContext({
        user: testUser,
        body: {
          documents: ['doc1.pdf']
        }
      });

      await controller.submitBusinessPlan(req, res);

      const accessLog = await prisma.accessLog.findFirst({
        where: {
          userId: testUser.id,
          action: 'SUBMIT',
          resource: 'business_plan_verification'
        }
      });

      expect(accessLog).toBeTruthy();
      expect(accessLog?.success).toBe(true);
    });
  });
});