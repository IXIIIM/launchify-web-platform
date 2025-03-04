import { renderHook } from '@testing-library/react-hooks';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/services/AdminService';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth');

describe('useRoleAccess Hook', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('returns hasAccess=true when user has exact required role', () => {
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
    
    const { result } = renderHook(() => useRoleAccess(UserRole.ADMIN));
    
    expect(result.current.hasAccess).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
  
  test('returns hasAccess=true when user has higher role than required', () => {
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
    
    const { result } = renderHook(() => useRoleAccess(UserRole.ADMIN));
    
    expect(result.current.hasAccess).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
  
  test('returns hasAccess=false when user has lower role than required', () => {
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
    
    const { result } = renderHook(() => useRoleAccess(UserRole.ADMIN));
    
    expect(result.current.hasAccess).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
  
  test('returns hasAccess=false when user is not authenticated', () => {
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
    
    const { result } = renderHook(() => useRoleAccess(UserRole.ADMIN));
    
    expect(result.current.hasAccess).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });
  
  test('returns isLoading=true when auth is loading', () => {
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
    
    const { result } = renderHook(() => useRoleAccess(UserRole.ADMIN));
    
    expect(result.current.hasAccess).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });
  
  test('handles invalid user role gracefully', () => {
    // Mock the useAuth hook to return a user with an invalid role
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Invalid User', email: 'invalid@example.com', role: 'invalid_role' },
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
    
    const { result } = renderHook(() => useRoleAccess(UserRole.ADMIN));
    
    expect(result.current.hasAccess).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
}); 