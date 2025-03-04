// src/server/__tests__/recommendation.test.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { RecommendationService } from '../services/recommendation';
import { RecommendationSubscriptionService } from '../services/recommendation-subscription';
import { getRecommendations, refreshRecommendations } from '../controllers/recommendation.controller';

const prismaMock = mockDeep<PrismaClient>();
const redisMock = {
  get: jest.fn(),
  set: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  setex: jest.fn()
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock)
}));

jest.mock('ioredis', () => jest.fn(() => redisMock));

describe('Recommendation System', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReset(prismaMock);
    mockReq = {
      user: {
        id: 'test-user-id',
        subscriptionTier: 'Gold'
      }
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('Recommendation Service', () => {
    let service: RecommendationService;

    beforeEach(() => {
      service = new RecommendationService();
    });

    test('calculates industry score correctly', async () => {
      const user = {
        userType: 'entrepreneur',
        entrepreneurProfile: {
          industries: ['Tech', 'Finance']
        }
      };

      const match = {
        userType: 'funder',
        funderProfile: {
          areasOfInterest: ['Tech', 'Healthcare']
        }
      };

      const score = await service['calculateIndustryScore'](user, match);
      expect(score).toBe(0.5); // 1 common industry out of 2
    });

    test('calculates investment score correctly', async () => {
      const entrepreneur = {
        userType: 'entrepreneur',
        entrepreneurProfile: {
          desiredInvestment: {
            amount: 500000
          }
        }
      };

      const funder = {
        userType: 'funder',
        funderProfile: {
          investmentPreferences: {
            min: 250000,
            max: 1000000
          }
        }
      };

      const score = await service['calculateInvestmentScore'](entrepreneur, funder);
      expect(score).toBeGreaterThan(0.6);
      expect(score).toBeLessThan(0.8);
    });

    test('calculates experience score correctly', async () => {
      const user1 = {
        entrepreneurProfile: { yearsExperience: 5 }
      };

      const user2 = {
        funderProfile: { yearsExperience: 7 }
      };

      const score = await service['calculateExperienceScore'](user1, user2);
      expect(score).toBeGreaterThan(0.7);
    });

    test('gets appropriate recommendation reasons', async () => {
      const user = {
        userType: 'entrepreneur',
        entrepreneurProfile: {
          industries: ['Tech'],
          yearsExperience: 5,
          desiredInvestment: { amount: 500000 }
        }
      };

      const match = {
        userType: 'funder',
        funderProfile: {
          areasOfInterest: ['Tech'],
          yearsExperience: 6,
          investmentPreferences: {
            min: 250000,
            max: 1000000
          }
        },
        verificationLevel: 'BusinessPlan'
      };

      const reasons = await service['getRecommendationReasons'](user, match, 85);
      expect(reasons).toContain('Strong industry alignment');
      expect(reasons).toContain('Similar experience level');
    });
  });

  describe('Subscription Integration', () => {
    let subscriptionService: RecommendationSubscriptionService;

    beforeEach(() => {
      subscriptionService = new RecommendationSubscriptionService();
    });

    test('validates daily recommendation limits', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        subscriptionTier: 'Basic'
      });

      redisMock.incr.mockResolvedValue(3);
      
      const hasAccess = await subscriptionService.validateRecommendationAccess('test-user-id');
      expect(hasAccess).toBeTruthy();

      redisMock.incr.mockResolvedValue(6);
      
      const noAccess = await subscriptionService.validateRecommendationAccess('test-user-id');
      expect(noAccess).toBeFalsy();
    });

    test('applies tier bonuses correctly', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        subscriptionTier: 'Gold'
      });

      const baseScore = 70;
      const enhancedScore = await subscriptionService.applyTierBonuses('test-user-id', baseScore);
      expect(enhancedScore).toBe(84); // 20% bonus for Gold tier
    });

    test('handles refresh cooldowns', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        subscriptionTier: 'Silver'
      });

      redisMock.get.mockResolvedValue(null);
      const canRefresh = await subscriptionService.canRefreshRecommendations('test-user-id');
      expect(canRefresh).toBeTruthy();

      const recentTimestamp = Math.floor(Date.now() / 1000) - 1000;
      redisMock.get.mockResolvedValue(recentTimestamp.toString());
      const cannotRefresh = await subscriptionService.canRefreshRecommendations('test-user-id');
      expect(cannotRefresh).toBeFalsy();
    });
  });

  describe('Controller Integration', () => {
    test('returns recommendations with features', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        subscriptionTier: 'Gold'
      });

      const mockRecommendations = [
        {
          user: {
            id: 'match-1',
            name: 'Test Match',
            industries: ['Tech']
          },
          score: 85,
          reasons: ['Strong industry alignment']
        }
      ];

      prismaMock.match.findMany.mockResolvedValue(mockRecommendations);

      await getRecommendations(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            score: expect.any(Number),
            reasons: expect.arrayContaining([expect.any(String)])
          })
        ]),
        features: expect.arrayContaining(['customFilters', 'priorityMatching'])
      }));
    });

    test('handles refresh cooldown', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'test-user-id',
        subscriptionTier: 'Basic'
      });

      const recentTimestamp = Math.floor(Date.now() / 1000) - 1000;
      redisMock.get.mockResolvedValue(recentTimestamp.toString());

      await refreshRecommendations(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('cooldown')
      }));
    });
  });
});