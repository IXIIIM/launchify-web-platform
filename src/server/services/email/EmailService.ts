// Full implementation of EmailService
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path: string;
    contentType?: string;
  }>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private templatesDir: string;
  private fromEmail: string;

  constructor() {
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || 'user@example.com',
        pass: process.env.EMAIL_PASSWORD || 'password'
      }
    });

    // Set templates directory
    this.templatesDir = path.join(__dirname, '../../../../templates/emails');
    
    // Set from email address
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@launchify.com';

    // Register handlebars helpers
    this.registerHandlebarsHelpers();
  }

  /**
   * Register custom handlebars helpers for email templates
   */
  private registerHandlebarsHelpers() {
    handlebars.registerHelper('formatDate', function(date: Date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });

    handlebars.registerHelper('formatCurrency', function(amount: number) {
      if (amount === undefined || amount === null) return '';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    });
  }

  /**
   * Send an email using a template
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const { to, subject, template, data = {}, attachments = [] } = options;

      // Get template content
      const templatePath = path.join(this.templatesDir, `${template}.hbs`);
      
      // Check if template exists
      if (!fs.existsSync(templatePath)) {
        console.error(`Email template not found: ${template}`);
        throw new Error(`Email template not found: ${template}`);
      }

      // Read template file
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      
      // Compile template
      const compiledTemplate = handlebars.compile(templateSource);
      
      // Render template with data
      const html = compiledTemplate({
        ...data,
        appUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
      });

      // Send email
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject,
        html,
        attachments
      });

      console.log(`Email sent: ${info.messageId}`);
      
      // Log email in database
      await this.logEmailSent(to, subject, template);
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Log email sent in database
   */
  private async logEmailSent(to: string, subject: string, template: string) {
    try {
      await prisma.emailLog.create({
        data: {
          recipient: to,
          subject,
          template,
          sentAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  /**
   * Send a welcome email to a new user
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Launchify!',
      template: 'welcome',
      data: {
        name,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
      }
    });
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      data: {
        resetUrl,
        expiryHours: 24 // Token validity in hours
      }
    });
  }

  /**
   * Send a verification email
   */
  async sendVerificationEmail(email: string, verificationToken: string): Promise<boolean> {
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      data: {
        verifyUrl
      }
    });
  }

  /**
   * Send a notification email
   */
  async sendNotificationEmail(
    email: string, 
    subject: string, 
    message: string, 
    actionUrl?: string, 
    actionText?: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject,
      template: 'notification',
      data: {
        message,
        actionUrl,
        actionText,
        showAction: !!actionUrl
      }
    });
  }

  /**
   * Send a document signing request email
   */
  async sendDocumentSigningRequestEmail(
    email: string,
    documentName: string,
    signingUrl: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Document Requires Your Signature: ${documentName}`,
      template: 'document-signature',
      data: {
        documentName,
        signingUrl
      }
    });
  }

  /**
   * Send a match notification email
   */
  async sendMatchNotificationEmail(
    email: string,
    matchName: string,
    matchType: string,
    matchProfileUrl: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `New Match on Launchify: ${matchName}`,
      template: 'match-notification',
      data: {
        matchName,
        matchType,
        matchProfileUrl
      }
    });
  }

  /**
   * Send an escrow funded notification email
   */
  async sendEscrowFundedEmail(
    email: string,
    amount: number,
    projectName: string,
    escrowUrl: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Escrow Account Funded for ${projectName}`,
      template: 'escrow-funded',
      data: {
        amount,
        projectName,
        escrowUrl
      }
    });
  }

  /**
   * Send a milestone completed notification email
   */
  async sendMilestoneCompletedEmail(
    email: string,
    milestoneName: string,
    projectName: string,
    amount: number,
    milestoneUrl: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Milestone Completed: ${milestoneName}`,
      template: 'milestone-completed',
      data: {
        milestoneName,
        projectName,
        amount,
        milestoneUrl
      }
    });
  }

  /**
   * Send a verification status update email
   */
  async sendVerificationStatusEmail(
    email: string,
    status: 'approved' | 'rejected' | 'info_requested',
    verificationLevel: string,
    message?: string,
    verificationUrl?: string
  ): Promise<boolean> {
    let subject = '';
    let template = 'verification-status';
    
    switch (status) {
      case 'approved':
        subject = `Verification Approved: ${verificationLevel}`;
        break;
      case 'rejected':
        subject = `Verification Rejected: ${verificationLevel}`;
        break;
      case 'info_requested':
        subject = `Additional Information Needed: ${verificationLevel} Verification`;
        break;
    }
    
    return this.sendEmail({
      to: email,
      subject,
      template,
      data: {
        status,
        verificationLevel,
        message: message || '',
        verificationUrl: verificationUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verification`,
        showVerificationUrl: !!verificationUrl
      }
    });
  }
}