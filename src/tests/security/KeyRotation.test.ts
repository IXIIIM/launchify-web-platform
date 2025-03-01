// src/tests/security/KeyRotation.test.ts
import { KeyRotation } from '../../server/security/KeyRotation';
import { DocumentEncryption } from '../../server/security/DocumentEncryption';
import { PrismaClient } from '@prisma/client';
import { S3, KMS } from 'aws-sdk';
import { mockClient } from 'aws-sdk-mock';
import { createHash, randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Mock AWS services
mockClient(S3);
mockClient(KMS);

describe('KeyRotation', () => {
  // Test data
  const testUserId = 'test-user-id';
  const testDocumentId = 'test-document-id';
  const testContent = Buffer.from('Test document content');
  const testMasterKey = randomBytes(32);
  const testDocumentKey = randomBytes(32);

  beforeEach(async () => {
    // Setup test environment
    await prisma.securitySettings.create({
      data: {
        userId: testUserId,
        masterKeyId: 'old-master-key',
        lastKeyRotation: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // 100 days old
      }
    });

    await prisma.document.create({
      data: {
        id: testDocumentId,
        ownerId: testUserId,
        name: 'test.txt',
        mimeType: 'text/plain',
        size: testContent.length,
        encryption: {
          create: {
            keyId: 'old-document-key',
            iv: randomBytes(12).toString('hex'),
            authTag: randomBytes(16).toString('hex'),
            salt: randomBytes(32).toString('hex'),
            algorithm: 'aes-256-gcm',
            lastRotation: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) // 40 days old
          }
        }
      }
    });

    // Mock AWS responses
    mockClient(KMS).on('generateDataKey').returns({
      Plaintext: testDocumentKey,
      CiphertextBlob: randomBytes(32)
    });

    mockClient(S3).on('putObject').returns({
      ETag: '"mock-etag"'
    });

    mockClient(S3).on('getObject').returns({
      Body: await DocumentEncryption.encryptDocument(
        testContent,
        testUserId,
        testDocumentId
      )
    });
  });

  afterEach(async () => {
    // Cleanup test data
    await prisma.documentEncryption.deleteMany({
      where: { documentId: testDocumentId }
    });
    await prisma.document.deleteMany({
      where: { id: testDocumentId }
    });
    await prisma.securitySettings.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.securityLog.deleteMany({
      where: { userId: testUserId }
    });
  });

  describe('rotateMasterKey', () => {
    it('should rotate master key successfully', async () => {
      // Execute
      await KeyRotation.rotateMasterKey(testUserId);

      // Verify
      const settings = await prisma.securitySettings.findUnique({
        where: { userId: testUserId }
      });

      expect(settings?.masterKeyId).not.toBe('old-master-key');
      expect(settings?.lastKeyRotation).toBeGreaterThan(
        new Date(Date.now() - 1000) // Within last second
      );

      // Verify log entry
      const log = await prisma.securityLog.findFirst({
        where: {
          userId: testUserId,
          eventType: 'KEY_ROTATION'
        }
      });

      expect(log).toBeTruthy();
      expect(log?.details).toMatchObject({
        keyType: 'MASTER_KEY',
        oldKeyId: 'old-master-key'
      });
    });

    it('should re-encrypt document keys after master key rotation', async () => {
      // Execute
      await KeyRotation.rotateMasterKey(testUserId);

      // Verify document still accessible
      const content = await DocumentEncryption.decryptDocument(
        testContent,
        testUserId,
        testDocumentId
      );

      expect(content.toString()).toBe(testContent.toString());
    });
  });

  describe('rotateDocumentKey', () => {
    it('should rotate document key successfully', async () => {
      // Execute
      await KeyRotation.rotateDocumentKey(testDocumentId, testUserId);

      // Verify
      const encryption = await prisma.documentEncryption.findUnique({
        where: { documentId: testDocumentId }
      });

      expect(encryption?.keyId).not.toBe('old-document-key');
      expect(encryption?.lastRotation).toBeGreaterThan(
        new Date(Date.now() - 1000)
      );

      // Verify log entry
      const log = await prisma.securityLog.findFirst({
        where: {
          userId: testUserId,
          eventType: 'KEY_ROTATION',
          details: {
            path: ['documentId'],
            equals: testDocumentId
          }
        }
      });

      expect(log).toBeTruthy();
    });

    it('should maintain document accessibility after key rotation', async () => {
      // Execute
      await KeyRotation.rotateDocumentKey(testDocumentId, testUserId);

      // Verify content
      const content = await DocumentEncryption.decryptDocument(
        testContent,
        testUserId,
        testDocumentId
      );

      expect(content.toString()).toBe(testContent.toString());
    });
  });

  describe('checkRotationNeeds', () => {
    it('should identify keys needing rotation', async () => {
      // Execute
      await KeyRotation.checkRotationNeeds();

      // Verify master key rotated
      const settings = await prisma.securitySettings.findUnique({
        where: { userId: testUserId }
      });
      expect(settings?.masterKeyId).not.toBe('old-master-key');

      // Verify document key rotated
      const encryption = await prisma.documentEncryption.findUnique({
        where: { documentId: testDocumentId }
      });
      expect(encryption?.keyId).not.toBe('old-document-key');
    });
  });

  describe('key deletion scheduling', () => {
    it('should schedule old keys for deletion', async () => {
      // Execute rotation
      await KeyRotation.rotateMasterKey(testUserId);

      // Verify deletion scheduled
      const deletionSchedule = await prisma.keyDeletionSchedule.findFirst({
        where: { keyId: 'old-master-key' }
      });

      expect(deletionSchedule).toBeTruthy();
      expect(deletionSchedule?.scheduledDeletion).toBeGreaterThan(
        new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) // At least 6 days from now
      );
    });
  });

  describe('error handling', () => {
    it('should handle KMS service errors gracefully', async () => {
      // Mock KMS error
      mockClient(KMS).on('generateDataKey').rejects(
        new Error('KMS service error')
      );

      // Execute and verify error handling
      await expect(
        KeyRotation.rotateMasterKey(testUserId)
      ).rejects.toThrow('Failed to rotate master key');

      // Verify no partial changes
      const settings = await prisma.securitySettings.findUnique({
        where: { userId: testUserId }
      });
      expect(settings?.masterKeyId).toBe('old-master-key');
    });

    it('should handle S3 service errors gracefully', async () => {
      // Mock S3 error
      mockClient(S3).on('putObject').rejects(
        new Error('S3 service error')
      );

      // Execute and verify error handling
      await expect(
        KeyRotation.rotateDocumentKey(testDocumentId, testUserId)
      ).rejects.toThrow('Failed to rotate document key');

      // Verify no partial changes
      const encryption = await prisma.documentEncryption.findUnique({
        where: { documentId: testDocumentId }
      });
      expect(encryption?.keyId).toBe('old-document-key');
    });
  });

  describe('concurrent rotations', () => {
    it('should handle concurrent master key rotations safely', async () => {
      // Start multiple rotations concurrently
      const rotations = Promise.all([
        KeyRotation.rotateMasterKey(testUserId),
        KeyRotation.rotateMasterKey(testUserId),
        KeyRotation.rotateMasterKey(testUserId)
      ]);

      await expect(rotations).resolves.not.toThrow();

      // Verify only one rotation succeeded
      const logs = await prisma.securityLog.findMany({
        where: {
          userId: testUserId,
          eventType: 'KEY_ROTATION',
          details: {
            path: ['keyType'],
            equals: 'MASTER_KEY'
          }
        }
      });

      expect(logs.length).toBe(1);
    });
  });
});

// Utility function to compare buffers
function compareBuffers(buf1: Buffer, buf2: Buffer): boolean {
  if (buf1.length !== buf2.length) return false;
  return buf1.compare(buf2) === 0;
}