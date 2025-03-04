// src/context/AdminContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminStats {
  activeAlerts: number;
  pendingVerifications: number;
  activeUsers: number;
  securityIncidents: number;
}

interface AdminContextType {
  stats: AdminStats;
  recentActivity: any[];
  refreshStats: () => Promise<void>;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<AdminStats>({
    activeAlerts: 0,
    pendingVerifications: 0,
    activeUsers: 0,
    securityIncidents: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch admin stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/recent-activity');
      if (!response.ok) throw new Error('Failed to fetch recent activity');
      
      const data = await response.json();
      setRecentActivity(data);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const refreshStats = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchStats(),
      fetchRecentActivity()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return (
    <AdminContext.Provider
      value={{
        stats,
        recentActivity,
        refreshStats,
        isLoading
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

// WebSocket connection for real-time updates
let ws: WebSocket | null = null;

export const connectAdminWebSocket = () => {
  if (ws) return;

  ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:8080');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'STATS_UPDATE':
        // Update stats in all components using the context
        break;
      case 'NEW_ACTIVITY':
        // Add new activity to the recent activity list
        break;
      case 'SECURITY_ALERT':
        // Handle new security alerts
        break;
    }
  };

  ws.onclose = () => {
    // Attempt to reconnect after a delay
    setTimeout(connectAdminWebSocket, 5000);
  };
};

export const disconnectAdminWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
};