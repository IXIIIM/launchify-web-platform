// Continuing from previous implementation...

      matches: {
        trend: metrics.matches.successRate > 70 ? 'up' : metrics.matches.successRate > 50 ? 'stable' : 'down',
        percentage: metrics.matches.successRate,
        recommendation: metrics.matches.successRate < 50
          ? 'Review matching algorithm parameters'
          : undefined
      },
      engagement: {
        trend: metrics.users.retentionRate > 60 ? 'up' : metrics.users.retentionRate > 40 ? 'stable' : 'down',
        percentage: metrics.users.retentionRate,
        recommendation: metrics.users.retentionRate < 40
          ? 'Implement engagement improvement strategies'
          : undefined
      }
    };
  }

  async cleanupOldData(): Promise<void> {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const ninetyDaysAgo = subDays(new Date(), 90);

      // Keep daily data for 30 days
      await this.prisma.analyticsDaily.deleteMany({
        where: {
          date: { lt: thirtyDaysAgo }
        }
      });

      // Keep reports for 90 days
      await this.prisma.analyticsReport.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo }
        }
      });

      console.log('Old analytics data cleanup completed');
    } catch (error) {
      console.error('Error cleaning up old analytics data:', error);
    }
  }
}

// Create singleton instance
export const analyticsScheduler = new AnalyticsScheduler();