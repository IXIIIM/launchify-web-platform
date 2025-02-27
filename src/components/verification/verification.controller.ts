// src/server/controllers/verification.controller.ts

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

export const getVerificationRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, type } = req.query;
    const isAdmin = req.user.role === 'admin';

    const filters = {
      ...(status && { status: status as string }),
      ...(type && { type: type as string }),
      ...(!isAdmin && { userId: req.user.id })
    };

    const requests = await verificationService.getVerificationRequests(filters);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching verifications:', error);
    res.status(500).json({ message: 'Error fetching verification requests' });
  }
};

export const approveVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await verificationService.approveVerification(requestId, req.user.id, notes);
    res.json({ message: 'Verification approved' });
  } catch (error) {
    console.error('Error approving verification:', error);
    res.status(500).json({ message: 'Error approving verification' });
  }
};

export const rejectVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await verificationService.rejectVerification(requestId, req.user.id, reason);
    res.json({ message: 'Verification rejected' });
  } catch (error) {
    console.error('Error rejecting verification:', error);
    res.status(500).json({ message: 'Error rejecting verification' });
  }
};

export const assignReviewer = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { reviewerId } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const request = await verificationService.assignReviewer(requestId, reviewerId);
    res.json(request);
  } catch (error) {
    console.error('Error assigning reviewer:', error);
    res.status(500).json({ message: 'Error assigning reviewer' });
  }
};

export const addReviewNote = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { note } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const request = await verificationService.addReviewNote(
      requestId,
      note,
      req.user.id
    );
    res.json(request);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ message: 'Error adding review note' });
  }
};

// src/server/routes/verification.ts

import express from 'express';
import multer from 'multer';
import {
  submitVerificationRequest,
  getVerificationRequests,
  approveVerification,
  rejectVerification,
  assignReviewer,
  addReviewNote
} from '../controllers/verification.controller';
import { authenticateToken, isAdmin } from '../middleware/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  }
});

const router = express.Router();

router.post(
  '/request',
  authenticateToken,
  upload.array('documents'),
  submitVerificationRequest
);

router.get(
  '/requests',
  authenticateToken,
  getVerificationRequests
);

router.post(
  '/requests/:requestId/approve',
  authenticateToken,
  isAdmin,
  approveVerification
);

router.post(
  '/requests/:requestId/reject',
  authenticateToken,
  isAdmin,
  rejectVerification
);

router.post(
  '/requests/:requestId/assign',
  authenticateToken,
  isAdmin,
  assignReviewer
);

router.post(
  '/requests/:requestId/notes',
  authenticateToken,
  isAdmin,
  addReviewNote
);

export default router;