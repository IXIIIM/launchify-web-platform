import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from './useAuth';
import { UserRole } from '@/services/AdminService';

interface AdminWebSocketOptions {
  onRoleAccessAttempt?: (data: any) => void;
  onVerificationRequest?: (data: any) => void;
  onSecurityEvent?: (data: any) => void;
  onSubscriptionUpdate?: (data: any) => void;
  onPermissionChange?: (data: any) => void;
  onDashboardStats?: (data: any) => void;
}

export function useAdminWebSocket(options: AdminWebSocketOptions = {}) {
  const { user, isAuthenticated, token } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Determine which admin channels the user should be subscribed to
  const getAdminChannels = useCallback(() => {
    if (!user?.role) return [];
    
    const channels = [];
    
    switch(user.role) {
      case UserRole.SUPER_ADMIN:
        channels.push('admin:permissions');
        // Fall through to include ADMIN channels
        
      case UserRole.ADMIN:
        channels.push('admin:security');
        channels.push('admin:analytics');
        channels.push('admin:dashboard');
        channels.push('admin:role-access');
        // Fall through to include MODERATOR channels
        
      case UserRole.MODERATOR:
        channels.push('admin:verification');
        break;
        
      default:
        // Regular users don't get admin channels
        break;
    }
    
    return channels;
  }, [user?.role]);
  
  // Handle incoming WebSocket messages
  const handleMessage = useCallback((data: any) => {
    if (!data || !data.type) return;
    
    switch(data.type) {
      case 'role-access-attempt':
        options.onRoleAccessAttempt?.(data.data);
        break;
        
      case 'verification-request':
        options.onVerificationRequest?.(data.data);
        break;
        
      case 'security-event':
        options.onSecurityEvent?.(data.data);
        break;
        
      case 'subscription-update':
        options.onSubscriptionUpdate?.(data.data);
        break;
        
      case 'permission-change':
        options.onPermissionChange?.(data.data);
        break;
        
      case 'dashboard-stats':
        options.onDashboardStats?.(data.data);
        break;
        
      default:
        console.warn('Unknown admin WebSocket message type:', data.type);
    }
  }, [options]);
  
  // Initialize WebSocket connection
  const { state, send, subscribe } = useWebSocket(token || '', {
    onMessage: handleMessage,
    onOpen: () => {
      // Subscribe to admin channels when connection opens
      const channels = getAdminChannels();
      if (channels.length > 0) {
        subscribe(channels);
        setIsSubscribed(true);
      }
    }
  });
  
  // Re-subscribe if user role changes
  useEffect(() => {
    if (state.connected && !isSubscribed && isAuthenticated) {
      const channels = getAdminChannels();
      if (channels.length > 0) {
        subscribe(channels);
        setIsSubscribed(true);
      }
    }
  }, [state.connected, isSubscribed, isAuthenticated, user?.role, getAdminChannels, subscribe]);
  
  return {
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    isSubscribed
  };
} 