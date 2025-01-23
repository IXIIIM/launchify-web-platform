import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics';
import { parseISO } from 'date-fns';

const analyticsService = new AnalyticsService();

interface AuthRequest extends Request {
  user: any;
}

// ... [Rest of the controller implementation] ...