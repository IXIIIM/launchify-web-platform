import { CronJob } from 'cron';
import { SecurityMonitor } from './interfaces/SecurityMonitor';

export class SecurityMonitorScheduler {
  private monitor: SecurityMonitor;
  private jobs: CronJob[] = [];

  constructor(monitor: SecurityMonitor) {
    this.monitor = monitor;
  }

  startScheduledTasks(): void {
    // Monitor key ages every 12 hours
    this.jobs.push(
      new CronJob('0 */12 * * *', async () => {
        try {
          await this.monitor.monitorKeyAges();
        } catch (error) {
          console.error('Key age monitoring error:', error);
        }
      })
    );

    // Monitor failed rotations every hour
    this.jobs.push(
      new CronJob('0 * * * *', async () => {
        try {
          await this.monitor.monitorFailedRotations();
        } catch (error) {
          console.error('Failed rotation monitoring error:', error);
        }
      })
    );

    // Monitor rotation delays every 6 hours
    this.jobs.push(
      new CronJob('0 */6 * * *', async () => {
        try {
          await this.monitor.monitorRotationDelays();
        } catch (error) {
          console.error('Rotation delay monitoring error:', error);
        }
      })
    );

    // Process active alerts every 30 minutes
    this.jobs.push(
      new CronJob('*/30 * * * *', async () => {
        try {
          await this.monitor.processActiveAlerts();
        } catch (error) {
          console.error('Alert processing error:', error);
        }
      })
    );

    // Generate compliance report daily
    this.jobs.push(
      new CronJob('0 0 * * *', async () => {
        try {
          await this.monitor.generateComplianceReport();
        } catch (error) {
          console.error('Compliance report generation error:', error);
        }
      })
    );

    // Check system health every 5 minutes
    this.jobs.push(
      new CronJob('*/5 * * * *', async () => {
        try {
          const healthy = await this.monitor.checkSystemHealth();
          if (!healthy) {
            console.error('System health check failed');
            // Additional alerting/notification could be implemented here
          }
        } catch (error) {
          console.error('Health check error:', error);
        }
      })
    );

    // Start all jobs
    this.jobs.forEach(job => job.start());
  }

  stopScheduledTasks(): void {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
  }

  getActiveJobs(): { description: string; nextRun: Date | null }[] {
    return this.jobs.map(job => ({
      description: job.cronTime.toString(),
      nextRun: job.nextDate().toDate()
    }));
  }
}