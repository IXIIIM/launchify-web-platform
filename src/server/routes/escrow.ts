import express from 'express';
import { EscrowController } from '../controllers/escrow.controller';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const escrowController = new EscrowController();

// Escrow account routes
router.post(
  '/',
  authMiddleware,
  (req, res) => escrowController.createEscrowAccount(req, res)
);

router.get(
  '/',
  authMiddleware,
  (req, res) => escrowController.getUserEscrowAccounts(req, res)
);

router.get(
  '/:id',
  authMiddleware,
  (req, res) => escrowController.getEscrowAccount(req, res)
);

router.post(
  '/:id/deposit',
  authMiddleware,
  (req, res) => escrowController.fundEscrowAccount(req, res)
);

// Milestone routes
router.post(
  '/:id/milestones',
  authMiddleware,
  (req, res) => escrowController.createMilestone(req, res)
);

router.get(
  '/:id/milestones',
  authMiddleware,
  (req, res) => escrowController.getMilestones(req, res)
);

router.post(
  '/milestones/:id/proof',
  authMiddleware,
  (req, res) => escrowController.submitProofOfWork(req, res)
);

router.post(
  '/milestones/:id/release',
  authMiddleware,
  (req, res) => escrowController.releaseMilestone(req, res)
);

router.post(
  '/milestones/:id/dispute',
  authMiddleware,
  (req, res) => escrowController.disputeMilestone(req, res)
);

export default router; 