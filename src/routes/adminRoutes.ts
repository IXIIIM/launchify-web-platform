import React, { useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { 
  Shield, 
  AlertTriangle, 
  FileCheck, 
  Users, 
  Settings,
  BarChart,
  LogOut
} from 'lucide-react';

import AdminDashboard from './AdminDashboard';
import SecurityAlertManagement from './SecurityAlertManagement';
import VerificationQueueManagement from './VerificationQueueManagement';
import SecurityLogViewer from './SecurityLogViewer';

const AdminInterface = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    {
      icon: <BarChart className="h-5 w-5" />,
      label: 'Dashboard',
      path: '/admin',
      component: AdminDashboard
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      label: 'Security Alerts',
      path: '/admin/alerts',
      component: SecurityAlertManagement
    },
    {
      icon: <FileCheck className="h-5 w-5" />,
      label: 'Verification Queue',
      path: '/admin/verifications',
      component: VerificationQueueManagement
    },
    {
      icon: <Shield className="h-5 w-5" />,
      label: 'Security Logs',
      path: '/admin/security-logs',
      component: SecurityLogViewer
    }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${
        isSidebarOpen ? 'w-64' : 'w-20'
      } bg-white shadow-lg transition-all duration-300`}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              {isSidebarOpen && (
                <span className="text-xl font-bold">Admin</span>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 ${
                      location.pathname === item.path ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {item.icon}
                    {isSidebarOpen && (
                      <span>{item.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t">
            <button
              onClick={() => navigate('/admin/settings')}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <Settings className="h-5 w-5" />
              {isSidebarOpen && (
                <span>Settings</span>
              )}
            </button>
            <button
              onClick={() => {
                // Handle logout
                navigate('/login');
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <LogOut className="h-5 w-5" />
              {isSidebarOpen && (
                <span>Logout</span>
              )}
            </button>
          </div>

          {/* Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-4 border-t text-gray-500 hover:bg-gray-50"
          >
            {isSidebarOpen ? '←' : '→'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/alerts" element={<SecurityAlertManagement />} />
            <Route path="/verifications" element={<VerificationQueueManagement />} />
            <Route path="/security-logs" element={<SecurityLogViewer />} />
          </Routes>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="w-64 bg-white shadow-lg p-4 border-l">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        
        {/* Stats Overview */}
        <div className="space-y-4 mb-6">
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">3</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Pending Verifications</p>
                <p className="text-2xl font-bold text-yellow-600">12</p>
              </div>
              <FileCheck className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-green-600">245</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <h4 className="font-medium mb-3">Recent Activity</h4>
          <div className="space-y-3">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="text-sm p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">New verification request</p>
                <p className="text-gray-500">2 minutes ago</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2">
          <button className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            View All Alerts
          </button>
          <button className="w-full p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Export Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminInterface;