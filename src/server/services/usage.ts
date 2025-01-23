import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

interface TierLimits {
  dailyMatches: number;
  monthlyMessages: number;
  maxActiveChats: number;
  canAccessAnalytics: boolean;
  canBoostProfile: boolean;
  verificationAccess: string[];
}

// ... [Rest of the usage service implementation] ...