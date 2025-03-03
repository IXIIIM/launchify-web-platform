import express from 'express';
import { DocumentController } from '../controllers/document.controller';
import { DocumentService } from '../services/documents/DocumentService';
import { StorageService } from '../services/storage/StorageService';
import { EmailService } from '../services/email/EmailService';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Initialize services
const storageService = new StorageService();
const emailService = new EmailService();
const documentService = new DocumentService(storageService, emailService);

// Initialize controller
const documentController = new DocumentController(documentService);

// Document routes
router.post(
  '/',
  authMiddleware,
  (req, res) => documentController.generateDocument(req, res)
);

router.get(
  '/',
  authMiddleware,
  (req, res) => documentController.getUserDocuments(req, res)
);

router.get(
  '/:id',
  authMiddleware,
  (req, res) => documentController.getDocument(req, res)
);

router.post(
  '/:id/sign',
  authMiddleware,
  (req, res) => documentController.signDocument(req, res)
);

router.post(
  '/:id/cancel',
  authMiddleware,
  (req, res) => documentController.cancelDocument(req, res)
);

// Template routes
router.get(
  '/templates',
  authMiddleware,
  (req, res) => documentController.getTemplates(req, res)
);

router.post(
  '/templates',
  authMiddleware,
  (req, res) => documentController.createTemplate(req, res)
);

router.put(
  '/templates/:id',
  authMiddleware,
  (req, res) => documentController.updateTemplate(req, res)
);

// NDA generation for matches
router.post(
  '/nda/match/:matchId',
  authMiddleware,
  (req, res) => documentController.generateNDAForMatch(req, res)
);

export default router; 