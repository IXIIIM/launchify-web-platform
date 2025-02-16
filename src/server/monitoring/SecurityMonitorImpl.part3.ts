// Part 3: Metrics generation and system health monitoring
import { format } from 'date-fns';
import { SecurityMetrics } from './interfaces/SecurityMonitor';
import AWS from 'aws-sdk';

export class SecurityMonitorImpl {
  async generateMetrics(startDate: Date, endDate: Date): Promise<SecurityMetrics> {
    const [keyAgeMetrics, rotationMetrics, alerts] = await Promise.all([
      this.getKeyAgeMetrics(),
      this.getRotationMetrics(startDate, endDate),
      this.getActiveAlerts()
    ]);

    return {
      ...keyAgeMetrics,
      ...rotationMetrics,
      activeAlerts: alerts
    };
  }

  private async getKeyAgeMetrics() {
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

    return { keyAgeDistribution };
  }

  private async getRotationMetrics(startDate: Date, endDate: Date) {
    const [failedRotations, pendingRotations] = await Promise.all([
      this.prisma.securityLog.count({
        where: {
          eventType: 'KEY_ROTATION',
          status: 'FAILURE',
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.scheduledNotification.count({
        where: {
          type: 'KEY_ROTATION',
          status: 'PENDING'
        }
      })
    ]);

    return { failedRotations, pendingRotations };
  }

  private async getActiveAlerts() {
    return this.prisma.securityAlert.findMany({
      where: { resolved: false },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    });
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

    // Log report generation
    await this.logSecurityEvent('COMPLIANCE_REPORT_GENERATED', 'SUCCESS', {
      reportPeriod: { startDate, endDate },
      timestamp: new Date()
    });
  }

  private generateRecommendations(metrics: SecurityMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.keyAgeDistribution['90+'] > 0) {
      recommendations.push('Immediate action required: Some keys are over 90 days old');
    }

    if (metrics.failedRotations > this.thresholds.FAILED_ROTATIONS_WARNING) {
      recommendations.push('Investigate increased rate of rotation failures');
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

      // Check AWS service connectivity
      const [snsHealth, s3Health] = await Promise.all([
        this.checkSNSHealth(),
        this.checkS3Health()
      ]);

      if (!snsHealth || !s3Health) {
        throw new Error('AWS service health check failed');
      }

      await this.logSecurityEvent('SYSTEM_HEALTH_CHECK', 'SUCCESS', {
        timestamp: new Date(),
        services: {
          database: true,
          sns: snsHealth,
          s3: s3Health
        }
      });

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

  private async checkSNSHealth(): Promise<boolean> {
    try {
      await new AWS.SNS().getTopicAttributes({
        TopicArn: this.alertTopicArn
      }).promise();
      return true;
    } catch {
      return false;
    }
  }

  private async checkS3Health(): Promise<boolean> {
    try {
      await new AWS.S3().headBucket({
        Bucket: this.reportBucket
      }).promise();
      return true;
    } catch {
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

      // Validate AWS resources exist and are accessible
      await Promise.all([
        this.checkSNSHealth(),
        this.checkS3Health()
      ]);

      await this.logSecurityEvent('CONFIGURATION_VALIDATION', 'SUCCESS', {
        timestamp: new Date(),
        thresholds: this.thresholds
      });

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