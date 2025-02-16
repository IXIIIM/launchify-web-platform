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