// Full implementation of EmailService
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import handlebars from 'handlebars';
import { PrismaClient } from '@prisma/client';

// ... [Previous implementation] ...