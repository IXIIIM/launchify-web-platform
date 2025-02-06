import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '../middleware/error';
import { StorageService } from '../../services/storage/StorageService';
import { UsageService } from '../../services/usage/UsageService';

const prisma = new PrismaClient();
const storageService = new StorageService();
const usageService = new UsageService();

interface AuthRequest extends Request {
  user: any;
}

// Validation schemas
const entrepreneurProfileSchema = z.object({
  projectName: z.string().min(2),
  logo: z.string().url().optional(),
  photo: z.string().url().optional(),
  dbaNumber: z.string().optional(),
  taxId: z.string().optional(),
  companyWebsite: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  features: z.array(z.string()).min(1).max(5),
  industries: z.array(z.string()).min(1),
  yearsExperience: z.number().min(0),
  businessType: z.enum(['B2B', 'B2C']),
  desiredInvestment: z.object({
    amount: z.number().min(0),
    timeframe: z.string()
  }),
  profitabilityTimeframe: z.string()
});

const funderProfileSchema = z.object({
  name: z.string().min(2),
  logo: z.string().url().optional(),
  photo: z.string().url().optional(),
  taxId: z.string().optional(),
  companyWebsite: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  availableFunds: z.number().min(0),
  areasOfInterest: z.array(z.string()).min(1),
  yearsExperience: z.number().min(0),
  investmentPreferences: z.object({
    timeframe: z.string(),
    commitmentLength: z.string()
  }),
  certifications: z.array(z.enum([
    'SmallBusiness',
    'MinorityOwned',
    'WomenOwned',
    'GreenFriendly'
  ]))
});

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        entrepreneurProfile: true,
        funderProfile: true,
        subscription: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Track profile view if viewing another user's profile
    if (req.params.userId && req.params.userId !== req.user.id) {
      await usageService.trackProfileView(req.params.userId);
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      subscriptionTier: user.subscriptionTier,
      verificationLevel: user.verificationLevel,
      profile: user.userType === 'entrepreneur' 
        ? user.entrepreneurProfile 
        : user.funderProfile,
      subscription: user.subscription[0]
    });
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        entrepreneurProfile: true,
        funderProfile: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Validate based on user type
    const validatedData = user.userType === 'entrepreneur'
      ? entrepreneurProfileSchema.parse(req.body)
      : funderProfileSchema.parse(req.body);

    // Handle profile updates based on user type
    if (user.userType === 'entrepreneur') {
      await prisma.entrepreneurProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...validatedData
        },
        update: validatedData
      });
    } else {
      await prisma.funderProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...validatedData
        },
        update: validatedData
      });
    }

    // Return updated profile
    await getProfile(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
};

export const uploadProfileImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      throw new ValidationError('Validation failed', [{
        field: 'photo',
        message: 'Profile image is required'
      }]);
    }

    const imageUrl = await storageService.uploadProfileImage(
      req.file.buffer,
      req.user.id
    );

    // Update profile with new image URL
    if (req.user.userType === 'entrepreneur') {
      await prisma.entrepreneurProfile.update({
        where: { userId: req.user.id },
        data: { photo: imageUrl }
      });
    } else {
      await prisma.funderProfile.update({
        where: { userId: req.user.id },
        data: { photo: imageUrl }
      });
    }

    res.json({ url: imageUrl });
  } catch (error) {
    throw error;
  }
};

export const uploadCompanyLogo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      throw new ValidationError('Validation failed', [{
        field: 'logo',
        message: 'Company logo is required'
      }]);
    }

    const logoUrl = await storageService.uploadCompanyLogo(
      req.file.buffer,
      req.user.id
    );

    // Update profile with new logo URL
    if (req.user.userType === 'entrepreneur') {
      await prisma.entrepreneurProfile.update({
        where: { userId: req.user.id },
        data: { logo: logoUrl }
      });
    } else {
      await prisma.funderProfile.update({
        where: { userId: req.user.id },
        data: { logo: logoUrl }
      });
    }

    res.json({ url: logoUrl });
  } catch (error) {
    throw error;
  }
};

export const getProfileStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await usageService.generateUsageReport(req.user.id);
    res.json(stats);
  } catch (error) {
    throw error;
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      emailNotifications,
      pushNotifications,
      theme,
      language
    } = req.body;

    await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        emailNotifications,
        pushNotifications,
        theme,
        language
      },
      update: {
        emailNotifications,
        pushNotifications,
        theme,
        language
      }
    });

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    throw error;
  }
};

export const getLoginHistory = async (req: AuthRequest, res: Response) => {
  try {
    const history = await prisma.loginHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json(history);
  } catch (error) {
    throw error;
  }
};