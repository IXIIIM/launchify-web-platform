import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { User, Brain, Zap, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface AnalyticsData {
  matchQuality: {
    average: number;
    trend: { date: string; score: number }[];
  };
  successRate: {
    overall: number;
    byType: Record<string, number>;
    trend: { date: string; rate: number }[];
  };
  insights: {
    type: string;
    score: number;
    message: string;
    recommendations?: string[];
  }[];
  patterns: {
    timeOfDay: Record<string, number>;
    dayOfWeek: Record<string, number>;
    responseTime: Record<string, number>;
  };
}

const RecommendationAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/matches/analytics?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setData(data);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-64 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Match Quality Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Match Quality Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <LineChart
              data={data.matchQuality.trend}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={2}
              />
            </LineChart>
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Overall Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(data.successRate.overall * 100)}%
            </div>
            <div className="mt-4">
              {Object.entries(data.successRate.byType).map(([type, rate]) => (
                <div key={type} className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">{type}</span>
                  <span className="font-medium">{Math.round(rate * 100)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Activity Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Best Times</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(data.patterns.timeOfDay)
                    .sort(([_, a], [__, b]) => b - a)
                    .slice(0, 3)
                    .map(([time, score]) => (
                      <div key={time} className="p-2 bg-gray-50 rounded">
                        <div className="font-medium">{time}</div>
                        <div className="text-gray-600">{Math.round(score * 100)}% success</div>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Best Days</h4>
                <div className="space-y-2">
                  {Object.entries(data.patterns.dayOfWeek)
                    .sort(([_, a], [__, b]) => b - a)
                    .slice(0, 3)
                    .map(([day, score]) => (
                      <div key={day} className="flex justify-between">
                        <span>{day}</span>
                        <span>{Math.round(score * 100)}% success</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.insights.map((insight, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium">{insight.message}</div>
                  {insight.recommendations && (
                    <ul className="mt-2 space-y-1 text-sm">
                      {insight.recommendations.map((rec, i) => (
                        <li key={i} className="text-gray-600">• {rec}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response Time Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Response Time Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <LineChart
              data={Object.entries(data.patterns.responseTime).map(([time, rate]) => ({
                time,
                rate: rate * 100
              }))}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="rate"
                name="Success Rate"
                stroke="#2563eb"
                strokeWidth={2}
              />
            </LineChart>
          </div>
        </CardContent>
      </Card>

      {/* Timeframe Controls */}
      <div className="flex justify-end space-x-4">
        {['week', 'month', 'year'].map((t) => (
          <button
            key={t}
            onClick={() => setTimeframe(t as typeof timeframe)}
            className={`px-4 py-2 rounded-lg ${
              timeframe === t
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecommendationAnalytics;