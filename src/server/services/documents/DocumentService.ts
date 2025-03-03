import { PrismaClient } from '@prisma/client';
import { StorageService } from '../storage/StorageService';
import { EmailService } from '../email/EmailService';
import * as PDFLib from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export enum DocumentType {
  NDA = 'nda',
  INVESTMENT_AGREEMENT = 'investment_agreement',
  PARTNERSHIP_AGREEMENT = 'partnership_agreement',
  TERM_SHEET = 'term_sheet',
  ESCROW_AGREEMENT = 'escrow_agreement',
  CUSTOM = 'custom'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURE = 'pending_signature',
  SIGNED = 'signed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  content: string;
  variables: string[];
  version: number;
  isDefault: boolean;
}

interface SignaturePosition {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class DocumentService {
  private storageService: StorageService;
  private emailService: EmailService;
  private templates: Map<string, DocumentTemplate> = new Map();
  private templateDir: string = path.join(__dirname, '../../../../templates/documents');

  constructor(storageService: StorageService, emailService: EmailService) {
    this.storageService = storageService;
    this.emailService = emailService;
    this.loadTemplates();
  }

  /**
   * Load document templates from the filesystem
   */
  private async loadTemplates() {
    try {
      // Ensure template directory exists
      if (!fs.existsSync(this.templateDir)) {
        fs.mkdirSync(this.templateDir, { recursive: true });
      }

      // Load default templates from database
      const dbTemplates = await prisma.documentTemplate.findMany({
        where: {
          isActive: true
        }
      });

      // Add templates to the map
      for (const template of dbTemplates) {
        this.templates.set(template.id, {
          id: template.id,
          name: template.name,
          type: template.type as DocumentType,
          content: template.content,
          variables: template.variables as string[],
          version: template.version,
          isDefault: template.isDefault
        });
      }

      // If no templates exist, create default ones
      if (this.templates.size === 0) {
        await this.createDefaultTemplates();
      }
    } catch (error) {
      console.error('Error loading document templates:', error);
    }
  }

  /**
   * Create default document templates
   */
  private async createDefaultTemplates() {
    const defaultTemplates = [
      {
        name: 'Standard NDA',
        type: DocumentType.NDA,
        content: fs.readFileSync(path.join(this.templateDir, 'nda_template.html'), 'utf8'),
        variables: ['party1Name', 'party1Address', 'party2Name', 'party2Address', 'effectiveDate', 'terminationDate', 'governingLaw', 'confidentialInfoDescription'],
        isDefault: true
      },
      {
        name: 'Investment Agreement',
        type: DocumentType.INVESTMENT_AGREEMENT,
        content: fs.readFileSync(path.join(this.templateDir, 'investment_agreement_template.html'), 'utf8'),
        variables: ['investorName', 'investorAddress', 'companyName', 'companyAddress', 'investmentAmount', 'equityPercentage', 'closingDate', 'governingLaw'],
        isDefault: true
      },
      {
        name: 'Escrow Agreement',
        type: DocumentType.ESCROW_AGREEMENT,
        content: fs.readFileSync(path.join(this.templateDir, 'escrow_agreement_template.html'), 'utf8'),
        variables: ['buyerName', 'buyerAddress', 'sellerName', 'sellerAddress', 'escrowAgentName', 'escrowAgentAddress', 'escrowAmount', 'releaseConditions', 'effectiveDate', 'governingLaw'],
        isDefault: true
      }
    ];

    for (const template of defaultTemplates) {
      const newTemplate = await prisma.documentTemplate.create({
        data: {
          name: template.name,
          type: template.type,
          content: template.content,
          variables: template.variables,
          version: 1,
          isDefault: template.isDefault,
          isActive: true
        }
      });

      this.templates.set(newTemplate.id, {
        ...template,
        id: newTemplate.id,
        version: 1
      });
    }
  }

  /**
   * Generate a document from a template
   */
  async generateDocument(
    templateId: string,
    data: Record<string, any>,
    createdById: string,
    recipientIds: string[],
    matchId?: string
  ) {
    try {
      // Get template
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }

      // Validate required variables
      for (const variable of template.variables) {
        if (!data[variable]) {
          throw new Error(`Missing required variable: ${variable}`);
        }
      }

      // Compile template with Handlebars
      const compiledTemplate = handlebars.compile(template.content);
      const html = compiledTemplate(data);

      // Generate PDF
      const pdfBytes = await this.htmlToPdf(html);

      // Generate a unique document ID
      const documentId = uuidv4();

      // Upload to storage
      const documentUrl = await this.storageService.uploadDocument(
        pdfBytes,
        `documents/${documentId}.pdf`
      );

      // Create document record in database
      const document = await prisma.document.create({
        data: {
          id: documentId,
          name: `${template.name} - ${new Date().toISOString().split('T')[0]}`,
          type: template.type,
          status: DocumentStatus.DRAFT,
          url: documentUrl,
          templateId: template.id,
          templateVersion: template.version,
          templateData: data,
          createdById,
          matchId,
          recipients: {
            create: recipientIds.map(userId => ({
              userId,
              status: DocumentStatus.PENDING_SIGNATURE
            }))
          }
        },
        include: {
          recipients: true
        }
      });

      // Send notifications to recipients
      for (const recipient of document.recipients) {
        await this.notifyRecipient(document.id, recipient.userId);
      }

      return document;
    } catch (error) {
      console.error('Error generating document:', error);
      throw error;
    }
  }

