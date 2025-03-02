// src/server/security/KeyRotation.ts
import { PrismaClient } from '@prisma/client';
import { S3, KMS } from 'aws-sdk';
import { DocumentEncryption } from './DocumentEncryption';
import { createHash } from 'crypto';

const prisma = new PrismaClient();
const s3 = new S3();
const kms = new KMS();

export class KeyRotation {
  // Schedule for automatic key rotation
  private static readonly ROTATION_INTERVALS = {
    MASTER_KEY: 90, // days
    DOCUMENT_KEY: 30 // days
  };

  // Rotate master key for a user
  static async rotateMasterKey(userId: string): Promise<void> {
    try {
      // Generate new master key
      const newMasterKey = await this.generateNewMasterKey();
      const oldMasterKeyId = await this.getCurrentMasterKeyId(userId);

      // Store new master key
      const newMasterKeyId = await this.storeMasterKey(newMasterKey);

      // Update user's security settings
      await prisma.securitySettings.update({
        where: { userId },
        data: { 
          masterKeyId: newMasterKeyId,
          lastKeyRotation: new Date()
        }
      });

      // Re-encrypt all document keys
      await this.reEncryptDocumentKeys(userId, oldMasterKeyId, newMasterKey);

      // Schedule old key deletion
      await this.scheduleKeyDeletion(oldMasterKeyId);

      // Log rotation event
      await this.logKeyRotation(userId, 'MASTER_KEY', oldMasterKeyId, newMasterKeyId);
    } catch (error) {
      console.error('Master key rotation error:', error);
      throw new Error('Failed to rotate master key');
    }
  }

