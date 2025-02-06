import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { UsageService } from '../services/usage';
import { ValidationError } from '../utils/errors';

const prisma = new PrismaClient();
const usageService = new UsageService();

interface AuthRequest extends Request {
  user: any;
}

// Check if user has reached their daily match limit
export const checkMatchLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const canMatch = await usageService.trackMatch(req.user.id);
    if (!canMatch) {
      throw new ValidationError('Daily match limit reached', [{
        field: 'matches',
        message: 'You have reached your daily match limit'
      }]);
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Verify user has completed their profile
export const checkProfileCompletion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        entrepreneurProfile: true,
        funderProfile: true
      }
    });

    if (!user) {
      throw new ValidationError('User not found', []);
    }

    const profile = user.userType === 'entrepreneur'
      ? user.entrepreneurProfile
      : user.funderProfile;

    if (!profile) {
      throw new ValidationError('Profile incomplete', [{
        field: 'profile',
        message: 'Please complete your profile before using matching features'
      }]);
    }

    // Check required profile fields based on user type
    if (user.userType === 'entrepreneur') {
      const requiredFields = [
        'projectName',
        'industries',
        'yearsExperience',
        'businessType',
        'desiredInvestment'
      ];

      const missingFields = requiredFields.filter(field => !profile[field]);
      if (missingFields.length > 0) {
        throw new ValidationError('Profile incomplete', [{
          field: 'profile',
          message: `Missing required fields: ${missingFields.join(', ')}` 
        }]);
      }
    } else {
      const requiredFields = [
        'name',
        'areasOfInterest', 
        'yearsExperience',
        'availableFunds',
        'investmentPreferences'
      ];

      const missingFields = requiredFields.filter(field => !profile[field]);
      if (missingFields.length > 0) {
        throw new ValidationError('Profile incomplete', [{
          field: 'profile',
          message: `Missing required fields: ${missingFields.join(', ')}`
        }]);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Verify user has active subscription
export const checkSubscriptionStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.id,
        status: 'active'
      }
    });

    if (!subscription) {
      throw new ValidationError('Subscription required', [{
        field: 'subscription',
        message: 'Active subscription required to use matching features'
      }]);
    }

    next();
  } catch (error) {
    next(error);
  }
};