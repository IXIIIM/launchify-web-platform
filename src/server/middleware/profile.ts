// src/server/middleware/profile.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ValidationError } from '../utils/errors';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user: any;
}

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

    // Check if user has completed profile setup
    const profile = user.userType === 'entrepreneur' 
      ? user.entrepreneurProfile 
      : user.funderProfile;

    if (!profile) {
      throw new ValidationError('Profile incomplete', [{
        field: 'profile',
        message: 'Please complete your profile before matching'
      }]);
    }

    // Check required fields based on user type
    if (user.userType === 'entrepreneur') {
      const requiredFields = [
        'projectName',
        'photo',
        'features',
        'industries',
        'businessType',
        'desiredInvestment'
      ];

      const missingFields = requiredFields.filter(field => !profile[field]);

      if (missingFields.length > 0) {
        throw new ValidationError('Required fields missing', 
          missingFields.map(field => ({
            field,
            message: `${field} is required`
          }))
        );
      }
    } else {
      const requiredFields = [
        'name',
        'photo',
        'availableFunds',
        'areasOfInterest',
        'investmentPreferences'
      ];

      const missingFields = requiredFields.filter(field => !profile[field]);

      if (missingFields.length > 0) {
        throw new ValidationError('Required fields missing',
          missingFields.map(field => ({
            field,
            message: `${field} is required`
          }))
        );
      }
    }

    // Verify email and phone
    if (!user.emailVerified || !user.phoneVerified) {
      throw new ValidationError('Verification required', [{
        field: 'verification',
        message: 'Please verify your email and phone number'
      }]);
    }

    next();
  } catch (error) {
    next(error);
  }
};