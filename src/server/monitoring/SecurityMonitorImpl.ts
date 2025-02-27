// src/server/monitoring/SecurityMonitorImpl.ts
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

  async monitorFailedRotations(): Promise<void> {
    try {
      const failedRotations = await this.prisma.securityLog.groupBy({
        by: ['userId'],
        where: {
          eventType: 'KEY_ROTATION',
          status: 'FAILURE',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        _count: { id: true }
      });

      for (const failure of failedRotations) {
        const failureCount = failure._count.id;
        const severity = this.determineAlertSeverity(
          failureCount,
          this.thresholds.FAILED_ROTATIONS_WARNING,
          this.thresholds.FAILED_ROTATIONS_CRITICAL
        );

        await this.sendAlert({
          type: 'ROTATION_FAILURE_ALERT',
          severity,
          userId: failure.userId,
          details: {
            failureCount,
            timeWindow: '24 hours'
          },
          timestamp: new Date()
        });
      }

      await this.logSecurityEvent('FAILED_ROTATION_MONITORING', 'SUCCESS', {
        failuresChecked: failedRotations.length,
        timestamp: new Date()
      });
    } catch (error) {
      await this.logSecurityEvent('FAILED_ROTATION_MONITORING', 'FAILURE', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date()
      });
      throw error;
    }
  }

  async monitorRotationDelays(): Promise<void> {
    try {
      const delayedRotations = await this.prisma.scheduledNotification.findMany({
        where: {
          type: 'KEY_ROTATION',
          status: 'PENDING',
          scheduledFor: {
            lt: new Date()
          }
        },
        include: { user: true }
      });

      for (const rotation of delayedRotations) {
        const delay = Date.now() - rotation.scheduledFor.getTime();
        const severity = this.determineAlertSeverity(
          delay,
          this.thresholds.ROTATION_DELAY_WARNING,
          this.thresholds.ROTATION_DELAY_CRITICAL
        );

        await this.sendAlert({
          type: 'ROTATION_DELAY_ALERT',
          severity,
          userId: rotation.user.id,
          details: {
            delay,
            scheduledFor: rotation.scheduledFor
          },
          timestamp: new Date()
        });
      }

      await this.logSecurityEvent('ROTATION_DELAY_MONITORING', 'SUCCESS', {
        delaysChecked: delayedRotations.length,
        timestamp: new Date()
      });
    } catch (error) {
      await this.logSecurityEvent('ROTATION_DELAY_MONITORING', 'FAILURE', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date()
      });
      throw error;
    }
  }

  async sendAlert(alert: SecurityAlert): Promise<void> {
    try {
      // Store alert in database
      await this.prisma.securityAlert.create({
        data: {
          type: alert.type,
          severity: alert.severity,
          userId: alert.userId,
          details: alert.details,
          timestamp: alert.timestamp
        }
      });

      // Send notifications if user-specific alert
      if (alert.userId) {
        await this.notifyUser(alert.userId, {
          type: alert.type,
          content: this.formatAlertMessage(alert),
          severity: alert.severity,
          metadata: alert.details
        });
      }

      // Send SNS alert for critical severity
      if (alert.severity === 'CRITICAL') {
        await sns.publish({
          TopicArn: this.alertTopicArn,
          Message: JSON.stringify(alert),
          MessageAttributes: {
            AlertType: {
              DataType: 'String',
              StringValue: alert.type
            }
          }
        }).promise();
      }

      await this.logSecurityEvent('ALERT_SENT', 'SUCCESS', {
        alertType: alert.type,
        severity: alert.severity,
        userId: alert.userId,
        timestamp: alert.timestamp
      });
    } catch (error) {
      await this.logSecurityEvent('ALERT_SENT', 'FAILURE', {
        error: error.message,
        stack: error.stack,
        alertDetails: alert
      });
      throw error;
    }
  }

  private formatAlertMessage(alert: SecurityAlert): string {
    switch (alert.type) {
      case 'KEY_AGE_ALERT':
        return `Your ${alert.details.keyType} is ${Math.floor(alert.details.keyAge / (24 * 60 * 60 * 1000))} days old and requires rotation`;
      
      case 'ROTATION_FAILURE_ALERT':
        return `Key rotation failed ${alert.details.failureCount} times in the last ${alert.details.timeWindow}`;
      
      case 'ROTATION_DELAY_ALERT':
        return `Key rotation is delayed by ${Math.floor(alert.details.delay / (24 * 60 * 60 * 1000))} days`;
      
      default:
        return `Security alert: ${alert.type}`;
    }
  }

  async processActiveAlerts(): Promise<void> {
    try {
      const activeAlerts = await this.prisma.securityAlert.findMany({
        where: {
          resolved: false,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: {
          severity: 'desc'
        }
      });

      // Process each active alert
      for (const alert of activeAlerts) {
        // Check if alert conditions still exist
        const stillActive = await this.checkAlertConditions(alert);
        
        if (!stillActive) {
          // Auto-resolve alert if conditions no longer exist
          await this.prisma.securityAlert.update({
            where: { id: alert.id },
            data: { 
              resolved: true,
              resolvedAt: new Date(),
              resolutionDetails: {
                type: 'AUTO_RESOLVED',
                reason: 'Alert conditions no longer present'
              }
            }
          });
        } else if (alert.severity === 'CRITICAL') {
          // Escalate critical alerts that have been active too long
          const alertAge = Date.now() - alert.createdAt.getTime();
          if (alertAge > 24 * 60 * 60 * 1000) { // 24 hours
            await this.escalateAlert(alert);
          }
        }
      }

      await this.logSecurityEvent('ALERT_PROCESSING', 'SUCCESS', {
        alertsProcessed: activeAlerts.length,
        timestamp: new Date()
      });
    } catch (error) {
      await this.logSecurityEvent('ALERT_PROCESSING', 'FAILURE', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date()
      });
      throw error;
    }
  }

  private async checkAlertConditions(alert: any): Promise<boolean> {
    switch (alert.type) {
      case 'KEY_AGE_ALERT':
        return this.checkKeyAgeCondition(alert);
      case 'ROTATION_FAILURE_ALERT':
        return this.checkRotationFailureCondition(alert);
      case 'ROTATION_DELAY_ALERT':
        return this.checkRotationDelayCondition(alert);
      default:
        return false;
    }
  }

  private async checkKeyAgeCondition(alert: any): Promise<boolean> {
    const { keyType, documentId } = alert.details;
    
    if (keyType === 'MASTER_KEY') {
      const settings = await this.prisma.securitySettings.findFirst({
        where: { userId: alert.userId }
      });
      return settings && Date.now() - settings.lastKeyRotation.getTime() >= this.thresholds.KEY_AGE_WARNING;
    } else {
      const encryption = await this.prisma.documentEncryption.findFirst({
        where: { documentId }
      });
      return encryption && Date.now() - encryption.lastRotation.getTime() >= this.thresholds.KEY_AGE_WARNING;
    }
  }

  private async checkRotationFailureCondition(alert: any): Promise<boolean> {
    const recentFailures = await this.prisma.securityLog.count({
      where: {
        userId: alert.userId,
        eventType: 'KEY_ROTATION',
        status: 'FAILURE',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    return recentFailures >= this.thresholds.FAILED_ROTATIONS_WARNING;
  }

  private async checkRotationDelayCondition(alert: any): Promise<boolean> {
    const pendingRotation = await this.prisma.scheduledNotification.findFirst({
      where: {
        userId: alert.userId,
        type: 'KEY_ROTATION',
        status: 'PENDING',
        scheduledFor: {
          lt: new Date()
        }
      }
    });
    return !!pendingRotation;
  }

  private async escalateAlert(alert: any): Promise<void> {
    // Send high-priority SNS notification
    await sns.publish({
      TopicArn: this.alertTopicArn,
      Message: JSON.stringify({
        ...alert,
        escalated: true,
        escalationReason: 'Critical alert active for >24 hours'
      }),
      MessageAttributes: {
        AlertType: {
          DataType: 'String',
          StringValue: `${alert.type}_ESCALATED`
        }
      }
    }).promise();

    // Update alert status
    await this.prisma.securityAlert.update({
      where: { id: alert.id },
      data: {
        escalated: true,
        escalatedAt: new Date()
      }
    });

    // Log escalation
    await this.logSecurityEvent('ALERT_ESCALATED', 'SUCCESS', {
      alertId: alert.id,
      alertType: alert.type,
      userId: alert.userId,
      escalationReason: 'Critical alert active for >24 hours'
    });
  }

  async generateMetrics(startDate: Date, endDate: Date): Promise<SecurityMetrics> {
    // Calculate key age distribution
    const keyAges = await this.prisma.securitySettings.findMany({
      select: { lastKeyRotation: true }
    });

    const keyAgeDistribution = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0
    };

    keyAges.forEach(({ lastKeyRotation }) => {
      const ageInDays = Math.floor((Date.now() - lastKeyRotation.getTime()) / (24 * 60 * 60 * 1000));
      if (ageInDays <= 30) keyAgeDistribution['0-30']++;
      else if (ageInDays <= 60) keyAgeDistribution['31-60']++;
      else if (ageInDays <= 90) keyAgeDistribution['61-90']++;
      else keyAgeDistribution['90+']++;
    });

    // Get failed rotations count
    const failedRotations = await this.prisma.securityLog.count({
      where: {
        eventType: 'KEY_ROTATION',
        status: 'FAILURE',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Get pending rotations
    const pendingRotations = await this.prisma.scheduledNotification.count({
      where: {
        type: 'KEY_ROTATION',
        status: 'PENDING'
      }
    });

    // Calculate compliance rate
    const totalKeys = keyAges.length;
    const compliantKeys = keyAges.filter(
      ({ lastKeyRotation }) => 
        Date.now() - lastKeyRotation.getTime() <= 90 * 24 * 60 * 60 * 1000
    ).length;
    const complianceRate = (compliantKeys / totalKeys) * 100;

    // Get active alerts
    const activeAlerts = await this.prisma.securityAlert.findMany({
      where: {
        resolved: false,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    return {
      keyAgeDistribution,
      failedRotations,
      pendingRotations,
      complianceRate,
      activeAlerts
    };
  }

  async generateComplianceReport(): Promise<void> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    
    const metrics = await this.generateMetrics(startDate, endDate);
    const reportData = {
      timestamp: new Date(),
      period: { startDate, endDate },
      metrics,
      recommendations: this.generateRecommendations(metrics)
    };

    // Store report in S3
    const s3 = new AWS.S3();
    await s3.putObject({
      Bucket: this.reportBucket,
      Key: `compliance-reports/report-${format(endDate, 'yyyy-MM-dd')}.json`,
      Body: JSON.stringify(reportData, null, 2),
      ContentType: 'application/json'
    }).promise();
  }

  private generateRecommendations(metrics: SecurityMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.keyAgeDistribution['90+'] > 0) {
      recommendations.push('Immediate action required: Some keys are over 90 days old');
    }

    if (metrics.failedRotations > this.thresholds.FAILED_ROTATIONS_WARNING) {
      recommendations.push('Investigate increased rate of rotation failures');
    }

    if (metrics.complianceRate < 90) {
      recommendations.push('Improve key rotation compliance - current rate below 90%');
    }

    if (metrics.pendingRotations > 0) {
      recommendations.push('Address pending key rotations to maintain security posture');
    }

    return recommendations;
  }

  async checkSystemHealth(): Promise<boolean> {
    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      // Check SNS connectivity
      await sns.listTopics().promise();

      // Check S3 access
      const s3 = new AWS.S3();
      await s3.headBucket({ Bucket: this.reportBucket }).promise();

      return true;
    } catch (error) {
      await this.logSecurityEvent('SYSTEM_HEALTH_CHECK', 'FAILURE', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date()
      });
      return false;
    }
  }

  async validateConfiguration(): Promise<boolean> {
    try {
      // Validate thresholds
      const thresholdValid = 
        this.thresholds.KEY_AGE_WARNING < this.thresholds.KEY_AGE_CRITICAL &&
        this.thresholds.FAILED_ROTATIONS_WARNING < this.thresholds.FAILED_ROTATIONS_CRITICAL &&
        this.thresholds.ROTATION_DELAY_WARNING < this.thresholds.ROTATION_DELAY_CRITICAL;

      if (!thresholdValid) {
        throw new Error('Invalid threshold configuration');
      }

      // Validate AWS resources
      const [topic, bucket] = await Promise.all([
        sns.getTopicAttributes({ TopicArn: this.alertTopicArn }).promise(),
        new AWS.S3().headBucket({ Bucket: this.reportBucket }).promise()
      ]);

      return true;
    } catch (error) {
      await this.logSecurityEvent('CONFIGURATION_VALIDATION', 'FAILURE', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date()
      });
      return false;
    }
  }
}