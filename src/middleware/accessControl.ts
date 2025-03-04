import { Request, Response, NextFunction } from 'express';
import { AccessControlService } from '../services/AccessControlService';

interface AuthRequest extends Request {
  user?: any;
}

export const requireFeatureAccess = (feature: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const accessControlService = new AccessControlService(req.app.get('prisma'), req.app.get('redis'));
    
    try {
      const hasAccess = await accessControlService.canAccessFeature(req.user.id, feature);
      
      if (!hasAccess) {
        return res.status(403).json({
          message: 'This feature requires a higher subscription tier'
        });
      }
      
      next();
    } catch (error) {
      console.error('Access control error:', error);
      res.status(500).json({ message: 'Error checking feature access' });
    }
  };
};

export const requireVerifiedAccess = (feature: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const accessControlService = new AccessControlService(req.app.get('prisma'), req.app.get('redis'));
    
    try {
      const hasAccess = await accessControlService.canAccessVerifiedFeature(req.user.id, feature);
      
      if (!hasAccess) {
        return res.status(403).json({
          message: 'This feature requires additional verification'
        });
      }
      
      next();
    } catch (error) {
      console.error('Verification access error:', error);
      res.status(500).json({ message: 'Error checking verification access' });
    }
  };
};

export const requireResourceAccess = (resourceType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const resourceId = req.params.id;
    if (!resourceId) {
      return res.status(400).json({ message: 'Resource ID required' });
    }

    const accessControlService = new AccessControlService(req.app.get('prisma'), req.app.get('redis'));
    
    try {
      const hasAccess = await accessControlService.verifyResourceAccess(
        req.user.id,
        resourceType,
        resourceId
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          message: 'You do not have access to this resource'
        });
      }
      
      next();
    } catch (error) {
      console.error('Resource access error:', error);
      res.status(500).json({ message: 'Error checking resource access' });
    }
  };
};