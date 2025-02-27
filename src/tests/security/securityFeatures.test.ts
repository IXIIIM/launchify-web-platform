// src/tests/integration/security/securityFeatures.test.ts
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { SecurityAlertService } from '@/services/SecurityAlertService';
import { SecurityLoggingService } from '@/services/SecurityLoggingService';
import { VerificationService } from '@/services/VerificationService';
import { createTestUser, createTestAdmin } from '../helpers/userHelpers';
import { setupTestDatabase, teardownTestDatabase } from '../helpers/dbHelpers';
import { mockEmailService, mockWebSocket } from '../mocks/serviceMocks';

const prisma = new PrismaClient();
let securityAlertService: SecurityAlertService;
let securityLoggingService: SecurityLoggingService;
let verificationService: VerificationService;
let testUser: any;
let testAdmin: any;

describe('Security Features Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    
    // Initialize services with mocked dependencies
    const emailService = mockEmailService();
    const wsServer = mockWebSocket();
    
    securityAlertService = new SecurityAlertService(emailService, wsServer);
    securityLoggingService = new SecurityLoggingService(securityAlertService);
    verificationService = new VerificationService(emailService, securityAlertService);

    // Create test users
    testUser = await createTestUser(prisma);
    testAdmin = await createTestAdmin(prisma);
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await prisma.securityAlert.deleteMany();
    await prisma.securityLog.deleteMany();
    await prisma.verificationRequest.deleteMany();
  });

  describe('Security Alert System', () => {
    test('should create and process security alerts', async () => {
      // Create test alert
      const alert = await securityAlertService.createAlert(
        'test_alert',
        { testData: true },
        {
          title: 'Test Alert',
          description: 'Test alert description',
          severity: 'high',
          requiresImmediate: true,
          notifyAdmins: true
        }
      );

      // Verify alert creation
      expect(alert).toBeDefined();
      expect(alert.severity).toBe('high');

      // Verify admin notification
      const notifications = await prisma.notification.findMany({
        where: { type: 'security_alert' }
      });
      expect(notifications).toHaveLength(1);
      expect(notifications[0].userId).toBe(testAdmin.id);
    });

    test('should detect and alert on suspicious patterns', async () => {
      // Simulate multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await securityLoggingService.log({
          type: 'failed_login',
          message: 'Failed login attempt',
          severity: 'medium',
          userId: testUser.id,
          ip: '192.168.1.1'
        });
      }

      // Verify pattern detection
      const alerts = await prisma.securityAlert.findMany({
        where: { type: 'security_pattern_match' }
      });
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('high');
    });
  });

  describe('Verification System', () => {
    test('should process verification requests with proper security logging', async () => {
      // Submit verification request
      const request = await verificationService.submitVerificationRequest(
        testUser.id,
        'BusinessPlan',
        ['document1.pdf', 'document2.pdf']
      );

      // Verify request creation
      expect(request).toBeDefined();
      expect(request.status).toBe('pending');

      // Verify security logging
      const logs = await prisma.securityLog.findMany({
        where: { type: 'verification_request' }
      });
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe(testUser.id);

      // Review request
      const reviewedRequest = await verificationService.reviewVerificationRequest(
        request.id,
        'approved',
        'Test approval notes',
        testAdmin.id
      );

      // Verify status update
      expect(reviewedRequest.status).toBe('approved');

      // Verify approval logging
      const approvalLogs = await prisma.securityLog.findMany({
        where: { type: 'verification_approval' }
      });
      expect(approvalLogs).toHaveLength(1);
    });

    test('should enforce verification request limits', async () => {
      // Create max allowed requests
      const config = await verificationService.getVerificationConfig('BusinessPlan');
      for (let i = 0; i < config.maxRetries; i++) {
        await verificationService.submitVerificationRequest(
          testUser.id,
          'BusinessPlan',
          ['document.pdf']
        );
      }

      // Attempt to exceed limit
      await expect(
        verificationService.submitVerificationRequest(
          testUser.id,
          'BusinessPlan',
          ['document.pdf']
        )
      ).rejects.toThrow('Maximum retry attempts reached');

      // Verify limit exceeded logging
      const logs = await prisma.securityLog.findMany({
        where: { 
          type: 'verification_limit_exceeded',
          userId: testUser.id
        }
      });
      expect(logs).toHaveLength(1);
    });
  });

  describe('Security Logging System', () => {
    test('should track and aggregate security events', async () => {
      // Generate test security events
      const events = [
        {
          type: 'auth_attempt',
          severity: 'low',
          message: 'Test auth attempt'
        },
        {
          type: 'profile_update',
          severity: 'medium',
          message: 'Test profile update'
        },
        {
          type: 'admin_action',
          severity: 'high',
          message: 'Test admin action'
        }
      ];

      // Log events
      for (const event of events) {
        await securityLoggingService.log({
          ...event,
          userId: testUser.id,
          ip: '192.168.1.1'
        });
      }

      // Verify event tracking
      const logs = await prisma.securityLog.findMany({
        orderBy: { timestamp: 'asc' }
      });
      expect(logs).toHaveLength(3);

      // Verify metrics
      const metrics = await securityLoggingService.getMetrics('hour');
      expect(metrics.total).toBe(3);
      expect(metrics.bySeverity).toEqual({
        low: 1,
        medium: 1,
        high: 1
      });
    });

    test('should properly handle real-time metrics', async () => {
      // Generate rapid security events
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          securityLoggingService.log({
            type: 'api_rate_limit',
            severity: 'medium',
            message: `Rate limit test ${i}`,
            userId: testUser.id,
            ip: '192.168.1.1'
          })
        );
      }

      await Promise.all(promises);

      // Verify real-time metrics
      const metrics = await securityLoggingService.getMetrics('minute');
      expect(metrics.byType.api_rate_limit).toBe(10);
      expect(metrics.topIPs['192.168.1.1']).toBe(10);
    });
  });

  describe('Admin Interface Security', () => {
    test('should enforce admin access controls', async () => {
      // Attempt non-admin access
      const nonAdminRes = await fetch('/api/admin/security-logs', {
        headers: { Authorization: `Bearer ${testUser.token}` }
      });
      expect(nonAdminRes.status).toBe(403);

      // Verify access denied logging
      const accessLogs = await prisma.securityLog.findMany({
        where: { type: 'admin_access_denied' }
      });
      expect(accessLogs).toHaveLength(1);

      // Verify admin access
      const adminRes = await fetch('/api/admin/security-logs', {
        headers: { Authorization: `Bearer ${testAdmin.token}` }
      });
      expect(adminRes.status).toBe(200);
    });

    test('should track admin actions', async () => {
      // Perform admin action
      await fetch('/api/admin/verification-requests/123/approve', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${testAdmin.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: 'Test approval' })
      });

      // Verify action logging
      const actionLogs = await prisma.securityLog.findMany({
        where: { 
          type: 'admin_action',
          userId: testAdmin.id
        }
      });
      expect(actionLogs).toHaveLength(1);
      expect(actionLogs[0].metadata).toMatchObject({
        action: 'approve_verification',
        targetId: '123'
      });
    });
  });
});

// src/tests/integration/helpers/userHelpers.ts
export const createTestUser = async (prisma: PrismaClient) => {
  return prisma.user.create({
    data: {
      email: 'test@example.com',
      password: 'hashedPassword',
      userType: 'entrepreneur',
      subscriptionTier: 'Basic',
      verificationLevel: 'None'
    }
  });
};

export const createTestAdmin = async (prisma: PrismaClient) => {
  return prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: 'hashedPassword',
      userType: 'admin',
      isAdmin: true,
      subscriptionTier: 'Basic',
      verificationLevel: 'None'
    }
  });
};

// src/tests/integration/mocks/serviceMocks.ts
export const mockEmailService = () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
});

export const mockWebSocket = () => ({
  sendNotification: jest.fn().mockResolvedValue(true)
});