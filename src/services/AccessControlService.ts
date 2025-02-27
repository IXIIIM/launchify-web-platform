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
const TIER_PERMISSIONS: Record<SubscriptionTier, AccessPermission[]> = {
  Basic: [
    { action: 'read', resource: 'profile' },
    { action: 'read', resource: 'basic_matches' }
  ],
  Chrome: [
    { action: 'read', resource: 'profile' },
    { action: 'read', resource: 'basic_matches' },
    { action: 'read', resource: 'chrome_matches' },
    { action: 'read', resource: 'basic_analytics' }
  ],
  Bronze: [
    { action: 'read', resource: 'profile' },
    { action: 'read', resource: 'basic_matches' },
    { action: 'read', resource: 'chrome_matches' },
    { action: 'read', resource: 'bronze_matches' },
    { action: 'read', resource: 'basic_analytics' },
    { action: 'read', resource: 'advanced_analytics' }
  ],
  Silver: [
    { action: 'read', resource: 'profile' },
    { action: 'read', resource: 'basic_matches' },
    { action: 'read', resource: 'chrome_matches' },
    { action: 'read', resource: 'bronze_matches' },
    { action: 'read', resource: 'silver_matches' },
    { action: 'read', resource: 'basic_analytics' },
    { action: 'read', resource: 'advanced_analytics' },
    { action: 'write', resource: 'priority_support' }
  ],
  Gold: [
    { action: 'read', resource: 'profile' },
    { action: 'read', resource: 'basic_matches' },
    { action: 'read', resource: 'chrome_matches' },
    { action: 'read', resource: 'bronze_matches' },
    { action: 'read', resource: 'silver_matches' },
    { action: 'read', resource: 'gold_matches' },
    { action: 'read', resource: 'basic_analytics' },
    { action: 'read', resource: 'advanced_analytics' },
    { action: 'write', resource: 'priority_support' },
    { action: 'write', resource: 'profile_boost' }
  ],
  Platinum: [
    { action: 'read', resource: 'profile' },
    { action: 'read', resource: 'basic_matches' },
    { action: 'read', resource: 'chrome_matches' },
    { action: 'read', resource: 'bronze_matches' },
    { action: 'read', resource: 'silver_matches' },
    { action: 'read', resource: 'gold_matches' },
    { action: 'read', resource: 'platinum_matches' },
    { action: 'read', resource: 'basic_analytics' },
    { action: 'read', resource: 'advanced_analytics' },
    { action: 'write', resource: 'priority_support' },
    { action: 'write', resource: 'profile_boost' },
    { action: 'write', resource: 'white_glove_service' }
  ]
};

export class AccessControlService {
  private prisma: PrismaClient;
  private redis: Redis;
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  async canAccessFeature(userId: string, feature: string): Promise<boolean> {
    const cacheKey = `access:${userId}:${feature}`;
    
    // Check cache first
    const cachedResult = await this.redis.get(cacheKey);
    if (cachedResult !== null) {
      return cachedResult === 'true';
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user || !user.subscription) {
      return false;
    }

    const hasAccess = this.checkTierPermissions(user.subscription.tier, feature);
    
    // Cache the result
    await this.redis.set(cacheKey, hasAccess.toString(), 'EX', this.CACHE_TTL);
    
    return hasAccess;
  }

  private checkTierPermissions(tier: SubscriptionTier, feature: string): boolean {
    const permissions = TIER_PERMISSIONS[tier];
    return permissions.some(permission => 
      `${permission.action}_${permission.resource}` === feature
    );
  }
}
