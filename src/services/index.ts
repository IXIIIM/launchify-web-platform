import { WebSocketServer } from './websocket';
import { AnalyticsService } from './analytics';
import { ChatService } from './chat/ChatService';
import { EmailService } from './email/EmailService';
import { StorageService } from './storage/StorageService';
import { SubscriptionService } from './subscription';
import { UsageService } from './usage/UsageService';
import { VerificationService } from './verification/VerificationService';
import { NotificationScheduler } from './notifications/NotificationScheduler';
import http from 'http';

export class ServiceProvider {
  public analytics: AnalyticsService;
  public chat: ChatService;
  public email: EmailService;
  public storage: StorageService;
  public subscription: SubscriptionService;
  public usage: UsageService;
  public verification: VerificationService;
  public websocket: WebSocketServer;
  public scheduler: NotificationScheduler;

  constructor(server: http.Server) {
    // Initialize base services first
    this.websocket = new WebSocketServer(server);
    this.email = new EmailService();
    this.storage = new StorageService();
    this.usage = new UsageService();

    // Initialize dependent services
    this.subscription = new SubscriptionService(
      this.websocket,
      this.email
    );

    this.chat = new ChatService(
      this.websocket,
      this.usage
    );

    this.verification = new VerificationService(
      this.storage,
      this.email,
      this.subscription
    );

    this.analytics = new AnalyticsService();

    // Initialize notification scheduler
    this.scheduler = new NotificationScheduler(
      this.email,
      this.websocket
    );

    // Start scheduled tasks
    this.initializeScheduledTasks();
  }

  private initializeScheduledTasks() {
    // Process notifications every minute
    setInterval(() => {
      this.scheduler.processNotifications();
    }, 60 * 1000);

    // Clean up expired resources daily
    setInterval(() => {
      this.cleanup();
    }, 24 * 60 * 60 * 1000);
  }

  private async cleanup() {
    try {
      // Clean up expired sessions
      await this.cleanupExpiredSessions();

      // Clean up old notifications
      await this.cleanupOldNotifications();

      // Clean up temporary files
      await this.cleanupTempFiles();

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  private async cleanupExpiredSessions() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await prisma.session.deleteMany({
      where: {
        lastActivity: {
          lt: thirtyDaysAgo
        }
      }
    });
  }

  private async cleanupOldNotifications() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo
        },
        read: true
      }
    });
  }

  private async cleanupTempFiles() {
    try {
      const expiredFiles = await prisma.temporaryFile.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      await Promise.all(
        expiredFiles.map(async (file) => {
          await this.storage.deleteFile(file.path);
          await prisma.temporaryFile.delete({
            where: { id: file.id }
          });
        })
      );
    } catch (error) {
      console.error('Error cleaning up temporary files:', error);
    }
  }
}

// Export instance creation helper
export const createServices = (server: http.Server): ServiceProvider => {
  return new ServiceProvider(server);
};