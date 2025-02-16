import { PrismaClient } from '@prisma/client';
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

export class SubscriptionAnalytics {
  async getSubscriptionMetrics(startDate: Date, endDate: Date) {
    const [
      subscriptionGrowth,
      revenueMetrics,
      retentionMetrics,
      tierDistribution
    ] = await Promise.all([
      this.calculateSubscriptionGrowth(startDate, endDate),
      this.calculateRevenueMetrics(startDate, endDate),
      this.calculateRetentionMetrics(startDate, endDate),
      this.calculateTierDistribution()
    ]);

    return {
      subscriptionGrowth,
      revenueMetrics,
      retentionMetrics,
      tierDistribution,
      timestamp: new Date()
    };
  }

  private async calculateSubscriptionGrowth(startDate: Date, endDate: Date) {
    const [newSubscriptions, canceledSubscriptions] = await Promise.all([
      prisma.subscription.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      prisma.subscription.count({
        where: {
          status: 'canceled',
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ]);

    const netGrowth = newSubscriptions - canceledSubscriptions;
    const growthRate = await this.calculateGrowthRate(startDate, endDate);

    return {
      newSubscriptions,
      canceledSubscriptions,
      netGrowth,
      growthRate,
      dailyTrends: await this.calculateDailySubscriptionTrends(startDate, endDate)
    };
  }

  private async calculateRevenueMetrics(startDate: Date, endDate: Date) {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: true
      }
    });

    const mrr = this.calculateMRR(subscriptions);
    const arr = mrr * 12;
    const revenueByTier = this.calculateRevenueByTier(subscriptions);

    return {
      mrr,
      arr,
      revenueByTier,
      monthlyTrends: await this.calculateMonthlyRevenueTrends(startDate, endDate)
    };
  }

  private async calculateRetentionMetrics(startDate: Date, endDate: Date) {
    const cohorts = await this.generateCohorts(startDate, endDate);
    const retentionRates = await this.calculateCohortRetention(cohorts);
    const churnRate = await this.calculateChurnRate(startDate, endDate);

    return {
      cohortRetention: retentionRates,
      churnRate,
      averageLifetime: await this.calculateAverageLifetime()
    };
  }

  private async calculateTierDistribution() {
    const distribution = await prisma.subscription.groupBy({
      by: ['tier'],
      where: {
        status: 'active'
      },
      _count: true
    });

    const totalSubscriptions = distribution.reduce(
      (sum, tier) => sum + tier._count,
      0
    );

    return {
      distribution: distribution.map(tier => ({
        tier: tier.tier,
        count: tier._count,
        percentage: (tier._count / totalSubscriptions) * 100
      })),
      upgradeRates: await this.calculateTierUpgradeRates()
    };
  }

  private async calculateGrowthRate(startDate: Date, endDate: Date) {
    const [startCount, endCount] = await Promise.all([
      prisma.subscription.count({
        where: {
          status: 'active',
          createdAt: {
            lt: startDate
          }
        }
      }),
      prisma.subscription.count({
        where: {
          status: 'active',
          createdAt: {
            lte: endDate
          }
        }
      })
    ]);

    return startCount > 0 
      ? ((endCount - startCount) / startCount) * 100 
      : 0;
  }

  private async calculateDailySubscriptionTrends(startDate: Date, endDate: Date) {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const trends = await Promise.all(
      days.map(async day => {
        const [newSubs, canceledSubs] = await Promise.all([
          prisma.subscription.count({
            where: {
              createdAt: {
                gte: startOfMonth(day),
                lt: endOfMonth(day)
              }
            }
          }),
          prisma.subscription.count({
            where: {
              status: 'canceled',
              updatedAt: {
                gte: startOfMonth(day),
                lt: endOfMonth(day)
              }
            }
          })
        ]);

        return {
          date: format(day, 'yyyy-MM-dd'),
          new: newSubs,
          canceled: canceledSubs,
          net: newSubs - canceledSubs
        };
      })
    );

    return trends;
  }

  private calculateMRR(subscriptions: any[]) {
    return subscriptions.reduce((total, sub) => {
      const price = this.getSubscriptionPrice(sub.tier, sub.user.userType);
      return total + price;
    }, 0);
  }

  private calculateRevenueByTier(subscriptions: any[]) {
    const revenueTiers = subscriptions.reduce((acc, sub) => {
      const price = this.getSubscriptionPrice(sub.tier, sub.user.userType);
      acc[sub.tier] = (acc[sub.tier] || 0) + price;
      return acc;
    }, {});

    return Object.entries(revenueTiers).map(([tier, revenue]) => ({
      tier,
      revenue,
      percentage: (revenue / this.calculateMRR(subscriptions)) * 100
    }));
  }

  private async calculateMonthlyRevenueTrends(startDate: Date, endDate: Date) {
    const months = eachDayOfInterval({ start: startDate, end: endDate })
      .filter(date => date.getDate() === 1);

    const trends = await Promise.all(
      months.map(async month => {
        const subscriptions = await prisma.subscription.findMany({
          where: {
            status: 'active',
            createdAt: {
              lte: endOfMonth(month)
            }
          },
          include: {
            user: true
          }
        });

        return {
          month: format(month, 'yyyy-MM'),
          mrr: this.calculateMRR(subscriptions)
        };
      })
    );

    return trends;
  }

  private async generateCohorts(startDate: Date, endDate: Date) {
    return prisma.subscription.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true
    });
  }

  private async calculateCohortRetention(cohorts: any[]) {
    // Implementation for cohort retention calculation
    // This would track how many users from each monthly cohort remain active
    return [];
  }

  private async calculateChurnRate(startDate: Date, endDate: Date) {
    const [startingSubscriptions, endingSubscriptions, canceledSubscriptions] = 
      await Promise.all([
        prisma.subscription.count({
          where: {
            status: 'active',
            createdAt: {
              lt: startDate
            }
          }
        }),
        prisma.subscription.count({
          where: {
            status: 'active',
            createdAt: {
              lte: endDate
            }
          }
        }),
        prisma.subscription.count({
          where: {
            status: 'canceled',
            updatedAt: {
              gte: startDate,
              lte: endDate
            }
          }
        })
      ]);

    return startingSubscriptions > 0
      ? (canceledSubscriptions / startingSubscriptions) * 100
      : 0;
  }

  private async calculateAverageLifetime() {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'canceled'
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    const lifetimes = subscriptions.map(sub => 
      sub.updatedAt.getTime() - sub.createdAt.getTime()
    );

    return lifetimes.length > 0
      ? lifetimes.reduce((sum, time) => sum + time, 0) / lifetimes.length
      : 0;
  }

  private async calculateTierUpgradeRates() {
    // Implementation for calculating tier upgrade rates
    // This would track how often users upgrade their subscription tier
    return [];
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

    return prices[tier][userType];
  }
}