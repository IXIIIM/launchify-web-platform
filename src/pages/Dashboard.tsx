import React, { useState, useEffect } from 'react';

interface DashboardData {
  profileInfo: {
    name: string;
    userType: 'entrepreneur' | 'funder';
    subscriptionTier: string;
  };
  matches: {
    total: number;
    recent: Array<{
      id: string;
      name: string;
      compatibility: number;
    }>;
  };
  analytics: {
    profileViews: number;
    matchRate: number;
    activeChats: number;
  };
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>No data available</div>;
  }

  return (
    <div className="p-6">
      {/* Profile Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Profile Overview</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold">{data.profileInfo.name}</h3>
          <p>{data.profileInfo.userType}</p>
          <p>{data.profileInfo.subscriptionTier} Plan</p>
        </div>
      </div>

      {/* Analytics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Analytics</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="font-semibold">Profile Views</h4>
            <p className="text-2xl">{data.analytics.profileViews}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="font-semibold">Match Rate</h4>
            <p className="text-2xl">{data.analytics.matchRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="font-semibold">Active Chats</h4>
            <p className="text-2xl">{data.analytics.activeChats}</p>
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Matches</h2>
        <div className="bg-white rounded-lg shadow">
          {data.matches.recent.map(match => (
            <div key={match.id} className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">{match.name}</h4>
                <span>{match.compatibility}% Match</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;