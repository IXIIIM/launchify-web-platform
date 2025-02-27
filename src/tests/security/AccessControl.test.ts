import { AccessControlService } from '@/services/AccessControlService';
import { PrismaClient } from '@prisma/client';
import { mock } from 'jest-mock-extended';

describe('AccessControlService', () => {
  let accessControlService: AccessControlService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = mock<PrismaClient>();
    accessControlService = new AccessControlService(mockPrisma);
  });

  describe('subscription tier access', () => {
    it('should enforce Basic tier restrictions', async () => {
      const user = {
        id: '1',
        subscriptionTier: 'Basic',
        userType: 'entrepreneur'
      };

      const canAccessAnalytics = await accessControlService.canAccessFeature(
        user,
        'analytics'
      );
      expect(canAccessAnalytics).toBe(false);
    });

    it('should allow Premium tier features', async () => {
      const user = {
        id: '1',
        subscriptionTier: 'Platinum',
        userType: 'funder'
      };

      const canAccessAllFeatures = await Promise.all([
        accessControlService.canAccessFeature(user, 'analytics'),
        accessControlService.canAccessFeature(user, 'advancedMatching'),
        accessControlService.canAccessFeature(user, 'prioritySupport')
      ]);

      expect(canAccessAllFeatures.every(Boolean)).toBe(true);
    });
  });
});