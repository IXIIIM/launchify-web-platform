import { AnalyticsCache } from '../AnalyticsCache';
import Redis from 'ioredis-mock';

jest.mock('ioredis', () => require('ioredis-mock'));

describe('AnalyticsCache', () => {
  let analyticsCache: AnalyticsCache;

  beforeEach(() => {
    analyticsCache = new AnalyticsCache('redis://localhost:6379');
  });

  afterEach(async () => {
    await analyticsCache.invalidateAll();
    await analyticsCache.close();
  });

  describe('getMetrics and setMetrics', () => {
    it('should set and get metrics successfully', async () => {
      const testData = { value: 42 };
      await analyticsCache.setMetrics('test', { param: 'value' }, testData);
      const result = await analyticsCache.getMetrics('test', { param: 'value' });
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent metrics', async () => {
      const result = await analyticsCache.getMetrics('nonexistent', {});
      expect(result).toBeNull();
    });
  });

  describe('invalidateMetrics', () => {
    it('should invalidate specific metrics', async () => {
      await analyticsCache.setMetrics('test', { param: 'value' }, { value: 42 });
      await analyticsCache.invalidateMetrics('test', { param: 'value' });
      const result = await analyticsCache.getMetrics('test', { param: 'value' });
      expect(result).toBeNull();
    });

    it('should invalidate all metrics of a type', async () => {
      await analyticsCache.setMetrics('test', { param: 'value1' }, { value: 42 });
      await analyticsCache.setMetrics('test', { param: 'value2' }, { value: 43 });
      await analyticsCache.invalidateMetrics('test');
      const result1 = await analyticsCache.getMetrics('test', { param: 'value1' });
      const result2 = await analyticsCache.getMetrics('test', { param: 'value2' });
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('getTimeSeriesData and setTimeSeriesData', () => {
    it('should set and get time series data successfully', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const testData = [{ date: '2025-01-01', value: 42 }];

      await analyticsCache.setTimeSeriesData('test', startDate, endDate, testData);
      const result = await analyticsCache.getTimeSeriesData('test', startDate, endDate);
      expect(result).toEqual(testData);
    });
  });
});