// src/server/routes/security.ts
import express from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { SecurityMonitorImpl } from '../monitoring/SecurityMonitorImpl';
import { SecurityMonitorConfig } from '../monitoring/interfaces/SecurityMonitor';
import { EmailService } from '../services/email/EmailService';
import { WebSocketServer } from '../services/websocket';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize services
const emailService = new EmailService();
const wsServer = new WebSocketServer(server);

const monitorConfig: SecurityMonitorConfig = {
  prisma,
  emailService,
  wsServer,
  thresholds: {
    KEY_AGE_WARNING: 60 * 24 * 60 * 60 * 1000,
    KEY_AGE_CRITICAL: 80 * 24 * 60 * 60 * 1000,
    FAILED_ROTATIONS_WARNING: 2,
    FAILED_ROTATIONS_CRITICAL: 5,
    ROTATION_DELAY_WARNING: 7 * 24 * 60 * 60 * 1000,
    ROTATION_DELAY_CRITICAL: 14 * 24 * 60 * 60 * 1000
  },
  alertTopicArn: process.env.AWS_SNS_ALERT_TOPIC!,
  reportBucket: process.env.AWS_S3_REPORTS_BUCKET!
};

const securityMonitor = new SecurityMonitorImpl(monitorConfig);

// Get security metrics
router.get('/metrics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const timeframe = req.query.timeframe as string || '30d';
    const days = parseInt(timeframe.replace('d', ''));
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const metrics = await securityMonitor.generateMetrics(startDate, endDate);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    res.status(500).json({ message: 'Error fetching security metrics' });
  }
});

// Get active alerts
router.get('/alerts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const activeAlerts = await prisma.securityAlert.findMany({
      where: {
        resolved: false
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(activeAlerts);
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({ message: 'Error fetching alerts' });
  }
});

// Get compliance reports
router.get('/reports', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const reports = await prisma.securityLog.findMany({
      where: {
        eventType: 'COMPLIANCE_REPORT',
        createdAt: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching compliance reports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

// Manually trigger key rotation
router.post('/rotate-key', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { keyType, documentId } = req.body;
    
    // Validate request
    if (!keyType || (keyType === 'DOCUMENT_KEY' && !documentId)) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    // Schedule key rotation
    await prisma.scheduledNotification.create({
      data: {
        userId: req.user.id,
        type: 'KEY_ROTATION',
        scheduledFor: new Date(),
        status: 'PENDING',
        details: {
          keyType,
          documentId,
          requestedBy: req.user.id
        }
      }
    });

    res.json({ message: 'Key rotation scheduled successfully' });
  } catch (error) {
    console.error('Error scheduling key rotation:', error);
    res.status(500).json({ message: 'Error scheduling key rotation' });
  }
});

// Resolve alert
router.post('/alerts/:alertId/resolve', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { resolution } = req.body;

    await prisma.securityAlert.update({
      where: { id: alertId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolutionDetails: {
          resolvedBy: req.user.id,
          resolution,
          timestamp: new Date()
        }
      }
    });

    res.json({ message: 'Alert resolved successfully' });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ message: 'Error resolving alert' });
  }
});

// Get system health status
router.get('/health', authenticateToken, async (req: Request, res: Response) => {
  try {
    const healthy = await securityMonitor.checkSystemHealth();
    res.json({ healthy });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({ message: 'Error checking system health' });
  }
});

// Get configuration status
router.get('/config', authenticateToken, async (req: Request, res: Response) => {
  try {
    const valid = await securityMonitor.validateConfiguration();
    res.json({ valid });
  } catch (error) {
    console.error('Error validating configuration:', error);
    res.status(500).json({ message: 'Error validating configuration' });
  }
});

export default router;