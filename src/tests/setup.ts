import { PrismaClient } from '@prisma/client';
import { mockClient } from 'aws-sdk-mock';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test environment
  process.env.AWS_REGION = 'us-east-1';
  process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
  process.env.AWS_KMS_KEY_ID = 'test-kms-key';
  process.env.AWS_S3_DOCUMENTS_BUCKET = 'test-documents-bucket';
  process.env.AWS_S3_KEYS_BUCKET = 'test-keys-bucket';

  // Reset test database
  await prisma.$executeRaw`TRUNCATE TABLE "SecuritySettings" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Document" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "DocumentEncryption" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "SecurityLog" CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
  mockClient.restore();
});