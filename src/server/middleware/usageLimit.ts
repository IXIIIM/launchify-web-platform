import { Request, Response, NextFunction } from 'express';
import { UsageService } from '../services/usage';

const usageService = new UsageService();

interface AuthRequest extends Request {
  user: any;
}

// ... [Rest of the usage limit middleware implementation] ...