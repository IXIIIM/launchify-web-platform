import { PrismaClient } from '@prisma/client';
import { SNS } from 'aws-sdk';

interface AccessLogEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  success: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}

export class AccessLogService {
  // Rest of the file content...