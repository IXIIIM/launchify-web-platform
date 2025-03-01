// src/server/monitoring/KeyRotationMetrics.ts
import { PrismaClient } from '@prisma/client';
import { startOfDay, subDays, format } from 'date-fns';
import { S3 } from 'aws-sdk';

const prisma = new PrismaClient();
const s3 = new S3();

export class KeyRotationMetrics {
  // Report generation intervals
  private static readonly INTERVALS = {
    DAILY: 1,
    WEEKLY: 7,
    MONTHLY: 30,
    QUARTERLY: 90
  };

  // Generate comprehensive key rotation report
  async generateReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    keyAgeMetrics: any;
    rotationMetrics: any;
    complianceMetrics: any;
    performanceMetrics: any;
  }> {
    const [
      keyAgeMetrics,
      rotationMetrics,
      complianceMetrics,
      performanceMetrics
    ] = await Promise.all([
      this.calculateKeyAgeMetrics(startDate, endDate),
      this.calculateRotationMetrics(startDate, endDate),
      this.calculateComplianceMetrics(startDate, endDate),
      this.calculatePerformanceMetrics(startDate, endDate)
    ]);

    // Store report in S3
    const reportId = `key-rotation-report-${format(startDate, 'yyyy-MM-dd')}`;
    await this.storeReport(reportId, {
      keyAgeMetrics,
      rotationMetrics,
      complianceMetrics,
      performanceMetrics,
      generatedAt: new Date(),
      period: { startDate, endDate }
    });

    return {
      keyAgeMetrics,
      rotationMetrics,
      complianceMetrics,
      performanceMetrics
    };
  }

  // Calculate key age metrics
  private async calculateKeyAgeMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    // Master key ages
    const masterKeyAges = await prisma.securitySettings.findMany({
      where: {
        lastKeyRotation: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        lastKeyRotation: true
      }
    });

    // Document key ages
    const documentKeyAges = await prisma.documentEncryption.findMany({
      where: {
        lastRotation: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        lastRotation: true
      }
    });

    // Calculate age distributions
    const masterKeyDistribution = this.calculateAgeDistribution(
      masterKeyAges.map(k => k.lastKeyRotation)
    );

    const documentKeyDistribution = this.calculateAgeDistribution(
      documentKeyAges.map(k => k.lastRotation)
    );

    return {
      masterKeys: {
        distribution: masterKeyDistribution,
        averageAge: this.calculateAverageAge(masterKeyAges.map(k => k.lastKeyRotation)),
        oldestKey: this.findOldestKey(masterKeyAges.map(k => k.lastKeyRotation))
      },
      documentKeys: {
        distribution: documentKeyDistribution,
        averageAge: this.calculateAverageAge(documentKeyAges.map(k => k.lastRotation)),
        oldestKey: this.findOldestKey(documentKeyAges.map(k => k.lastRotation))
      }
    };
  }

  // Calculate rotation metrics
  private async calculateRotationMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const rotationLogs = await prisma.securityLog.findMany({
      where: {
        eventType: 'KEY_ROTATION',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Calculate success rates
    const successfulRotations = rotationLogs.filter(
      log => log.status === 'SUCCESS'
    ).length;

    const failedRotations = rotationLogs.filter(
      log => log.status === 'FAILURE'
    ).length;

    // Calculate rotation trends
    const dailyRotations = this.calculateDailyTrends(
      rotationLogs,
      startDate,
      endDate
    );

    return {
      totalRotations: rotationLogs.length,
      successfulRotations,
      failedRotations,
      successRate: (successfulRotations / rotationLogs.length) * 100,
      dailyTrends: dailyRotations,
      averageRotationsPerDay: rotationLogs.length / this.daysBetween(startDate, endDate)
    };
  }

  // Calculate compliance metrics
  private async calculateComplianceMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    // Get all keys
    const [masterKeys, documentKeys] = await Promise.all([
      prisma.securitySettings.findMany({
        select: {
          lastKeyRotation: true
        }
      }),
      prisma.documentEncryption.findMany({
        select: {
          lastRotation: true
        }
      })
    ]);

    // Calculate compliance percentages
    const masterKeyCompliance = this.calculateCompliancePercentage(
      masterKeys.map(k => k.lastKeyRotation)
    );

    const documentKeyCompliance = this.calculateCompliancePercentage(
      documentKeys.map(k => k.lastRotation)
    );

    // Calculate alerts and violations
    const alerts = await prisma.securityLog.count({
      where: {
        eventType: {
          in: ['KEY_AGE_ALERT', 'ROTATION_FAILURE_ALERT', 'ROTATION_DELAY_ALERT']
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    return {
      masterKeyCompliance,
      documentKeyCompliance,
      overallCompliance: (masterKeyCompliance + documentKeyCompliance) / 2,
      alerts,
      complianceTrend: await this.calculateComplianceTrend(startDate, endDate)
    };
  }

  // Calculate performance metrics
  private async calculatePerformanceMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const rotationLogs = await prisma.securityLog.findMany({
      where: {
        eventType: 'KEY_ROTATION',
        status: 'SUCCESS',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true,
        details: true
      }
    });

    // Calculate rotation durations
    const durations = rotationLogs
      .map(log => this.extractRotationDuration(log.details))
      .filter(Boolean);

    return {
      averageRotationDuration: this.calculateAverage(durations),
      maxRotationDuration: Math.max(...durations),
      minRotationDuration: Math.min(...durations),
      p95RotationDuration: this.calculatePercentile(durations, 95),
      rotationTimeDistribution: this.calculateTimeDistribution(durations)
    };
  }

  // Helper: Calculate age distribution
  private calculateAgeDistribution(dates: Date[]): Record<string, number> {
    const now = new Date();
    const distribution = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0
    };

    dates.forEach(date => {
      const ageInDays = this.daysBetween(date, now);
      if (ageInDays <= 30) distribution['0-30']++;
      else if (ageInDays <= 60) distribution['31-60']++;
      else if (ageInDays <= 90) distribution['61-90']++;
      else distribution['90+']++;
    });

    return distribution;
  }

  // Helper: Calculate average age
  private calculateAverageAge(dates: Date[]): number {
    const now = new Date();
    const ages = dates.map(date => this.daysBetween(date, now));
    return this.calculateAverage(ages);
  }

  // Helper: Find oldest key
  private findOldestKey(dates: Date[]): number {
    const now = new Date();
    return Math.max(...dates.map(date => this.daysBetween(date, now)));
  }

  // Helper: Calculate daily trends
  private calculateDailyTrends(
    logs: any[],
    startDate: Date,
    endDate: Date
  ): Record<string, number> {
    const trends: Record<string, number> = {};
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      trends[dateStr] = logs.filter(
        log => format(log.createdAt, 'yyyy-MM-dd') === dateStr
      ).length;
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    return trends;
  }

  // Helper: Calculate compliance percentage
  private calculateCompliancePercentage(dates: Date[]): number {
    const now = new Date();
    const compliantKeys = dates.filter(
      date => this.daysBetween(date, now) <= 90
    ).length;
    return (compliantKeys / dates.length) * 100;
  }

  // Helper: Calculate compliance trend
  private async calculateComplianceTrend(
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const trend: Record<string, number> = {};
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const [masterKeys, documentKeys] = await Promise.all([
        prisma.securitySettings.findMany({
          where: {
            lastKeyRotation: {
              lte: currentDate
            }
          },
          select: {
            lastKeyRotation: true
          }
        }),
        prisma.documentEncryption.findMany({
          where: {
            lastRotation: {
              lte: currentDate
            }
          },
          select: {
            lastRotation: true
          }
        })
      ]);

      const masterKeyCompliance = this.calculateCompliancePercentage(
        masterKeys.map(k => k.lastKeyRotation)
      );
      const documentKeyCompliance = this.calculateCompliancePercentage(
        documentKeys.map(k => k.lastRotation)
      );

      trend[dateStr] = (masterKeyCompliance + documentKeyCompliance) / 2;
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    return trend;
  }

  // Helper: Calculate time distribution
  private calculateTimeDistribution(durations: number[]): Record<string, number> {
    const distribution = {
      '0-1min': 0,
      '1-5min': 0,
      '5-15min': 0,
      '15+min': 0
    };

    durations.forEach(duration => {
      const minutes = duration / (60 * 1000);
      if (minutes <= 1) distribution['0-1min']++;
      else if (minutes <= 5) distribution['1-5min']++;
      else if (minutes <= 15) distribution['5-15min']++;
      else distribution['15+min']++;
    });

    return distribution;
  }

  // Helper: Store report in S3
  private async storeReport(reportId: string, data: any): Promise<void> {
    await s3.putObject({
      Bucket: process.env.AWS_S3_REPORTS_BUCKET!,
      Key: `key-rotation-reports/${reportId}.json`,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json'
    }).promise();
  }

  // Helper: Calculate days between dates
  private daysBetween(date1: Date, date2: Date): number {
    return Math.floor(
      (date2.getTime() - date1.getTime()) / (24 * 60 * 60 * 1000)
    );
  }

  // Helper: Calculate average
  private calculateAverage(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  // Helper: Calculate percentile
  private calculatePercentile(numbers: number[], percentile: number): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  // Helper: Extract rotation duration
  private extractRotationDuration(details: any): number {
    if (!details || !details.startTime || !details.endTime) return 0;
    return new Date(details.endTime).getTime() - new Date(details.startTime).getTime();
  }
}

// Schedule reports
export const scheduleReports = async (metrics: KeyRotationMetrics): Promise<void> => {
  // Daily reports
  setInterval(
    async () => {
      try {
        const endDate = new Date();
        const startDate = subDays(endDate, KeyRotationMetrics.INTERVALS.DAILY);
        await metrics.generateReport(startDate, endDate);
      } catch (error) {
        console.error('Daily report generation error:', error);
      }
    },
    24 * 60 * 60 * 1000
  );

  // Weekly reports
  setInterval(
    async () => {
      try {
        const endDate = new Date();
        const startDate = subDays(endDate, KeyRotationMetrics.INTERVALS.WEEKLY);
        await metrics.generateReport(startDate, endDate);
      } catch (error) {
        console.error('Weekly report generation error:', error);
      }
    },
    7 * 24 * 60 * 60 * 1000
  );

  // Monthly reports
  setInterval(
    async () => {
      try {
        const endDate = new Date();
        const startDate = subDays(endDate, KeyRotationMetrics.INTERVALS.MONTHLY);
        await metrics.generateReport(startDate, endDate);
      } catch (error) {
        console.error('Monthly report generation error:', error);
      }
    },
    30 * 24 * 60 * 60 * 1000
  );
};