import { PlatformMetrics } from '../../../types/analytics';

interface TemplateData {
  metrics: PlatformMetrics;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
}

export const generateReportTemplate = (data: TemplateData): string => {
  const { metrics, startDate, endDate, generatedAt } = data;

  return `
# Platform Analytics Report

**Generated at:** ${generatedAt.toLocaleString()}
**Period:** ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}

## User Metrics
- Total Users: ${metrics.users.total}
- Active Users: ${metrics.users.activeUsers}
- Growth Rate: ${metrics.users.growthRate}%
- Retention Rate: ${metrics.users.retentionRate}%

### User Distribution
- Entrepreneurs: ${metrics.users.byType.entrepreneurs}
- Funders: ${metrics.users.byType.funders}

## Subscription Metrics
- Active Subscriptions: ${metrics.subscriptions.active}
- Churn Rate: ${metrics.subscriptions.churnRate}%
- Conversion Rate: ${metrics.subscriptions.conversionRate}%

### Subscription Distribution
${Object.entries(metrics.subscriptions.byTier)
  .map(([tier, count]) => `- ${tier}: ${count}`)
  .join('\n')}

## Match Metrics
- Total Matches: ${metrics.matches.total}
- Successful Matches: ${metrics.matches.successful}
- Success Rate: ${metrics.matches.successRate}%
- Average Compatibility: ${metrics.matches.averageCompatibility}%

## Revenue Metrics
- Daily Revenue: $${metrics.revenue.daily.toFixed(2)}
- Monthly Revenue: $${metrics.revenue.monthly.toFixed(2)}
- Monthly Growth: ${metrics.revenue.monthlyGrowth}%
- Average Revenue Per User: $${metrics.revenue.averageRevenuePerUser.toFixed(2)}

### Revenue Projections
- Next Month: $${metrics.revenue.projections.nextMonth.toFixed(2)}
- Next Quarter: $${metrics.revenue.projections.nextQuarter.toFixed(2)}
- Next Year: $${metrics.revenue.projections.nextYear.toFixed(2)}
`;
};
