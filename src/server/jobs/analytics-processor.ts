import { CronJob } from 'cron';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { AnalyticsService } from '../services/analytics';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);
const analyticsService = new AnalyticsService();

export class AnalyticsProcessor {
  private dailyStatsJob: CronJob;
  private weeklyReportJob: CronJob;
  private cleanupJob: CronJob;

  constructor() {
    // Process daily stats at midnight
    this.dailyStatsJob = new CronJob('0 0 * * *', this.processDailyStats.bind(this));

    // Generate weekly reports on Sundays at 1 AM
    this.weeklyReportJob = new CronJob('0 1 * * 0', this.generateWeeklyReports.bind(this));

    // Clean up old analytics data at 2 AM daily
    this.cleanupJob = new CronJob('0 2 * * *', this.cleanupOldData.bind(this));
  }

  start() {
    this.dailyStatsJob.start();
    this.weeklyReportJob.start();
    this.cleanupJob.start();
  }

  stop() {
    this.dailyStatsJob.stop();
    this.weeklyReportJob.stop();
    this.cleanupJob.stop();
  }

  private async processDailyStats() {
    try {
      const yesterday = subDays(new Date(), 1);
      const stats = await analyticsService.getPlatformAnalytics(
        startOfDay(yesterday),
        endOfDay(yesterday)
      );

      // Store daily stats in database
      await prisma.analyticsDaily.create({
        data: {
          date: yesterday,
          newUsers: stats.users.dailySignups.reduce(
            (sum, stat) => sum + stat.entrepreneurs + stat.funders,
            0
          ),
          activeSubscriptions: stats.subscriptions.active,
          successfulMatches: stats.matches.successful,
          revenue: stats.revenue.monthly,
          metadata: stats // Store full stats as JSON
        }
      });

      // Invalidate relevant cache
      const cacheKeys = await redis.keys('analytics:*');
      if (cacheKeys.length > 0) {
        await redis.del(...cacheKeys);
      }
    } catch (error) {
      console.error('Error processing daily stats:', error);
    }
  }

  private async generateWeeklyReports() {
    try {
      const startDate = subDays(new Date(), 7);
      const endDate = new Date();

      // Generate reports for admins
      const adminUsers = await prisma.user.findMany({
        where: { role: 'admin' }
      });

      for (const admin of adminUsers) {
        await prisma.analyticsReport.create({
          data: {
            userId: admin.id,
            type: 'WEEKLY',
            startDate,
            endDate,
            data: await analyticsService.generateReport(admin.id, startDate, endDate)
          }
        });
      }
    } catch (error) {
      console.error('Error generating weekly reports:', error);
    }
  }

  private async cleanupOldData() {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30);

      // Remove old daily stats
      await prisma.analyticsDaily.deleteMany({
        where: {
          date: {
            lt: thirtyDaysAgo
          }
        }
      });

      // Remove old reports
      await prisma.analyticsReport.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      // Clear old cache entries
      const oldCacheKeys = await redis.keys('analytics:*');
      for (const key of oldCacheKeys) {
        const ttl = await redis.ttl(key);
        if (ttl <= 0) {
          await redis.del(key);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old analytics data:', error);
    }
  }
}

// Create and export singleton instance
export const analyticsProcessor = new AnalyticsProcessor();