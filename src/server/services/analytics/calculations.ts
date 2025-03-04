import { Subscription, User } from '@prisma/client';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';

interface SubscriptionWithUser extends Subscription {
  user: User;
}

const TIER_PRICES = {
  Basic: { entrepreneur: 0, funder: 0 },
  Chrome: { entrepreneur: 25, funder: 100 },
  Bronze: { entrepreneur: 50, funder: 200 },
  Silver: { entrepreneur: 75, funder: 300 },
  Gold: { entrepreneur: 100, funder: 500 },
  Platinum: { entrepreneur: 200, funder: 1000 }
};

export const calculateRevenueByTier = (
  subscriptions: SubscriptionWithUser[],
  date: Date
): number => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  return subscriptions.reduce((total, subscription) => {
    // Only count active subscriptions within the date range
    if (
      subscription.status === 'active' &&
      isWithinInterval(date, {
        start: subscription.createdAt,
        end: subscription.currentPeriodEnd
      })
    ) {
      const price = TIER_PRICES[subscription.tier as keyof typeof TIER_PRICES];
      return total + price[subscription.user.userType as 'entrepreneur' | 'funder'];
    }
    return total;
  }, 0);
};

export const calculateChurnRate = (
  activeSubscriptions: number,
  canceledSubscriptions: number
): number => {
  if (activeSubscriptions === 0) return 0;
  return (canceledSubscriptions / (activeSubscriptions + canceledSubscriptions)) * 100;
};

export const calculateUserRetention = (
  currentUsers: number,
  newUsers: number,
  previousUsers: number
): number => {
  if (previousUsers === 0) return 0;
  return ((currentUsers - newUsers) / previousUsers) * 100;
};

export const calculateMatchQuality = (matches: any[]): number => {
  if (matches.length === 0) return 0;
  
  const totalCompatibility = matches.reduce((sum, match) => sum + match.compatibility, 0);
  return totalCompatibility / matches.length;
};

export const calculateEngagementScore = (
  messagesCount: number,
  matchesCount: number,
  profileViewsCount: number
): number => {
  // Weighted scoring system
  const messageWeight = 0.4;
  const matchWeight = 0.4;
  const viewWeight = 0.2;

  const messageScore = Math.min(messagesCount / 100, 1) * messageWeight * 100;
  const matchScore = Math.min(matchesCount / 20, 1) * matchWeight * 100;
  const viewScore = Math.min(profileViewsCount / 50, 1) * viewWeight * 100;

  return messageScore + matchScore + viewScore;
};