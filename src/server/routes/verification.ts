import express from 'express';
import { VerificationController } from '../controllers/verification.controller';
import { VerificationService } from '../services/verification/VerificationService';
import { StorageService } from '../services/storage/StorageService';
import { EmailService } from '../services/email/EmailService';
import { SubscriptionService } from '../services/subscription/SubscriptionService';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Initialize services
const storageService = new StorageService();
const emailService = new EmailService();
const subscriptionService = new SubscriptionService();
const verificationService = new VerificationService(
  storageService,
  emailService,
  subscriptionService
);

// Initialize controller
const verificationController = new VerificationController(verificationService);

// User verification routes
router.post(
  '/',
  authMiddleware,
  verificationController.getUploadMiddleware(),
  (req, res) => verificationController.submitVerification(req, res)
);

router.get(
  '/status',
  authMiddleware,
  (req, res) => verificationController.getVerificationStatus(req, res)
);

// Admin verification routes
router.get(
  '/admin',
  authMiddleware,
  (req, res) => verificationController.getAllVerificationRequests(req, res)
);

router.get(
  '/admin/:id',
  authMiddleware,
  (req, res) => verificationController.getVerificationRequest(req, res)
);

router.post(
  '/admin/:id/approve',
  authMiddleware,
  (req, res) => verificationController.approveVerification(req, res)
);

router.post(
  '/admin/:id/reject',
  authMiddleware,
  (req, res) => verificationController.rejectVerification(req, res)
);

router.post(
  '/admin/:id/request-info',
  authMiddleware,
  (req, res) => verificationController.requestAdditionalInfo(req, res)
);

export default router;