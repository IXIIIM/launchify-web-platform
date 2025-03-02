// src/server/routes/chat.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { chatFileRoutes } from '../controllers/chat-file.controller';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: 'Too many file uploads, please try again later'
});

// Rate limiting for file downloads
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many file downloads, please try again later'
});

// File handling routes
router.post(
  '/:matchId/files',
  authenticateToken,
  uploadLimiter,
  ...chatFileRoutes.uploadFiles
);

router.get(
  '/files/:fileId',
  authenticateToken,
  downloadLimiter,
  chatFileRoutes.downloadFile
);

router.delete(
  '/files/:fileId',
  authenticateToken,
  chatFileRoutes.deleteFile
);

router.get(
  '/:matchId/files',
  authenticateToken,
  chatFileRoutes.listFiles
);

export default router;