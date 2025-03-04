import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../common/LoadingScreen';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectAuthenticated?: boolean;
  redirectPath?: string;
}

/**
 * Public Route Component
 * 
 * For routes that should be accessible to all users
 * Optionally redirects authenticated users to a specified path (e.g., dashboard)
 */
const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectAuthenticated = true,
  redirectPath = '/dashboard'
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading screen while auth state is being determined
  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  // If user is authenticated and we should redirect authenticated users
  if (isAuthenticated && redirectAuthenticated) {
    // Get the intended destination from location state, or use the default redirectPath
    const from = location.state?.from || redirectPath;
    return <Navigate to={from} replace />;
  }

  // Render children for unauthenticated users or when redirectAuthenticated is false
  return <>{children}</>;
};

export default PublicRoute; 