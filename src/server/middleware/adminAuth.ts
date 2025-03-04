// src/server/middleware/adminAuth.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
}

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Error checking admin status' });
  }
};

// src/server/controllers/admin.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      pendingVerifications,
      activeAlerts,
      totalUsers,
      securityIncidents
    ] = await Promise.all([
      prisma.verificationRequest.count({
        where: { status: 'pending' }
      }),
      prisma.securityAlert.count({
        where: { status: 'active' }
      }),
      prisma.user.count(),
      prisma.securityLog.count({
        where: {
          severity: 'high',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    const recentAlerts = await prisma.securityAlert.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        severity: true,
        timestamp: true
      }
    });

    const verificationQueue = await prisma.verificationRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        user: {
          select: {
            email: true,
            userType: true
          }
        },
        type: true,
        createdAt: true,
        status: true
      }
    });

    const securityLogs = await prisma.securityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        type: true,
        message: true,
        ip: true,
        timestamp: true,
        metadata: true
      }
    });

    res.json({
      pendingVerifications,
      activeAlerts,
      totalUsers,
      securityIncidents,
      recentAlerts,
      verificationQueue,
      securityLogs
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
};

export const getVerificationRequests = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const requests = await prisma.verificationRequest.findMany({
      where: status ? { status: String(status) } : undefined,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        user: {
          select: {
            email: true,
            userType: true,
            entrepreneurProfile: true,
            funderProfile: true
          }
        }
      }
    });

    const total = await prisma.verificationRequest.count({
      where: status ? { status: String(status) } : undefined
    });

    res.json({
      requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    res.status(500).json({ message: 'Error fetching verification requests' });
  }
};

export const updateVerificationRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const request = await prisma.verificationRequest.update({
      where: { id },
      data: { 
        status,
        notes,
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      }
    });

    // If approved, update user's verification level
    if (status === 'approved') {
      await prisma.user.update({
        where: { id: request.userId },
        data: { verificationLevel: request.type }
      });
    }

    res.json(request);
  } catch (error) {
    console.error('Error updating verification request:', error);
    res.status(500).json({ message: 'Error updating verification request' });
  }
};

export const getSecurityLogs = async (req: Request, res: Response) => {
  try {
    const { 
      type,
      severity,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const where: any = {};
    if (type) where.type = String(type);
    if (severity) where.severity = String(severity);
    if (startDate || endDate) {
      where.timestamp = {
        ...(startDate && { gte: new Date(String(startDate)) }),
        ...(endDate && { lte: new Date(String(endDate)) })
      };
    }

    const logs = await prisma.securityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.securityLog.count({ where });

    res.json({
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching security logs:', error);
    res.status(500).json({ message: 'Error fetching security logs' });
  }
};

// src/server/routes/admin.ts
import express from 'express';
import {
  getDashboardStats,
  getVerificationRequests,
  updateVerificationRequest,
  getSecurityLogs
} from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/adminAuth';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authenticateToken, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/verification-requests', getVerificationRequests);
router.put('/verification-requests/:id', updateVerificationRequest);
router.get('/security-logs', getSecurityLogs);

export default router;

// src/server/prisma/schema.prisma (additions)
model SecurityAlert {
  id          String   @id @default(uuid())
  title       String
  description String
  severity    String   // low, medium, high, critical
  status      String   // active, resolved
  metadata    Json?
  timestamp   DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model SecurityLog {
  id        String   @id @default(uuid())
  type      String   // auth, verification, system
  message   String
  severity  String   // low, medium, high
  ip        String?
  userId    String?
  metadata  Json?
  timestamp DateTime @default(now())

  user      User?    @relation(fields: [userId], references: [id])
}

// Update User model
model User {
  // ... existing fields
  isAdmin   Boolean  @default(false)
  securityLogs SecurityLog[]
}