  // Rotate document key
  static async rotateDocumentKey(
    documentId: string,
    userId: string
  ): Promise<void> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: { encryption: true }
      });

      if (!document) throw new Error('Document not found');

      // Generate new document key
      const { encryptionKey: newKey, keyId: newKeyId } = 
        await this.generateNewDocumentKey();

      // Get current document content
      const currentContent = await this.getDocumentContent(
        documentId,
        userId
      );

      // Re-encrypt document with new key
      const { encryptedData, metadata } = 
        await DocumentEncryption.encryptDocument(
          currentContent,
          userId,
          documentId,
          newKey
        );

      // Update document in S3
      await s3.putObject({
        Bucket: process.env.AWS_S3_DOCUMENTS_BUCKET!,
        Key: `documents/${documentId}`,
        Body: encryptedData,
        Metadata: {
          keyId: newKeyId,
          ...metadata
        }
      }).promise();

      // Update encryption metadata
      await prisma.documentEncryption.update({
        where: { documentId },
        data: {
          keyId: newKeyId,
          lastRotation: new Date(),
          ...metadata
        }
      });

      // Schedule old key deletion
      if (document.encryption?.keyId) {
        await this.scheduleKeyDeletion(document.encryption.keyId);
      }

      // Log rotation event
      await this.logKeyRotation(
        userId,
        'DOCUMENT_KEY',
        document.encryption?.keyId,
        newKeyId,
        documentId
      );
    } catch (error) {
      console.error('Document key rotation error:', error);
      throw new Error('Failed to rotate document key');
    }
  }

  // Check for keys that need rotation
  static async checkRotationNeeds(): Promise<void> {
    try {
      // Check master keys
      const usersNeedingRotation = await prisma.securitySettings.findMany({
        where: {
          lastKeyRotation: {
            lt: new Date(Date.now() - this.ROTATION_INTERVALS.MASTER_KEY * 24 * 60 * 60 * 1000)
          }
        }
      });

      for (const settings of usersNeedingRotation) {
        await this.rotateMasterKey(settings.userId);
      }

      // Check document keys
      const documentsNeedingRotation = await prisma.documentEncryption.findMany({
        where: {
          lastRotation: {
            lt: new Date(Date.now() - this.ROTATION_INTERVALS.DOCUMENT_KEY * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          document: true
        }
      });

      for (const doc of documentsNeedingRotation) {
        await this.rotateDocumentKey(
          doc.documentId,
          doc.document.ownerId
        );
      }
    } catch (error) {
      console.error('Rotation check error:', error);
      throw new Error('Failed to check key rotation needs');
    }
  }

  // Generate new master key
  private static async generateNewMasterKey(): Promise<Buffer> {
    const { Plaintext } = await kms.generateDataKey({
      KeyId: process.env.AWS_KMS_KEY_ID!,
      KeySpec: 'AES_256'
    }).promise();

    return Buffer.from(Plaintext!);
  }

  // Generate new document key
  private static async generateNewDocumentKey(): Promise<{
    encryptionKey: Buffer;
    keyId: string;
  }> {
    const { Plaintext, CiphertextBlob } = await kms.generateDataKey({
      KeyId: process.env.AWS_KMS_KEY_ID!,
      KeySpec: 'AES_256'
    }).promise();

    const keyId = createHash('sha256')
      .update(CiphertextBlob!)
      .digest('hex');

    return {
      encryptionKey: Buffer.from(Plaintext!),
      keyId
    };
  }

  // Get current master key ID
  private static async getCurrentMasterKeyId(
    userId: string
  ): Promise<string | null> {
    const settings = await prisma.securitySettings.findUnique({
      where: { userId }
    });

    return settings?.masterKeyId || null;
  }

  // Store master key in KMS/S3
  private static async storeMasterKey(
    masterKey: Buffer
  ): Promise<string> {
    const keyId = createHash('sha256')
      .update(masterKey)
      .digest('hex');

    await s3.putObject({
      Bucket: process.env.AWS_S3_KEYS_BUCKET!,
      Key: `master-keys/${keyId}`,
      Body: masterKey,
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: process.env.AWS_KMS_KEY_ID
    }).promise();

    return keyId;
  }

  // Re-encrypt document keys with new master key
  private static async reEncryptDocumentKeys(
    userId: string,
    oldMasterKeyId: string | null,
    newMasterKey: Buffer
  ): Promise<void> {
    const documents = await prisma.document.findMany({
      where: { ownerId: userId },
      include: { encryption: true }
    });

    for (const doc of documents) {
      if (!doc.encryption) continue;

      // Get document content
      const content = await this.getDocumentContent(doc.id, userId);

      // Re-encrypt with new master key
      await this.rotateDocumentKey(doc.id, userId);
    }
  }

  // Schedule key deletion (after grace period)
  private static async scheduleKeyDeletion(
    keyId: string,
    gracePeriod: number = 7 // days
  ): Promise<void> {
    await prisma.keyDeletionSchedule.create({
      data: {
        keyId,
        scheduledDeletion: new Date(
          Date.now() + gracePeriod * 24 * 60 * 60 * 1000
        )
      }
    });
  }

  // Log key rotation event
  private static async logKeyRotation(
    userId: string,
    keyType: 'MASTER_KEY' | 'DOCUMENT_KEY',
    oldKeyId: string | null,
    newKeyId: string,
    documentId?: string
  ): Promise<void> {
    await prisma.securityLog.create({
      data: {
        userId,
        eventType: 'KEY_ROTATION',
        status: 'SUCCESS',
        details: {
          keyType,
          oldKeyId,
          newKeyId,
          documentId
        }
      }
    });
  }

  // Get document content
  private static async getDocumentContent(
    documentId: string,
    userId: string
  ): Promise<Buffer> {
    const { Body } = await s3.getObject({
      Bucket: process.env.AWS_S3_DOCUMENTS_BUCKET!,
      Key: `documents/${documentId}`
    }).promise();

    return DocumentEncryption.decryptDocument(
      Body as Buffer,
      userId,
      documentId
    );
  }
}

// Schedule key rotation checks
export const scheduleKeyRotationChecks = (): void => {
  setInterval(
    async () => {
      try {
        await KeyRotation.checkRotationNeeds();
      } catch (error) {
        console.error('Scheduled key rotation check failed:', error);
      }
    },
    24 * 60 * 60 * 1000 // Check daily
  );
};