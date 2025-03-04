import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface Insight {
  title: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
  percentage?: number;
  recommendation?: string;
}

interface AnalyticsInsightsProps {
  metrics: any;
}

const AnalyticsInsights: React.FC<AnalyticsInsightsProps> = ({ metrics }) => {
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // User growth insights
    const userGrowth = ((metrics.users.total - metrics.users.previousTotal) / metrics.users.previousTotal) * 100;
    insights.push({
      title: 'User Growth',
      description: `User base has ${userGrowth > 0 ? 'grown' : 'decreased'} by ${Math.abs(userGrowth).toFixed(1)}% in the selected period`,
      trend: userGrowth > 0 ? 'up' : 'down',
      percentage: userGrowth,
      recommendation: userGrowth < 0 ? 'Consider increasing marketing efforts and user acquisition channels' : undefined
    });

    // Match success rate insights
    const matchRate = metrics.matches.successRate;
    insights.push({
      title: 'Match Success Rate',
      description: `${matchRate.toFixed(1)}% of matches result in successful connections`,
      trend: matchRate > 70 ? 'up' : matchRate > 50 ? 'neutral' : 'down',
      percentage: matchRate,
      recommendation: matchRate < 50 ? 'Review matching algorithm parameters and user feedback' : undefined
    });

    // Revenue insights
    const revenueGrowth = metrics.revenue.monthlyGrowth;
    insights.push({
      title: 'Revenue Growth',
      description: `Monthly revenue has ${revenueGrowth > 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueGrowth).toFixed(1)}%`,
      trend: revenueGrowth > 0 ? 'up' : 'down',
      percentage: revenueGrowth,
      recommendation: revenueGrowth < 0 ? 'Analyze churn rates and consider retention strategies' : undefined
    });

    // Subscription insights
    const subscriptionGrowth = ((metrics.subscriptions.active - metrics.subscriptions.previousActive) / metrics.subscriptions.previousActive) * 100;
    insights.push({
      title: 'Subscription Growth',
      description: `Active subscriptions have ${subscriptionGrowth > 0 ? 'increased' : 'decreased'} by ${Math.abs(subscriptionGrowth).toFixed(1)}%`,
      trend: subscriptionGrowth > 0 ? 'up' : 'down',
      percentage: subscriptionGrowth,
      recommendation: subscriptionGrowth < 0 ? 'Review pricing strategy and subscription benefits' : undefined
    });

    return insights;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <ArrowUpCircle className="w-6 h-6 text-green-500" />;
      case 'down':
        return <ArrowDownCircle className="w-6 h-6 text-red-500" />;
      default:
        return <MinusCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const insights = generateInsights();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Key Insights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{insight.title}</h3>
                <p className="text-gray-600 mt-1">{insight.description}</p>
              </div>
              {getTrendIcon(insight.trend)}
            </div>

            {insight.percentage !== undefined && (
              <div className="mt-4 flex items-center space-x-2">
                {insight.percentage > 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <span className={`font-semibold ${insight.percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(insight.percentage).toFixed(1)}%
                </span>
              </div>
            )}

            {insight.recommendation && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md">
                <p className="text-sm">{insight.recommendation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsInsights;