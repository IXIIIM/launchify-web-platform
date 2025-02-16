import { PrismaClient } from '@prisma/client';
import { EmailService } from '../email/EmailService';
import { WebSocketServer } from '../websocket';
import { S3 } from 'aws-sdk';

const prisma = new PrismaClient();
const s3 = new S3();

export class VerificationService {
  private emailService: EmailService;
  private wsServer: WebSocketServer;

  constructor(emailService: EmailService, wsServer: WebSocketServer) {
    this.emailService = emailService;
    this.wsServer = wsServer;
  }

  async submitVerificationRequest(
    userId: string,
    type: string,
    documents: Express.Multer.File[],
    metadata: any
  ): Promise<any> {
    try {
      // Upload documents to S3
      const documentUrls = await Promise.all(
        documents.map(doc => this.uploadDocument(userId, type, doc))
      );

      // Create verification request
      const request = await prisma.verificationRequest.create({
        data: {
          userId,
          type,
          status: 'pending',
          documents: documentUrls,
          metadata,
          submittedAt: new Date()
        }
      });

      // Notify admin team
      await this.notifyAdmins(request);

      // Update user record
      await prisma.user.update({
        where: { id: userId },
        data: {
          pendingVerification: type
        }
      });

      return request;
    } catch (error) {
      console.error('Error submitting verification request:', error);
      throw error;
    }
  }

  async processVerificationRequest(
    requestId: string,
    decision: 'approved' | 'rejected',
    notes?: string
  ): Promise<void> {
    try {
      const request = await prisma.verificationRequest.findUnique({
        where: { id: requestId },
        include: {
          user: true
        }
      });

      if (!request) {
        throw new Error('Verification request not found');
      }

      // Update request status
      await prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: decision,
          processedAt: new Date(),
          notes
        }
      });

      // Update user verification level if approved
      if (decision === 'approved') {
        await prisma.user.update({
          where: { id: request.userId },
          data: {
            verificationLevel: request.type,
            pendingVerification: null
          }
        });
      }

      // Send notification to user
      await this.notifyUser(request.userId, decision, notes);

      // Log the verification decision
      await prisma.securityLog.create({
        data: {
          userId: request.userId,
          eventType: 'VERIFICATION_DECISION',
          status: decision,
          details: {
            requestId,
            verificationType: request.type,
            notes
          }
        }
      });
    } catch (error) {
      console.error('Error processing verification request:', error);
      throw error;
    }
  }

  async getVerificationQueue(filters?: {
    status?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any[]> {
    try {
      const requests = await prisma.verificationRequest.findMany({
        where: {
          status: filters?.status,
          type: filters?.type,
          submittedAt: {
            gte: filters?.startDate,
            lte: filters?.endDate
          }
        },
        include: {
          user: {
            select: {
              email: true,
              userType: true,
              entrepreneurProfile: true,
              funderProfile: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        }
      });

      // Generate signed URLs for documents
      return await Promise.all(
        requests.map(async request => ({
          ...request,
          documents: await Promise.all(
            request.documents.map(doc => this.getSignedDocumentUrl(doc))
          )
        }))
      );
    } catch (error) {
      console.error('Error fetching verification queue:', error);
      throw error;
    }
  }

  async getVerificationStatus(userId: string): Promise<any> {
    try {
      const [currentLevel, pendingRequest] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            verificationLevel: true,
            pendingVerification: true
          }
        }),
        prisma.verificationRequest.findFirst({
          where: {
            userId,
            status: 'pending'
          },
          orderBy: {
            submittedAt: 'desc'
          }
        })
      ]);

      return {
        currentLevel: currentLevel?.verificationLevel,
        pendingLevel: currentLevel?.pendingVerification,
        pendingRequest: pendingRequest ? {
          type: pendingRequest.type,
          submittedAt: pendingRequest.submittedAt,
          documents: pendingRequest.documents
        } : null
      };
    } catch (error) {
      console.error('Error fetching verification status:', error);
      throw error;
    }
  }

  private async uploadDocument(
    userId: string,
    type: string,
    file: Express.Multer.File
  ): Promise<string> {
    const key = `verification/${userId}/${type}/${Date.now()}-${file.originalname}`;

    await s3.putObject({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        userId,
        verificationType: type
      }
    }).promise();

    return key;
  }

  private async getSignedDocumentUrl(key: string): Promise<string> {
    return s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Expires: 3600 // URL expires in 1 hour
    });
  }

  private async notifyAdmins(request: any): Promise<void> {
    // Send email to admin team
    await this.emailService.sendEmail({
      to: process.env.ADMIN_EMAIL!,
      template: 'verification-request',
      data: {
        requestId: request.id,
        type: request.type,
        userId: request.userId
      }
    });

    // Send in-app notification to admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'admin'
      }
    });

    for (const admin of adminUsers) {
      await this.wsServer.sendNotification(admin.id, {
        type: 'VERIFICATION_REQUEST',
        content: `New ${request.type} verification request received`,
        metadata: {
          requestId: request.id,
          type: request.type,
          userId: request.userId
        }
      });
    }
  }

  private async notifyUser(
    userId: string,
    decision: string,
    notes?: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return;

    // Send email notification
    await this.emailService.sendEmail({
      to: user.email,
      template: decision === 'approved' ? 'verification-approved' : 'verification-rejected',
      data: {
        type: user.pendingVerification,
        notes
      }
    });

    // Send in-app notification
    await this.wsServer.sendNotification(userId, {
      type: 'VERIFICATION_DECISION',
      content: `Your verification request has been ${decision}`,
      metadata: {
        decision,
        notes
      }
    });
  }
}