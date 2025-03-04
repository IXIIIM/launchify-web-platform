import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Search, Filter, MoreVertical } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
  id: string;
  email: string;
  userType: 'entrepreneur' | 'funder';
  subscriptionTier: string;
  verificationLevel: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastActive: string;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    userType: '',
    subscriptionTier: '',
    verificationLevel: '',
    status: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error(`Failed to ${action} user`);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    return (
      user.email.toLowerCase().includes(search.toLowerCase()) &&
      (!filters.userType || user.userType === filters.userType) &&
      (!filters.subscriptionTier || user.subscriptionTier === filters.subscriptionTier) &&
      (!filters.verificationLevel || user.verificationLevel === filters.verificationLevel) &&
      (!filters.status || user.status === filters.status)
    );
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex space-x-4">
          <div className="flex items-center rounded-lg bg-white px-3 py-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-2 outline-none"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center px-3 py-2 bg-white rounded-lg">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium">User Type</label>
                  <select
                    value={filters.userType}
                    onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300"
                  >
                    <option value="">All</option>
                    <option value="entrepreneur">Entrepreneur</option>
                    <option value="funder">Funder</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Subscription</label>
                  <select
                    value={filters.subscriptionTier}
                    onChange={(e) => setFilters(prev => ({ ...prev, subscriptionTier: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300"
                  >
                    <option value="">All</option>
                    <option value="Basic">Basic</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300"
                  >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.email}</div>
                    <div className="text-sm text-gray-500">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.userType === 'entrepreneur'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.userType}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.subscriptionTier === 'Platinum'
                      ? 'bg-purple-100 text-purple-800'
                      : user.subscriptionTier === 'Gold'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.subscriptionTier}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.verificationLevel === 'None'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.verificationLevel}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : user.status === 'suspended'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.status}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(user.lastActive).toLocaleString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <MoreVertical className="h-5 w-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleAction(user.id, 'view')}>
                        View Details
                      </DropdownMenuItem>
                      {user.status === 'active' ? (
                        <DropdownMenuItem 
                          onClick={() => handleAction(user.id, 'suspend')}
                          className="text-red-600"
                        >
                          Suspend User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => handleAction(user.id, 'activate')}
                          className="text-green-600"
                        >
                          Activate User
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleAction(user.id, 'delete')}>
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}