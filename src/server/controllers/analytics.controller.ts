import { Request, Response } from 'express';
import { SubscriptionAnalytics } from '../services/analytics/SubscriptionAnalytics';
import { startOfMonth, subMonths, endOfMonth } from 'date-fns';

const subscriptionAnalytics = new SubscriptionAnalytics();

interface AuthRequest extends Request {
  user: any;
}

export const getSubscriptionMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const timeframe = req.query.timeframe || '1m';
    const endDate = endOfMonth(new Date());
    let startDate: Date;

    switch (timeframe) {
      case '3m':
        startDate = startOfMonth(subMonths(endDate, 3));
        break;
      case '6m':
        startDate = startOfMonth(subMonths(endDate, 6));
        break;
      case '12m':
        startDate = startOfMonth(subMonths(endDate, 12));
        break;
      default:
        startDate = startOfMonth(subMonths(endDate, 1));
    }

    // Check user permissions
    if (!req.user.permissions?.includes('VIEW_ANALYTICS')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const metrics = await subscriptionAnalytics.getSubscriptionMetrics(
      startDate,
      endDate
    );

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching subscription metrics:', error);
    res.status(500).json({ message: 'Error fetching metrics' });
  }
};

export const generateSubscriptionReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, format = 'json' } = req.body;

    // Check user permissions
    if (!req.user.permissions?.includes('GENERATE_REPORTS')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const metrics = await subscriptionAnalytics.getSubscriptionMetrics(
      new Date(startDate),
      new Date(endDate)
    );

    if (format === 'csv') {
      // Convert to CSV format
      const csv = await generateCSVReport(metrics);
      res.header('Content-Type', 'text/csv');
      res.attachment(`subscription-report-${startDate}-${endDate}.csv`);
      return res.send(csv);
    }

    res.json(metrics);
  } catch (error) {
    console.error('Error generating subscription report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
};

const generateCSVReport = async (metrics: any) => {
  // Implementation for CSV conversion
  return '';
};