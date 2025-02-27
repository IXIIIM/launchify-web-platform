// src/server/middleware/location.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user: any;
  ip: string;
}

export const trackLocation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next();
    }

    const ip = req.headers['x-forwarded-for']?.toString() || req.ip;
    const existingLocation = await prisma.userLocation.findUnique({
      where: { userId: req.user.id }
    });

    // Only update location periodically
    if (existingLocation && 
        Date.now() - existingLocation.updatedAt.getTime() < 24 * 60 * 60 * 1000) {
      return next();
    }

    // Get location from IP using ipapi.co
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const locationData = await response.json();

    if (locationData.error) {
      console.warn('Location lookup failed:', locationData.error);
      return next();
    }

    // Update or create location record
    await prisma.userLocation.upsert({
      where: { userId: req.user.id },
      update: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        city: locationData.city,
        state: locationData.region,
        country: locationData.country_name
      },
      create: {
        userId: req.user.id,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        city: locationData.city,
        state: locationData.region,
        country: locationData.country_name
      }
    });

    next();
  } catch (error) {
    console.error('Error tracking location:', error);
    next(); // Continue even if location tracking fails
  }
};