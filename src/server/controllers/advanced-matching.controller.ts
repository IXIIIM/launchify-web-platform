// src/server/controllers/advanced-matching.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { UsageService } from '../services/usage';
import { NotFoundError, ValidationError } from '../utils/errors';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);
const usageService = new UsageService();

interface AuthRequest extends Request {
  user: any;
}

// Validation schemas
const filterSchema = z.object({
  verificationLevel: z.array(z.string()),
  location: z.string(),
  radius: z.number().min(0),
  investmentRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }),
  industries: z.array(z.string())
});

// Constants
const BOOST_DURATION = 30 * 60; // 30 minutes in seconds
const BOOST_MULTIPLIER = 10;
const BOOST_COOLDOWN = 24 * 60 * 60; // 24 hours in seconds

export const checkBoostAccess = async (req: AuthRequest, res: Response) => {
  try {
    const canAccess = await usageService.canAccessFeature(req.user.id, 'canBoostProfile');
    res.json({ canAccess });
  } catch (error) {
    throw error;
  }
};

export const getBoostStats = async (req: AuthRequest, res: Response) => {
  try {
    const boostKey = `boost:${req.user.id}`;
    const viewsKey = `boost:views:${req.user.id}`;
    
    // Get current boost status
    const [boostTtl, views] = await Promise.all([
      redis.ttl(boostKey),
      redis.get(viewsKey)
    ]);

    // Calculate match increase if boost was active
    let matchIncrease = 0;
    if (boostTtl > 0) {
      const normalMatches = await prisma.match.count({
        where: {
          userId: req.user.id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });

      const boostedMatches = await prisma.match.count({
        where: {
          userId: req.user.id,
          createdAt: {
            gte: new Date(Date.now() - boostTtl * 1000)
          }
        }
      });

      if (normalMatches > 0) {
        matchIncrease = Math.round((boostedMatches / normalMatches - 1) * 100);
      }
    }

    res.json({
      active: boostTtl > 0,
      remainingTime: boostTtl > 0 ? boostTtl : 0,
      viewsReceived: parseInt(views || '0'),
      matchIncrease
    });
  } catch (error) {
    throw error;
  }
};

export const activateBoost = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user can access boost feature
    const canBoost = await usageService.canAccessFeature(req.user.id, 'canBoostProfile');
    if (!canBoost) {
      throw new ValidationError('Boost feature not available', [{
        field: 'boost',
        message: 'Upgrade your subscription to access profile boost'
      }]);
    }

    const boostKey = `boost:${req.user.id}`;
    const viewsKey = `boost:views:${req.user.id}`;
    
    // Check if boost is already active
    const ttl = await redis.ttl(boostKey);
    if (ttl > 0) {
      throw new ValidationError('Boost already active', [{
        field: 'boost',
        message: `Boost is already active for ${Math.ceil(ttl / 60)} minutes`
      }]);
    }

    // Check cooldown period
    const lastBoostKey = `boost:last:${req.user.id}`;
    const lastBoost = await redis.get(lastBoostKey);
    if (lastBoost) {
      const cooldownRemaining = await redis.ttl(lastBoostKey);
      if (cooldownRemaining > 0) {
        throw new ValidationError('Boost on cooldown', [{
          field: 'boost',
          message: `Boost available in ${Math.ceil(cooldownRemaining / 3600)} hours`
        }]);
      }
    }

    // Activate boost
    await Promise.all([
      redis.setex(boostKey, BOOST_DURATION, 'active'),
      redis.setex(lastBoostKey, BOOST_COOLDOWN, 'used'),
      redis.set(viewsKey, '0')
    ]);

    // Update user's match visibility
    await prisma.user.update({
      where: { id: req.user.id },
      data: { boostActive: true }
    });

    res.json({
      message: 'Boost activated successfully',
      duration: BOOST_DURATION,
      multiplier: BOOST_MULTIPLIER
    });
  } catch (error) {
    throw error;
  }
};

export const updateFilters = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = filterSchema.parse(req.body);

    // Store filters in Redis for quick access during matching
    const filterKey = `filters:${req.user.id}`;
    await redis.set(filterKey, JSON.stringify(validatedData));

    // If location filter is set, geocode and store coordinates
    if (validatedData.location) {
      const coordinates = await geocodeLocation(validatedData.location);
      if (coordinates) {
        await redis.hmset(`location:${req.user.id}`, {
          lat: coordinates.lat,
          lng: coordinates.lng,
          radius: validatedData.radius
        });
      }
    } else {
      await redis.del(`location:${req.user.id}`);
    }

    res.json({
      message: 'Filters updated successfully',
      filters: validatedData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid filter data', error.errors);
    }
    throw error;
  }
};

export const getFilters = async (req: AuthRequest, res: Response) => {
  try {
    const filterKey = `filters:${req.user.id}`;
    const filters = await redis.get(filterKey);
    
    // Get location data if it exists
    const locationKey = `location:${req.user.id}`;
    const location = await redis.hgetall(locationKey);

    res.json({
      filters: filters ? JSON.parse(filters) : null,
      location: Object.keys(location).length > 0 ? location : null
    });
  } catch (error) {
    throw error;
  }
};

// Helper function to apply boost multiplier to match algorithm
export const applyBoostMultiplier = async (userId: string, score: number): Promise<number> => {
  const boostKey = `boost:${userId}`;
  const isBoostActive = await redis.exists(boostKey);
  
  if (isBoostActive) {
    // Increment view counter
    await redis.incr(`boost:views:${userId}`);
    return score * BOOST_MULTIPLIER;
  }
  
  return score;
};

// Helper function to apply filters to match query
export const applyMatchFilters = async (userId: string, query: any): Promise<any> => {
  const filterKey = `filters:${userId}`;
  const filters = await redis.get(filterKey);
  
  if (!filters) return query;

  const parsedFilters = JSON.parse(filters);
  const enhancedQuery = { ...query };

  // Apply verification level filter
  if (parsedFilters.verificationLevel?.length > 0) {
    enhancedQuery.verificationLevel = {
      in: parsedFilters.verificationLevel
    };
  }

  // Apply investment range filter
  if (parsedFilters.investmentRange) {
    enhancedQuery.OR = [
      {
        entrepreneurProfile: {
          desiredInvestment: {
            amount: {
              gte: parsedFilters.investmentRange.min,
              lte: parsedFilters.investmentRange.max
            }
          }
        }
      },
      {
        funderProfile: {
          availableFunds: {
            gte: parsedFilters.investmentRange.min,
            lte: parsedFilters.investmentRange.max
          }
        }
      }
    ];
  }

  // Apply industry filter
  if (parsedFilters.industries?.length > 0) {
    enhancedQuery.OR = [
      {
        entrepreneurProfile: {
          industries: {
            hasSome: parsedFilters.industries
          }
        }
      },
      {
        funderProfile: {
          areasOfInterest: {
            hasSome: parsedFilters.industries
          }
        }
      }
    ];
  }

  // Apply location filter if exists
  const locationKey = `location:${userId}`;
  const location = await redis.hgetall(locationKey);
  
  if (Object.keys(location).length > 0) {
    // Add location-based filtering using coordinates
    enhancedQuery.location = {
      near: {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng),
        radius: parseInt(location.radius)
      }
    };
  }

  return enhancedQuery;
};

// Helper function to geocode location
const geocodeLocation = async (location: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    // Implement geocoding using your preferred service
    // For example, using Google Maps Geocoding API
    return null; // Replace with actual implementation
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};