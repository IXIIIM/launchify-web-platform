import { PrismaClient } from '@prisma/client';
import { SNS } from 'aws-sdk';

interface AccessLogEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  success: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}

export class AccessLogService {
  private prisma: PrismaClient;
  private sns: SNS;
  private readonly ALERT_TOPIC_ARN: string;

  constructor(prisma: PrismaClient, sns: SNS) {
    this.prisma = prisma;
    this.sns = sns;
    this.ALERT_TOPIC_ARN = process.env.ACCESS_ALERT_TOPIC_ARN || '';
  }

  async logAccess(event: AccessLogEvent): Promise<void> {
    try {
      await this.prisma.accessLog.create({
        data: {
          userId: event.userId,
          action: event.action,
          resource: event.resource,
          resourceId: event.resourceId,
          success: event.success,
          reason: event.reason,
          metadata: event.metadata,
          createdAt: new Date()
        }
      });

      if (!event.success && this.isSuspiciousActivity(event)) {
        await this.sendSecurityAlert(event);
      }
    } catch (error) {
      console.error('Error logging access:', error);
    }
  }

  private isSuspiciousActivity(event: AccessLogEvent): boolean {
    const suspiciousPatterns = [
      event.resource.includes('admin') && !event.success,
      event.resource === 'profile' && event.metadata?.targetUserId !== event.userId,
      event.action === 'verification' && !event.success && event.metadata?.attemptCount > 3
    ];

    return suspiciousPatterns.some(Boolean);
  }

  private async sendSecurityAlert(event: AccessLogEvent): Promise<void> {
    try {
      const message = {
        type: 'SUSPICIOUS_ACCESS_ATTEMPT',
        timestamp: new Date().toISOString(),
        details: {
          userId: event.userId,
          action: event.action,
          resource: event.resource,
          reason: event.reason,
          metadata: event.metadata
        }
      };

      await this.sns.publish({
        TopicArn: this.ALERT_TOPIC_ARN,
        Message: JSON.stringify(message),
        MessageAttributes: {
          severity: {
            DataType: 'String',
            StringValue: 'HIGH'
          }
        }
      }).promise();
    } catch (error) {
      console.error('Error sending security alert:', error);
    }
  }
}