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
        keyAge: Math.floor(keyAge / (24 * 60 * 60 * 1000)),
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

  private determineKeySeverity(keyAge: number): 'WARNING' | 'CRITICAL' {
    return keyAge >= KeyRotationMonitor.THRESHOLDS.KEY_AGE_CRITICAL
      ? 'CRITICAL'
      : 'WARNING';
  }

  private async sendSNSAlert(type: string, data: any): Promise<void> {
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
};