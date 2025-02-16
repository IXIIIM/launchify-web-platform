import { PrismaClient } from '@prisma/client';
import { S3 } from 'aws-sdk';
import { format, subDays } from 'date-fns';
import { WebSocketServer } from '../websocket';

const prisma = new PrismaClient();
const s3 = new S3();

interface ErrorLogEntry {
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  component: string;
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
  userId?: string;
}

interface AlertThresholds {
  errorCount: number;
  timeWindowMinutes: number;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}

export class ErrorLoggingService {
  private wsServer: WebSocketServer;
  private static instance: ErrorLoggingService;
  
  private alertThresholds: AlertThresholds[] = [
    { errorCount: 50, timeWindowMinutes: 5, severity: 'WARNING' },
    { errorCount: 100, timeWindowMinutes: 5, severity: 'ERROR' },
    { errorCount: 200, timeWindowMinutes: 5, severity: 'CRITICAL' }
  ];

  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  static getInstance(wsServer: WebSocketServer): ErrorLoggingService {
    if (!ErrorLoggingService.instance) {
      ErrorLoggingService.instance = new ErrorLoggingService(wsServer);
    }
    return ErrorLoggingService.instance;
  }

  async logError(error: ErrorLogEntry): Promise<void> {
    try {
      // Create error log in database
      const errorLog = await prisma.errorLog.create({
        data: {
          severity: error.severity,
          component: error.component,
          message: error.message,
          stack: error.stack,
          metadata: error.metadata,
          ...(error.userId && {
            user: {
              connect: { id: error.userId }
            }
          })
        }
      });

      // Check alert thresholds
      await this.checkAlertThresholds();

      // Archive to S3 if needed
      if (error.severity === 'ERROR' || error.severity === 'CRITICAL') {
        await this.archiveToS3(errorLog);
      }

      // Send real-time notification for critical errors
      if (error.severity === 'CRITICAL') {
        await this.notifyAdmins(errorLog);
      }
    } catch (loggingError) {
      console.error('Error logging error:', loggingError);
      // Use fallback logging mechanism
      this.logToFallback(error);
    }
  }

  private async checkAlertThresholds(): Promise<void> {
    for (const threshold of this.alertThresholds) {
      const recentErrorCount = await prisma.errorLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - threshold.timeWindowMinutes * 60 * 1000)
          },
          severity: threshold.severity
        }
      });

      if (recentErrorCount >= threshold.errorCount) {
        await this.generateAlert(threshold, recentErrorCount);
      }
    }
  }

  private async generateAlert(
    threshold: AlertThresholds,
    errorCount: number
  ): Promise<void> {
    const alert = await prisma.errorAlert.create({
      data: {
        type: 'THRESHOLD_EXCEEDED',
        severity: threshold.severity,
        message: `Error threshold exceeded: ${errorCount} ${threshold.severity} errors in ${threshold.timeWindowMinutes} minutes`,
        metadata: {
          threshold,
          actualCount: errorCount,
          timestamp: new Date()
        }
      }
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: 'admin' }
    });

    for (const admin of admins) {
      await this.wsServer.sendNotification(admin.id, {
        type: 'ERROR_ALERT',
        content: alert.message,
        severity: alert.severity,
        metadata: alert.metadata
      });
    }
  }

  private async archiveToS3(errorLog: any): Promise<void> {
    try {
      const date = format(errorLog.createdAt, 'yyyy/MM/dd');
      const key = `error-logs/${date}/${errorLog.id}.json`;

      await s3.putObject({
        Bucket: process.env.AWS_S3_LOGS_BUCKET!,
        Key: key,
        Body: JSON.stringify(errorLog, null, 2),
        ContentType: 'application/json'
      }).promise();
    } catch (error) {
      console.error('Error archiving to S3:', error);
    }
  }

  private async notifyAdmins(errorLog: any): Promise<void> {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'admin' }
      });

      for (const admin of admins) {
        await this.wsServer.sendNotification(admin.id, {
          type: 'CRITICAL_ERROR',
          content: `Critical error in ${errorLog.component}: ${errorLog.message}`,
          severity: 'CRITICAL',
          metadata: {
            errorId: errorLog.id,
            component: errorLog.component,
            timestamp: errorLog.createdAt
          }
        });
      }
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }

  private logToFallback(error: ErrorLogEntry): void {
    // Fallback to file system logging if database logging fails
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...error
    };
    
    console.error('FALLBACK ERROR LOG:', logEntry);
    // In a production environment, you might want to write to a local file
    // or use a secondary logging service
  }

  async rotateOldLogs(): Promise<void> {
    try {
      const retentionDays = {
        INFO: 30,
        WARNING: 60,
        ERROR: 90,
        CRITICAL: 365
      };

      for (const [severity, days] of Object.entries(retentionDays)) {
        // Archive logs to S3 before deletion
        const logsToRotate = await prisma.errorLog.findMany({
          where: {
            severity: severity as 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL',
            createdAt: {
              lt: subDays(new Date(), days)
            }
          }
        });

        // Batch archive to S3
        await Promise.all(
          logsToRotate.map(log => this.archiveToS3(log))
        );

        // Delete old logs
        await prisma.errorLog.deleteMany({
          where: {
            severity: severity as 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL',
            createdAt: {
              lt: subDays(new Date(), days)
            }
          }
        });
      }
    } catch (error) {
      console.error('Error rotating logs:', error);
      throw error;
    }
  }

  async getLogSummary(days: number = 7): Promise<any> {
    try {
      const startDate = subDays(new Date(), days);

      const [
        totalErrors,
        severityCounts,
        componentErrors,
        trendData
      ] = await Promise.all([
        // Total error count
        prisma.errorLog.count({
          where: {
            createdAt: {
              gte: startDate
            }
          }
        }),

        // Errors by severity
        prisma.errorLog.groupBy({
          by: ['severity'],
          where: {
            createdAt: {
              gte: startDate
            }
          },
          _count: true
        }),

        // Errors by component
        prisma.errorLog.groupBy({
          by: ['component'],
          where: {
            createdAt: {
              gte: startDate
            }
          },
          _count: true
        }),

        // Daily trend
        prisma.errorLog.groupBy({
          by: ['createdAt'],
          where: {
            createdAt: {
              gte: startDate
            }
          },
          _count: true
        })
      ]);

      return {
        totalErrors,
        byComponent: componentErrors.reduce((acc, curr) => ({
          ...acc,
          [curr.component]: curr._count
        }), {}),
        bySeverity: severityCounts.reduce((acc, curr) => ({
          ...acc,
          [curr.severity]: curr._count
        }), {}),
        dailyTrend: trendData.reduce((acc, curr) => ({
          ...acc,
          [format(curr.createdAt, 'yyyy-MM-dd')]: curr._count
        }), {})
      };
    } catch (error) {
      console.error('Error generating log summary:', error);
      throw error;
    }
  }
}

// Schedule log rotation
export const scheduleLogRotation = (service: ErrorLoggingService): void => {
  // Run log rotation daily at midnight
  setInterval(
    async () => {
      try {
        await service.rotateOldLogs();
      } catch (error) {
        console.error('Error in scheduled log rotation:', error);
      }
    },
    24 * 60 * 60 * 1000 // Daily
  );
};