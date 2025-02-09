// src/server/document/DocumentVersioning.ts
import { PrismaClient } from '@prisma/client';
import { S3 } from 'aws-sdk';
import { DocumentEncryption } from '../security/DocumentEncryption';

const prisma = new PrismaClient();
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

export class DocumentVersioning {
  // Create a new version
  static async createVersion(
    documentId: string,
    userId: string,
    file: Buffer,
    changes?: string
  ): Promise<string> {
    try {
      // Get latest version number
      const latestVersion = await prisma.documentVersion.findFirst({
        where: { documentId },
        orderBy: { versionNumber: 'desc' }
      });

      const versionNumber = (latestVersion?.versionNumber || 0) + 1;

      // Encrypt the new version
      const { encryptedData, metadata } = await DocumentEncryption.encryptDocument(
        file,
        userId,
        `${documentId}_v${versionNumber}`
      );

      // Store encrypted version in S3
      const s3Key = `documents/${documentId}/v${versionNumber}`;
      await s3.putObject({
        Bucket: process.env.AWS_S3_DOCUMENTS_BUCKET!,
        Key: s3Key,
        Body: encryptedData,
        Metadata: {
          userId,
          versionNumber: String(versionNumber),
          ...metadata
        }
      }).promise();

      // Create version record
      const version = await prisma.documentVersion.create({
        data: {
          documentId,
          versionNumber,
          createdBy: userId,
          s3Key,
          changes,
          size: file.length,
          checksum: this.calculateChecksum(file)
        }
      });

      // Update document's current version
      await prisma.document.update({
        where: { id: documentId },
        data: { currentVersionId: version.id }
      });

      return version.id;
    } catch (error) {
      console.error('Error creating document version:', error);
      throw new Error('Failed to create document version');
    }
  }

  // Rest of the implementation...
}