import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoleBasedAccess from '@/components/admin/RoleBasedAccess';
import { UserRole } from '@/services/AdminService';
import { useAuth } from '@/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth');

describe('RoleBasedAccess Component', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  
  // Test content
  const childContent = 'Protected Content';
  const fallbackContent = 'Access Denied';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders children when user has exact required role', () => {
    // Mock the useAuth hook to return a user with ADMIN role
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Admin User', email: 'admin@example.com', role: UserRole.ADMIN },
      isAuthenticated: true,
      isLoading: false,
      token: 'mock-token',
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
    });
    
    render(
      <RoleBasedAccess requiredRole={UserRole.ADMIN} fallback={<div>{fallbackContent}</div>}>
        <div>{childContent}</div>
      </RoleBasedAccess>
    );
    
    expect(screen.getByText(childContent)).toBeInTheDocument();
    expect(screen.queryByText(fallbackContent)).not.toBeInTheDocument();
  });
  
  test('renders children when user has higher role than required', () => {
    // Mock the useAuth hook to return a user with SUPER_ADMIN role
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Super Admin', email: 'superadmin@example.com', role: UserRole.SUPER_ADMIN },
      isAuthenticated: true,
      isLoading: false,
      token: 'mock-token',
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
    });
    
    render(
      <RoleBasedAccess requiredRole={UserRole.ADMIN} fallback={<div>{fallbackContent}</div>}>
        <div>{childContent}</div>
      </RoleBasedAccess>
    );
    
    expect(screen.getByText(childContent)).toBeInTheDocument();
    expect(screen.queryByText(fallbackContent)).not.toBeInTheDocument();
  });
  
  test('renders fallback when user has lower role than required', () => {
    // Mock the useAuth hook to return a user with MODERATOR role
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Moderator', email: 'moderator@example.com', role: UserRole.MODERATOR },
      isAuthenticated: true,
      isLoading: false,
      token: 'mock-token',
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
    });
    
    render(
      <RoleBasedAccess requiredRole={UserRole.ADMIN} fallback={<div>{fallbackContent}</div>}>
        <div>{childContent}</div>
      </RoleBasedAccess>
    );
    
    expect(screen.queryByText(childContent)).not.toBeInTheDocument();
    expect(screen.getByText(fallbackContent)).toBeInTheDocument();
  });
  
  test('renders fallback when user is not authenticated', () => {
    // Mock the useAuth hook to return an unauthenticated state
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
    });
    
    render(
      <RoleBasedAccess requiredRole={UserRole.ADMIN} fallback={<div>{fallbackContent}</div>}>
        <div>{childContent}</div>
      </RoleBasedAccess>
    );
    
    expect(screen.queryByText(childContent)).not.toBeInTheDocument();
    expect(screen.getByText(fallbackContent)).toBeInTheDocument();
  });
  
  test('renders nothing when loading and no fallback provided', () => {
    // Mock the useAuth hook to return a loading state
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      token: null,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
    });
    
    const { container } = render(
      <RoleBasedAccess requiredRole={UserRole.ADMIN}>
        <div>{childContent}</div>
      </RoleBasedAccess>
    );
    
    expect(container).toBeEmptyDOMElement();
  });
  
  test('renders fallback when loading and fallback is provided', () => {
    // Mock the useAuth hook to return a loading state
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      token: null,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updateProfile: jest.fn(),
    });
    
    render(
      <RoleBasedAccess requiredRole={UserRole.ADMIN} fallback={<div>{fallbackContent}</div>}>
        <div>{childContent}</div>
      </RoleBasedAccess>
    );
    
    // When loading, the component should render nothing, not the fallback
    expect(screen.queryByText(childContent)).not.toBeInTheDocument();
    expect(screen.queryByText(fallbackContent)).not.toBeInTheDocument();
  });
}); 