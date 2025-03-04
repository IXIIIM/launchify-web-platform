import { AnalyticsScheduler } from '../AnalyticsScheduler';
import { PrismaClient } from '@prisma/client';
import { analyticsCache } from '../../services/cache';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../services/cache');

describe('AnalyticsScheduler', () => {
  let scheduler: AnalyticsScheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    scheduler = new AnalyticsScheduler();
  });

  afterEach(() => {
    scheduler.stop();
  });

  describe('aggregateDailyMetrics', () => {
    it('should aggregate and store daily metrics', async () => {
      const mockMetrics = {
        users: { total: 100, previousTotal: 90 },
        revenue: { daily: 1000 },
        matches: { successful: 50 }
      };

      // @ts-ignore - Mocking private method
      scheduler.analyticsService.getPlatformAnalytics = jest.fn().mockResolvedValue(mockMetrics);

      // @ts-ignore - Testing private method
      await scheduler.aggregateDailyMetrics();

      expect(scheduler.analyticsService.getPlatformAnalytics).toHaveBeenCalled();
      expect(analyticsCache.invalidateMetrics).toHaveBeenCalledWith('daily');
    });
  });

  describe('aggregateWeeklyMetrics', () => {
    it('should generate weekly reports for admins', async () => {
      const mockAdmins = [{ id: 'admin1' }, { id: 'admin2' }];
      const mockMetrics = {
        users: { total: 500 },
        revenue: { weekly: 5000 }
      };

      // @ts-ignore - Mocking private method
      scheduler.analyticsService.getPlatformAnalytics = jest.fn().mockResolvedValue(mockMetrics);
      (scheduler.prisma.user.findMany as jest.Mock).mockResolvedValue(mockAdmins);

      // @ts-ignore - Testing private method
      await scheduler.aggregateWeeklyMetrics();

      expect(scheduler.prisma.analyticsReport.create).toHaveBeenCalledTimes(mockAdmins.length);
      expect(analyticsCache.invalidateMetrics).toHaveBeenCalledWith('weekly');
    });
  });

  describe('aggregateMonthlyMetrics', () => {
    it('should aggregate monthly metrics and generate reports', async () => {
      const mockMetrics = {
        users: { total: 1000, growthRate: 10, retentionRate: 75 },
        revenue: { monthly: 10000, monthlyGrowth: 15 },
        matches: { averageRate: 80 }
      };

      // @ts-ignore - Mocking private method
      scheduler.analyticsService.getPlatformAnalytics = jest.fn().mockResolvedValue(mockMetrics);

      // @ts-ignore - Testing private method
      await scheduler.aggregateMonthlyMetrics();

      expect(scheduler.prisma.analyticsMonthly.create).toHaveBeenCalled();
      expect(analyticsCache.invalidateMetrics).toHaveBeenCalledWith('monthly');
    });
  });

  describe('generateInsights', () => {
    it('should generate correct insights from metrics', async () => {
      const mockMetrics = {
        users: { growthRate: 10, retentionRate: 75 },
        revenue: { monthlyGrowth: 15 },
        matches: { successRate: 85 }
      };

      // @ts-ignore - Testing private method
      const insights = await scheduler.generateInsights(mockMetrics);

      expect(insights).toEqual({
        userGrowth: {
          trend: 'up',
          percentage: 10,
          recommendation: undefined
        },
        revenue: {
          trend: 'up',
          percentage: 15,
          recommendation: undefined
        },
        matches: {
          trend: 'up',
          percentage: 85,
          recommendation: undefined
        },
        engagement: {
          trend: 'up',
          percentage: 75,
          recommendation: undefined
        }
      });
    });
  });
});
