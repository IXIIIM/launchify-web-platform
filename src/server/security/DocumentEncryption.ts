// src/server/security/DocumentEncryption.ts
import crypto from 'crypto';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';
import { S3 } from 'aws-sdk';

const scrypt = promisify(crypto.scrypt);
const randomBytes = promisify(crypto.randomBytes);

const prisma = new PrismaClient();
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

export class DocumentEncryption {
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 12;
  private static readonly AUTH_TAG_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;

  // Generate a document-specific encryption key
  private static async generateEncryptionKey(
    masterKey: Buffer,
    salt: Buffer
  ): Promise<Buffer> {
    return scrypt(masterKey, salt, this.KEY_LENGTH) as Promise<Buffer>;
  }

  // Encrypt a document
  static async encryptDocument(
    document: Buffer,
    userId: string,
    documentId: string
  ): Promise<{
    encryptedData: Buffer;
    metadata: {
      iv: string;
      authTag: string;
      salt: string;
      algorithm: string;
    };
  }> {
    try {
      // Generate random values
      const iv = await randomBytes(this.IV_LENGTH);
      const salt = await randomBytes(this.SALT_LENGTH);
      
      // Get user's master key from secure storage
      const masterKey = await this.getUserMasterKey(userId);
      
      // Generate document-specific encryption key
      const encryptionKey = await this.generateEncryptionKey(masterKey, salt);

      // Create cipher
      const cipher = crypto.createCipheriv(
        this.ENCRYPTION_ALGORITHM,
        encryptionKey,
        iv,
        { authTagLength: this.AUTH_TAG_LENGTH }
      );

      // Encrypt document
      const encryptedData = Buffer.concat([
        cipher.update(document),
        cipher.final()
      ]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Store encryption metadata
      await this.storeEncryptionMetadata(documentId, {
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        salt: salt.toString('hex'),
        algorithm: this.ENCRYPTION_ALGORITHM
      });

      return {
        encryptedData,
        metadata: {
          iv: iv.toString('hex'),
          authTag: authTag.toString('hex'),
          salt: salt.toString('hex'),
          algorithm: this.ENCRYPTION_ALGORITHM
        }
      };
    } catch (error) {
      console.error('Document encryption error:', error);
      throw new Error('Failed to encrypt document');
    }
  }

  // Decrypt a document
  static async decryptDocument(
    encryptedData: Buffer,
    userId: string,
    documentId: string
  ): Promise<Buffer> {
    try {
      // Get encryption metadata
      const metadata = await this.getEncryptionMetadata(documentId);
      
      // Get user's master key
      const masterKey = await this.getUserMasterKey(userId);
      
      // Generate document-specific encryption key
      const salt = Buffer.from(metadata.salt, 'hex');
      const encryptionKey = await this.generateEncryptionKey(masterKey, salt);

      // Create decipher
      const decipher = crypto.createDecipheriv(
        metadata.algorithm,
        encryptionKey,
        Buffer.from(metadata.iv, 'hex'),
        { authTagLength: this.AUTH_TAG_LENGTH }
      );

      // Set auth tag
      decipher.setAuthTag(Buffer.from(metadata.authTag, 'hex'));

      // Decrypt document
      const decryptedData = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
      ]);

      return decryptedData;
    } catch (error) {
      console.error('Document decryption error:', error);
      throw new Error('Failed to decrypt document');
    }
  }

  // Store encryption metadata in database
  private static async storeEncryptionMetadata(
    documentId: string,
    metadata: {
      iv: string;
      authTag: string;
      salt: string;
      algorithm: string;
    }
  ): Promise<void> {
    await prisma.documentEncryption.create({
      data: {
        documentId,
        iv: metadata.iv,
        authTag: metadata.authTag,
        salt: metadata.salt,
        algorithm: metadata.algorithm
      }
    });
  }

  // Get encryption metadata from database
  private static async getEncryptionMetadata(
    documentId: string
  ): Promise<{
    iv: string;
    authTag: string;
    salt: string;
    algorithm: string;
  }> {
    const metadata = await prisma.documentEncryption.findUnique({
      where: { documentId }
    });

    if (!metadata) {
      throw new Error('Encryption metadata not found');
    }

    return metadata;
  }

  // Get user's master encryption key from secure storage
  private static async getUserMasterKey(userId: string): Promise<Buffer> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { securitySettings: true }
    });

    if (!user?.securitySettings?.masterKeyId) {
      // Generate new master key if not exists
      const masterKey = await randomBytes(this.KEY_LENGTH);
      const masterKeyId = await this.storeMasterKey(masterKey);

      await prisma.securitySettings.update({
        where: { userId },
        data: { masterKeyId }
      });

      return masterKey;
    }

    return this.retrieveMasterKey(user.securitySettings.masterKeyId);
  }

  // Store master key in AWS KMS
  private static async storeMasterKey(masterKey: Buffer): Promise<string> {
    const params = {
      KeyId: process.env.AWS_KMS_KEY_ID,
      Plaintext: masterKey
    };

    const { CiphertextBlob } = await new AWS.KMS().encrypt(params).promise();
    
    // Store encrypted master key in S3
    const keyId = crypto.randomUUID();
    await s3.putObject({
      Bucket: process.env.AWS_S3_KEYS_BUCKET!,
      Key: `master-keys/${keyId}`,
      Body: CiphertextBlob,
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: process.env.AWS_KMS_KEY_ID
    }).promise();

    return keyId;
  }

  // Retrieve master key from AWS KMS
  private static async retrieveMasterKey(keyId: string): Promise<Buffer> {
    // Get encrypted master key from S3
    const { Body } = await s3.getObject({
      Bucket: process.env.AWS_S3_KEYS_BUCKET!,
      Key: `master-keys/${keyId}`
    }).promise();

    // Decrypt master key using KMS
    const { Plaintext } = await new AWS.KMS().decrypt({
      CiphertextBlob: Body as Buffer,
      KeyId: process.env.AWS_KMS_KEY_ID
    }).promise();

    return Buffer.from(Plaintext as Buffer);
  }

  // Clean up encryption metadata when document is deleted
  static async cleanupEncryption(documentId: string): Promise<void> {
    await prisma.documentEncryption.delete({
      where: { documentId }
    });
  }
}

