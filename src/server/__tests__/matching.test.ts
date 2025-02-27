// src/server/__tests__/matching.test.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { getMatches, swipe, updatePreferences } from '../controllers/matching.controller';
import { UsageService } from '../services/usage';

// Mock Prisma
jest.mock('@prisma/client');
const prismaMock = mockDeep<PrismaClient>();

// Mock Usage Service
jest.mock('../services/usage');
const usageServiceMock = mockDeep<UsageService>();

describe('Matching Controller', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReset(prismaMock);
    mockReset(usageServiceMock);

    mockReq = {
      user: {
        id: 'test-user-id',
        userType: 'entrepreneur',
        entrepreneurProfile: {
          industries: ['Tech', 'Finance'],
          desiredInvestment: {
            amount: 500000,
            timeframe: '12 months'
          },
          yearsExperience: 5
        }
      }
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('getMatches', () => {
    it('should return potential matches with compatibility scores', async () => {
      // Mock usage service check
      usageServiceMock.trackMatch.mockResolvedValue(true);

      // Mock potential matches
      const mockMatches = [
        {
          id: 'funder-1',
          userType: 'funder',
          verificationLevel: 'BusinessPlan',
          funderProfile: {
            areasOfInterest: ['Tech'],
            investmentPreferences: {
              min: 100000,
              max: 1000000
            },
            yearsExperience: 7
          }
        },
        {
          id: 'funder-2',
          userType: 'funder',
          verificationLevel: 'None',
          funderProfile: {
            areasOfInterest: ['Retail'],
            investmentPreferences: {
              min: 50000,
              max: 200000
            },
            yearsExperience: 3
          }
        }
      ];

      prismaMock.user.findMany.mockResolvedValue(mockMatches);

      await getMatches(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];

      // Verify response structure
      expect(response).toBeInstanceOf(Array);
      expect(response.length).toBe(2);
      expect(response[0]).toHaveProperty('compatibility');
      expect(response[0]).toHaveProperty('matchReasons');

      // Verify sorting by compatibility
      expect(response[0].compatibility).toBeGreaterThanOrEqual(response[1].compatibility);
    });

    it('should handle daily match limit exceeded', async () => {
      usageServiceMock.trackMatch.mockResolvedValue(false);

      await getMatches(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('limit')
        })
      );
    });
  });

  describe('swipe', () => {
    it('should create a match on right swipe', async () => {
      mockReq.body = {
        targetUserId: 'target-user-id',
        direction: 'right'
      };

      // Mock no existing match
      prismaMock.match.findFirst.mockResolvedValue(null);

      await swipe(mockReq, mockRes);

      expect(prismaMock.match.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'test-user-id',
          targetUserId: 'target-user-id',
          status: 'pending'
        })
      });

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isMatch: false
        })
      );
    });

    it('should create mutual match when both users like each other', async () => {
      mockReq.body = {
        targetUserId: 'target-user-id',
        direction: 'right'
      };

      // Mock existing match
      prismaMock.match.findFirst.mockResolvedValue({
        id: 'existing-match-id',
        userId: 'target-user-id',
        targetUserId: 'test-user-id',
        status: 'pending'
      });

      await swipe(mockReq, mockRes);

      // Verify match status update
      expect(prismaMock.match.update).toHaveBeenCalledWith({
        where: { id: 'existing-match-id' },
        data: { status: 'matched' }
      });

      // Verify chat room creation
      expect(prismaMock.chatRoom.create).toHaveBeenCalled();

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isMatch: true
        })
      );
    });

    it('should handle left swipe (reject)', async () => {
      mockReq.body = {
        targetUserId: 'target-user-id',
        direction: 'left'
      };

      await swipe(mockReq, mockRes);

      expect(prismaMock.match.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'test-user-id',
          targetUserId: 'target-user-id',
          status: 'rejected'
        })
      });
    });
  });

  describe('updatePreferences', () => {
    it('should update match preferences', async () => {
      const preferences = {
        industries: ['Tech', 'Finance'],
        investmentRange: {
          min: 100000,
          max: 1000000
        },
        experienceRange: {
          min: 2,
          max: 10
        }
      };

      mockReq.body = preferences;

      await updatePreferences(mockReq, mockRes);

      expect(prismaMock.matchPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        update: preferences,
        create: expect.objectContaining({
          ...preferences,
          userId: 'test-user-id'
        })
      });

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          preferences
        })
      );
    });

    it('should validate preference data', async () => {
      mockReq.body = {
        industries: ['Tech'],
        investmentRange: {
          min: -1000, // Invalid negative value
          max: 1000000
        }
      };

      await updatePreferences(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('validation')
        })
      );
    });
  });
});