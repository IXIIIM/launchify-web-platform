import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: 'No authentication token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret) as { userId: string };

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        entrepreneurProfile: true,
        funderProfile: true
      }
    });

    if (!user) {
      return res.status(401).json({
        message: 'User not found'
      });
    }

    // Check if user is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        message: 'Please verify your email address'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: 'Authentication token has expired'
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: 'Invalid authentication token'
      });
    }

    next(error);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

export const requireVerified = (verificationLevels: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    if (!verificationLevels.includes(req.user.verificationLevel)) {
      return res.status(403).json({
        message: `This action requires ${verificationLevels.join(' or ')} verification`
      });
    }

    next();
  };
};

export const requireSubscriptionTier = (allowedTiers: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    if (!allowedTiers.includes(req.user.subscriptionTier)) {
      return res.status(403).json({
        message: `This feature requires ${allowedTiers.join(' or ')} subscription`
      });
    }

    next();
  };
};

export const requireActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: req.user.id,
      status: 'active'
    }
  });

  if (!subscription && req.user.subscriptionTier !== 'Basic') {
    return res.status(403).json({
      message: 'Active subscription required'
    });
  }

  next();
};

export const requirePhoneVerification = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  if (!req.user.phoneVerified) {
    return res.status(403).json({
      message: 'Phone verification required'
    });
  }

  next();
};

export const rateLimitByUser = (
  maxRequests: number,
  windowMs: number
) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    const now = Date.now();
    const userRequests = requests.get(req.user.id);

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(req.user.id, {
        count: 1,
        resetTime: now + windowMs
      });
    } else {
      userRequests.count++;
      
      if (userRequests.count > maxRequests) {
        return res.status(429).json({
          message: 'Too many requests',
          retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
        });
      }
    }

    next();
  };
};