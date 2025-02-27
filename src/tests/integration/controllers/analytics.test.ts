import { AnalyticsController } from '@/controllers/analytics.controller';
import { PrismaClient } from '@prisma/client';
import { SNS } from 'aws-sdk';
import { createMockContext } from '../helpers/context';
import { setupTestDatabase } from '../helpers/database';
import { createTestUser } from '../helpers/factories';

describe('AnalyticsController Integration Tests', () => {
  let prisma: PrismaClient;
  let controller: AnalyticsController;
  let mockSNS: jest.Mocked<SNS>;
  let testUser: any;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    mockSNS = {
      publish: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ MessageId: '123' })
      })
    } as any;
    controller = new AnalyticsController(prisma, mockSNS);
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

  describe('getBasicAnalytics', () => {
    it('should return analytics for user', async () => {
      const { req, res } = createMockContext({
        user: testUser,
        query: { timeframe: '30d' }
      });

      await controller.getBasicAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timeframe: '30d',
          matches: expect.any(Number),
          messages: expect.any(Number),
          profileViews: expect.any(Number)
        })
      );
    });
  });
});