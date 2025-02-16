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
});