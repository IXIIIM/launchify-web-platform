import { Request, Response, NextFunction } from 'express';
import { isValid, isAfter, isBefore, parseISO } from 'date-fns';

export const validateAnalyticsQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors: string[] = [];

  // Validate dates if provided
  if (req.query.startDate) {
    const startDate = parseISO(req.query.startDate as string);
    if (!isValid(startDate)) {
      errors.push('Invalid start date format');
    }
  }

  if (req.query.endDate) {
    const endDate = parseISO(req.query.endDate as string);
    if (!isValid(endDate)) {
      errors.push('Invalid end date format');
    }
  }

  if (req.query.startDate && req.query.endDate) {
    const startDate = parseISO(req.query.startDate as string);
    const endDate = parseISO(req.query.endDate as string);
    
    if (isValid(startDate) && isValid(endDate) && isAfter(startDate, endDate)) {
      errors.push('Start date must be before end date');
    }

    // Limit date range to 1 year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (isBefore(startDate, oneYearAgo)) {
      errors.push('Date range cannot exceed 1 year');
    }
  }

  // Validate timeframe if provided
  if (req.query.timeframe && !['day', 'week', 'month', 'year'].includes(req.query.timeframe as string)) {
    errors.push('Invalid timeframe');
  }

  // Validate user type if provided
  if (req.query.userType && !['entrepreneur', 'funder'].includes(req.query.userType as string)) {
    errors.push('Invalid user type');
  }

  // Validate subscription tier if provided
  if (req.query.subscriptionTier && 
      !['Basic', 'Chrome', 'Bronze', 'Silver', 'Gold', 'Platinum'].includes(req.query.subscriptionTier as string)) {
    errors.push('Invalid subscription tier');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};
