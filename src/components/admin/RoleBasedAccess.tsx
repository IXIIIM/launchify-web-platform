import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/services/AdminService';

interface RoleBasedAccessProps {
  requiredRole: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A component that renders its children only if the current user has the required role.
 * Otherwise, it renders the fallback component or nothing.
 */
const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  requiredRole,
  children,
  fallback = null
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // If still loading auth state, render nothing
  if (isLoading) {
    return null;
  }

  // If not authenticated, render fallback
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Check if user has the required role
  const hasRequiredRole = checkUserRole(user.role, requiredRole);

  // Render children if user has the required role, otherwise render fallback
  return <>{hasRequiredRole ? children : fallback}</>;
};

/**
 * Checks if a user's role meets the required role level.
 * This follows a hierarchical approach where higher roles have access to lower role features.
 * 
 * @param userRole The user's current role
 * @param requiredRole The role required for access
 * @returns boolean indicating if the user has sufficient permissions
 */
const checkUserRole = (userRole: string, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    [UserRole.SUPER_ADMIN]: 4,
    [UserRole.ADMIN]: 3,
    [UserRole.MODERATOR]: 2,
    [UserRole.USER]: 1
  };

  const userRoleLevel = roleHierarchy[userRole as UserRole] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

  return userRoleLevel >= requiredRoleLevel;
};

export default RoleBasedAccess; 