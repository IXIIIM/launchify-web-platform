import { Request, Response } from 'express';
import { VerificationService } from '../services/verification/VerificationService';
import { EmailService } from '../services/email/EmailService';
import { WebSocketServer } from '../services/websocket';
import { AuthRequest } from '../middleware/auth';
import { VerificationLevel } from '../../types/user';
import { uploadMiddleware } from '../middleware/upload';

const emailService = new EmailService();
const verificationService = new VerificationService(emailService, WebSocketServer.getInstance());

export class VerificationController {
  private verificationService: VerificationService;

  constructor(verificationService: VerificationService) {
    this.verificationService = verificationService;
  }

  /**
   * Submit a verification request
   * @route POST /api/verification
   */
  async submitVerification(req: AuthRequest, res: Response) {
    try {
      const { level, additionalInfo, isCertified } = req.body;
      const userId = req.user.id;
      
      if (!level || !Object.values(VerificationLevel).includes(level)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid verification level' 
        });
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No documents provided' 
        });
      }

      const request = await this.verificationService.submitVerification(
        userId,
        level as VerificationLevel,
        req.files,
        additionalInfo,
        isCertified === 'true' || isCertified === true
      );

      return res.status(201).json({
        success: true,
        message: 'Verification request submitted successfully',
        data: request
      });
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to submit verification request'
      });
    }
  }

  /**
   * Get verification status for the current user
   * @route GET /api/verification/status
   */
  async getVerificationStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user.id;
      const status = await this.verificationService.getUserVerificationStatus(userId);

      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (error: any) {
      console.error('Error getting verification status:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get verification status'
      });
    }
  }

  /**
   * Get all verification requests (admin only)
   * @route GET /api/admin/verification
   */
  async getAllVerificationRequests(req: AuthRequest, res: Response) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access'
        });
      }

      const { status, type, userId } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;
      if (type) filters.type = type;
      if (userId) filters.userId = userId;

      const requests = await this.verificationService.getVerificationRequests(filters);

      return res.status(200).json({
        success: true,
        data: requests
      });
    } catch (error: any) {
      console.error('Error getting verification requests:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get verification requests'
      });
    }
  }

  /**
   * Get a specific verification request (admin only)
   * @route GET /api/admin/verification/:id
   */
  async getVerificationRequest(req: AuthRequest, res: Response) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access'
        });
      }

      const { id } = req.params;
      const request = await this.verificationService.getVerificationRequest(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Verification request not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: request
      });
    } catch (error: any) {
      console.error('Error getting verification request:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get verification request'
      });
    }
  }

  /**
   * Approve a verification request (admin only)
   * @route POST /api/admin/verification/:id/approve
   */
  async approveVerification(req: AuthRequest, res: Response) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access'
        });
      }

      const { id } = req.params;
      const { notes } = req.body;
      const reviewerId = req.user.id;

      const result = await this.verificationService.approveVerification(id, reviewerId, notes);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error approving verification:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to approve verification request'
      });
    }
  }

  /**
   * Reject a verification request (admin only)
   * @route POST /api/admin/verification/:id/reject
   */
  async rejectVerification(req: AuthRequest, res: Response) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access'
        });
      }

      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const reviewerId = req.user.id;
      const result = await this.verificationService.rejectVerification(id, reviewerId, reason);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error rejecting verification:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to reject verification request'
      });
    }
  }

  /**
   * Request additional information for a verification request (admin only)
   * @route POST /api/admin/verification/:id/request-info
   */
  async requestAdditionalInfo(req: AuthRequest, res: Response) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access'
        });
      }

      const { id } = req.params;
      const { questions } = req.body;
      
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Questions are required'
        });
      }

      const reviewerId = req.user.id;
      const result = await this.verificationService.requestAdditionalInfo(id, reviewerId, questions);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error requesting additional info:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to request additional information'
      });
    }
  }

  /**
   * Get upload middleware for verification documents
   */
  getUploadMiddleware() {
    return uploadMiddleware.array('documents', 10); // Allow up to 10 documents
  }
}