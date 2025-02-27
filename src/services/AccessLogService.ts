<<<<<<< HEAD
// src/services/AccessLogService.ts
=======
>>>>>>> feature/security-implementation
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
<<<<<<< HEAD
      // Log to database
=======
>>>>>>> feature/security-implementation
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

<<<<<<< HEAD
      // Send alert for suspicious activity
      if (!event.success && this.isSuspiciousActivity(event)) {
        await this.sendSecurityAlert(event);
      }

      // Track failed attempts for rate limiting
      if (!event.success) {
        await this.trackFailedAttempt(event);
      }
    } catch (error) {
      console.error('Error logging access:', error);
      // Don't throw - logging should not interrupt main flow
=======
      if (!event.success && this.isSuspiciousActivity(event)) {
        await this.sendSecurityAlert(event);
      }
    } catch (error) {
      console.error('Error logging access:', error);
>>>>>>> feature/security-implementation
    }
  }

  private isSuspiciousActivity(event: AccessLogEvent): boolean {
<<<<<<< HEAD
    // Check for known suspicious patterns
    const suspiciousPatterns = [
      // Trying to access admin resources
      event.resource.includes('admin') && !event.success,
      // Attempting to access another user's private data
      event.resource === 'profile' && event.metadata?.targetUserId !== event.userId,
      // Multiple failed verification attempts
=======
    const suspiciousPatterns = [
      event.resource.includes('admin') && !event.success,
      event.resource === 'profile' && event.metadata?.targetUserId !== event.userId,
>>>>>>> feature/security-implementation
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
<<<<<<< HEAD

  private async trackFailedAttempt(event: AccessLogEvent): Promise<void> {
    try {
      // Get recent failed attempts
      const recentFailures = await this.prisma.accessLog.count({
        where: {
          userId: event.userId,
          success: false,
          createdAt: {
            gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
          }
        }
      });

      // If too many failures, trigger additional security measures
      if (recentFailures >= 5) {
        await this.handleExcessiveFailures(event);
      }
    } catch (error) {
      console.error('Error tracking failed attempt:', error);
    }
  }

  private async handleExcessiveFailures(event: AccessLogEvent): Promise<void> {
    try {
      // Update user security status
      await this.prisma.user.update({
        where: { id: event.userId },
        data: {
          securityStatus: 'LOCKED',
          lastSecurityIncident: new Date()
        }
      });

      // Send high-priority alert
      const message = {
        type: 'EXCESSIVE_FAILED_ATTEMPTS',
        timestamp: new Date().toISOString(),
        details: {
          userId: event.userId,
          action: event.action,
          resource: event.resource,
          recentFailures: true
        }
      };

      await this.sns.publish({
        TopicArn: this.ALERT_TOPIC_ARN,
        Message: JSON.stringify(message),
        MessageAttributes: {
          severity: {
            DataType: 'String',
            StringValue: 'CRITICAL'
          }
        }
      }).promise();
    } catch (error) {
      console.error('Error handling excessive failures:', error);
    }
  }

  async generateAccessReport(userId: string, startDate: Date, endDate: Date) {
    try {
      const logs = await this.prisma.accessLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const summary = {
        totalAttempts: logs.length,
        successfulAttempts: logs.filter(log => log.success).length,
        failedAttempts: logs.filter(log => !log.success).length,
        resourceAccess: this.summarizeResourceAccess(logs),
        suspiciousActivity: logs.filter(log => 
          !log.success && this.isSuspiciousActivity({
            userId,
            action: log.action,
            resource: log.resource,
            success: log.success,
            reason: log.reason,
            metadata: log.metadata
          })
        ).length
      };

      return { logs, summary };
    } catch (error) {
      console.error('Error generating access report:', error);
      throw new Error('Failed to generate access report');
    }
  }

  private summarizeResourceAccess(logs: any[]): Record<string, number> {
    return logs.reduce((acc, log) => {
      acc[log.resource] = (acc[log.resource] || 0) + 1;
      return acc;
    }, {});
  }
=======
>>>>>>> feature/security-implementation
}