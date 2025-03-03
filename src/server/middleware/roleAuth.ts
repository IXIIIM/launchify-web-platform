import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { container } from '../container';
import { AdminWebSocketService } from '../services/websocket/AdminWebSocketService';

const prisma = new PrismaClient();

// Define the role hierarchy
export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

// Extend the Express Request type to include user property
interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: UserRole;
    [key: string]: any;
  };
}

// Get the AdminWebSocketService from the container
const adminWsService = container.resolve<AdminWebSocketService>('adminWebSocketService');

/**
 * Log access attempts to the security log
 */
const logAccessAttempt = async (
  userId: string | undefined,
  requiredRole: UserRole,
  userRole: UserRole | undefined,
  path: string,
  success: boolean,
  ipAddress: string | undefined
) => {
  try {
    const securityLog = await prisma.securityLog.create({
      data: {
        userId: userId || 'anonymous',
        eventType: 'ROLE_ACCESS_ATTEMPT',
        status: success ? 'SUCCESS' : 'FAILURE',
        ipAddress: ipAddress || 'unknown',
        message: success 
          ? `User successfully accessed ${path} with role ${userRole}`
          : `User attempted to access ${path} but lacked required role ${requiredRole}`,
        severity: success ? 'INFO' : 'WARNING',
        details: {
          requiredRole,
          userRole: userRole || 'none',
          path,
          timestamp: new Date().toISOString()
        }
      }
    });

    // Send real-time notification via WebSocket
    adminWsService.notifyRoleAccessAttempt({
      id: securityLog.id,
      userId: userId || 'anonymous',
      userRole: userRole || 'none',
      requiredRole,
      path,
      success,
      timestamp: new Date(),
      ipAddress: ipAddress || 'unknown'
    });

    return securityLog;
  } catch (error) {
    console.error('Error logging access attempt:', error);
    return null;
  }
};

/**
 * Middleware to require a specific role for access
 */
export const requireRole = (role: UserRole) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user exists in request (should be set by auth middleware)
      if (!req.user) {
        await logAccessAttempt(
          undefined,
          role,
          undefined,
          req.path,
          false,
          req.ip
        );
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user has a role assigned
      if (!req.user.role) {
        await logAccessAttempt(
          req.user.id,
          role,
          undefined,
          req.path,
          false,
          req.ip
        );
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: 'No role assigned' 
        });
      }

      // Check if user's role is sufficient
      const hasRequiredRole = checkUserRole(req.user.role, role);
      
      // Log the access attempt
      await logAccessAttempt(
        req.user.id,
        role,
        req.user.role as UserRole,
        req.path,
        hasRequiredRole,
        req.ip
      );

      if (!hasRequiredRole) {
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: `Required role: ${role}` 
        });
      }

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to require any of the specified roles for access
 */
export const requireAnyRole = (roles: UserRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user exists in request (should be set by auth middleware)
      if (!req.user) {
        await logAccessAttempt(
          undefined,
          roles[0], // Log the first role for simplicity
          undefined,
          req.path,
          false,
          req.ip
        );
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user has a role assigned
      if (!req.user.role) {
        await logAccessAttempt(
          req.user.id,
          roles[0], // Log the first role for simplicity
          undefined,
          req.path,
          false,
          req.ip
        );
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: 'No role assigned' 
        });
      }

      // Check if user's role is sufficient for any of the required roles
      const hasAnyRequiredRole = roles.some(role => 
        checkUserRole(req.user!.role as UserRole, role)
      );
      
      // Log the access attempt
      await logAccessAttempt(
        req.user.id,
        roles[0], // Log the first role for simplicity
        req.user.role as UserRole,
        req.path,
        hasAnyRequiredRole,
        req.ip
      );

      if (!hasAnyRequiredRole) {
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: `Required roles: ${roles.join(' or ')}` 
        });
      }

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Checks if a user's role meets the required role level.
 * This follows a hierarchical approach where higher roles have access to lower role features.
 * 
 * @param userRole The user's current role
 * @param requiredRole The role required for access
 * @returns boolean indicating if the user has sufficient permissions
 */
const checkUserRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    [UserRole.SUPER_ADMIN]: 4,
    [UserRole.ADMIN]: 3,
    [UserRole.MODERATOR]: 2,
    [UserRole.USER]: 1
  };

  const userRoleLevel = roleHierarchy[userRole] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

  return userRoleLevel >= requiredRoleLevel;
}; 