  /**
   * Convert HTML to PDF
   */
  private async htmlToPdf(html: string): Promise<Buffer> {
    // This is a placeholder for actual HTML to PDF conversion
    // In a real implementation, you would use a library like puppeteer or a service like DocRaptor
    
    // For now, we'll create a simple PDF using pdf-lib
    const pdfDoc = await PDFLib.PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    
    // Add some text to the PDF
    const { width, height } = page.getSize();
    page.drawText('Document content would be rendered here', {
      x: 50,
      y: height - 50,
      size: 12
    });
    
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Notify a recipient about a document that requires their signature
   */
  private async notifyRecipient(documentId: string, userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Create notification
      await prisma.notification.create({
        data: {
          userId,
          type: 'document_signature_required',
          content: 'You have a document that requires your signature',
          metadata: {
            documentId
          }
        }
      });

      // Send email
      await this.emailService.sendEmail({
        to: user.email,
        template: 'document-signature-required',
        data: {
          name: user.name || 'User',
          documentId,
          signUrl: `${process.env.FRONTEND_URL}/documents/${documentId}/sign`
        }
      });
    } catch (error) {
      console.error('Error notifying recipient:', error);
    }
  }

  /**
   * Get a document by ID
   */
  async getDocument(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        recipients: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Check if user has access to this document
    const hasAccess = document.createdById === userId || 
      document.recipients.some(r => r.userId === userId);

    if (!hasAccess) {
      throw new Error('Unauthorized access to document');
    }

    return document;
  }

