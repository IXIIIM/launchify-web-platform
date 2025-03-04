// src/server/services/files/ChatFileService.ts
import { PrismaClient } from '@prisma/client';
import AWS from 'aws-sdk';
import crypto from 'crypto';
import path from 'path';

const prisma = new PrismaClient();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

interface FileMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
}

export class ChatFileService {
  private readonly bucket: string;
  private readonly allowedTypes: string[];
  private readonly maxFileSize: number;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET!;
    // Define allowed file types
    this.allowedTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      // Text
      'text/plain',
      'text/csv',
      // Archives
      'application/zip',
      'application/x-rar-compressed'
    ];
    // 50MB max file size
    this.maxFileSize = 50 * 1024 * 1024;
  }

  async uploadFile(
    file: Buffer,
    metadata: FileMetadata,
    matchId: string
  ): Promise<string> {
    // Validate file
    if (!this.allowedTypes.includes(metadata.mimeType)) {
      throw new Error('File type not allowed');
    }

    if (metadata.size > this.maxFileSize) {
      throw new Error('File size exceeds limit');
    }

    // Generate secure filename
    const fileHash = crypto
      .createHash('sha256')
      .update(file)
      .digest('hex')
      .slice(0, 16);
    const extension = path.extname(metadata.originalName);
    const key = `chats/${matchId}/${fileHash}${extension}`;

    // Upload to S3
    try {
      await s3.upload({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: metadata.mimeType,
        Metadata: {
          originalName: metadata.originalName,
          uploadedBy: metadata.uploadedBy
        },
        // Encrypt files at rest
        ServerSideEncryption: 'AES256'
      }).promise();

      // Create file record in database
      const fileRecord = await prisma.chatFile.create({
        data: {
          key,
          originalName: metadata.originalName,
          mimeType: metadata.mimeType,
          size: metadata.size,
          uploadedBy: metadata.uploadedBy,
          matchId
        }
      });

      return fileRecord.id;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getFileUrl(fileId: string, userId: string): Promise<string> {
    // Get file record and verify access
    const file = await prisma.chatFile.findFirst({
      where: { id: fileId },
      include: {
        match: true
      }
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Verify user has access to this match
    if (file.match.userId !== userId && file.match.matchedWithId !== userId) {
      throw new Error('Unauthorized access to file');
    }

    // Generate signed URL for secure access
    try {
      const url = await s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucket,
        Key: file.key,
        Expires: 3600 // URL expires in 1 hour
      });

      // Log file access
      await prisma.fileAccess.create({
        data: {
          fileId: file.id,
          accessedBy: userId,
          accessType: 'download'
        }
      });

      return url;
    } catch (error) {
      console.error('Error generating file URL:', error);
      throw new Error('Failed to generate file access URL');
    }
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    // Get file record and verify ownership
    const file = await prisma.chatFile.findFirst({
      where: { id: fileId },
      include: {
        match: true
      }
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Only allow file deletion by the uploader
    if (file.uploadedBy !== userId) {
      throw new Error('Unauthorized to delete file');
    }

    // Delete from S3
    try {
      await s3.deleteObject({
        Bucket: this.bucket,
        Key: file.key
      }).promise();

      // Delete database record
      await prisma.chatFile.delete({
        where: { id: fileId }
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  async listFiles(matchId: string, userId: string): Promise<any[]> {
    // Verify user has access to this match
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { userId },
          { matchedWithId: userId }
        ]
      }
    });

    if (!match) {
      throw new Error('Match not found or unauthorized access');
    }

    // Get all files for this match
    const files = await prisma.chatFile.findMany({
      where: { matchId },
      orderBy: { createdAt: 'desc' },
      include: {
        fileAccess: {
          where: { accessedBy: userId },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    return files.map(file => ({
      id: file.id,
      name: file.originalName,
      type: file.mimeType,
      size: file.size,
      uploadedBy: file.uploadedBy,
      uploadedAt: file.createdAt,
      lastAccessed: file.fileAccess[0]?.createdAt || null
    }));
  }

  async scanFile(file: Buffer): Promise<boolean> {
    // In a production environment, implement virus scanning
    // For now, we'll do basic validation
    try {
      // Check for common malware signatures
      const malwareSignatures = [
        Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'),
        // Add more signatures as needed
      ];

      for (const signature of malwareSignatures) {
        if (file.includes(signature)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error scanning file:', error);
      return false;
    }
  }
}