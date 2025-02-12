import express from 'express';
import multer from 'multer';
import {
  submitVerification,
  processVerification,
  getVerificationQueue,
  getVerificationStatus,
  getAvailableVerificationLevels,
  getVerificationStats,
  withdrawVerification,
  updateVerificationDocuments,
  requestAdditionalInfo
} from '../controllers/verification.controller';
import { authenticateToken } from '../middleware/auth';
import { checkFeatureAccess } from '../middleware/usageLimit';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  },
  fileFilter: (req, file, cb) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type'));
      return;
    }
    cb(null, true);
  }
});

// Public routes
router.get('/levels', authenticateToken, getAvailableVerificationLevels);

// User routes
router.post(
  '/submit',
  authenticateToken,
  upload.array('documents', 5),
  submitVerification
);

router.get(
  '/status',
  authenticateToken,
  getVerificationStatus
);

router.post(
  '/:requestId/withdraw',
  authenticateToken,
  withdrawVerification
);

router.put(
  '/:requestId/documents',
  authenticateToken,
  upload.array('documents', 5),
  updateVerificationDocuments
);

// Admin routes
router.post(
  '/:requestId/process',
  authenticateToken,
  checkFeatureAccess('canProcessVerifications'),
  processVerification
);

router.get(
  '/queue',
  authenticateToken,
  checkFeatureAccess('canViewVerificationQueue'),
  getVerificationQueue
);

router.get(
  '/stats',
  authenticateToken,
  checkFeatureAccess('canViewVerificationStats'),
  getVerificationStats
);

router.post(
  '/:requestId/request-info',
  authenticateToken,
  checkFeatureAccess('canProcessVerifications'),
  requestAdditionalInfo
);

// Error handling middleware
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Maximum is 5 files per request'
      });
    }
  }

  console.error('Verification route error:', error);
  res.status(500).json({
    message: 'An error occurred while processing the request'
  });
});

export default router;