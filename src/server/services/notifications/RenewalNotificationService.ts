// Full implementation of RenewalNotificationService
import { PrismaClient } from '@prisma/client';
import { addDays, isPast } from 'date-fns';
import { EmailService } from '../email/EmailService';
import { WebSocketServer } from '../websocket';

// ... [Previous implementation] ...