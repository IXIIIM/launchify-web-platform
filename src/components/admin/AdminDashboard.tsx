// src/components/admin/AdminDashboard.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UserPlus, ShieldAlert, FileCheck, ActivitySquare } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    activeAlerts: 0,
    totalUsers: 0,
    securityIncidents: 0
  });
  
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
      
      setStats({
        pendingVerifications: data.pendingVerifications,
        activeAlerts: data.activeAlerts,
        totalUsers: data.totalUsers,
        securityIncidents: data.securityIncidents
      });

      setRecentAlerts(data.recentAlerts);
      setVerificationQueue(data.verificationQueue);
      setSecurityLogs(data.securityLogs);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Security Dashboard</h1>
        <p className="text-gray-600">Monitor and manage platform security</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-4">
          <CardContent className="p-0 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Pending Verifications</p>
              <h3 className="text-2xl font-bold">{stats.pendingVerifications}</h3>
            </div>
            <UserPlus className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Active Alerts</p>
              <h3 className="text-2xl font-bold">{stats.activeAlerts}</h3>
            </div>
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
            </div>
            <UserPlus className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Security Incidents</p>
              <h3 className="text-2xl font-bold">{stats.securityIncidents}</h3>
            </div>
            <ActivitySquare className="h-8 w-8 text-yellow-500" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAlerts.map((alert, index) => (
              <Alert key={index} variant={alert.severity}>
                <AlertTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  {alert.title}
                </AlertTitle>
                <AlertDescription>
                  {alert.description}
                  <div className="mt-2 text-sm text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verification Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-4 text-left">User</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Submitted</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {verificationQueue.map((request, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-4">{request.user}</td>
                    <td className="p-4">{request.type}</td>
                    <td className="p-4">{new Date(request.submitted).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="text-blue-600 hover:text-blue-800">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Security Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Security Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border-b">
                <div className={`p-2 rounded-full ${
                  log.type === 'warning' ? 'bg-yellow-100' :
                  log.type === 'error' ? 'bg-red-100' :
                  'bg-blue-100'
                }`}>
                  <ActivitySquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{log.message}</p>
                  <div className="mt-1 text-sm text-gray-500">
                    <span>{log.ip}</span> • 
                    <span className="ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
