import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define the extended request type with user property
interface AuthRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

/**
 * Get dashboard statistics for admin dashboard
 */
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
      prisma.securityLog.count({
        where: { 
          severity: 'high',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
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

    // Get recent verification requests
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

    // Get recent security logs
    const recentSecurityLogs = await prisma.securityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        message: true,
        severity: true,
        ipAddress: true,
        createdAt: true
      }
    });

    res.json({
      stats: {
        pendingVerifications,
        activeAlerts,
        totalUsers,
        securityIncidents
      },
      verificationQueue,
      recentSecurityLogs
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
};

/**
 * Get verification requests with pagination and filtering
 */
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
            userType: true
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

/**
 * Update a verification request status
 */
export const updateVerificationRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const request = await prisma.verificationRequest.update({
      where: { id },
      data: { 
        status,
        notes,
        reviewedAt: new Date(),
        reviewedBy: req.user?.id
      }
    });

    // If approved, update user's verification level
    if (status === 'approved') {
      await prisma.user.update({
        where: { id: request.userId },
        data: { verificationLevel: request.type }
      });

      // Log the verification approval
      await prisma.securityLog.create({
        data: {
          userId: request.userId,
          eventType: 'VERIFICATION_APPROVED',
          message: `Verification request for ${request.type} was approved`,
          severity: 'info',
          ipAddress: req.ip,
          details: { requestId: id, reviewedBy: req.user?.id }
        }
      });
    }

    res.json(request);
  } catch (error) {
    console.error('Error updating verification request:', error);
    res.status(500).json({ message: 'Error updating verification request' });
  }
};

/**
 * Get security logs with filtering and pagination
 */
export const getSecurityLogs = async (req: Request, res: Response) => {
  try {
    const { 
      type,
      severity,
      startDate,
      endDate,
      userId,
      page = 1,
      limit = 50
    } = req.query;

    const where: any = {};
    
    if (type) where.eventType = String(type);
    if (severity) where.severity = String(severity);
    if (userId) where.userId = String(userId);
    
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(String(startDate)) }),
        ...(endDate && { lte: new Date(String(endDate)) })
      };
    }

    const logs = await prisma.securityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
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

/**
 * Get role-based access logs with filtering and pagination
 */
export const getRoleAccessLogs = async (req: Request, res: Response) => {
  try {
    const { 
      role,
      success,
      startDate,
      endDate,
      userId,
      path,
      page = 1,
      limit = 50
    } = req.query;

    const where: any = {
      eventType: 'ROLE_ACCESS_ATTEMPT'
    };
    
    if (success) where.status = success === 'true' ? 'SUCCESS' : 'FAILURE';
    if (userId) where.userId = String(userId);
    
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(String(startDate)) }),
        ...(endDate && { lte: new Date(String(endDate)) })
      };
    }

    // Filter by role or path using JSON path query on the details field
    if (role || path) {
      where.details = {};
      
      if (role) {
        where.details.requiredRole = String(role);
      }
      
      if (path) {
        where.details.path = {
          contains: String(path)
        };
      }
    }

    const logs = await prisma.securityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });

    const total = await prisma.securityLog.count({ where });

    // Get statistics
    const successCount = await prisma.securityLog.count({
      where: {
        ...where,
        status: 'SUCCESS'
      }
    });

    const failureCount = await prisma.securityLog.count({
      where: {
        ...where,
        status: 'FAILURE'
      }
    });

    res.json({
      logs,
      stats: {
        successCount,
        failureCount,
        successRate: total > 0 ? (successCount / total) * 100 : 0
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching role access logs:', error);
    res.status(500).json({ message: 'Error fetching role access logs' });
  }
}; 