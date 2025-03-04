// src/server/monitoring/KeyRotationMonitor.ts
import { PrismaClient } from '@prisma/client';
import { EmailService } from '../services/email/EmailService';
import { WebSocketServer } from '../services/websocket';
import { SNS } from 'aws-sdk';

const prisma = new PrismaClient();
const sns = new SNS();

export class KeyRotationMonitor {
  private emailService: EmailService;
  private wsServer: WebSocketServer;

  // Alert thresholds
  private static readonly THRESHOLDS = {
    KEY_AGE_WARNING: 60 * 24 * 60 * 60 * 1000, // 60 days
    KEY_AGE_CRITICAL: 80 * 24 * 60 * 60 * 1000, // 80 days
    FAILED_ROTATIONS_WARNING: 2,
    FAILED_ROTATIONS_CRITICAL: 5,
    ROTATION_DELAY_WARNING: 7 * 24 * 60 * 60 * 1000, // 7 days
    ROTATION_DELAY_CRITICAL: 14 * 24 * 60 * 60 * 1000 // 14 days
  };

  constructor(emailService: EmailService, wsServer: WebSocketServer) {
    this.emailService = emailService;
    this.wsServer = wsServer;
  }

  // Monitor key ages and schedule rotations
  async monitorKeyAges(): Promise<void> {
    try {
      // Check master keys
      const oldMasterKeys = await prisma.securitySettings.findMany({
        where: {
          lastKeyRotation: {
            lt: new Date(Date.now() - KeyRotationMonitor.THRESHOLDS.KEY_AGE_WARNING)
          }
        },
        include: {
          user: true
        }
      });

      for (const settings of oldMasterKeys) {
        const keyAge = Date.now() - settings.lastKeyRotation.getTime();
        const severity = this.determineKeySeverity(keyAge);
        
        await this.sendKeyAgeAlert(
          settings.user.id,
          'MASTER_KEY',
          keyAge,
          severity
        );
      }

      // Check document keys
      const oldDocumentKeys = await prisma.documentEncryption.findMany({
        where: {
          lastRotation: {
            lt: new Date(Date.now() - KeyRotationMonitor.THRESHOLDS.KEY_AGE_WARNING)
          }
        },
        include: {
          document: {
            include: {
              owner: true
            }
          }
        }
      });

      for (const encryption of oldDocumentKeys) {
        const keyAge = Date.now() - encryption.lastRotation.getTime();
        const severity = this.determineKeySeverity(keyAge);
        
        await this.sendKeyAgeAlert(
          encryption.document.owner.id,
          'DOCUMENT_KEY',
          keyAge,
          encryption.documentId,
          severity
        );
      }
    } catch (error) {
      console.error('Error monitoring key ages:', error);
      await this.sendSystemAlert('KEY_AGE_MONITORING_FAILED', error);
    }
  }

