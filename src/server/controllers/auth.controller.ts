import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/environment';
import { ValidationError, UnauthorizedError } from '../middleware/error';
import { EmailService } from '../../services/email/EmailService';

const prisma = new PrismaClient();
const emailService = new EmailService();

// Validation schemas
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Password must contain at least one letter and one number'
  }),
  userType: z.enum(['entrepreneur', 'funder']),
  firstName: z.string().min(2),
  lastName: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const signup = async (req: Request, res: Response) => {
  try {
    const validatedData = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      throw new ValidationError('Validation failed', [{
        field: 'email',
        message: 'Email already registered'
      }]);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Generate verification token
    const verificationToken = jwt.sign(
      { email: validatedData.email },
      config.auth.jwtSecret,
      { expiresIn: '24h' }
    );

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        userType: validatedData.userType,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        verificationToken,
        subscriptionTier: 'Basic',
        verificationLevel: 'None'
      }
    });

    // Send verification email
    await emailService.sendEmail({
      to: user.email,
      template: 'verify-email',
      data: {
        name: `${user.firstName} ${user.lastName}`,
        verificationUrl: `${config.server.frontendUrl}/verify-email?token=${verificationToken}`,
        token: verificationToken,
        userType: user.userType
      }
    });

    // Send welcome email
    await emailService.sendEmail({
      to: user.email,
      template: 'welcome',
      data: {
        name: `${user.firstName} ${user.lastName}`,
        userType: user.userType,
        dashboardUrl: `${config.server.frontendUrl}/dashboard`,
        socialLinks: {
          linkedin: config.social.linkedin,
          twitter: config.social.twitter,
          facebook: config.social.facebook
        },
        companyAddress: config.company.address
      }
    });

    res.status(201).json({
      message: 'User created successfully. Please verify your email.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        entrepreneurProfile: true,
        funderProfile: true
      }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedError('Please verify your email first');
    }

    const validPassword = await bcrypt.compare(validatedData.password, user.password);
    if (!validPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiresIn }
    );

    // Record login
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || '',
        status: 'success'
      }
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        subscriptionTier: user.subscriptionTier,
        verificationLevel: user.verificationLevel,
        profile: user.userType === 'entrepreneur' 
          ? user.entrepreneurProfile 
          : user.funderProfile
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }

    // Record failed login attempt
    if (error instanceof UnauthorizedError) {
      const user = await prisma.user.findUnique({
        where: { email: req.body.email }
      });

      if (user) {
        await prisma.loginHistory.create({
          data: {
            userId: user.id,
            ip: req.ip,
            userAgent: req.headers['user-agent'] || '',
            status: 'failed'
          }
        });
      }
    }

    throw error;
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, config.auth.jwtSecret) as { email: string };
    const user = await prisma.user.findFirst({
      where: { 
        email: decoded.email,
        verificationToken: token
      }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null
      }
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Verification token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid verification token');
    }
    throw error;
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Return success even if user not found for security
      return res.json({ message: 'Password reset email sent' });
    }

    const resetToken = jwt.sign(
      { userId: user.id },
      config.auth.jwtSecret,
      { expiresIn: '1h' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: resetToken }
    });

    await emailService.sendEmail({
      to: user.email,
      template: 'reset-password',
      data: {
        name: `${user.firstName} ${user.lastName}`,
        resetUrl: `${config.server.frontendUrl}/reset-password?token=${resetToken}`,
        token: resetToken
      }
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, config.auth.jwtSecret) as { userId: string };
    const user = await prisma.user.findFirst({
      where: { 
        id: decoded.userId,
        resetPasswordToken: token
      }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    // Validate new password
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword)) {
      throw new ValidationError('Validation failed', [{
        field: 'newPassword',
        message: 'Password must be at least 8 characters and contain letters and numbers'
      }]);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null
      }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Reset token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid reset token');
    }
    throw error;
  }
};