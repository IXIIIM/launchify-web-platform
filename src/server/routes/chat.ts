// src/server/routes/chat.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { chatFileRoutes } from '../controllers/chat-file.controller';
import { rateLimit } from 'express-rate-limit';
import { ChatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const chatController = new ChatController();

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

// Chat room routes
router.post(
  '/rooms',
  authMiddleware,
  (req, res) => chatController.createChatRoom(req, res)
);

router.get(
  '/rooms',
  authMiddleware,
  (req, res) => chatController.getChatRooms(req, res)
);

router.get(
  '/rooms/:id',
  authMiddleware,
  (req, res) => chatController.getChatRoom(req, res)
);

// Message routes
router.post(
  '/rooms/:id/messages',
  authMiddleware,
  (req, res) => chatController.sendMessage(req, res)
);

router.get(
  '/rooms/:id/messages',
  authMiddleware,
  (req, res) => chatController.getMessages(req, res)
);

router.post(
  '/rooms/:id/read',
  authMiddleware,
  (req, res) => chatController.markMessagesAsRead(req, res)
);

// Participant routes
router.post(
  '/rooms/:id/participants',
  authMiddleware,
  (req, res) => chatController.addParticipants(req, res)
);

router.delete(
  '/rooms/:id/participants/:userId',
  authMiddleware,
  (req, res) => chatController.removeParticipant(req, res)
);

router.delete(
  '/rooms/:id/leave',
  authMiddleware,
  (req, res) => chatController.leaveChatRoom(req, res)
);

// Match chat room
router.post(
  '/match/:matchId',
  authMiddleware,
  (req, res) => chatController.createMatchChatRoom(req, res)
);

export default router;