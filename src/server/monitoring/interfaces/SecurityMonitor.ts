// src/server/monitoring/interfaces/SecurityMonitor.ts
import { PrismaClient } from '@prisma/client';
import { EmailService } from '../../services/email/EmailService';
import { WebSocketServer } from '../../services/websocket';

export interface SecurityAlert {
  type: string;
  severity: 'WARNING' | 'CRITICAL';
  userId?: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface MonitoringThresholds {
  KEY_AGE_WARNING: number;
  KEY_AGE_CRITICAL: number;
  FAILED_ROTATIONS_WARNING: number;
  FAILED_ROTATIONS_CRITICAL: number;
  ROTATION_DELAY_WARNING: number;
  ROTATION_DELAY_CRITICAL: number;
}

export interface SecurityMetrics {
  keyAgeDistribution: Record<string, number>;
  failedRotations: number;
  pendingRotations: number;
  complianceRate: number;
  activeAlerts: SecurityAlert[];
}

export interface SecurityMonitor {
  // Core monitoring methods
  monitorKeyAges(): Promise<void>;
  monitorFailedRotations(): Promise<void>;
  monitorRotationDelays(): Promise<void>;
  
  // Alert handling
  sendAlert(alert: SecurityAlert): Promise<void>;
  processActiveAlerts(): Promise<void>;
  
  // Metrics and reporting
  generateMetrics(startDate: Date, endDate: Date): Promise<SecurityMetrics>;
  generateComplianceReport(): Promise<void>;
  
  // System health
  checkSystemHealth(): Promise<boolean>;
  validateConfiguration(): Promise<boolean>;
}

export interface SecurityMonitorConfig {
  prisma: PrismaClient;
  emailService: EmailService;
  wsServer: WebSocketServer;
  thresholds: MonitoringThresholds;
  alertTopicArn: string;
  reportBucket: string;
}

export abstract class BaseSecurityMonitor implements SecurityMonitor {
  protected prisma: PrismaClient;
  protected emailService: EmailService;
  protected wsServer: WebSocketServer;
  protected thresholds: MonitoringThresholds;
  protected alertTopicArn: string;
  protected reportBucket: string;

  constructor(config: SecurityMonitorConfig) {
    this.prisma = config.prisma;
    this.emailService = config.emailService;
    this.wsServer = config.wsServer;
    this.thresholds = config.thresholds;
    this.alertTopicArn = config.alertTopicArn;
    this.reportBucket = config.reportBucket;
  }

  abstract monitorKeyAges(): Promise<void>;
  abstract monitorFailedRotations(): Promise<void>;
  abstract monitorRotationDelays(): Promise<void>;
  abstract sendAlert(alert: SecurityAlert): Promise<void>;
  abstract processActiveAlerts(): Promise<void>;
  abstract generateMetrics(startDate: Date, endDate: Date): Promise<SecurityMetrics>;
  abstract generateComplianceReport(): Promise<void>;
  abstract checkSystemHealth(): Promise<boolean>;
  abstract validateConfiguration(): Promise<boolean>;

  protected async logSecurityEvent(
    eventType: string,
    status: string,
    details: Record<string, any>
  ): Promise<void> {
    await this.prisma.securityLog.create({
      data: {
        eventType,
        status,
        details,
        timestamp: new Date()
      }
    });
  }

  protected determineAlertSeverity(
    value: number,
    warningThreshold: number,
    criticalThreshold: number
  ): 'WARNING' | 'CRITICAL' {
    return value >= criticalThreshold ? 'CRITICAL' : 'WARNING';
  }

  protected async notifyUser(
    userId: string,
    notification: {
      type: string;
      content: string;
      severity: 'WARNING' | 'CRITICAL';
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return;

    // Send email notification
    await this.emailService.sendEmail({
      to: user.email,
      template: 'security-alert',
      data: {
        ...notification,
        timestamp: new Date()
      }
    });

    // Send in-app notification
    await this.wsServer.sendNotification(userId, {
      type: notification.type,
      content: notification.content,
      severity: notification.severity,
      metadata: notification.metadata
    });
  }
}