  /**
   * Get all documents for a user
   */
  async getUserDocuments(userId: string, filters: any = {}) {
    const where: any = {
      OR: [
        { createdById: userId },
        { recipients: { some: { userId } } }
      ]
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.matchId) {
      where.matchId = filters.matchId;
    }

    return prisma.document.findMany({
      where,
      include: {
        recipients: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Sign a document
   */
  async signDocument(documentId: string, userId: string, signatureData: string) {
    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        recipients: true
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Check if user is a recipient
    const recipient = document.recipients.find(r => r.userId === userId);
    if (!recipient) {
      throw new Error('User is not a recipient of this document');
    }

    // Check if document is pending signature
    if (document.status !== DocumentStatus.PENDING_SIGNATURE) {
      throw new Error(`Document cannot be signed in its current status: ${document.status}`);
    }

    // Check if recipient has already signed
    if (recipient.status === DocumentStatus.SIGNED) {
      throw new Error('User has already signed this document');
    }

    // Update recipient status
    await prisma.documentRecipient.update({
      where: {
        id: recipient.id
      },
      data: {
        status: DocumentStatus.SIGNED,
        signedAt: new Date(),
        signatureData
      }
    });

    // Check if all recipients have signed
    const allSigned = await this.checkAllRecipientsSigned(documentId);
    if (allSigned) {
      // Update document status
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.SIGNED,
          completedAt: new Date()
        }
      });

      // Notify document creator
      await this.notifyDocumentCompleted(documentId);
    }

    return { success: true };
  }

  /**
   * Check if all recipients have signed a document
   */
  private async checkAllRecipientsSigned(documentId: string): Promise<boolean> {
    const recipients = await prisma.documentRecipient.findMany({
      where: { documentId }
    });

    return recipients.every(r => r.status === DocumentStatus.SIGNED);
  }

  /**
   * Notify document creator that all recipients have signed
   */
  private async notifyDocumentCompleted(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        createdBy: true
      }
    });

    if (!document || !document.createdBy) return;

    // Create notification
    await prisma.notification.create({
      data: {
        userId: document.createdById,
        type: 'document_completed',
        content: `All parties have signed the document: ${document.name}`,
        metadata: {
          documentId
        }
      }
    });

    // Send email
    await this.emailService.sendEmail({
      to: document.createdBy.email,
      template: 'document-completed',
      data: {
        name: document.createdBy.name || 'User',
        documentName: document.name,
        documentUrl: `${process.env.FRONTEND_URL}/documents/${documentId}`
      }
    });
  }

  /**
   * Cancel a document
   */
  async cancelDocument(documentId: string, userId: string, reason: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Only the creator can cancel a document
    if (document.createdById !== userId) {
      throw new Error('Only the document creator can cancel it');
    }

    // Check if document can be cancelled
    if (document.status === DocumentStatus.SIGNED || document.status === DocumentStatus.EXPIRED) {
      throw new Error(`Document cannot be cancelled in its current status: ${document.status}`);
    }

    // Update document status
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.CANCELLED,
        notes: reason
      }
    });

    // Notify recipients
    await this.notifyDocumentCancelled(documentId, reason);

    return { success: true };
  }

  /**
   * Notify recipients that a document has been cancelled
   */
  private async notifyDocumentCancelled(documentId: string, reason: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        recipients: {
          include: {
            user: true
          }
        }
      }
    });

    if (!document) return;

    for (const recipient of document.recipients) {
      if (!recipient.user) continue;

      // Create notification
      await prisma.notification.create({
        data: {
          userId: recipient.userId,
          type: 'document_cancelled',
          content: `Document "${document.name}" has been cancelled`,
          metadata: {
            documentId,
            reason
          }
        }
      });

      // Send email
      await this.emailService.sendEmail({
        to: recipient.user.email,
        template: 'document-cancelled',
        data: {
          name: recipient.user.name || 'User',
          documentName: document.name,
          reason
        }
      });
    }
  }

  /**
   * Get document templates
   */
  async getTemplates(type?: DocumentType) {
    const where: any = {
      isActive: true
    };

    if (type) {
      where.type = type;
    }

    return prisma.documentTemplate.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });
  }

  /**
   * Create a custom template
   */
  async createTemplate(
    name: string,
    type: DocumentType,
    content: string,
    variables: string[],
    createdById: string
  ) {
    const template = await prisma.documentTemplate.create({
      data: {
        name,
        type,
        content,
        variables,
        version: 1,
        isDefault: false,
        isActive: true,
        createdById
      }
    });

    // Add to in-memory cache
    this.templates.set(template.id, {
      id: template.id,
      name: template.name,
      type: template.type as DocumentType,
      content: template.content,
      variables: template.variables as string[],
      version: template.version,
      isDefault: template.isDefault
    });

    return template;
  }

  /**
   * Update a template
   */
  async updateTemplate(
    templateId: string,
    updates: {
      name?: string;
      content?: string;
      variables?: string[];
      isActive?: boolean;
    },
    userId: string
  ) {
    const template = await prisma.documentTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Only the creator or an admin can update a template
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (template.createdById !== userId && user?.role !== 'admin') {
      throw new Error('Unauthorized to update this template');
    }

    // If content or variables are changing, increment version
    const shouldIncrementVersion = updates.content || updates.variables;
    
    const updatedTemplate = await prisma.documentTemplate.update({
      where: { id: templateId },
      data: {
        ...updates,
        version: shouldIncrementVersion ? { increment: 1 } : undefined
      }
    });

    // Update in-memory cache
    if (updatedTemplate.isActive) {
      this.templates.set(updatedTemplate.id, {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        type: updatedTemplate.type as DocumentType,
        content: updatedTemplate.content,
        variables: updatedTemplate.variables as string[],
        version: updatedTemplate.version,
        isDefault: updatedTemplate.isDefault
      });
    } else {
      this.templates.delete(updatedTemplate.id);
    }

    return updatedTemplate;
  }

  /**
   * Generate an NDA for a match
   */
  async generateNDAForMatch(matchId: string, createdById: string) {
    try {
      // Get match details
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          entrepreneur: {
            include: {
              user: true,
              company: true
            }
          },
          funder: {
            include: {
              user: true,
              company: true
            }
          }
        }
      });

      if (!match) {
        throw new Error('Match not found');
      }

      // Get default NDA template
      const ndaTemplate = await prisma.documentTemplate.findFirst({
        where: {
          type: DocumentType.NDA,
          isDefault: true,
          isActive: true
        }
      });

      if (!ndaTemplate) {
        throw new Error('Default NDA template not found');
      }

      // Prepare data for NDA
      const entrepreneur = match.entrepreneur;
      const funder = match.funder;
      
      const data = {
        party1Name: entrepreneur.company?.name || entrepreneur.user.name,
        party1Address: entrepreneur.company?.address || 'Address not provided',
        party2Name: funder.company?.name || funder.user.name,
        party2Address: funder.company?.address || 'Address not provided',
        effectiveDate: new Date().toISOString().split('T')[0],
        terminationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
        governingLaw: 'State of Delaware',
        confidentialInfoDescription: 'All business, technical, financial, and other information disclosed between the parties.'
      };

      // Generate the document
      const document = await this.generateDocument(
        ndaTemplate.id,
        data,
        createdById,
        [entrepreneur.userId, funder.userId],
        matchId
      );

      // Update match with document reference
      await prisma.match.update({
        where: { id: matchId },
        data: {
          ndaDocumentId: document.id
        }
      });

      return document;
    } catch (error) {
      console.error('Error generating NDA for match:', error);
      throw error;
    }
  }
} 