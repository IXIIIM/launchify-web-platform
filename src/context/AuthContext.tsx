import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { LoginCredentials, RegistrationData } from '../services/AuthService';
import { User, UserRole } from '../types/user';

// Auth context state interface
interface AuthContextState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasAllRoles: (roles: UserRole[]) => boolean;
  clearError: () => void;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextState>({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  hasRole: () => false,
  hasAnyRole: () => false,
  hasAllRoles: () => false,
  clearError: () => {},
});

// Auth provider props interface
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * 
 * Provides authentication state and methods to the application
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is authenticated
        const authenticated = authService.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          // Get current user from token
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login a user
   * @param credentials Login credentials
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);
      setIsAuthenticated(true);
      setUser(response.user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register a new user
   * @param data Registration data
   */
  const register = async (data: RegistrationData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register(data);
      setIsAuthenticated(true);
      setUser(response.user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout the current user
   */
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Logout failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if the current user has a specific role
   * @param role The role to check
   * @returns boolean True if the user has the role
   */
  const hasRole = (role: UserRole): boolean => {
    return user !== null && user.roles.includes(role);
  };

  /**
   * Check if the current user has any of the specified roles
   * @param roles The roles to check
   * @returns boolean True if the user has any of the roles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user !== null && user.roles.some(role => roles.includes(role));
  };

  /**
   * Check if the current user has all of the specified roles
   * @param roles The roles to check
   * @returns boolean True if the user has all of the roles
   */
  const hasAllRoles = (roles: UserRole[]): boolean => {
    return user !== null && roles.every(role => user.roles.includes(role));
  };

  /**
   * Clear any authentication errors
   */
  const clearError = (): void => {
    setError(null);
  };

  // Context value
  const contextValue: AuthContextState = {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 * @returns AuthContextState The auth context state
 */
export const useAuth = (): AuthContextState => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext; 