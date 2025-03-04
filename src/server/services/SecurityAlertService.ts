// src/server/services/SecurityAlertService.ts
import { PrismaClient } from '@prisma/client';
import { EmailService } from './email/EmailService';
import { WebSocketServer } from './websocket';

const prisma = new PrismaClient();

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

interface AlertConfig {
  title: string;
  description: string;
  severity: AlertSeverity;
  requiresImmediate: boolean;
  notifyAdmins: boolean;
  autoResolveAfter?: number; // Time in milliseconds
}

export class SecurityAlertService {
  private emailService: EmailService;
  private wsServer: WebSocketServer;

  constructor(emailService: EmailService, wsServer: WebSocketServer) {
    this.emailService = emailService;
    this.wsServer = wsServer;
  }

  async createAlert(
    type: string,
    data: any,
    config: AlertConfig
  ) {
    try {
      // Create alert record
      const alert = await prisma.securityAlert.create({
        data: {
          title: config.title,
          description: config.description,
          severity: config.severity,
          status: 'active',
          metadata: {
            type,
            ...data,
            timestamp: new Date().toISOString()
          }
        }
      });

      // Log security event
      await prisma.securityLog.create({
        data: {
          type: 'security_alert',
          message: `Security alert created: ${config.title}`,
          severity: config.severity,
          metadata: {
            alertId: alert.id,
            ...data
          }
        }
      });

      // Notify admins if required
      if (config.notifyAdmins) {
        await this.notifyAdmins(alert);
      }

      // Send real-time notification
      await this.sendRealTimeNotification(alert);

      // Set up auto-resolution if configured
      if (config.autoResolveAfter) {
        setTimeout(
          () => this.resolveAlert(alert.id, 'Auto-resolved based on configuration'),
          config.autoResolveAfter
        );
      }

      return alert;
    } catch (error) {
      console.error('Error creating security alert:', error);
      throw error;
    }
  }

  private async notifyAdmins(alert: any) {
    try {
      // Get all admin users
      const admins = await prisma.user.findMany({
        where: { isAdmin: true }
      });

      // Send email notifications
      await Promise.all(
        admins.map(admin =>
          this.emailService.sendEmail({
            to: admin.email,
            template: 'security-alert',
            data: {
              title: alert.title,
              description: alert.description,
              severity: alert.severity,
              timestamp: alert.timestamp,
              metadata: alert.metadata
            }
          })
        )
      );
    } catch (error) {
      console.error('Error notifying admins:', error);
      // Don't throw - we don't want to fail the alert creation if notifications fail
    }
  }

  private async sendRealTimeNotification(alert: any) {
    try {
      // Get all admin users
      const admins = await prisma.user.findMany({
        where: { isAdmin: true }
      });

      // Send WebSocket notifications to all admin users
      admins.forEach(admin => {
        this.wsServer.sendNotification(admin.id, {
          type: 'SECURITY_ALERT',
          alert: {
            id: alert.id,
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            timestamp: alert.timestamp
          }
        });
      });
    } catch (error) {
      console.error('Error sending real-time notifications:', error);
    }
  }

  async resolveAlert(alertId: string, resolution: string) {
    try {
      const alert = await prisma.securityAlert.update({
        where: { id: alertId },
        data: {
          status: 'resolved',
          metadata: {
            resolution,
            resolvedAt: new Date().toISOString()
          }
        }
      });

      // Log resolution
      await prisma.securityLog.create({
        data: {
          type: 'alert_resolution',
          message: `Security alert resolved: ${alert.title}`,
          severity: alert.severity,
          metadata: {
            alertId: alert.id,
            resolution
          }
        }
      });

      return alert;
    } catch (error) {
      console.error('Error resolving security alert:', error);
      throw error;
    }
  }

  async getActiveAlerts() {
    return prisma.securityAlert.findMany({
      where: { status: 'active' },
      orderBy: { severity: 'desc' }
    });
  }

  async getAlertHistory(options: {
    severity?: AlertSeverity[];
    startDate?: Date;
    endDate?: Date;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      severity,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 20
    } = options;

    const where: any = {};
    if (severity) where.severity = { in: severity };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate })
      };
    }

    const [alerts, total] = await Promise.all([
      prisma.securityAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.securityAlert.count({ where })
    ]);

    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

// src/server/controllers/alerts.controller.ts
import { Request, Response } from 'express';
import { SecurityAlertService } from '../services/SecurityAlertService';
import { EmailService } from '../services/email/EmailService';
import { WebSocketServer } from '../services/websocket';

const emailService = new EmailService();
const wsServer = new WebSocketServer();
const alertService = new SecurityAlertService(emailService, wsServer);

export const getActiveAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await alertService.getActiveAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({ message: 'Error fetching alerts' });
  }
};

export const getAlertHistory = async (req: Request, res: Response) => {
  try {
    const {
      severity,
      startDate,
      endDate,
      status,
      page,
      limit
    } = req.query;

    const result = await alertService.getAlertHistory({
      severity: severity ? (severity as string).split(',') as any[] : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({ message: 'Error fetching alert history' });
  }
};

export const resolveAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    const alert = await alertService.resolveAlert(id, resolution);
    res.json(alert);
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ message: 'Error resolving alert' });
  }
};

// src/server/routes/alerts.ts
import express from 'express';
import {
  getActiveAlerts,
  getAlertHistory,
  resolveAlert
} from '../controllers/alerts.controller';
import { requireAdmin } from '../middleware/adminAuth';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get('/active', getActiveAlerts);
router.get('/history', getAlertHistory);
router.post('/:id/resolve', resolveAlert);

export default router;