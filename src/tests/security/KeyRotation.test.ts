// src/tests/security/KeyRotation.test.ts
import { KeyRotation } from '../../server/security/KeyRotation';
import { mockClient } from 'aws-sdk-mock';
import { S3, KMS } from 'aws-sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('KeyRotation', () => {
  // Test data setup
  const testUserId = 'test-user-id';
  const testDocumentId = 'test-document-id';
  const testMasterKey = Buffer.from('test-master-key');
  const testDocumentKey = Buffer.from('test-document-key');

  beforeEach(async () => {
    // Mock AWS services
    mockClient(S3);
    mockClient(KMS);

    // Setup test data
    await setupTestData();
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestData();
    mockClient.restore();
  });

  describe('rotateMasterKey', () => {
    it('should successfully rotate master key', async () => {
      // Setup
      mockKMSGenerateKey();
      mockS3PutObject();

      // Execute
      await KeyRotation.rotateMasterKey(testUserId);

      // Verify
      const settings = await prisma.securitySettings.findUnique({
        where: { userId: testUserId }
      });

      expect(settings?.lastKeyRotation).toBeDefined();
      expect(settings?.masterKeyId).not.toBe('old-master-key');

      // Verify log entry
      const log = await prisma.securityLog.findFirst({
        where: {
          userId: testUserId,
          eventType: 'KEY_ROTATION'
        }
      });

      expect(log).toBeTruthy();
    });

    it('should handle KMS errors gracefully', async () => {
      // Setup
      mockKMSError();

      // Execute and verify
      await expect(KeyRotation.rotateMasterKey(testUserId))
        .rejects.toThrow('Failed to rotate master key');

      // Verify no partial changes
      const settings = await prisma.securitySettings.findUnique({
        where: { userId: testUserId }
      });

      expect(settings?.masterKeyId).toBe('old-master-key');
    });
  });

  describe('rotateDocumentKey', () => {
    it('should successfully rotate document key', async () => {
      // Setup
      mockKMSGenerateKey();
      mockS3Operations();

      // Execute
      await KeyRotation.rotateDocumentKey(testDocumentId, testUserId);

      // Verify
      const encryption = await prisma.documentEncryption.findUnique({
        where: { documentId: testDocumentId }
      });

      expect(encryption?.lastRotation).toBeDefined();
      expect(encryption?.keyId).not.toBe('old-document-key');

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

    it('should handle S3 errors gracefully', async () => {
      // Setup
      mockS3Error();

      // Execute and verify
      await expect(KeyRotation.rotateDocumentKey(testDocumentId, testUserId))
        .rejects.toThrow('Failed to rotate document key');

      // Verify no partial changes
      const encryption = await prisma.documentEncryption.findUnique({
        where: { documentId: testDocumentId }
      });

      expect(encryption?.keyId).toBe('old-document-key');
    });
  });

  describe('checkRotationNeeds', () => {
    it('should identify keys needing rotation', async () => {
      // Setup
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000); // 100 days old
      await setupOldKeys(oldDate);

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

  // Helper functions
  async function setupTestData() {
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test@example.com',
        securitySettings: {
          create: {
            masterKeyId: 'old-master-key',
            lastKeyRotation: new Date()
          }
        }
      }
    });

    await prisma.document.create({
      data: {
        id: testDocumentId,
        ownerId: testUserId,
        encryption: {
          create: {
            keyId: 'old-document-key',
            lastRotation: new Date()
          }
        }
      }
    });
  }

  async function cleanupTestData() {
    await prisma.documentEncryption.deleteMany();
    await prisma.document.deleteMany();
    await prisma.securitySettings.deleteMany();
    await prisma.user.deleteMany();
    await prisma.securityLog.deleteMany();
  }

  async function setupOldKeys(oldDate: Date) {
    await prisma.securitySettings.update({
      where: { userId: testUserId },
      data: { lastKeyRotation: oldDate }
    });

    await prisma.documentEncryption.update({
      where: { documentId: testDocumentId },
      data: { lastRotation: oldDate }
    });
  }

  // Mock functions
  function mockKMSGenerateKey() {
    mockClient(KMS).on('generateDataKey').returns({
      Plaintext: testDocumentKey,
      CiphertextBlob: Buffer.from('encrypted-key')
    });
  }

  function mockKMSError() {
    mockClient(KMS).on('generateDataKey').rejects(
      new Error('KMS service error')
    );
  }

  function mockS3Operations() {
    mockClient(S3).on('putObject').returns({
      ETag: '"mock-etag"'
    });

    mockClient(S3).on('getObject').returns({
      Body: Buffer.from('test-content')
    });
  }

  function mockS3Error() {
    mockClient(S3).on('putObject').rejects(
      new Error('S3 service error')
    );
  }
});