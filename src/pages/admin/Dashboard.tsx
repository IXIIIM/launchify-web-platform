// src/pages/admin/Dashboard.tsx
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SubscriptionAnalytics from '@/components/admin/SubscriptionAnalytics';
import UserManagement from '@/components/admin/UserManagement';
import VerificationQueue from '@/components/admin/VerificationQueue';
import SecurityLogs from '@/components/admin/SecurityLogs';
import RoleBasedAccess from '@/components/admin/RoleBasedAccess';
import { UserRole } from '@/services/AdminService';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('analytics');

  // Access denied component to show when user doesn't have required permissions
  const AccessDenied = () => (
    <div className="container mx-auto px-4 py-8">
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don't have permission to access the admin dashboard. Please contact an administrator if you believe this is an error.
        </AlertDescription>
      </Alert>
    </div>
  );

  return (
    <RoleBasedAccess requiredRole={UserRole.ADMIN} fallback={<AccessDenied />}>
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
    </RoleBasedAccess>
  );
};

export default AdminDashboard;