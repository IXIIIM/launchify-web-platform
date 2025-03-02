// src/tests/security/AccessControl.test.ts
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

      const canAccessBasicMatching = await accessControlService.canAccessFeature(
        user,
        'basicMatching'
      );
      expect(canAccessBasicMatching).toBe(true);
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

  describe('verification level access', () => {
    it('should restrict access based on verification level', async () => {
      const user = {
        id: '1',
        verificationLevel: 'None',
        userType: 'entrepreneur'
      };

      const canAccessVerifiedFeatures = await accessControlService.canAccessVerifiedFeature(
        user,
        'businessPlanReview'
      );
      expect(canAccessVerifiedFeatures).toBe(false);
    });

    it('should grant access to verified users', async () => {
      const user = {
        id: '1',
        verificationLevel: 'BusinessPlan',
        userType: 'entrepreneur'
      };

      const canAccessVerifiedFeatures = await accessControlService.canAccessVerifiedFeature(
        user,
        'businessPlanReview'
      );
      expect(canAccessVerifiedFeatures).toBe(true);
    });
  });

  describe('resource ownership', () => {
    it('should verify resource ownership', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        id: '1',
        userId: '1',
        matchedWithId: '2',
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const canAccess = await accessControlService.verifyResourceAccess(
        '1',
        'match',
        '1'
      );
      expect(canAccess).toBe(true);
    });

    it('should deny access to unauthorized resources', async () => {
      mockPrisma.match.findUnique.mockResolvedValue({
        id: '1',
        userId: '2',
        matchedWithId: '3',
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const canAccess = await accessControlService.verifyResourceAccess(
        '1',
        'match',
        '1'
      );
      expect(canAccess).toBe(false);
    });
  });
});

// src/tests/security/AuditLogging.test.ts
import { AuditLogService } from '@/services/AuditLogService';
import { PrismaClient } from '@prisma/client';
import { SNS } from 'aws-sdk';
import { mock } from 'jest-mock-extended';

describe('AuditLogService', () => {
  let auditLogService: AuditLogService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockSNS: jest.Mocked<SNS>;

  beforeEach(() => {
    mockPrisma = mock<PrismaClient>();
    mockSNS = mock<SNS>();
    auditLogService = new AuditLogService(mockPrisma, mockSNS);
  });

  describe('audit logging', () => {
    it('should log security events', async () => {
      const event = {
        userId: '1',
        action: 'LOGIN_ATTEMPT',
        status: 'SUCCESS',
        metadata: {
          ip: '192.168.1.1',
          userAgent: 'test-agent'
        }
      };

      mockPrisma.auditLog.create.mockResolvedValue({
        id: '1',
        ...event,
        createdAt: new Date()
      });

      await auditLogService.logSecurityEvent(event);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining(event)
      });
    });

    it('should notify on critical security events', async () => {
      const criticalEvent = {
        userId: '1',
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        status: 'FAILURE',
        metadata: {
          ip: '192.168.1.1',
          resource: 'admin_panel'
        }
      };

      mockSNS.publish.mockImplementation(() => ({
        promise: () => Promise.resolve({ MessageId: '123' })
      }));

      await auditLogService.logSecurityEvent(criticalEvent);

      expect(mockSNS.publish).toHaveBeenCalledWith({
        TopicArn: expect.any(String),
        Message: expect.stringContaining('UNAUTHORIZED_ACCESS_ATTEMPT')
      });
    });
  });

  describe('audit log queries', () => {
    it('should retrieve user activity logs', async () => {
      const userId = '1';
      const mockLogs = [
        {
          id: '1',
          userId,
          action: 'PROFILE_UPDATE',
          status: 'SUCCESS',
          metadata: {},
          createdAt: new Date()
        }
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const logs = await auditLogService.getUserActivityLogs(userId);
      expect(logs).toEqual(mockLogs);
    });

    it('should filter logs by time range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await auditLogService.getSecurityLogs(startDate, endDate);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    });

    it('should identify suspicious patterns', async () => {
      const mockLogs = [
        {
          id: '1',
          userId: '1',
          action: 'LOGIN_ATTEMPT',
          status: 'FAILURE',
          metadata: { ip: '192.168.1.1' },
          createdAt: new Date()
        },
        {
          id: '2',
          userId: '1',
          action: 'LOGIN_ATTEMPT',
          status: 'FAILURE',
          metadata: { ip: '192.168.1.1' },
          createdAt: new Date()
        }
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const suspiciousActivity = await auditLogService.detectSuspiciousActivity('1');
      expect(suspiciousActivity.hasFailedAttempts).toBe(true);
    });
  });
});