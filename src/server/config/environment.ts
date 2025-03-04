import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
config();

// Environment variable schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  FRONTEND_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string(),

  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // AWS
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_S3_BUCKET: z.string(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PRICE_ID_MAP: z.string(), // JSON string of price IDs

  // Redis
  REDIS_URL: z.string().url(),

  // Email
  SYSTEM_EMAIL_ADDRESS: z.string().email(),
  SUPPORT_EMAIL_ADDRESS: z.string().email(),

  // Social Media
  LINKEDIN_URL: z.string().url().optional(),
  TWITTER_URL: z.string().url().optional(),
  FACEBOOK_URL: z.string().url().optional(),

  // Company
  COMPANY_NAME: z.string().default('Launchify'),
  COMPANY_ADDRESS: z.string(),

  // Features
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  MAX_PROFILE_IMAGE_SIZE: z.string().transform(Number).default('5242880'), // 5MB
  ENABLE_VERIFICATION: z.string().transform(Boolean).default('true'),
  ENABLE_ANALYTICS: z.string().transform(Boolean).default('true'),

  // Rate Limiting
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error.errors);
    process.exit(1);
  }
};

// Create config object
const env = parseEnv();

// Stripe price ID map
const stripePrices = JSON.parse(env.STRIPE_PRICE_ID_MAP);

// Export validated config
export const config = {
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',

  server: {
    port: env.PORT,
    frontendUrl: env.FRONTEND_URL,
  },

  db: {
    url: env.DATABASE_URL,
  },

  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
  },

  aws: {
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    s3Bucket: env.AWS_S3_BUCKET,
  },

  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    prices: stripePrices,
  },

  redis: {
    url: env.REDIS_URL,
  },

  email: {
    systemAddress: env.SYSTEM_EMAIL_ADDRESS,
    supportAddress: env.SUPPORT_EMAIL_ADDRESS,
  },

  social: {
    linkedin: env.LINKEDIN_URL,
    twitter: env.TWITTER_URL,
    facebook: env.FACEBOOK_URL,
  },

  company: {
    name: env.COMPANY_NAME,
    address: env.COMPANY_ADDRESS,
  },

  features: {
    maxFileSize: env.MAX_FILE_SIZE,
    maxProfileImageSize: env.MAX_PROFILE_IMAGE_SIZE,
    enableVerification: env.ENABLE_VERIFICATION,
    enableAnalytics: env.ENABLE_ANALYTICS,
  },

  rateLimit: {
    window: env.RATE_LIMIT_WINDOW,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
} as const;

// Type for the config object
export type Config = typeof config;

// Helper functions
export const isProduction = () => config.isProduction;
export const isDevelopment = () => config.isDevelopment;
export const isTest = () => config.isTest;