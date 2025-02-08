import { AnalyticsCache } from './AnalyticsCache';

// Create and export singleton instance
export const analyticsCache = new AnalyticsCache(process.env.REDIS_URL!);

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await analyticsCache.close();
});

export { AnalyticsCache };
