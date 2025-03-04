import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user: any;
}

// Validation schema for security settings
const SecuritySettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  passwordExpiration: z.number().min(30).max(365),
  minPasswordLength: z.number().min(8).max(32),
  requireSpecialChars: z.boolean(),
  requireNumbers: z.boolean(),
  sessionTimeout: z.number().min(5).max(120),
  maxLoginAttempts: z.number().min(3).max(10),
  notifyOnNewDevice: z.boolean(),
  notifyOnPasswordChange: z.boolean(),
  autoLockTimeout: z.number().min(5).max(60)
});

export const getSecuritySettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.securitySettings.findUnique({
      where: { userId: req.user.id }
    });

    if (!settings) {
      // Return default settings if none exist
      return res.json({
        twoFactorEnabled: false,
        passwordExpiration: 90,
        minPasswordLength: 12,
        requireSpecialChars: true,
        requireNumbers: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        notifyOnNewDevice: true,
        notifyOnPasswordChange: true,
        autoLockTimeout: 15
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.status(500).json({ message: 'Error fetching security settings' });
  }
};

export const updateSecuritySettings = async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const validatedSettings = SecuritySettingsSchema.parse(req.body);

    // Update or create settings
    const settings = await prisma.securitySettings.upsert({
      where: { userId: req.user.id },
      update: validatedSettings,
      create: {
        ...validatedSettings,
        userId: req.user.id
      }
    });

    // Log the security settings change
    await prisma.securityLog.create({
      data: {
        userId: req.user.id,
        eventType: 'SECURITY_SETTINGS_UPDATE',
        status: 'SUCCESS',
        details: {
          previousSettings: req.body,
          newSettings: settings
        }
      }
    });

    res.json(settings);
  } catch (error) {
    // Log validation or database errors
    await prisma.securityLog.create({
      data: {
        userId: req.user.id,
        eventType: 'SECURITY_SETTINGS_UPDATE',
        status: 'FAILURE',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          attemptedSettings: req.body
        }
      }
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid security settings',
        errors: error.errors
      });
    }

    console.error('Error updating security settings:', error);
    res.status(500).json({ message: 'Error updating security settings' });
  }
};

export const getSecurityLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const logs = await prisma.securityLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip
    });

    const totalLogs = await prisma.securityLog.count({
      where: { userId: req.user.id }
    });

    res.json({
      logs,
      totalPages: Math.ceil(totalLogs / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    console.error('Error fetching security logs:', error);
    res.status(500).json({ message: 'Error fetching security logs' });
  }
};

export const validateSecuritySettings = async (req: AuthRequest, res: Response) => {
  try {
    const result = SecuritySettingsSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        valid: false,
        errors: result.error.errors
      });
    }

    res.json({
      valid: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error validating security settings:', error);
    res.status(500).json({ message: 'Error validating security settings' });
  }
};