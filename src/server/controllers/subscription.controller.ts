import { Request, Response } from 'express';
import { StripeService } from '../services/stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stripeService = new StripeService();

// ... [Rest of the subscription controller implementation] ...