  // Monitor failed rotation attempts
  async monitorFailedRotations(): Promise<void> {
    try {
      const failedRotations = await prisma.securityLog.groupBy({
        by: ['userId'],
        where: {
          eventType: 'KEY_ROTATION',
          status: 'FAILURE',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        _count: {
          id: true
        }
      });

      for (const failure of failedRotations) {
        const severity = this.determineFailureSeverity(failure._count.id);
        
        await this.sendRotationFailureAlert(
          failure.userId,
          failure._count.id,
          severity
        );
      }
    } catch (error) {
      console.error('Error monitoring failed rotations:', error);
      await this.sendSystemAlert('ROTATION_FAILURE_MONITORING_FAILED', error);
    }
  }

  // Monitor rotation delays
  async monitorRotationDelays(): Promise<void> {
    try {
      const scheduledRotations = await prisma.scheduledNotification.findMany({
        where: {
          type: 'KEY_ROTATION',
          status: 'PENDING',
          scheduledFor: {
            lt: new Date()
          }
        },
        include: {
          user: true
        }
      });

      for (const rotation of scheduledRotations) {
        const delay = Date.now() - rotation.scheduledFor.getTime();
        const severity = this.determineDelaySeverity(delay);
        
        await this.sendRotationDelayAlert(
          rotation.user.id,
          delay,
          severity
        );
      }
    } catch (error) {
      console.error('Error monitoring rotation delays:', error);
      await this.sendSystemAlert('ROTATION_DELAY_MONITORING_FAILED', error);
    }
  }

  // Determine alert severity based on key age
  private determineKeySeverity(keyAge: number): 'WARNING' | 'CRITICAL' {
    return keyAge >= KeyRotationMonitor.THRESHOLDS.KEY_AGE_CRITICAL
      ? 'CRITICAL'
      : 'WARNING';
  }

  // Determine alert severity based on failure count
  private determineFailureSeverity(failureCount: number): 'WARNING' | 'CRITICAL' {
    return failureCount >= KeyRotationMonitor.THRESHOLDS.FAILED_ROTATIONS_CRITICAL
      ? 'CRITICAL'
      : 'WARNING';
  }

  // Determine alert severity based on delay
  private determineDelaySeverity(delay: number): 'WARNING' | 'CRITICAL' {
    return delay >= KeyRotationMonitor.THRESHOLDS.ROTATION_DELAY_CRITICAL
      ? 'CRITICAL'
      : 'WARNING';
  }

  // Send key age alert
  private async sendKeyAgeAlert(
    userId: string,
    keyType: 'MASTER_KEY' | 'DOCUMENT_KEY',
    keyAge: number,
    documentId?: string,
    severity: 'WARNING' | 'CRITICAL' = 'WARNING'
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return;

    // Send email alert
    await this.emailService.sendEmail({
      to: user.email,
      template: 'key-rotation-alert',
      data: {
        keyType,
        keyAge: Math.floor(keyAge / (24 * 60 * 60 * 1000)), // Convert to days
        documentId,
        severity
      }
    });

    // Send in-app notification
    await this.wsServer.sendNotification(userId, {
      type: 'KEY_AGE_ALERT',
      content: `Your ${keyType} is ${Math.floor(keyAge / (24 * 60 * 60 * 1000))} days old`,
      severity,
      metadata: {
        keyType,
        keyAge,
        documentId
      }
    });

    // Send SNS alert for critical severity
    if (severity === 'CRITICAL') {
      await this.sendSNSAlert('KEY_AGE_CRITICAL', {
        userId,
        keyType,
        keyAge,
        documentId
      });
    }

    // Log alert
    await prisma.securityLog.create({
      data: {
        userId,
        eventType: 'KEY_AGE_ALERT',
        status: severity,
        details: {
          keyType,
          keyAge,
          documentId
        }
      }
    });
  }

  // Send rotation failure alert
  private async sendRotationFailureAlert(
    userId: string,
    failureCount: number,
    severity: 'WARNING' | 'CRITICAL' = 'WARNING'
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return;

    // Send email alert
    await this.emailService.sendEmail({
      to: user.email,
      template: 'rotation-failure-alert',
      data: {
        failureCount,
        severity
      }
    });

    // Send in-app notification
    await this.wsServer.sendNotification(userId, {
      type: 'ROTATION_FAILURE_ALERT',
      content: `Key rotation failed ${failureCount} times in the last 24 hours`,
      severity,
      metadata: {
        failureCount
      }
    });

    // Send SNS alert for critical severity
    if (severity === 'CRITICAL') {
      await this.sendSNSAlert('ROTATION_FAILURE_CRITICAL', {
        userId,
        failureCount
      });
    }

    // Log alert
    await prisma.securityLog.create({
      data: {
        userId,
        eventType: 'ROTATION_FAILURE_ALERT',
        status: severity,
        details: {
          failureCount
        }
      }
    });
  }

  // Send rotation delay alert
  private async sendRotationDelayAlert(
    userId: string,
    delay: number,
    severity: 'WARNING' | 'CRITICAL' = 'WARNING'
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return;

    // Send email alert
    await this.emailService.sendEmail({
      to: user.email,
      template: 'rotation-delay-alert',
      data: {
        delay: Math.floor(delay / (24 * 60 * 60 * 1000)), // Convert to days
        severity
      }
    });

    // Send in-app notification
    await this.wsServer.sendNotification(userId, {
      type: 'ROTATION_DELAY_ALERT',
      content: `Key rotation is delayed by ${Math.floor(delay / (24 * 60 * 60 * 1000))} days`,
      severity,
      metadata: {
        delay
      }
    });

    // Send SNS alert for critical severity
    if (severity === 'CRITICAL') {
      await this.sendSNSAlert('ROTATION_DELAY_CRITICAL', {
        userId,
        delay
      });
    }

    // Log alert
    await prisma.securityLog.create({
      data: {
        userId,
        eventType: 'ROTATION_DELAY_ALERT',
        status: severity,
        details: {
          delay
        }
      }
    });
  }

  // Send system alert
  private async sendSystemAlert(
    type: string,
    error: any
  ): Promise<void> {
    // Send SNS alert
    await this.sendSNSAlert(type, {
      error: error.message,
      stack: error.stack
    });

    // Log alert
    await prisma.securityLog.create({
      data: {
        eventType: 'SYSTEM_ALERT',
        status: 'ERROR',
        details: {
          type,
          error: error.message,
          stack: error.stack
        }
      }
    });
  }

  // Send SNS alert
  private async sendSNSAlert(
    type: string,
    data: any
  ): Promise<void> {
    try {
      await sns.publish({
        TopicArn: process.env.AWS_SNS_ALERT_TOPIC,
        Message: JSON.stringify({
          type,
          timestamp: new Date().toISOString(),
          data
        }),
        MessageAttributes: {
          AlertType: {
            DataType: 'String',
            StringValue: type
          }
        }
      }).promise();
    } catch (error) {
      console.error('Error sending SNS alert:', error);
    }
  }
}

// Schedule monitoring checks
export const scheduleKeyMonitoring = (
  monitor: KeyRotationMonitor
): void => {
  // Check key ages every 12 hours
  setInterval(
    async () => {
      try {
        await monitor.monitorKeyAges();
      } catch (error) {
        console.error('Key age monitoring error:', error);
      }
    },
    12 * 60 * 60 * 1000
  );

  // Check failed rotations every hour
  setInterval(
    async () => {
      try {
        await monitor.monitorFailedRotations();
      } catch (error) {
        console.error('Failed rotation monitoring error:', error);
      }
    },
    60 * 60 * 1000
  );

  // Check rotation delays every 6 hours
  setInterval(
    async () => {
      try {
        await monitor.monitorRotationDelays();
      } catch (error) {
        console.error('Rotation delay monitoring error:', error);
      }
    },
    6 * 60 * 60 * 1000
  );
};