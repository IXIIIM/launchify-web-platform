// src/pages/admin/Dashboard.tsx
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubscriptionAnalytics from '@/components/admin/SubscriptionAnalytics';
import UserManagement from '@/components/admin/UserManagement';
import VerificationQueue from '@/components/admin/VerificationQueue';
import SecurityLogs from '@/components/admin/SecurityLogs';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="verification">Verification Queue</TabsTrigger>
          <TabsTrigger value="security">Security Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <SubscriptionAnalytics />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="verification">
          <VerificationQueue />
        </TabsContent>

        <TabsContent value="security">
          <SecurityLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;