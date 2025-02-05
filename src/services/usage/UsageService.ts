    const limits = TIER_LIMITS[user.subscriptionTier];
    return limits[feature] || false;
  }

  async canAccessVerificationLevel(userId: string, level: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    });

    if (!user) throw new Error('User not found');

    const limits = TIER_LIMITS[user.subscriptionTier];
    return limits.verificationAccess.includes(level);
  }

  async getUserUsage(userId: string): Promise<{
    matches: UsageStats;
    messages: UsageStats;
    activeChats: UsageStats;
    limits: TierLimits;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    });

    if (!user) throw new Error('User not found');

    const limits = TIER_LIMITS[user.subscriptionTier];
    const matchesKey = this.getRedisKey(userId, 'monthlyMatches');
    const messagesKey = this.getRedisKey(userId, 'monthlyMessages');

    const [monthlyMatches, monthlyMessages, activeChats] = await Promise.all([
      redis.get(matchesKey).then(val => parseInt(val || '0')),
      redis.get(messagesKey).then(val => parseInt(val || '0')),
      this.getActiveChatsCount(userId)
    ]);

    return {
      matches: {
        current: monthlyMatches,
        limit: limits.monthlyMatches,
        percentage: this.calculatePercentage(monthlyMatches, limits.monthlyMatches)
      },
      messages: {
        current: monthlyMessages,
        limit: limits.monthlyMessages,
        percentage: this.calculatePercentage(monthlyMessages, limits.monthlyMessages)
      },
      activeChats: {
        current: activeChats,
        limit: limits.maxActiveChats,
        percentage: this.calculatePercentage(activeChats, limits.maxActiveChats)
      },
      limits
    };
  }

  private async getActiveChatsCount(userId: string): Promise<number> {
    return prisma.match.count({
      where: {
        OR: [
          { userId },
          { matchedWithId: userId }
        ],
        status: 'accepted',
        messages: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    });
  }

  private calculatePercentage(current: number, limit: number): number {
    if (limit === Infinity) return 0;
    return Math.round((current / limit) * 100);
  }

  async trackProfileView(viewedUserId: string): Promise<void> {
    const key = this.getRedisKey(viewedUserId, 'profileViews');
    const date = new Date().toISOString().split('T')[0];
    await redis.hincrby(key, date, 1);
    await redis.expire(key, 90 * 24 * 60 * 60); // Keep for 90 days
  }

  async getProfileViews(userId: string, days: number = 30): Promise<Record<string, number>> {
    const key = this.getRedisKey(userId, 'profileViews');
    const views = await redis.hgetall(key);
    
    // Filter to requested date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return Object.entries(views)
      .filter(([date]) => new Date(date) >= cutoffDate)
      .reduce((acc, [date, count]) => {
        acc[date] = parseInt(count);
        return acc;
      }, {} as Record<string, number>);
  }

  async resetUsage(userId: string): Promise<void> {
    const matchesKey = this.getRedisKey(userId, 'monthlyMatches');
    const messagesKey = this.getRedisKey(userId, 'monthlyMessages');
    
    await Promise.all([
      redis.del(matchesKey),
      redis.del(messagesKey)
    ]);
  }

  async trackSubscriptionChange(userId: string, newTier: string): Promise<void> {
    // Reset usage counters when upgrading subscription
    await this.resetUsage(userId);
    
    // Record subscription change
    const changeKey = `subscription:changes:${userId}`;
    const change = {
      date: new Date().toISOString(),
      newTier,
    };
    
    await redis.lpush(changeKey, JSON.stringify(change));
    await redis.ltrim(changeKey, 0, 9); // Keep last 10 changes
  }

  async generateUsageReport(userId: string): Promise<{
    usage: {
      matches: UsageStats;
      messages: UsageStats;
      activeChats: UsageStats;
    };
    trends: {
      profileViews: Record<string, number>;
      matchRate: number;
      responseRate: number;
    };
  }> {
    const [usage, profileViews] = await Promise.all([
      this.getUserUsage(userId),
      this.getProfileViews(userId)
    ]);

    const [matchRate, responseRate] = await Promise.all([
      this.calculateMatchRate(userId),
      this.calculateResponseRate(userId)
    ]);

    return {
      usage: {
        matches: usage.matches,
        messages: usage.messages,
        activeChats: usage.activeChats
      },
      trends: {
        profileViews,
        matchRate,
        responseRate
      }
    };
  }

  private async calculateMatchRate(userId: string): Promise<number> {
    const [matches, totalSwipes] = await Promise.all([
      prisma.match.count({
        where: {
          OR: [{ userId }, { matchedWithId: userId }],
          status: 'accepted'
        }
      }),
      prisma.match.count({
        where: {
          OR: [{ userId }, { matchedWithId: userId }]
        }
      })
    ]);

    return totalSwipes > 0 ? (matches / totalSwipes) * 100 : 0;
  }

  private async calculateResponseRate(userId: string): Promise<number> {
    const conversations = await prisma.match.findMany({
      where: {
        OR: [{ userId }, { matchedWithId: userId }],
        status: 'accepted'
      },
      include: {
        messages: {
          select: {
            senderId: true
          }
        }
      }
    });

    let totalMessages = 0;
    let responsesReceived = 0;

    conversations.forEach(conversation => {
      const messages = conversation.messages;
      messages.forEach((message, index) => {
        if (index > 0 && message.senderId !== messages[index - 1].senderId) {
          responsesReceived++;
        }
        totalMessages++;
      });
    });

    return totalMessages > 0 ? (responsesReceived / totalMessages) * 100 : 0;
  }
}

interface UsageStats {
  current: number;
  limit: number;
  percentage: number;
}