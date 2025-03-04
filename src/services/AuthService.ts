import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { API_BASE_URL } from '../constants';
import { User, UserRole } from '../types/user';

// Token storage keys
const ACCESS_TOKEN_KEY = 'launchify_access_token';
const REFRESH_TOKEN_KEY = 'launchify_refresh_token';

// JWT token interface
interface JwtToken {
  sub: string; // User ID
  email: string;
  roles: UserRole[];
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}

// Auth response interface
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Registration data interface
export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  company?: string;
  phoneNumber?: string;
  acceptTerms: boolean;
}

// Login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Password reset request interface
export interface PasswordResetRequest {
  email: string;
}

// Password reset confirmation interface
export interface PasswordResetConfirmation {
  token: string;
  newPassword: string;
}

// Password change interface
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

// Two-factor authentication setup interface
export interface TwoFactorSetupResponse {
  qrCodeUrl: string;
  secret: string;
}

// Two-factor authentication verification interface
export interface TwoFactorVerificationRequest {
  code: string;
  rememberDevice?: boolean;
}

/**
 * Authentication Service
 * 
 * Handles all authentication-related operations including:
 * - User registration
 * - Login/logout
 * - Password reset
 * - Session management
 * - Token refresh
 * - Two-factor authentication
 * - Role-based access control
 */
class AuthService {
  private axiosInstance = axios.create({
    baseURL: `${API_BASE_URL}/auth`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Initialize the auth service
   * Sets up interceptors for token refresh
   */
  constructor() {
    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            const refreshed = await this.refreshToken();
            if (refreshed) {
              // Update the authorization header
              originalRequest.headers.Authorization = `Bearer ${this.getAccessToken()}`;
              // Retry the original request
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, log out the user
            this.logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Register a new user
   * @param data Registration data
   * @returns Promise with auth response
   */
  async register(data: RegistrationData): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>('/register', data);
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  /**
   * Log in a user
   * @param credentials Login credentials
   * @returns Promise with auth response
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>('/login', credentials);
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  /**
   * Log out the current user
   * Removes tokens and notifies the server
   */
  async logout(): Promise<void> {
    try {
      // Notify the server about logout (revoke tokens)
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await this.axiosInstance.post('/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear tokens regardless of server response
      this.clearTokens();
    }
  }

  /**
   * Request a password reset
   * @param data Password reset request data
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    await this.axiosInstance.post('/password-reset/request', data);
  }

  /**
   * Confirm a password reset
   * @param data Password reset confirmation data
   */
  async confirmPasswordReset(data: PasswordResetConfirmation): Promise<void> {
    await this.axiosInstance.post('/password-reset/confirm', data);
  }

  /**
   * Change the current user's password
   * @param data Password change request data
   */
  async changePassword(data: PasswordChangeRequest): Promise<void> {
    await this.axiosInstance.post('/password/change', data);
  }

  /**
   * Set up two-factor authentication
   * @returns Promise with QR code URL and secret
   */
  async setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    const response = await this.axiosInstance.post<TwoFactorSetupResponse>('/2fa/setup');
    return response.data;
  }

  /**
   * Verify two-factor authentication
   * @param data Two-factor verification data
   * @returns Promise with auth response
   */
  async verifyTwoFactor(data: TwoFactorVerificationRequest): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>('/2fa/verify', data);
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(): Promise<void> {
    await this.axiosInstance.post('/2fa/disable');
  }

  /**
   * Refresh the access token using the refresh token
   * @returns Promise<boolean> True if refresh was successful
   */
  async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return false;
    }
    
    try {
      const response = await axios.post<{ accessToken: string }>(`${API_BASE_URL}/auth/token/refresh`, {
        refreshToken,
      });
      
      if (response.data.accessToken) {
        this.setAccessToken(response.data.accessToken);
        return true;
      }
      
      return false;
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  /**
   * Check if the user is authenticated
   * @returns boolean True if the user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    try {
      const decoded = this.decodeToken(token);
      // Check if token is expired
      return decoded.exp * 1000 > Date.now();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the current user from the token
   * @returns User | null The current user or null if not authenticated
   */
  getCurrentUser(): User | null {
    const token = this.getAccessToken();
    if (!token) return null;
    
    try {
      const decoded = this.decodeToken(token);
      
      return {
        id: decoded.sub,
        email: decoded.email,
        roles: decoded.roles,
      } as User;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if the current user has a specific role
   * @param role The role to check
   * @returns boolean True if the user has the role
   */
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user !== null && user.roles.includes(role);
  }

  /**
   * Check if the current user has any of the specified roles
   * @param roles The roles to check
   * @returns boolean True if the user has any of the roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return user !== null && user.roles.some(role => roles.includes(role));
  }

  /**
   * Check if the current user has all of the specified roles
   * @param roles The roles to check
   * @returns boolean True if the user has all of the roles
   */
  hasAllRoles(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return user !== null && roles.every(role => user.roles.includes(role));
  }

  /**
   * Get the access token from storage
   * @returns string | null The access token or null if not found
   */
  private getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Get the refresh token from storage
   * @returns string | null The refresh token or null if not found
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Set the access token in storage
   * @param token The access token
   */
  private setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  /**
   * Set both tokens in storage
   * @param accessToken The access token
   * @param refreshToken The refresh token
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Clear all tokens from storage
   */
  private clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Decode a JWT token
   * @param token The token to decode
   * @returns JwtToken The decoded token
   */
  private decodeToken(token: string): JwtToken {
    return jwtDecode<JwtToken>(token);
  }
}

// Export a singleton instance
export const authService = new AuthService();
export default authService; 