import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AccessLogService } from '../services/AccessLogService';
import { SNS } from 'aws-sdk';

interface AuthRequest extends Request {
  user: any;
}

export class MatchController {
  // Rest of the file content...