// Document upload middleware with encryption
export const encryptedUploadMiddleware = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const originalUpload = req.file?.buffer;
  if (!originalUpload) return next();

  try {
    const documentId = crypto.randomUUID();
    const { encryptedData, metadata } = await DocumentEncryption.encryptDocument(
      originalUpload,
      req.user.id,
      documentId
    );

    // Store encrypted file in S3
    await s3.putObject({
      Bucket: process.env.AWS_S3_DOCUMENTS_BUCKET!,
      Key: `documents/${documentId}`,
      Body: encryptedData,
      Metadata: {
        userId: req.user.id,
        ...metadata
      }
    }).promise();

    // Add document ID to request for further processing
    req.documentId = documentId;
    next();
  } catch (error) {
    console.error('Document upload encryption error:', error);
    res.status(500).json({ error: 'Failed to process document upload' });
  }
};

// Document download middleware with decryption
export const decryptedDownloadMiddleware = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const { documentId } = req.params;

  try {
    // Get encrypted document from S3
    const { Body, Metadata } = await s3.getObject({
      Bucket: process.env.AWS_S3_DOCUMENTS_BUCKET!,
      Key: `documents/${documentId}`
    }).promise();

    // Verify user has access to document
    const hasAccess = await verifyDocumentAccess(req.user.id, documentId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Decrypt document
    const decryptedData = await DocumentEncryption.decryptDocument(
      Body as Buffer,
      req.user.id,
      documentId
    );

    // Set decrypted data for download
    req.decryptedFile = decryptedData;
    next();
  } catch (error) {
    console.error('Document download decryption error:', error);
    res.status(500).json({ error: 'Failed to process document download' });
  }
};

// Helper function to verify document access
async function verifyDocumentAccess(
  userId: string,
  documentId: string
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