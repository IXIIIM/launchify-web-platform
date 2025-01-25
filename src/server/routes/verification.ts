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

// ... rest of the routes