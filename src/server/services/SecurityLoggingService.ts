// src/server/services/SecurityLoggingService.ts
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { SecurityAlertService } from './SecurityAlertService';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

export type LogSeverity = 'low' | 'medium' | 'high' | 'critical';

interface LogEntry {
  type: string;
  message: string;
  severity: LogSeverity;
  userId?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

interface LogPattern {
  pattern: string | RegExp;
  timeWindow: number; // in milliseconds
  threshold: number;
  severity: LogSeverity;
  alert: {
    title: string;
    description: string;
    requiresImmediate: boolean;
  };
}

export class SecurityLoggingService {
  private alertService: SecurityAlertService;
  private patterns: LogPattern[] = [
    {
      pattern: 'failed_login',
      timeWindow: 5 * 60 * 1000, // 5 minutes
      threshold: 5,
      severity: 'high',
      alert: {
        title: 'Multiple Failed Login Attempts Detected',
        description: 'Multiple failed login attempts detected from the same IP address',
        requiresImmediate: true
      }
    },
    {
      pattern: 'verification_failure',
      timeWindow: 24 * 60 * 60 * 1000, // 24 hours
      threshold: 3,
      severity: 'medium',
      alert: {
        title: 'Multiple Verification Failures',
        description: 'Multiple verification attempts have failed for the same user',
        requiresImmediate: false
      }
    },
    {
      pattern: 'api_rate_limit',
      timeWindow: 15 * 60 * 1000, // 15 minutes
      threshold: 10,
      severity: 'high',
      alert: {
        title: 'API Rate Limit Exceeded Multiple Times',
        description: 'API rate limit has been exceeded multiple times from the same IP',
        requiresImmediate: true
      }
    }
  ];

  constructor(alertService: SecurityAlertService) {
    this.alertService = alertService;
  }

  async log(entry: LogEntry) {
    try {
      // Create log entry in database
      const log = await prisma.securityLog.create({
        data: {
          type: entry.type,
          message: entry.message,
          severity: entry.severity,
          userId: entry.userId,
          ip: entry.ip,
          metadata: entry.metadata || {}
        }
      });

      // Check for patterns that require alerts
      await this.checkPatterns(entry);

      // Store in Redis for real-time monitoring
      await this.updateRealTimeMetrics(entry);

      return log;
    } catch (error) {
      console.error('Error creating security log:', error);
      throw error;
    }
  }

  private async checkPatterns(entry: LogEntry) {
    for (const pattern of this.patterns) {
      if (this.matchesPattern(entry.type, pattern.pattern)) {
        const key = this.getPatternKey(entry, pattern);
        const count = await this.incrementPatternCount(key, pattern.timeWindow);

        if (count >= pattern.threshold) {
          await this.createPatternAlert(entry, pattern, count);
          // Reset counter after alert
          await redis.del(key);
        }
      }
    }
  }

  private matchesPattern(type: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return type === pattern;
    }
    return pattern.test(type);
  }

  private getPatternKey(entry: LogEntry, pattern: LogPattern): string {
    // Create unique key based on pattern and relevant identifiers
    const identifier = entry.userId || entry.ip || 'system';
    return `security:pattern:${pattern.pattern}:${identifier}`;
  }

  private async incrementPatternCount(key: string, timeWindow: number): Promise<number> {
    const multi = redis.multi();
    multi.incr(key);
    multi.pexpire(key, timeWindow);
    const results = await multi.exec();
    return results ? (results[0][1] as number) : 0;
  }

  private async createPatternAlert(entry: LogEntry, pattern: LogPattern, count: number) {
    await this.alertService.createAlert(
      'security_pattern_match',
      {
        patternType: pattern.pattern,
        occurrences: count,
        timeWindow: pattern.timeWindow,
        lastOccurrence: entry
      },
      {
        title: pattern.alert.title,
        description: pattern.alert.description,
        severity: pattern.severity,
        requiresImmediate: pattern.alert.requiresImmediate,
        notifyAdmins: true
      }
    );
  }

  private async updateRealTimeMetrics(entry: LogEntry) {
    const date = new Date();
    const minute = Math.floor(date.getTime() / 60000);
    const hourKey = `security:metrics:hourly:${Math.floor(minute / 60)}`;
    const minuteKey = `security:metrics:minute:${minute}`;

    const multi = redis.multi();

    // Update counts by type
    multi.hincrby(hourKey, `type:${entry.type}`, 1);
    multi.hincrby(minuteKey, `type:${entry.type}`, 1);

    // Update counts by severity
    multi.hincrby(hourKey, `severity:${entry.severity}`, 1);
    multi.hincrby(minuteKey, `severity:${entry.severity}`, 1);

    // Set expiry
    multi.expire(hourKey, 24 * 60 * 60); // 24 hours
    multi.expire(minuteKey, 60 * 60); // 1 hour

    await multi.exec();
  }

  async getMetrics(timeframe: 'minute' | 'hour' | 'day') {
    try {
      const now = new Date();
      let where: any = {};

      switch (timeframe) {
        case 'minute':
          where.timestamp = { gte: new Date(now.getTime() - 60000) };
          break;
        case 'hour':
          where.timestamp = { gte: new Date(now.getTime() - 3600000) };
          break;
        case 'day':
          where.timestamp = { gte: new Date(now.getTime() - 86400000) };
          break;
      }

      const [logs, patterns] = await Promise.all([
        prisma.securityLog.findMany({
          where,
          orderBy: { timestamp: 'desc' }
        }),
        this.getActivePatterns()
      ]);

      return {
        total: logs.length,
        bySeverity: this.groupBy(logs, 'severity'),
        byType: this.groupBy(logs, 'type'),
        topIPs: this.getTopValues(logs, 'ip', 10),
        activePatterns: patterns
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      throw error;
    }
  }

  private async getActivePatterns() {
    const patterns: Record<string, number> = {};
    const keys = await redis.keys('security:pattern:*');

    for (const key of keys) {
      const count = await redis.get(key);
      const [, , pattern] = key.split(':');
      patterns[pattern] = (patterns[pattern] || 0) + Number(count || 0);
    }

    return patterns;
  }

  private groupBy(logs: any[], field: string): Record<string, number> {
    return logs.reduce((acc, log) => {
      const value = log[field];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private getTopValues(logs: any[], field: string, limit: number): Record<string, number> {
    const counts = this.groupBy(logs, field);
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
  }
}

// Example usage middleware
export const logSecurityEvent = (
  type: string,
  severity: LogSeverity = 'low',
  getMessage?: (req: any) => string,
  getMetadata?: (req: any) => Record<string, any>
) => {
  return async (req: any, res: any, next: any) => {
    try {
      const securityLogging = req.app.get('securityLogging');
      
      await securityLogging.log({
        type,
        message: getMessage ? getMessage(req) : `Security event: ${type}`,
        severity,
        userId: req.user?.id,
        ip: req.ip,
        metadata: getMetadata ? getMetadata(req) : undefined
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
    next();
  };
};