import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import handlebars from 'handlebars';
import { PrismaClient } from '@prisma/client';
import * as emailTemplates from './templates';

const prisma = new PrismaClient();

interface EmailOptions {
  to: string;
  template: keyof typeof emailTemplates;
  data: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export class EmailService {
  private ses: SESv2Client;
  private templates: Map<string, HandlebarsTemplateDelegate>;

  constructor() {
    this.ses = new SESv2Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
    this.templates = new Map();
    this.loadTemplates();
  }

  private loadTemplates() {
    Object.entries(emailTemplates).forEach(([name, template]) => {
      this.templates.set(name, handlebars.compile(template));
    });
  }

  async sendEmail(options: EmailOptions) {
    try {
      const template = this.templates.get(options.template);
      if (!template) {
        throw new Error(`Template ${options.template} not found`);
      }

      const html = template(options.data);

      const command = new SendEmailCommand({
        FromEmailAddress: process.env.SYSTEM_EMAIL_ADDRESS,
        Destination: {
          ToAddresses: [options.to]
        },
        Content: {
          Simple: {
            Subject: {
              Data: this.getSubjectForTemplate(options.template)
            },
            Body: {
              Html: {
                Data: html
              }
            }
          }
        }
      });

      const result = await this.ses.send(command);

      // Log email send
      await prisma.emailLog.create({
        data: {
          to: options.to,
          template: options.template,
          messageId: result.MessageId!,
          content: html,
          metadata: options.data,
          status: 'sent'
        }
      });

      return result;
    } catch (error) {
      console.error('Error sending email:', error);

      // Log failed attempt
      await prisma.emailLog.create({
        data: {
          to: options.to,
          template: options.template,
          content: '',
          metadata: options.data,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      throw error;
    }
  }

  private getSubjectForTemplate(template: string): string {
    const subjects = {
      'subscription-renewal': 'Your Launchify Subscription is Due for Renewal',
      'payment-failure': 'Action Required: Payment Failed for Your Launchify Subscription',
      'trial-ending': 'Your Launchify Trial is Ending Soon',
      'subscription-canceled': 'Your Launchify Subscription Has Been Canceled',
      'match-notification': 'You Have a New Match on Launchify!',
      'welcome': 'Welcome to Launchify!',
      'verification-approved': 'Your Launchify Verification Has Been Approved',
      'verification-rejected': 'Update on Your Launchify Verification Request',
      'reset-password': 'Reset Your Launchify Password',
      'verify-email': 'Verify Your Launchify Email Address'
    };

    return subjects[template as keyof typeof subjects] || 'Launchify Notification';
  }
}