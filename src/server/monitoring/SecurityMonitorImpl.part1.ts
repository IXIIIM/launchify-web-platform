import { SNS } from 'aws-sdk';
import { format } from 'date-fns';
import { 
  BaseSecurityMonitor, 
  SecurityAlert, 
  SecurityMetrics,
  SecurityMonitorConfig 
} from './interfaces/SecurityMonitor';

const sns = new SNS();

export class SecurityMonitorImpl extends BaseSecurityMonitor {
  constructor(config: SecurityMonitorConfig) {
    super(config);
  }

  async monitorKeyAges(): Promise<void> {
    try {
      // Check master keys
      const oldMasterKeys = await this.prisma.securitySettings.findMany({
        where: {
          lastKeyRotation: {
            lt: new Date(Date.now() - this.thresholds.KEY_AGE_WARNING)
          }
        },
        include: { user: true }
      });

      // Process master key alerts
      for (const settings of oldMasterKeys) {
        const keyAge = Date.now() - settings.lastKeyRotation.getTime();
        const severity = this.determineAlertSeverity(
          keyAge,
          this.thresholds.KEY_AGE_WARNING,
          this.thresholds.KEY_AGE_CRITICAL
        );

        await this.sendAlert({
          type: 'KEY_AGE_ALERT',
          severity,
          userId: settings.user.id,
          details: {
            keyType: 'MASTER_KEY',
            keyAge,
            lastRotation: settings.lastKeyRotation
          },
          timestamp: new Date()
        });
      }

      // Similar check for document keys
      const oldDocumentKeys = await this.prisma.documentEncryption.findMany({
        where: {
          lastRotation: {
            lt: new Date(Date.now() - this.thresholds.KEY_AGE_WARNING)
          }
        },
        include: {
          document: { include: { owner: true } }
        }
      });

      // Process document key alerts
      for (const encryption of oldDocumentKeys) {
        const keyAge = Date.now() - encryption.lastRotation.getTime();
        const severity = this.determineAlertSeverity(
          keyAge,
          this.thresholds.KEY_AGE_WARNING,
          this.thresholds.KEY_AGE_CRITICAL
        );

        await this.sendAlert({
          type: 'KEY_AGE_ALERT',
          severity,
          userId: encryption.document.owner.id,
          details: {
            keyType: 'DOCUMENT_KEY',
            keyAge,
            documentId: encryption.documentId,
            lastRotation: encryption.lastRotation
          },
          timestamp: new Date()
        });
      }

      await this.logSecurityEvent('KEY_AGE_MONITORING', 'SUCCESS', {
        masterKeysChecked: oldMasterKeys.length,
        documentKeysChecked: oldDocumentKeys.length,
        timestamp: new Date()
      });
    } catch (error) {
      await this.logSecurityEvent('KEY_AGE_MONITORING', 'FAILURE', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date()
      });
      throw error;
    }
  }
}