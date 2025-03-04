// Continuing from previous content...

      console.error('Error fetching custom range metrics:', error);
      res.status(500).json({ message: 'Error fetching custom range metrics' });
    }
  }

  async getRealTimeStats(req: Request, res: Response) {
    try {
      const stats = {
        activeUsers: await this.getActiveUsers(),
        ongoingMatches: await this.getOngoingMatches(),
        recentTransactions: await this.getRecentTransactions(),
        systemHealth: await this.getSystemHealth()
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
      res.status(500).json({ message: 'Error fetching real-time stats' });
    }
  }

  private async getActiveUsers(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return prisma.userSession.count({
      where: {
        lastActivity: {
          gte: fiveMinutesAgo
        }
      }
    });
  }

  private async getOngoingMatches(): Promise<number> {
    return prisma.match.count({
      where: {
        status: 'pending',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
  }

  private async getRecentTransactions(): Promise<any[]> {
    return prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
        }
      },
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
  }

  private async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    metrics: Record<string, any>;
  }> {
    // Implement system health checks here
    // This could include database connection status, cache health, etc.
    const dbHealthy = await this.checkDatabaseHealth();
    const cacheHealthy = await this.checkCacheHealth();
    const queueHealthy = await this.checkQueueHealth();

    const status = dbHealthy && cacheHealthy && queueHealthy
      ? 'healthy'
      : (!dbHealthy || !cacheHealthy)
        ? 'critical'
        : 'degraded';

    return {
      status,
      metrics: {
        database: dbHealthy,
        cache: cacheHealthy,
        queue: queueHealthy,
        responseTime: await this.getAverageResponseTime(),
        errorRate: await this.getErrorRate()
      }
    };
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkCacheHealth(): Promise<boolean> {
    try {
      await analyticsCache.getMetrics('health_check', {});
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkQueueHealth(): Promise<boolean> {
    // Implement queue health check
    // This would depend on your queue implementation (Redis, RabbitMQ, etc.)
    return true;
  }

  private async getAverageResponseTime(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const requests = await prisma.requestLog.findMany({
      where: {
        timestamp: {
          gte: fiveMinutesAgo
        }
      },
      select: {
        responseTime: true
      }
    });

    if (requests.length === 0) return 0;
    return requests.reduce((sum, req) => sum + req.responseTime, 0) / requests.length;
  }

  private async getErrorRate(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const [totalRequests, errorRequests] = await Promise.all([
      prisma.requestLog.count({
        where: {
          timestamp: {
            gte: fiveMinutesAgo
          }
        }
      }),
      prisma.requestLog.count({
        where: {
          timestamp: {
            gte: fiveMinutesAgo
          },
          statusCode: {
            gte: 500
          }
        }
      })
    ]);

    return totalRequests === 0 ? 0 : (errorRequests / totalRequests) * 100;
  }
}