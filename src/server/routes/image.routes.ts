import express from 'express';
import {
  uploadImage,
  getImage,
  deleteImage,
  updateImageMetadata,
  listUserImages
} from '../controllers/image.controller';
import { authenticateToken } from '../middleware/auth';
import { checkFeatureAccess } from '../middleware/usageLimit';

const router = express.Router();

// Protected routes - require authentication
router.post(
  '/upload',
  authenticateToken,
  checkFeatureAccess('canUploadImages'),
  uploadImage
);

router.get(
  '/:id',
  authenticateToken,
  getImage
);

router.delete(
  '/:id',
  authenticateToken,
  deleteImage
);

router.patch(
  '/:id/metadata',
  authenticateToken,
  updateImageMetadata
);

router.get(
  '/',
  authenticateToken,
  listUserImages
);

export default router;