import { Request, Response, NextFunction } from 'express';
import { requireRole, requireAnyRole, UserRole } from '@/server/middleware/roleAuth';

// Define the user type to match the AuthRequest interface in roleAuth.ts
interface MockUser {
  id: string;
  role?: UserRole;
  [key: string]: any;
}

// Mock Express objects
const mockRequest = (user: MockUser | null = null, path = '/admin/dashboard') => {
  return {
    user,
    path,
    ip: '127.0.0.1'
  } as unknown as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return res as Response;
};

const mockNext = jest.fn() as NextFunction;

// Mock Prisma client
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        securityLog: {
          create: jest.fn().mockResolvedValue({
            id: 'mock-log-id',
            userId: 'mock-user-id',
            eventType: 'ROLE_ACCESS_ATTEMPT',
            status: 'SUCCESS',
            ipAddress: '127.0.0.1',
            message: 'Mock log message',
            severity: 'INFO',
            details: {}
          })
        },
        $disconnect: jest.fn()
      };
    })
  };
});

// Mock AdminWebSocketService
jest.mock('@/server/services/websocket/AdminWebSocketService', () => {
  return {
    notifyRoleAccessAttempt: jest.fn()
  };
});

// Mock container
jest.mock('@/server/container', () => {
  return {
    container: {
      resolve: jest.fn().mockReturnValue({
        notifyRoleAccessAttempt: jest.fn()
      })
    }
  };
});

describe('Role Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requireRole middleware', () => {
    test('should allow access when user has required role', async () => {
      const req = mockRequest({ id: 'user-1', role: UserRole.ADMIN });
      const res = mockResponse();
      
      await requireRole(UserRole.ADMIN)(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('should allow access when user has higher role than required', async () => {
      const req = mockRequest({ id: 'user-1', role: UserRole.SUPER_ADMIN });
      const res = mockResponse();
      
      await requireRole(UserRole.ADMIN)(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('should deny access when user has lower role than required', async () => {
      const req = mockRequest({ id: 'user-1', role: UserRole.MODERATOR });
      const res = mockResponse();
      
      await requireRole(UserRole.ADMIN)(req, res, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Forbidden',
        message: expect.stringContaining('Required role')
      }));
    });

    test('should deny access when user has no role', async () => {
      const req = mockRequest({ id: 'user-1' });
      const res = mockResponse();
      
      await requireRole(UserRole.ADMIN)(req, res, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Forbidden',
        message: 'No role assigned'
      }));
    });

    test('should deny access when no user is present', async () => {
      const req = mockRequest();
      const res = mockResponse();
      
      await requireRole(UserRole.ADMIN)(req, res, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Unauthorized'
      }));
    });

    test('should handle errors gracefully', async () => {
      // Mock an error being thrown
      const req = mockRequest({ id: 'user-1', role: UserRole.ADMIN });
      const res = mockResponse();
      
      // Force an error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Test error');
      jest.spyOn(global, 'Promise').mockImplementationOnce(() => {
        throw mockError;
      });
      
      await requireRole(UserRole.ADMIN)(req, res, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Internal server error'
      }));
      expect(console.error).toHaveBeenCalledWith('Role authorization error:', mockError);
    });
  });

  describe('requireAnyRole middleware', () => {
    test('should allow access when user has one of the required roles', async () => {
      const req = mockRequest({ id: 'user-1', role: UserRole.MODERATOR });
      const res = mockResponse();
      
      await requireAnyRole([UserRole.ADMIN, UserRole.MODERATOR])(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('should allow access when user has higher role than any required', async () => {
      const req = mockRequest({ id: 'user-1', role: UserRole.SUPER_ADMIN });
      const res = mockResponse();
      
      await requireAnyRole([UserRole.ADMIN, UserRole.MODERATOR])(req, res, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('should deny access when user has lower role than any required', async () => {
      const req = mockRequest({ id: 'user-1', role: UserRole.USER });
      const res = mockResponse();
      
      await requireAnyRole([UserRole.ADMIN, UserRole.MODERATOR])(req, res, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Forbidden',
        message: expect.stringContaining('Required roles')
      }));
    });
  });

  describe('Access logging', () => {
    test('should log successful access attempts', async () => {
      const req = mockRequest({ id: 'user-1', role: UserRole.ADMIN });
      const res = mockResponse();
      
      await requireRole(UserRole.ADMIN)(req, res, mockNext);
      
      // Check that Prisma was called to create a log
      const prismaClient = require('@prisma/client').PrismaClient();
      expect(prismaClient.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            eventType: 'ROLE_ACCESS_ATTEMPT',
            status: 'SUCCESS'
          })
        })
      );
    });

    test('should log failed access attempts', async () => {
      const req = mockRequest({ id: 'user-1', role: UserRole.USER });
      const res = mockResponse();
      
      await requireRole(UserRole.ADMIN)(req, res, mockNext);
      
      // Check that Prisma was called to create a log
      const prismaClient = require('@prisma/client').PrismaClient();
      expect(prismaClient.securityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            eventType: 'ROLE_ACCESS_ATTEMPT',
            status: 'FAILURE'
          })
        })
      );
    });

    test('should send WebSocket notifications for access attempts', async () => {
      const req = mockRequest({ id: 'user-1', role: UserRole.ADMIN });
      const res = mockResponse();
      
      await requireRole(UserRole.ADMIN)(req, res, mockNext);
      
      // Check that the WebSocket service was called
      const adminWsService = require('@/server/container').container.resolve();
      expect(adminWsService.notifyRoleAccessAttempt).toHaveBeenCalled();
    });
  });
}); 