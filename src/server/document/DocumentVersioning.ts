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

  // Get version history
  static async getVersionHistory(
    documentId: string,
    userId: string
  ): Promise<Array<{
    id: string;
    versionNumber: number;
    createdAt: Date;
    createdBy: string;
    changes?: string;
    size: number;
  }>> {
    // Verify access
    const hasAccess = await this.verifyAccess(documentId, userId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    return versions.map(version => ({
      id: version.id,
      versionNumber: version.versionNumber,
      createdAt: version.createdAt,
      createdBy: version.creator.email,
      changes: version.changes,
      size: version.size
    }));
  }

  // Restore specific version
  static async restoreVersion(
    documentId: string,
    versionId: string,
    userId: string
  ): Promise<void> {
    // Verify access
    const hasAccess = await this.verifyAccess(documentId, userId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    // Get version details
    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: { document: true }
    });

    if (!version) {
      throw new Error('Version not found');
    }

    // Get encrypted data from S3
    const { Body } = await s3.getObject({
      Bucket: process.env.AWS_S3_DOCUMENTS_BUCKET!,
      Key: version.s3Key
    }).promise();

    // Decrypt the version
    const decryptedData = await DocumentEncryption.decryptDocument(
      Body as Buffer,
      userId,
      `${documentId}_v${version.versionNumber}`
    );

    // Create new version with restored content
    await this.createVersion(
      documentId,
      userId,
      decryptedData,
      `Restored from version ${version.versionNumber}`
    );
  }

  // Compare versions
  static async compareVersions(
    documentId: string,
    version1Id: string,
    version2Id: string,
    userId: string
  ): Promise<{
    changes: Array<{
      type: 'added' | 'removed' | 'modified';
      content: string;
      lineNumber: number;
    }>;
    stats: {
      additions: number;
      deletions: number;
      modifications: number;
    };
  }> {
    // Verify access
    const hasAccess = await this.verifyAccess(documentId, userId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    // Get both versions
    const [version1, version2] = await Promise.all([
      this.getVersionContent(version1Id, userId),
      this.getVersionContent(version2Id, userId)
    ]);

    // Perform diff
    return this.calculateDiff(version1, version2);
  }

  // Get version content
  private static async getVersionContent(
    versionId: string,
    userId: string
  ): Promise<Buffer> {
    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId }
    });

    if (!version) {
      throw new Error('Version not found');
    }

    // Get encrypted data from S3
    const { Body } = await s3.getObject({
      Bucket: process.env.AWS_S3_DOCUMENTS_BUCKET!,
      Key: version.s3Key
    }).promise();

    // Decrypt the version
    return DocumentEncryption.decryptDocument(
      Body as Buffer,
      userId,
      `${version.documentId}_v${version.versionNumber}`
    );
  }

  // Calculate checksum
  private static calculateChecksum(data: Buffer): string {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  // Verify access
  private static async verifyAccess(
    documentId: string,
    userId: string
  ): Promise<boolean> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        owner: true,
        sharedWith: true
      }
    });

    if (!document) return false;

    return (
      document.owner.id === userId ||
      document.sharedWith.some(user => user.id === userId)
    );
  }

  // Calculate diff between versions
  private static calculateDiff(
    version1: Buffer,
    version2: Buffer
  ): {
    changes: Array<{
      type: 'added' | 'removed' | 'modified';
      content: string;
      lineNumber: number;
    }>;
    stats: {
      additions: number;
      deletions: number;
      modifications: number;
    };
  } {
    const diff = require('diff');
    const v1Lines = version1.toString().split('\n');
    const v2Lines = version2.toString().split('\n');

    const changes = [];
    let additions = 0;
    let deletions = 0;
    let modifications = 0;

    const diffResult = diff.diffLines(version1.toString(), version2.toString());

    let lineNumber = 1;
    for (const part of diffResult) {
      if (part.added) {
        changes.push({
          type: 'added',
          content: part.value,
          lineNumber
        });
        additions++;
        lineNumber += part.count || 0;
      } else if (part.removed) {
        changes.push({
          type: 'removed',
          content: part.value,
          lineNumber
        });
        deletions++;
      } else {
        if (part.value !== v1Lines[lineNumber - 1]) {
          changes.push({
            type: 'modified',
            content: part.value,
            lineNumber
          });
          modifications++;
        }
        lineNumber += part.count || 0;
      }
    }

    return {
      changes,
      stats: {
        additions,
        deletions,
        modifications
      }
    };
  }

  // Clean up old versions
  static async cleanupOldVersions(
    documentId: string,
    retentionDays: number = 90
  ): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldVersions = await prisma.documentVersion.findMany({
      where: {
        documentId,
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    for (const version of oldVersions) {
      // Delete from S3
      await s3.deleteObject({
        Bucket: process.env.AWS_S3_DOCUMENTS_BUCKET!,
        Key: version.s3Key
      }).promise();

      // Delete encryption metadata
      await DocumentEncryption.cleanupEncryption(
        `${documentId}_v${version.versionNumber}`
      );

      // Delete version record
      await prisma.documentVersion.delete({
        where: { id: version.id }
      });
    }
  }
}