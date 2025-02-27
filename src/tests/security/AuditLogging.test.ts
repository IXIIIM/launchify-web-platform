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
});