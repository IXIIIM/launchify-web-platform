import { Request, Response } from 'express';
import { VerificationService } from '../services/verification';
import { UsageService } from '../services/usage';

const verificationService = new VerificationService();
const usageService = new UsageService();

interface AuthRequest extends Request {
  user: any;
}

export const submitVerificationRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { level, metadata } = req.body;
    const documents = req.files as Express.Multer.File[];

    if (!documents || documents.length === 0) {
      return res.status(400).json({ message: 'No documents provided' });
    }

    const canAccess = await usageService.canAccessVerificationLevel(
      req.user.id,
      level
    );

    if (!canAccess) {
      return res.status(403).json({
        message: 'Your subscription tier does not support this verification level'
      });
    }

    const request = await verificationService.requestVerification(
      req.user.id,
      level,
      documents.map(doc => doc.buffer),
      metadata
    );

    res.json(request);
  } catch (error) {
    console.error('Error submitting verification:', error);
    res.status(500).json({ message: 'Error submitting verification request' });
  }
};

// ... rest of the controller implementations