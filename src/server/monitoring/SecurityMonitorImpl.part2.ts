// Part 2: Rotation monitoring and alert handling
import { SNS } from 'aws-sdk';
import { SecurityAlert } from './interfaces/SecurityMonitor';

export class SecurityMonitorImpl {
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
}