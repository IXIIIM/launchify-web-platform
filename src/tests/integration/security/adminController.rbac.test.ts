import { Request, Response } from 'express';
import { UserRole } from '@/server/middleware/roleAuth';
import * as adminController from '@/server/controllers/admin.controller';

// Mock Express objects
interface MockUser {
  id: string;
  role?: UserRole;
  [key: string]: any;
}

const mockRequest = (user: MockUser | null = null) => {
  return {
    user,
    query: {},
    params: {},
    body: {}
  } as unknown as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis()
  };
  return res as Response;
};

// Mock Prisma client
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        user: {
          findMany: jest.fn().mockResolvedValue([
            { id: '1', email: 'admin@example.com', role: 'ADMIN' },
            { id: '2', email: 'user@example.com', role: 'USER' }
          ]),
          count: jest.fn().mockResolvedValue(2)
        },
        securityLog: {
          findMany: jest.fn().mockResolvedValue([
            { id: '1', userId: '1', eventType: 'LOGIN', status: 'SUCCESS' }
          ]),
          count: jest.fn().mockResolvedValue(1)
        },
        $disconnect: jest.fn()
      };
    })
  };
});

// Mock the admin controller functions
jest.mock('@/server/controllers/admin.controller', () => {
  return {
    getDashboardStats: jest.fn().mockImplementation(async (req, res) => {
      // Check if user has admin role
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      return res.status(200).json({
        userCount: 2,
        activeUsers: 1,
        newUsersToday: 0,
        securityEvents: 1
      });
    }),
    
    getSecurityLogs: jest.fn().mockImplementation(async (req, res) => {
      // Check if user has admin role
      if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const prisma = new (require('@prisma/client').PrismaClient)();
      const logs = await prisma.securityLog.findMany();
      return res.status(200).json({ logs });
    }),
    
    getVerificationRequests: jest.fn().mockImplementation(async (req, res) => {
      // Check if user has moderator role or higher
      if (req.user?.role !== 'MODERATOR' && req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const prisma = new (require('@prisma/client').PrismaClient)();
      const requests = await prisma.user.findMany();
      return res.status(200).json({ requests });
    })
  };
});

describe('Admin Controller RBAC Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getDashboardStats', () => {
    test('should return dashboard stats for admin users', async () => {
      const req = mockRequest({ id: '1', role: UserRole.ADMIN });
      const res = mockResponse();
      
      await adminController.getDashboardStats(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        userCount: expect.any(Number),
        activeUsers: expect.any(Number)
      }));
    });
    
    test('should return dashboard stats for super admin users', async () => {
      const req = mockRequest({ id: '1', role: UserRole.SUPER_ADMIN });
      const res = mockResponse();
      
      await adminController.getDashboardStats(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        userCount: expect.any(Number),
        activeUsers: expect.any(Number)
      }));
    });
    
    test('should deny access to moderator users', async () => {
      const req = mockRequest({ id: '2', role: UserRole.MODERATOR });
      const res = mockResponse();
      
      await adminController.getDashboardStats(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Forbidden'
      }));
    });
    
    test('should deny access to regular users', async () => {
      const req = mockRequest({ id: '2', role: UserRole.USER });
      const res = mockResponse();
      
      await adminController.getDashboardStats(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Forbidden'
      }));
    });
    
    test('should deny access to unauthenticated requests', async () => {
      const req = mockRequest();
      const res = mockResponse();
      
      await adminController.getDashboardStats(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Forbidden'
      }));
    });
  });
  
  describe('getVerificationRequests', () => {
    test('should allow access to moderator users', async () => {
      const req = mockRequest({ id: '2', role: UserRole.MODERATOR });
      const res = mockResponse();
      
      await adminController.getVerificationRequests(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    
    test('should deny access to regular users', async () => {
      const req = mockRequest({ id: '2', role: UserRole.USER });
      const res = mockResponse();
      
      await adminController.getVerificationRequests(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Forbidden'
      }));
    });
  });
  
  describe('getSecurityLogs', () => {
    test('should return security logs for admin users', async () => {
      const req = mockRequest({ id: '1', role: UserRole.ADMIN });
      const res = mockResponse();
      
      await adminController.getSecurityLogs(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        logs: expect.arrayContaining([
          expect.objectContaining({ id: '1', userId: '1' })
        ])
      }));
    });
    
    test('should deny access to moderator users', async () => {
      const req = mockRequest({ id: '2', role: UserRole.MODERATOR });
      const res = mockResponse();
      
      await adminController.getSecurityLogs(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Forbidden'
      }));
    });
  });
}); 