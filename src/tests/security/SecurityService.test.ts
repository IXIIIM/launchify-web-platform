// src/tests/security/SecurityService.test.ts
import { SecurityService } from '@/services/SecurityService';
import { KMS } from 'aws-sdk';
import { mock } from 'jest-mock-extended';

jest.mock('aws-sdk');

describe('SecurityService', () => {
  let securityService: SecurityService;
  let mockKMS: jest.Mocked<KMS>;

  beforeEach(() => {
    mockKMS = mock<KMS>();
    securityService = new SecurityService(mockKMS);
  });

  describe('encryption', () => {
    it('should encrypt sensitive data using KMS', async () => {
      const testData = 'sensitive-info';
      const mockEncrypted = Buffer.from('encrypted');
      
      mockKMS.encrypt.mockImplementation(() => ({
        promise: () => Promise.resolve({ CiphertextBlob: mockEncrypted })
      }));

      const result = await securityService.encrypt(testData);
      
      expect(mockKMS.encrypt).toHaveBeenCalledWith({
        KeyId: expect.any(String),
        Plaintext: Buffer.from(testData)
      });
      expect(result).toBeDefined();
    });

    it('should decrypt encrypted data correctly', async () => {
      const mockDecrypted = Buffer.from('decrypted');
      
      mockKMS.decrypt.mockImplementation(() => ({
        promise: () => Promise.resolve({ Plaintext: mockDecrypted })
      }));

      const result = await securityService.decrypt('encrypted-data');
      
      expect(mockKMS.decrypt).toHaveBeenCalled();
      expect(result).toBe(mockDecrypted.toString());
    });

    it('should handle encryption errors gracefully', async () => {
      mockKMS.encrypt.mockImplementation(() => ({
        promise: () => Promise.reject(new Error('KMS Error'))
      }));

      await expect(securityService.encrypt('data'))
        .rejects
        .toThrow('Encryption failed');
    });
  });

  describe('key rotation', () => {
    it('should rotate encryption keys on schedule', async () => {
      mockKMS.scheduleKeyDeletion.mockImplementation(() => ({
        promise: () => Promise.resolve({})
      }));

      mockKMS.createKey.mockImplementation(() => ({
        promise: () => Promise.resolve({ KeyMetadata: { KeyId: 'new-key' } })
      }));

      await securityService.rotateKey();
      
      expect(mockKMS.createKey).toHaveBeenCalled();
      expect(mockKMS.scheduleKeyDeletion).toHaveBeenCalled();
    });
  });
});

// src/tests/security/SecurityMonitor.test.ts
import { SecurityMonitor } from '@/services/SecurityMonitor';
import { SNS } from 'aws-sdk';
import { mock } from 'jest-mock-extended';
import { redis } from '@/services/redis';

jest.mock('aws-sdk');

describe('SecurityMonitor', () => {
  let securityMonitor: SecurityMonitor;
  let mockSNS: jest.Mocked<SNS>;

  beforeEach(() => {
    mockSNS = mock<SNS>();
    securityMonitor = new SecurityMonitor(mockSNS);
  });

  describe('brute force detection', () => {
    it('should detect login attempts above threshold', async () => {
      const ipAddress = '192.168.1.1';
      
      // Simulate multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await securityMonitor.trackLoginAttempt(ipAddress, false);
      }

      mockSNS.publish.mockImplementation(() => ({
        promise: () => Promise.resolve({ MessageId: '123' })
      }));

      const isBlocked = await securityMonitor.isIPBlocked(ipAddress);
      expect(isBlocked).toBe(true);
      expect(mockSNS.publish).toHaveBeenCalledWith({
        TopicArn: expect.any(String),
        Message: expect.stringContaining('Potential brute force attack')
      });
    });

    it('should reset failed attempts after successful login', async () => {
      const ipAddress = '192.168.1.1';
      
      await securityMonitor.trackLoginAttempt(ipAddress, false);
      await securityMonitor.trackLoginAttempt(ipAddress, true);
      
      const attempts = await redis.get(`login_attempts:${ipAddress}`);
      expect(attempts).toBeNull();
    });
  });

  describe('suspicious activity detection', () => {
    it('should detect multiple password resets', async () => {
      const userId = 'test-user';
      
      mockSNS.publish.mockImplementation(() => ({
        promise: () => Promise.resolve({ MessageId: '123' })
      }));

      for (let i = 0; i < 3; i++) {
        await securityMonitor.trackPasswordReset(userId);
      }

      expect(mockSNS.publish).toHaveBeenCalledWith({
        TopicArn: expect.any(String),
        Message: expect.stringContaining('Multiple password resets detected')
      });
    });

    it('should detect unusual access patterns', async () => {
      const userId = 'test-user';
      const locations = ['US', 'RU', 'CN'];
      
      mockSNS.publish.mockImplementation(() => ({
        promise: () => Promise.resolve({ MessageId: '123' })
      }));

      for (const location of locations) {
        await securityMonitor.trackUserAccess(userId, location);
      }

      expect(mockSNS.publish).toHaveBeenCalledWith({
        TopicArn: expect.any(String),
        Message: expect.stringContaining('Unusual access pattern detected')
      });
    });
  });
});

// src/tests/security/RateLimiting.test.ts
import { rateLimiter } from '@/middleware/security';
import { redis } from '@/services/redis';
import { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';

describe('Rate Limiting Middleware', () => {
  let mockReq: jest.Mocked<Request>;
  let mockRes: jest.Mocked<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = mock<Request>();
    mockRes = mock<Response>();
    mockNext = jest.fn();
    mockReq.ip = '192.168.1.1';
  });

  afterEach(async () => {
    await redis.flushdb();
  });

  it('should allow requests within rate limit', async () => {
    for (let i = 0; i < 10; i++) {
      await rateLimiter(mockReq, mockRes, mockNext);
    }

    expect(mockNext).toHaveBeenCalledTimes(10);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should block requests exceeding rate limit', async () => {
    for (let i = 0; i < 15; i++) {
      await rateLimiter(mockReq, mockRes, mockNext);
    }

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Too many requests')
      })
    );
  });

  it('should reset rate limit after window expires', async () => {
    // Set shorter window for testing
    const testRateLimiter = rateLimiter({ windowMs: 100, max: 2 });
    
    await testRateLimiter(mockReq, mockRes, mockNext);
    await testRateLimiter(mockReq, mockRes, mockNext);
    
    expect(mockNext).toHaveBeenCalledTimes(2);
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    await testRateLimiter(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(3);
  });
});

// src/tests/security/RequestValidation.test.ts
import { validateRequest } from '@/middleware/security';
import { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';

describe('Request Validation Middleware', () => {
  let mockReq: jest.Mocked<Request>;
  let mockRes: jest.Mocked<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = mock<Request>();
    mockRes = mock<Response>();
    mockNext = jest.fn();
  });

  it('should validate request headers', () => {
    mockReq.headers = {
      'content-type': 'application/json',
      'user-agent': 'test-agent'
    };

    validateRequest(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject requests with invalid content-type', () => {
    mockReq.headers = {
      'content-type': 'text/plain'
    };

    validateRequest(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should sanitize request parameters', () => {
    mockReq.body = {
      name: '<script>alert("xss")</script>',
      email: 'test@example.com'
    };

    validateRequest(mockReq, mockRes, mockNext);
    expect(mockReq.body.name).not.toContain('<script>');
  });

  it('should validate request body size', () => {
    mockReq.headers['content-length'] = '10485761'; // > 10MB

    validateRequest(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(413);
  });
});