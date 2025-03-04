import { Request, Response } from 'express';
import { DocumentService, DocumentType } from '../services/documents/DocumentService';
import { AuthRequest } from '../middleware/auth';

export class DocumentController {
  private documentService: DocumentService;

  constructor(documentService: DocumentService) {
    this.documentService = documentService;
  }

  /**
   * Generate a document from a template
   * @route POST /api/documents
   */
  async generateDocument(req: AuthRequest, res: Response) {
    try {
      const { templateId, data, recipientIds, matchId } = req.body;
      const userId = req.user.id;

      if (!templateId) {
        return res.status(400).json({
          success: false,
          message: 'Template ID is required'
        });
      }

      if (!data || typeof data !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Document data is required'
        });
      }

      if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one recipient is required'
        });
      }

      const document = await this.documentService.generateDocument(
        templateId,
        data,
        userId,
        recipientIds,
        matchId
      );

      return res.status(201).json({
        success: true,
        message: 'Document generated successfully',
        data: document
      });
    } catch (error: any) {
      console.error('Error generating document:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate document'
      });
    }
  }

  /**
   * Get a document by ID
   * @route GET /api/documents/:id
   */
  async getDocument(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const document = await this.documentService.getDocument(id, userId);

      return res.status(200).json({
        success: true,
        data: document
      });
    } catch (error: any) {
      console.error('Error getting document:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get document'
      });
    }
  }

  /**
   * Get all documents for the current user
   * @route GET /api/documents
   */
  async getUserDocuments(req: AuthRequest, res: Response) {
    try {
      const userId = req.user.id;
      const { status, type, matchId } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (type) filters.type = type;
      if (matchId) filters.matchId = matchId;

      const documents = await this.documentService.getUserDocuments(userId, filters);

      return res.status(200).json({
        success: true,
        data: documents
      });
    } catch (error: any) {
      console.error('Error getting user documents:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user documents'
      });
    }
  }

  /**
   * Sign a document
   * @route POST /api/documents/:id/sign
   */
  async signDocument(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { signatureData } = req.body;
      const userId = req.user.id;

      if (!signatureData) {
        return res.status(400).json({
          success: false,
          message: 'Signature data is required'
        });
      }

      const result = await this.documentService.signDocument(id, userId, signatureData);

      return res.status(200).json({
        success: true,
        message: 'Document signed successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Error signing document:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to sign document'
      });
    }
  }

  /**
   * Cancel a document
   * @route POST /api/documents/:id/cancel
   */
  async cancelDocument(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Cancellation reason is required'
        });
      }

      const result = await this.documentService.cancelDocument(id, userId, reason);

      return res.status(200).json({
        success: true,
        message: 'Document cancelled successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Error cancelling document:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to cancel document'
      });
    }
  }

  /**
   * Get document templates
   * @route GET /api/documents/templates
   */
  async getTemplates(req: AuthRequest, res: Response) {
    try {
      const { type } = req.query;
      
      const templates = await this.documentService.getTemplates(
        type ? type as DocumentType : undefined
      );

      return res.status(200).json({
        success: true,
        data: templates
      });
    } catch (error: any) {
      console.error('Error getting templates:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get templates'
      });
    }
  }

  /**
   * Create a custom template
   * @route POST /api/documents/templates
   */
  async createTemplate(req: AuthRequest, res: Response) {
    try {
      const { name, type, content, variables } = req.body;
      const userId = req.user.id;

      if (!name || !type || !content || !variables) {
        return res.status(400).json({
          success: false,
          message: 'Name, type, content, and variables are required'
        });
      }

      if (!Object.values(DocumentType).includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document type'
        });
      }

      if (!Array.isArray(variables)) {
        return res.status(400).json({
          success: false,
          message: 'Variables must be an array'
        });
      }

      const template = await this.documentService.createTemplate(
        name,
        type as DocumentType,
        content,
        variables,
        userId
      );

      return res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template
      });
    } catch (error: any) {
      console.error('Error creating template:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create template'
      });
    }
  }

  /**
   * Update a template
   * @route PUT /api/documents/templates/:id
   */
  async updateTemplate(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, content, variables, isActive } = req.body;
      const userId = req.user.id;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (content !== undefined) updates.content = content;
      if (variables !== undefined) updates.variables = variables;
      if (isActive !== undefined) updates.isActive = isActive;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No updates provided'
        });
      }

      const template = await this.documentService.updateTemplate(id, updates, userId);

      return res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: template
      });
    } catch (error: any) {
      console.error('Error updating template:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update template'
      });
    }
  }

  /**
   * Generate an NDA for a match
   * @route POST /api/documents/nda/match/:matchId
   */
  async generateNDAForMatch(req: AuthRequest, res: Response) {
    try {
      const { matchId } = req.params;
      const userId = req.user.id;

      const document = await this.documentService.generateNDAForMatch(matchId, userId);

      return res.status(201).json({
        success: true,
        message: 'NDA generated successfully',
        data: document
      });
    } catch (error: any) {
      console.error('Error generating NDA for match:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate NDA'
      });
    }
  }
} 