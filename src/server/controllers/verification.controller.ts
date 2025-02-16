import { Request, Response } from 'express';
import { VerificationService } from '../services/verification/VerificationService';
import { EmailService } from '../services/email/EmailService';
import { WebSocketServer } from '../services/websocket';

const emailService = new EmailService();
const verificationService = new VerificationService(emailService, WebSocketServer.getInstance());

interface AuthRequest extends Request {
  user: any;
}

export const submitVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { type, metadata } = req.body;
    const documents = req.files as Express.Multer.File[];

    if (!documents || documents.length === 0) {
      return res.status(400).json({ message: 'No documents provided' });
    }

    // Validate file types and sizes
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const invalidFile = documents.find(
      file => !validTypes.includes(file.mimetype) || file.size > maxSize
    );

    if (invalidFile) {
      return res.status(400).json({
        message: 'Invalid file type or size. Only PDF and images under 10MB are allowed.'
      });
    }

    // Check if user can access this verification level
    const canAccess = await verificationService.canAccessVerificationLevel(
      req.user.id,
      type
    );

    if (!canAccess) {
      return res.status(403).json({
        message: 'Your subscription tier does not support this verification level'
      });
    }

    const request = await verificationService.submitVerificationRequest(
      req.user.id,
      type,
      documents,
      metadata
    );

    res.json({
      message: 'Verification request submitted successfully',
      requestId: request.id
    });
  } catch (error) {
    console.error('Error submitting verification:', error);
    res.status(500).json({ message: 'Error submitting verification request' });
  }
};

export const processVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { decision, notes } = req.body;

    // Check admin permissions
    if (!req.user.permissions?.includes('PROCESS_VERIFICATIONS')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Validate decision
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision' });
    }

    await verificationService.processVerificationRequest(
      requestId,
      decision,
      notes
    );

    res.json({ message: 'Verification request processed successfully' });
  } catch (error) {
    console.error('Error processing verification:', error);
    res.status(500).json({ message: 'Error processing verification request' });
  }
};

export const getVerificationQueue = async (req: AuthRequest, res: Response) => {
  try {
    // Check admin permissions
    if (!req.user.permissions?.includes('VIEW_VERIFICATION_QUEUE')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { status, type, startDate, endDate } = req.query;

    const filters = {
      status: status as string,
      type: type as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const queue = await verificationService.getVerificationQueue(filters);
    res.json(queue);
  } catch (error) {
    console.error('Error fetching verification queue:', error);
    res.status(500).json({ message: 'Error fetching verification queue' });
  }
};

export const getVerificationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const status = await verificationService.getVerificationStatus(req.user.id);
    res.json(status);
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ message: 'Error fetching verification status' });
  }
};

export const getAvailableVerificationLevels = async (req: AuthRequest, res: Response) => {
  try {
    const levels = await verificationService.getAvailableVerificationLevels(req.user.id);
    res.json(levels);
  } catch (error) {
    console.error('Error fetching verification levels:', error);
    res.status(500).json({ message: 'Error fetching verification levels' });
  }
};

export const getVerificationStats = async (req: AuthRequest, res: Response) => {
  try {
    // Check admin permissions
    if (!req.user.permissions?.includes('VIEW_VERIFICATION_STATS')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const stats = await verificationService.getVerificationStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching verification stats:', error);
    res.status(500).json({ message: 'Error fetching verification stats' });
  }
};

export const withdrawVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    await verificationService.withdrawVerificationRequest(req.user.id, requestId);
    res.json({ message: 'Verification request withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing verification:', error);
    res.status(500).json({ message: 'Error withdrawing verification request' });
  }
};

export const updateVerificationDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const documents = req.files as Express.Multer.File[];

    if (!documents || documents.length === 0) {
      return res.status(400).json({ message: 'No documents provided' });
    }

    await verificationService.updateVerificationDocuments(
      req.user.id,
      requestId,
      documents
    );

    res.json({ message: 'Verification documents updated successfully' });
  } catch (error) {
    console.error('Error updating verification documents:', error);
    res.status(500).json({ message: 'Error updating verification documents' });
  }
};

export const requestAdditionalInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { message, requiredDocuments } = req.body;

    // Check admin permissions
    if (!req.user.permissions?.includes('PROCESS_VERIFICATIONS')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    await verificationService.requestAdditionalInfo(
      requestId,
      message,
      requiredDocuments
    );

    res.json({ message: 'Additional information requested successfully' });
  } catch (error) {
    console.error('Error requesting additional info:', error);
    res.status(500).json({ message: 'Error requesting additional information' });
  }
};