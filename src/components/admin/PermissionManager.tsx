<<<<<<< HEAD
// src/components/admin/PermissionManager.tsx
=======
>>>>>>> feature/security-implementation
import React, { useState, useEffect } from 'react';
import { SubscriptionTier, UserType, VerificationLevel } from '@/types/user';

interface Permission {
  id: string;
  action: string;
  resource: string;
  tier: SubscriptionTier;
  verificationLevel: VerificationLevel | null;
  createdAt: string;
  updatedAt: string;
}

export const PermissionManager: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions');
      if (!response.ok) throw new Error('Failed to fetch permissions');
      const data = await response.json();
      setPermissions(data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePermission = async (permission: Permission) => {
    try {
      const response = await fetch(`/api/admin/permissions/${permission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permission)
      });

      if (!response.ok) throw new Error('Failed to update permission');
      
<<<<<<< HEAD
      // Refresh permissions list
=======
>>>>>>> feature/security-implementation
      await fetchPermissions();
      setEditingPermission(null);
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

<<<<<<< HEAD
  const handleCreatePermission = async (permission: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permission)
      });

      if (!response.ok) throw new Error('Failed to create permission');
      
      // Refresh permissions list
      await fetchPermissions();
    } catch (error) {
      console.error('Error creating permission:', error);
=======
  const handleDeletePermission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;
    
    try {
      const response = await fetch(`/api/admin/permissions/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete permission');
      
      await fetchPermissions();
    } catch (error) {
      console.error('Error deleting permission:', error);
>>>>>>> feature/security-implementation
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Permission Management</h2>
          <button
            onClick={() => setEditingPermission({
              id: '',
              action: '',
              resource: '',
              tier: 'Basic',
              verificationLevel: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Permission
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissions.map((permission) => (
                <tr key={permission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {permission.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {permission.resource}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {permission.tier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {permission.verificationLevel || 'None'}
                  </td>
<<<<<<< HEAD
                  <td className="px-6 py-4 whitespace-nowrap text-sm text
=======
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => setEditingPermission(permission)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePermission(permission.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
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
>>>>>>> feature/security-implementation
