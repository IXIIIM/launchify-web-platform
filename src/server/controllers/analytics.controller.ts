import { Request, Response } from 'express';
import { SubscriptionAnalytics } from '../services/analytics/SubscriptionAnalytics';
import { UserTypeAnalytics } from '../services/analytics/UserTypeAnalytics';
import { logger } from '../utils/logger';
import { createCsvStringifier } from 'csv-writer';
import { clearCache } from '../middleware/cache';
import { performance } from 'perf_hooks';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface SubscriptionMetricsQuery {
  timeframe?: string;
  userTypes?: string;
  subscriptionTiers?: string;
  startDate?: string;
  endDate?: string;
  includeTrials?: string;
  minRevenueValue?: string;
}

/**
 * Get subscription metrics with enhanced filtering and performance optimizations
 */
export const getSubscriptionMetrics = async (req: AuthRequest, res: Response) => {
  const startTime = performance.now();
  
  try {
    // Check if user has permission
    if (!req.user || !['admin', 'manager', 'analyst'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const query = req.query as SubscriptionMetricsQuery;
    
    // Parse query parameters
    const timeframe = query.timeframe || '1m';
    const userTypes = query.userTypes ? query.userTypes.split(',') : undefined;
    const subscriptionTiers = query.subscriptionTiers ? query.subscriptionTiers.split(',') : undefined;
    const includeTrials = query.includeTrials ? query.includeTrials === 'true' : true;
    const minRevenueValue = query.minRevenueValue ? parseInt(query.minRevenueValue, 10) : 0;
    
    // Handle custom date range
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (timeframe === 'custom' && query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
    }
    
    // Create analytics service instances
    const subscriptionAnalytics = new SubscriptionAnalytics();
    const userTypeAnalytics = new UserTypeAnalytics();
    
    // Get subscription metrics with filters
    const metrics = await subscriptionAnalytics.getSubscriptionMetrics(timeframe, {
      startDate,
      endDate,
      subscriptionTiers,
      includeTrials,
      minRevenueValue
    });
    
    // Get user type metrics if requested
    if (userTypes && userTypes.length > 0) {
      const userTypeMetrics = await userTypeAnalytics.getUserTypeMetrics(timeframe, {
        startDate,
        endDate,
        userTypes,
        subscriptionTiers,
        includeTrials
      });
      
      // Combine metrics
      metrics.userTypeMetrics = userTypeMetrics;
    }
    
    // Add performance metrics
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Add processing time to response headers
    res.setHeader('X-Processing-Time', `${processingTime.toFixed(2)}ms`);
    
    // Log performance metrics for monitoring
    logger.debug(`Analytics processing time: ${processingTime.toFixed(2)}ms for ${req.originalUrl}`);
    
    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching subscription metrics:', error);
    res.status(500).json({ error: 'Failed to fetch subscription metrics' });
  }
};

/**
 * Generate a subscription report based on filters
 */
export const generateSubscriptionReport = async (req: AuthRequest, res: Response) => {
  const startTime = performance.now();
  
  try {
    // Check if user has permission
    if (!req.user || !['admin', 'manager', 'analyst'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { 
      startDate, 
      endDate, 
      format = 'json',
      userTypes,
      subscriptionTiers,
      includeTrials = true
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Parse dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Validate dates
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Create analytics service instances
    const subscriptionAnalytics = new SubscriptionAnalytics();
    const userTypeAnalytics = new UserTypeAnalytics();
    
    // Get subscription metrics with custom date range
    const metrics = await subscriptionAnalytics.getSubscriptionMetrics('custom', {
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      subscriptionTiers,
      includeTrials
    });
    
    // Get user type metrics if requested
    if (userTypes && userTypes.length > 0) {
      const userTypeMetrics = await userTypeAnalytics.getUserTypeMetrics('custom', {
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        userTypes,
        subscriptionTiers,
        includeTrials
      });
      
      // Combine metrics
      metrics.userTypeMetrics = userTypeMetrics;
    }

    // Format response based on requested format
    if (format === 'csv') {
      const csvData = generateCSVReport(metrics);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=subscription_report_${startDate}_to_${endDate}.csv`);
      
      // Add performance metrics to response headers
      const endTime = performance.now();
      res.setHeader('X-Processing-Time', `${(endTime - startTime).toFixed(2)}ms`);
      
      return res.send(csvData);
    }

    // Add performance metrics to response headers
    const endTime = performance.now();
    res.setHeader('X-Processing-Time', `${(endTime - startTime).toFixed(2)}ms`);
    
    res.json(metrics);
  } catch (error) {
    logger.error('Error generating subscription report:', error);
    res.status(500).json({ error: 'Failed to generate subscription report' });
  }
};

/**
 * Invalidate analytics cache
 */
export const invalidateAnalyticsCache = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has permission
    if (!req.user || !['admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const { patterns = ['analytics'] } = req.body;
    
    // Validate patterns
    if (!Array.isArray(patterns) || patterns.length === 0) {
      return res.status(400).json({ error: 'Invalid cache patterns' });
    }
    
    // Clear cache
    const deletedCount = await clearCache(patterns);
    
    res.json({ 
      success: true, 
      message: `Successfully invalidated ${deletedCount} cache entries`,
      deletedCount
    });
  } catch (error) {
    logger.error('Error invalidating analytics cache:', error);
    res.status(500).json({ error: 'Failed to invalidate analytics cache' });
  }
};

/**
 * Generate a CSV report from subscription metrics
 */
function generateCSVReport(metrics: any): string {
  // Create CSV header and records
  const header = [
    { id: 'metric', title: 'Metric' },
    { id: 'value', title: 'Value' }
  ];
  
  const records = [
    { metric: 'New Subscriptions', value: metrics.subscriptionGrowth.newSubscriptions },
    { metric: 'Canceled Subscriptions', value: metrics.subscriptionGrowth.canceledSubscriptions },
    { metric: 'Net Growth', value: metrics.subscriptionGrowth.netGrowth },
    { metric: 'Growth Rate', value: `${metrics.subscriptionGrowth.growthRate}%` },
    { metric: 'MRR', value: metrics.revenueMetrics.mrr },
    { metric: 'ARR', value: metrics.revenueMetrics.arr },
    { metric: 'Churn Rate', value: `${metrics.retentionMetrics.churnRate}%` },
    { metric: 'Average Lifetime', value: `${metrics.retentionMetrics.averageLifetime} months` }
  ];
  
  // Create CSV stringifier
  const csvStringifier = createCsvStringifier({
    header,
    fieldDelimiter: ','
  });
  
  let csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
  
  // Add tier distribution
  csvContent += '\n\nTier Distribution\n';
  
  const tierHeader = [
    { id: 'tier', title: 'Tier' },
    { id: 'count', title: 'Subscribers' },
    { id: 'percentage', title: 'Percentage' }
  ];
  
  const tierStringifier = createCsvStringifier({
    header: tierHeader,
    fieldDelimiter: ','
  });
  
  csvContent += tierStringifier.getHeaderString() + 
    tierStringifier.stringifyRecords(metrics.tierDistribution.distribution.map((tier: any) => ({
      tier: tier.tier,
      count: tier.count,
      percentage: `${tier.percentage}%`
    })));
  
  // Add user type metrics if available
  if (metrics.userTypeMetrics) {
    csvContent += '\n\nUser Type Distribution\n';
    
    const userTypeHeader = [
      { id: 'userType', title: 'User Type' },
      { id: 'count', title: 'Count' },
      { id: 'percentage', title: 'Percentage' }
    ];
    
    const userTypeStringifier = createCsvStringifier({
      header: userTypeHeader,
      fieldDelimiter: ','
    });
    
    csvContent += userTypeStringifier.getHeaderString() + 
      userTypeStringifier.stringifyRecords(metrics.userTypeMetrics.distribution.map((type: any) => ({
        userType: type.userType,
        count: type.count,
        percentage: `${type.percentage}%`
      })));
  }
  
  return csvContent;
}