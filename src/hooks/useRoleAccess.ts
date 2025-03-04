import { useAuth } from './useAuth';
import { UserRole } from '@/services/AdminService';

interface UseRoleAccessReturn {
  hasAccess: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Custom hook for checking if the current user has the required role.
 * 
 * @param requiredRole The minimum role required for access
 * @returns Object containing access status and loading state
 */
export const useRoleAccess = (requiredRole: UserRole): UseRoleAccessReturn => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Check if user has the required role
  const hasAccess = (() => {
    if (!isAuthenticated || !user) return false;
    
    const roleHierarchy = {
      [UserRole.SUPER_ADMIN]: 4,
      [UserRole.ADMIN]: 3,
      [UserRole.MODERATOR]: 2,
      [UserRole.USER]: 1
    };

    const userRoleLevel = roleHierarchy[user.role as UserRole] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  })();

  return {
    hasAccess,
    isLoading,
    isAuthenticated
  };
};

export default useRoleAccess; 