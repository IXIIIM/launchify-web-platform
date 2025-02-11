import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

interface AccessPermission {
  action: string;
  resource: string;
}

type SubscriptionTier = 'Basic' | 'Chrome' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
type UserType = 'entrepreneur' | 'funder' | 'admin';
type VerificationLevel = 'None' | 'BusinessPlan' | 'UseCase' | 'DemographicAlignment' | 'AppUXUI' | 'FiscalAnalysis';

// Rest of the file content...