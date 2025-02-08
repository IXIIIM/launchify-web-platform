export interface UserMetrics {
  total: number;
  previousTotal: number;
  activeUsers: number;
  growthRate: number;
  retentionRate: number;
  byType: {
    entrepreneurs: number;
    funders: number;
  };
  dailySignups: Array<{
    date: string;
    entrepreneurs: number;
    funders: number;
  }>;
}

export interface SubscriptionMetrics {
  active: number;
  previousActive: number;
  byTier: Record<string, number>;
  churnRate: number;
  conversionRate: number;
}

export interface MatchMetrics {
  total: number;
  successful: number;
  successRate: number;
  averageCompatibility: number;
  dailyStats: Array<{
    date: string;
    total: number;
    successful: number;
    successRate: number;
  }>;
}

export interface RevenueMetrics {
  daily: number;
  monthly: number;
  monthlyGrowth: number;
  averageRevenuePerUser: number;
  bySubscriptionTier: Record<string, number>;
  projections: {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
  };
}

export interface PlatformMetrics {
  users: UserMetrics;
  subscriptions: SubscriptionMetrics;
  matches: MatchMetrics;
  revenue: RevenueMetrics;
  timestamp: Date;
}

export interface AnalyticsReport {
  id: string;
  userId: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  startDate: Date;
  endDate: Date;
  metrics: PlatformMetrics;
  insights?: {
    userGrowth: MetricInsight;
    revenue: MetricInsight;
    matches: MetricInsight;
    engagement: MetricInsight;
  };
  createdAt: Date;
}

export interface MetricInsight {
  trend: 'up' | 'down' | 'stable';
  percentage: number;
  significant: boolean;
  recommendation?: string;
}

export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  timeframe?: 'day' | 'week' | 'month' | 'year';
  userType?: 'entrepreneur' | 'funder';
  subscriptionTier?: string;
}