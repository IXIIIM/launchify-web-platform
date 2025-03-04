import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

export class AnalyticsService {
  async getUserAnalytics(userId: string, timeframe: 'week' | 'month' | 'year' = 'month') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        entrepreneurProfile: true,
        funderProfile: true,
        subscription: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) throw new Error('User not found');

    const startDate = startOfMonth(new Date());
    const endDate = endOfMonth(new Date());

    const [
      matchStats,
      messageStats,
      profileViews,
      connectionRate,
      verificationLevel
    ] = await Promise.all([
      this.getMatchAnalytics(userId, startDate, endDate),
      this.getMessageAnalytics(userId, startDate, endDate),
      this.getProfileViewAnalytics(userId, startDate, endDate),
      this.getConnectionRateAnalytics(userId),
      this.getVerificationLevelAnalytics(userId)
    ]);

    return {
      overview: {
        accountType: user.userType,
        subscriptionTier: user.subscriptionTier,
        memberSince: user.createdAt,
        currentPlan: user.subscription?.[0]
      },
      engagement: {
        matches: matchStats,
        messages: messageStats,
        profileViews,
        connectionRate
      },
      verification: verificationLevel
    };
  }

  private async getMatchAnalytics(userId: string, startDate: Date, endDate: Date) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userId },
          { matchedWithId: userId }
        ],
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        status: true,
        compatibility: true,
        createdAt: true
      }
    });

    const dailyMatches = matches.reduce((acc, match) => {
      const date = format(match.createdAt, 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: matches.length,
      accepted: matches.filter(m => m.status === 'accepted').length,
      rejected: matches.filter(m => m.status === 'rejected').length,
      averageCompatibility: matches.reduce((sum, m) => sum + m.compatibility, 0) / matches.length,
      dailyBreakdown: dailyMatches
    };
  }

  private async getMessageAnalytics(userId: string, startDate: Date, endDate: Date) {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ],
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        senderId: true,
        receiverId: true,
        createdAt: true
      }
    });

    const dailyMessages = messages.reduce((acc, message) => {
      const date = format(message.createdAt, 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: messages.length,
      sent: messages.filter(m => m.senderId === userId).length,
      received: messages.filter(m => m.receiverId === userId).length,
      dailyBreakdown: dailyMessages,
      averageResponseTime: await this.calculateAverageResponseTime(userId)
    };
  }

  private async getProfileViewAnalytics(userId: string, startDate: Date, endDate: Date) {
    const views = await redis.hgetall(`profile_views:${userId}`);
    const viewsArray = Object.entries(views).map(([date, count]) => ({
      date,
      count: parseInt(count)
    }));

    return {
      total: viewsArray.reduce((sum, v) => sum + v.count, 0),
      dailyBreakdown: viewsArray.reduce((acc, v) => {
        acc[v.date] = v.count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private async getConnectionRateAnalytics(userId: string) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userId },
          { matchedWithId: userId }
        ]
      },
      select: {
        status: true
      }
    });

    const total = matches.length;
    const accepted = matches.filter(m => m.status === 'accepted').length;

    return {
      rate: total > 0 ? (accepted / total) * 100 : 0,
      total,
      accepted
    };
  }

  private async calculateAverageResponseTime(userId: string) {
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        matchId: true,
        senderId: true,
        createdAt: true
      }
    });

    let totalResponseTime = 0;
    let responseCount = 0;

    conversations.forEach((message, index) => {
      if (index > 0 && 
          message.matchId === conversations[index - 1].matchId &&
          message.senderId !== conversations[index - 1].senderId) {
        const responseTime = message.createdAt.getTime() - conversations[index - 1].createdAt.getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    });

    return responseCount > 0 ? totalResponseTime / responseCount : 0;
  }

  private async getVerificationLevelAnalytics(userId: string) {
    const verificationRequests = await prisma.verificationRequest.findMany({
      where: { userId },
      select: {
        type: true,
        status: true,
        createdAt: true
      }
    });

    return {
      completedVerifications: verificationRequests.filter(v => v.status === 'approved').length,
      pendingVerifications: verificationRequests.filter(v => v.status === 'pending').length,
      verificationHistory: verificationRequests.map(v => ({
        type: v.type,
        status: v.status,
        date: v.createdAt
      }))
    };
  }

  async getPlatformAnalytics(startDate: Date, endDate: Date) {
    const [
      userStats,
      subscriptionStats,
      matchStats,
      revenueStats
    ] = await Promise.all([
      this.getUserStats(startDate, endDate),
      this.getSubscriptionStats(startDate, endDate),
      this.getMatchStats(startDate, endDate),
      this.getRevenueStats(startDate, endDate)
    ]);

    return {
      users: userStats,
      subscriptions: subscriptionStats,
      matches: matchStats,
      revenue: revenueStats
    };
  }

  private async getUserStats(startDate: Date, endDate: Date) {
    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        userType: true,
        subscriptionTier: true,
        createdAt: true
      }
    });

    const dailySignups = users.reduce((acc, user) => {
      const date = format(user.createdAt, 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: users.length,
      byType: {
        entrepreneurs: users.filter(u => u.userType === 'entrepreneur').length,
        funders: users.filter(u => u.userType === 'funder').length
      },
      byTier: users.reduce((acc, user) => {
        acc[user.subscriptionTier] = (acc[user.subscriptionTier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      dailySignups
    };
  }

  private async getSubscriptionStats(startDate: Date, endDate: Date) {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        tier: true,
        status: true,
        createdAt: true
      }
    });

    return {
      total: subscriptions.length,
      byTier: subscriptions.reduce((acc, sub) => {
        acc[sub.tier] = (acc[sub.tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: subscriptions.reduce((acc, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private async getMatchStats(startDate: Date, endDate: Date) {
    const matches = await prisma.match.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        status: true,
        compatibility: true,
        createdAt: true
      }
    });

    return {
      total: matches.length,
      successful: matches.filter(m => m.status === 'accepted').length,
      averageCompatibility: matches.reduce((sum, m) => sum + m.compatibility, 0) / matches.length,
      dailyMatches: matches.reduce((acc, match) => {
        const date = format(match.createdAt, 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private async getRevenueStats(startDate: Date, endDate: Date) {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        tier: true,
        user: {
          select: {
            userType: true
          }
        },
        createdAt: true
      }
    });

    const revenue = subscriptions.reduce((acc, sub) => {
      const price = this.getSubscriptionPrice(sub.tier, sub.user.userType);
      const date = format(sub.createdAt, 'yyyy-MM-dd');
      acc.total += price;
      acc.byDate[date] = (acc.byDate[date] || 0) + price;
      return acc;
    }, { total: 0, byDate: {} as Record<string, number> });

    return {
      total: revenue.total,
      dailyRevenue: revenue.byDate
    };
  }

  private getSubscriptionPrice(tier: string, userType: string): number {
    const prices = {
      Basic: { entrepreneur: 0, funder: 0 },
      Chrome: { entrepreneur: 25, funder: 100 },
      Bronze: { entrepreneur: 50, funder: 200 },
      Silver: { entrepreneur: 75, funder: 300 },
      Gold: { entrepreneur: 100, funder: 500 },
      Platinum: { entrepreneur: 200, funder: 1000 }
    };

    return prices[tier][userType as keyof typeof prices[typeof tier]];
  }
}