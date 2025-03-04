// src/server/controllers/chat-file.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ChatFileService } from '../services/files/ChatFileService';
import multer from 'multer';
import { WebSocketServer } from '../services/websocket';

const prisma = new PrismaClient();
const fileService = new ChatFileService();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 5 // Max 5 files per request
  }
});

interface AuthRequest extends Request {
  user: any;
}

export const uploadFiles = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const files = req.files as Express.Multer.File[];

    // Verify user has access to this match
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { userId: req.user.id },
          { matchedWithId: req.user.id }
        ]
      }
    });

    if (!match) {
      return res.status(403).json({ message: 'Unauthorized access to match' });
    }

    // Upload each file
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        // Scan file for viruses/malware
        const isClean = await fileService.scanFile(file.buffer);
        if (!isClean) {
          throw new Error(`File ${file.originalname} failed security scan`);
        }

        const fileId = await fileService.uploadFile(
          file.buffer,
          {
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadedBy: req.user.id
          },
          matchId
        );

        return {
          id: fileId,
          name: file.originalname,
          type: file.mimetype,
          size: file.size
        };
      })
    );

    // Create message with files
    const message = await prisma.message.create({
      data: {
        matchId,
        senderId: req.user.id,
        receiverId: match.userId === req.user.id ? match.matchedWithId : match.userId,
        content: '📎 Shared files',
        hasFiles: true,
        files: {
          connect: uploadedFiles.map(file => ({ id: file.id }))
        }
      }
    });

    // Send real-time notification
    const wsServer: WebSocketServer = req.app.get('wsServer');
    await wsServer.sendNotification(message.receiverId, {
      type: 'NEW_MESSAGE',
      content: 'New files shared',
      messageData: {
        ...message,
        files: uploadedFiles
      }
    });

    res.json(uploadedFiles);
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ message: 'Error uploading files' });
  }
};

export const downloadFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const url = await fileService.getFileUrl(fileId, req.user.id);
    res.json({ url });
  } catch (error) {
    console.error('Error getting file URL:', error);
    res.status(500).json({ message: 'Error accessing file' });
  }
};

export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    await fileService.deleteFile(fileId, req.user.id);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Error deleting file' });
  }
};

export const listFiles = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;
    const files = await fileService.listFiles(matchId, req.user.id);
    res.json(files);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ message: 'Error listing files' });
  }
};

// Middleware to handle file uploads
export const handleFileUpload = upload.array('files', 5);

// Export route handlers
export const chatFileRoutes = {
  uploadFiles: [handleFileUpload, uploadFiles],
  downloadFile,
  deleteFile,
  listFiles
};