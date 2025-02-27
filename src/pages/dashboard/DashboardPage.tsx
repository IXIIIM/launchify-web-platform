// src/pages/dashboard/DashboardPage.tsx

import React, { useState, useEffect } from 'react';
import { Card, PageHeader } from './layout-components';
import { LineChart, XAxis, YAxis, CartesianGrid, Line, Tooltip, ResponsiveContainer } from 'recharts';
import { User, MessageCircle, Eye, Users } from 'lucide-react';

const DashboardPage = () => {
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all required data in parallel
        const [profileRes, matchesRes, analyticsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/matches'),
          fetch('/api/analytics/user')
        ]);

        if (!profileRes.ok || !matchesRes.ok || !analyticsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [profileData, matchesData, analyticsData] = await Promise.all([
          profileRes.json(),
          matchesRes.json(),
          analyticsRes.json()
        ]);

        setProfile(profileData);
        setMatches(matchesData);
        
      } catch (error) {
        console.error('Dashboard error:', error);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Overview of your activity and matches"
      />

      {/* Profile Overview */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          {profile?.photo ? (
            <img 
              src={profile.photo} 
              alt="Profile" 
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-500" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">
              {profile?.type === 'entrepreneur' 
                ? profile.projectName 
                : profile.name}
            </h2>
            <div className="flex space-x-2 mt-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {profile?.subscriptionTier} Plan
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                {profile?.verificationLevel} Verified
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickStat 
          icon={Users}
          label="Total Matches"
          value={matches.length}
          trend="+12%"
          trendDirection="up"
        />
        <QuickStat 
          icon={MessageCircle}
          label="Active Conversations"
          value={matches.filter(m => m.hasRecentMessages).length}
          trend="+5%"
          trendDirection="up"
        />
        <QuickStat 
          icon={Eye}
          label="Profile Views"
          value="247"
          trend="+18%"
          trendDirection="up"
        />
      </div>

      {/* Recent Matches */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Matches</h3>
        <div className="space-y-4">
          {matches.slice(0, 3).map((match) => (
            <div key={match.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <img 
                  src={match.matchedUser.photo} 
                  alt="Match" 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium">
                    {match.matchedUser.type === 'entrepreneur'
                      ? match.matchedUser.projectName
                      : match.matchedUser.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Matched {new Date(match.matchDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {match.compatibility}% Match
                </div>
                <div className="text-sm text-gray-500">
                  {match.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const QuickStat = ({ icon: Icon, label, value, trend, trendDirection }) => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
      <div className={`text-sm ${
        trendDirection === 'up' ? 'text-green-600' : 'text-red-600'
      }`}>
        {trend}
      </div>
    </div>
  </Card>
);

export default DashboardPage;