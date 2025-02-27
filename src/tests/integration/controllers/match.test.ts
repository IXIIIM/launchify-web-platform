// src/tests/integration/controllers/match.test.ts
import { MatchController } from '@/controllers/match.controller';
import { PrismaClient } from '@prisma/client';
import { SNS } from 'aws-sdk';
import { createMockContext } from '../helpers/context';
import { setupTestDatabase } from '../helpers/database';
import { createTestUser, createTestMatch } from '../helpers/factories';

describe('MatchController Integration Tests', () => {
  let prisma: PrismaClient;
  let controller: MatchController;
  let mockSNS: jest.Mocked<SNS>;
  let testUser: any;
  let testMatch: any;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    mockSNS = {
      publish: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({ MessageId: '123' })
      })
    } as any;
    controller = new MatchController(prisma, mockSNS);
  });

  beforeEach(async () => {
    await prisma.clearDatabase();
    testUser = await createTestUser(prisma, {
      userType: 'entrepreneur',
      subscriptionTier: 'Gold'
    });
    testMatch = await createTestMatch(prisma, testUser.id);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('getPotentialMatches', () => {
    it('should return matches for authenticated user', async () => {
      const { req, res } = createMockContext({
        user: testUser
      });

      await controller.getPotentialMatches(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: testMatch.id
          })
        ])
      );
    });

    it('should log access attempt', async () => {
      const { req, res } = createMockContext({
        user: testUser
      });

      await controller.getPotentialMatches(req, res);

      const accessLog = await prisma.accessLog.findFirst({
        where: {
          userId: testUser.id,
          action: 'READ',
          resource: 'matches'
        }
      });

      expect(accessLog).toBeTruthy();
      expect(accessLog?.success).toBe(true);
    });
  });

  describe('connectWithMatch', () => {
    it('should connect users when authorized', async () => {
      const { req, res } = createMockContext({
        user: testUser,
        params: { id: testMatch.id }
      });

      await controller.connectWithMatch(req, res);

      const updatedMatch = await prisma.match.findUnique({
        where: { id: testMatch.id }
      });

      expect(updatedMatch?.status).toBe('CONNECTED');
      expect(updatedMatch?.connectedAt).toBeTruthy();
    });

    it('should prevent unauthorized connections', async () => {
      const unauthorizedUser = await createTestUser(prisma, {
        userType: 'entrepreneur'
      });

      const { req, res } = createMockContext({
        user: unauthorizedUser,
        params: { id: testMatch.id }
      });

      await controller.connectWithMatch(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});

// src/tests/integration/controllers/verification.test.ts
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

// src/tests/integration/helpers/context.ts
import { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';

export const createMockContext = ({
  user = null,
  body = {},
  params = {},
  query = {}
} = {}) => {
  const req = mock<Request>();
  const res = mock<Response>();

  req.user = user;
  req.body = body;
  req.params = params;
  req.query = query;

  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();

  return { req, res };
};

// src/tests/integration/helpers/database.ts
import { PrismaClient } from '@prisma/client';

export const setupTestDatabase = async () => {
  const prisma = new PrismaClient();

  // Add clearDatabase method for testing
  prisma.clearDatabase = async () => {
    const tablenames = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter(name => name !== '_prisma_migrations')
      .map(name => `"public"."${name}"`)
      .join(', ');

    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error) {
      console.log({ error });
    }
  };

  return prisma;
};

// src/tests/integration/helpers/factories.ts
import { PrismaClient } from '@prisma/client';

export const createTestUser = async (
  prisma: PrismaClient,
  data: any = {}
) => {
  return await prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      password: 'hashed_password',
      userType: data.userType || 'entrepreneur',
      subscriptionTier: data.subscriptionTier || 'Basic',
      verificationLevel: data.verificationLevel || 'None',
      emailVerified: true,
      phoneVerified: true,
      ...data
    }
  });
};

export const createTestMatch = async (
  prisma: PrismaClient,
  userId: string,
  data: any = {}
) => {
  const otherUser = await createTestUser(prisma, {
    userType: 'funder'
  });

  return await prisma.match.create({
    data: {
      userId,
      matchedWithId: otherUser.id,
      status: 'PENDING',
      compatibility: 0.85,
      ...data
    }
  });
};