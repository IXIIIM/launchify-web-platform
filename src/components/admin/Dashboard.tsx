// src/components/admin/Dashboard.tsx
import React from 'react';
import VerificationQueue from './VerificationQueue';
import SecurityLogViewer from './SecurityLogViewer';
import { PermissionManager } from './PermissionManager';
import SubscriptionAnalytics from './SubscriptionAnalytics';
import RoleAccessLogs from './RoleAccessLogs';
import RoleBasedAccess from './RoleBasedAccess';
import { UserRole } from '@/services/AdminService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Menu, X } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="relative">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-full bg-white shadow-md"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-700" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:hidden
      `}>
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <a href="#overview" onClick={() => {
                document.querySelector('[value="overview"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                setMobileMenuOpen(false);
              }} className="block p-2 hover:bg-gray-100 rounded">
                Overview
              </a>
            </li>
            <li>
              <a href="#verification" onClick={() => {
                document.querySelector('[value="verification"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                setMobileMenuOpen(false);
              }} className="block p-2 hover:bg-gray-100 rounded">
                Verification Queue
              </a>
            </li>
            <li>
              <a href="#analytics" onClick={() => {
                document.querySelector('[value="analytics"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                setMobileMenuOpen(false);
              }} className="block p-2 hover:bg-gray-100 rounded">
                Subscription Analytics
              </a>
            </li>
            <li>
              <a href="#security" onClick={() => {
                document.querySelector('[value="security"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                setMobileMenuOpen(false);
              }} className="block p-2 hover:bg-gray-100 rounded">
                Security Logs
              </a>
            </li>
            <li>
              <a href="#permissions" onClick={() => {
                document.querySelector('[value="permissions"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                setMobileMenuOpen(false);
              }} className="block p-2 hover:bg-gray-100 rounded">
                Permission Manager
              </a>
            </li>
            <li>
              <a href="#access-logs" onClick={() => {
                document.querySelector('[value="access-logs"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                setMobileMenuOpen(false);
              }} className="block p-2 hover:bg-gray-100 rounded">
                Access Logs
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="container mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6 pr-12 md:pr-0">Admin Dashboard</h1>
        
        <Tabs defaultValue="overview">
          <TabsList className="mb-4 overflow-x-auto flex-nowrap whitespace-nowrap pb-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="verification">Verification Queue</TabsTrigger>
            <TabsTrigger value="analytics">Subscription Analytics</TabsTrigger>
            <TabsTrigger value="security">Security Logs</TabsTrigger>
            <TabsTrigger value="permissions">Permission Manager</TabsTrigger>
            <TabsTrigger value="access-logs">Access Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Active Users</div>
                    <div className="text-2xl font-bold">1,234</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">New Today</div>
                    <div className="text-2xl font-bold">56</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Pending Verifications</div>
                    <div className="text-2xl font-bold">23</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-500">Security Alerts</div>
                    <div className="text-2xl font-bold">7</div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <ul className="space-y-3">
                  <li className="border-b pb-2">
                    <div className="text-sm text-gray-500">2 minutes ago</div>
                    <div>New user registration: john.doe@example.com</div>
                  </li>
                  <li className="border-b pb-2">
                    <div className="text-sm text-gray-500">15 minutes ago</div>
                    <div>Verification request submitted by user #12345</div>
                  </li>
                  <li className="border-b pb-2">
                    <div className="text-sm text-gray-500">1 hour ago</div>
                    <div>Failed login attempt from IP 192.168.1.1</div>
                  </li>
                  <li>
                    <div className="text-sm text-gray-500">2 hours ago</div>
                    <div>Role updated for user sarah.smith@example.com</div>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="verification">
            <RoleBasedAccess requiredRole={UserRole.MODERATOR}>
              <VerificationQueue />
            </RoleBasedAccess>
          </TabsContent>
          
          <TabsContent value="analytics">
            <RoleBasedAccess requiredRole={UserRole.ADMIN}>
              <SubscriptionAnalytics />
            </RoleBasedAccess>
          </TabsContent>
          
          <TabsContent value="security">
            <RoleBasedAccess requiredRole={UserRole.ADMIN}>
              <SecurityLogViewer />
            </RoleBasedAccess>
          </TabsContent>
          
          <TabsContent value="permissions">
            <RoleBasedAccess requiredRole={UserRole.SUPER_ADMIN}>
              <PermissionManager />
            </RoleBasedAccess>
          </TabsContent>
          
          <TabsContent value="access-logs">
            <RoleBasedAccess requiredRole={UserRole.SUPER_ADMIN}>
              <RoleAccessLogs />
            </RoleBasedAccess>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;

// src/components/admin/AccessLogList.tsx
export const AccessLogList: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endDate: new Date(),
    userId: '',
    resource: '',
    success: null as boolean | null
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/access-logs?' + new URLSearchParams({
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.resource && { resource: filters.resource }),
        ...(filters.success !== null && { success: filters.success.toString() })
      }));

      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.startDate.toISOString().split('T')[0]}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                startDate: new Date(e.target.value)
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.endDate.toISOString().split('T')[0]}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                endDate: new Date(e.target.value)
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">User ID</label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                userId: e.target.value
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Resource</label>
            <select
              value={filters.resource}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                resource: e.target.value
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">All</option>
              <option value="profile">Profile</option>
              <option value="match">Match</option>
              <option value="message">Message</option>
              <option value="analytics">Analytics</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.userId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.resource}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      log.success
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {log.success ? 'Success' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => {/* Show details modal */}}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Additional admin components...