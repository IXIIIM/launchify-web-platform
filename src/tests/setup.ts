import { redis } from '@/services/redis';
import { prisma } from '@/services/db';

beforeAll(async () => {
  // Clear Redis test data
  await redis.flushdb();
  
  // Clear test database
  await prisma.scheduledNotification.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.match.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.entrepreneurProfile.deleteMany();
  await prisma.funderProfile.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await redis.disconnect();
  await prisma.$disconnect();
});