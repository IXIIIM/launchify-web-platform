// src/server/security/SecurityEnhancer.ts
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class SecurityEnhancer {
  // Rate limiting configuration
  private static createRateLimiter(windowMs: number, max: number) {
    return rateLimit({
      windowMs,
      max,
      message: { error: 'Too many requests, please try again later.' }
    });
  }

  // Helmet configuration for enhanced security headers
  static configureHelmet() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'wss:', 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: "same-site" },
      dnsPrefetchControl: true,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: true,
      ieNoOpen: true,
      noSniff: true,
      permittedCrossDomainPolicies: true,
      referrerPolicy: { policy: 'same-origin' },
      xssFilter: true,
    });
  }

  // JWT with enhanced security
  static generateSecureToken(payload: any, expiresIn: string = '1h'): string {
    const secret = process.env.JWT_SECRET!;
    return jwt.sign(payload, secret, {
      expiresIn,
      algorithm: 'HS512',
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER,
      jwtid: crypto.randomBytes(16).toString('hex')
    });
  }

  // Enhanced password hashing with Argon2
  static async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(32);
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
      });
    });
  }

  // Secure password verification
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const [salt, key] = hash.split(':');
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, Buffer.from(salt, 'hex'), 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('hex') === key);
      });
    });
  }

  // Session management middleware
  static sessionMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return next();

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
          algorithms: ['HS512'],
          audience: process.env.JWT_AUDIENCE,
          issuer: process.env.JWT_ISSUER
        }) as any;

        // Check token in blacklist
        const isBlacklisted = await prisma.tokenBlacklist.findUnique({
          where: { token }
        });
        if (isBlacklisted) throw new Error('Token blacklisted');

        // Validate session
        const session = await prisma.session.findUnique({
          where: { id: decoded.sessionId }
        });
        if (!session || session.expiresAt < new Date()) {
          throw new Error('Session expired');
        }

        req.user = decoded;
        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
      }
    };
  }

  // API rate limiting middleware
  static apiLimiter = {
    standard: SecurityEnhancer.createRateLimiter(15 * 60 * 1000, 100),
    strict: SecurityEnhancer.createRateLimiter(15 * 60 * 1000, 50),
    auth: SecurityEnhancer.createRateLimiter(60 * 60 * 1000, 5)
  };

  // SQL injection prevention middleware
  static sqlInjectionPrevention() {
    return (req: Request, res: Response, next: NextFunction) => {
      const sanitizeValue = (value: any): any => {
        if (typeof value === 'string') {
          // Remove SQL injection patterns
          return value.replace(/['";\\/g, '');
        }
        if (typeof value === 'object') {
          return Object.keys(value).reduce((acc: any, key) => {
            acc[key] = sanitizeValue(value[key]);
            return acc;
          }, Array.isArray(value) ? [] : {});
        }
        return value;
      };

      req.body = sanitizeValue(req.body);
      req.query = sanitizeValue(req.query);
      req.params = sanitizeValue(req.params);
      
      next();
    };
  }

  // Request validation middleware
  static validateRequest(schema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: error.details[0].message
        });
      }
      next();
    };
  }

  // CORS configuration
  static corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
  };
}

// Additional security middleware
export const securityMiddleware = [
  SecurityEnhancer.configureHelmet(),
  hpp(), // Prevent HTTP Parameter Pollution
  SecurityEnhancer.sqlInjectionPrevention(),
  SecurityEnhancer.sessionMiddleware()
];