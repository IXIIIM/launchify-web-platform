// src/server/controllers/escrow.controller.ts

import { Request, Response } from 'express';
import { EscrowService } from '../services/escrow';
import { DocumentService, DocumentType } from '../services/documents/DocumentService';
import { StorageService } from '../services/storage/StorageService';
import { EmailService } from '../services/email/EmailService';
import { AuthRequest } from '../middleware/auth';

const escrowService = new EscrowService();

interface AuthRequest extends Request {
  user: any;
}

export const createEscrowAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { entrepreneurId, amount, matchId } = req.body;
    const funderId = req.user.id;

    if (!entrepreneurId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Entrepreneur ID and amount are required'
      });
    }

    if (req.user.userType !== 'funder') {
      return res.status(403).json({
        success: false,
        message: 'Only funders can create escrow accounts'
      });
    }

    // Create escrow account
    const escrowAccount = await escrowService.createEscrowAccount(
      entrepreneurId,
      funderId,
      parseFloat(amount)
    );

    // Generate escrow agreement document
    let escrowDocument = null;
    if (matchId) {
      try {
        escrowDocument = await generateEscrowAgreement(
          escrowAccount.id,
          matchId,
          funderId
        );
      } catch (docError) {
        console.error('Error generating escrow agreement:', docError);
        // Continue even if document generation fails
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Escrow account created successfully',
      data: {
        escrowAccount,
        escrowDocument
      }
    });
  } catch (error: any) {
    console.error('Error creating escrow account:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create escrow account'
    });
  }
};

export const depositToEscrow = async (req: AuthRequest, res: Response) => {
  try {
    const { escrowAccountId, paymentMethodId } = req.body;

    const escrowAccount = await escrowService.handleDeposit(
      escrowAccountId,
      paymentMethodId
    );

    res.json(escrowAccount);
  } catch (error) {
    console.error('Error processing deposit:', error);
    res.status(500).json({ message: 'Error processing deposit' });
  }
};

export const createMilestone = async (req: AuthRequest, res: Response) => {
  try {
    const { escrowAccountId, amount, description, dueDate } = req.body;

    const milestone = await escrowService.createMilestone(escrowAccountId, {
      amount,
      description,
      dueDate: new Date(dueDate)
    });

    res.json(milestone);
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ message: 'Error creating milestone' });
  }
};

export const submitMilestone = async (req: AuthRequest, res: Response) => {
  try {
    const { milestoneId, proofOfWork } = req.body;

    const milestone = await escrowService.approveMilestone(
      milestoneId,
      proofOfWork
    );

    res.json(milestone);
  } catch (error) {
    console.error('Error submitting milestone:', error);
    res.status(500).json({ message: 'Error submitting milestone' });
  }
};

export const releaseMilestone = async (req: AuthRequest, res: Response) => {
  try {
    const { milestoneId } = req.body;

    const milestone = await escrowService.releaseMilestone(milestoneId);

    res.json(milestone);
  } catch (error) {
    console.error('Error releasing milestone:', error);
    res.status(500).json({ message: 'Error releasing milestone' });
  }
};

export const disputeMilestone = async (req: AuthRequest, res: Response) => {
  try {
    const { milestoneId, reason } = req.body;

    const milestone = await escrowService.disputeMilestone(milestoneId, reason);

    res.json(milestone);
  } catch (error) {
    console.error('Error disputing milestone:', error);
    res.status(500).json({ message: 'Error disputing milestone' });
  }
};

// src/server/routes/escrow.ts

import express from 'express';
import {
  createEscrowAccount,
  depositToEscrow,
  createMilestone,
  submitMilestone,
  releaseMilestone,
  disputeMilestone
} from '../controllers/escrow.controller';
import { authenticateToken } from '../middleware/auth';
import { checkFeatureAccess } from '../middleware/usageLimit';

const router = express.Router();

router.post(
  '/accounts',
  authenticateToken,
  checkFeatureAccess('canUseEscrow'),
  createEscrowAccount
);

router.post(
  '/deposit',
  authenticateToken,
  checkFeatureAccess('canUseEscrow'),
  depositToEscrow
);

router.post(
  '/milestones',
  authenticateToken,
  checkFeatureAccess('canUseEscrow'),
  createMilestone
);

router.post(
  '/milestones/submit',
  authenticateToken,
  checkFeatureAccess('canUseEscrow'),
  submitMilestone
);

router.post(
  '/milestones/release',
  authenticateToken,
  checkFeatureAccess('canUseEscrow'),
  releaseMilestone
);

router.post(
  '/milestones/dispute',
  authenticateToken,
  checkFeatureAccess('canUseEscrow'),
  disputeMilestone
);

export default router;