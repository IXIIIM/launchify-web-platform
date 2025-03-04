/**
 * Authentication utility functions
 */

/**
 * Retrieves the authentication token from localStorage
 * @returns The authentication token or null if not found
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Sets the authentication token in localStorage
 * @param token The token to store
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

/**
 * Removes the authentication token from localStorage
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

/**
 * Checks if the user is authenticated
 * @returns True if the user has a valid auth token
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!token;
};

/**
 * Parses the JWT token to get user information
 * @param token The JWT token
 * @returns The decoded token payload or null if invalid
 */
export const parseToken = (token: string): any | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

/**
 * Gets the current user's ID from the token
 * @returns The user ID or null if not authenticated
 */
export const getCurrentUserId = (): string | null => {
  const token = getAuthToken();
  if (!token) return null;
  
  const decoded = parseToken(token);
  return decoded?.sub || null;
};

/**
 * Checks if the token is expired
 * @returns True if the token is expired or invalid
 */
export const isTokenExpired = (): boolean => {
  const token = getAuthToken();
  if (!token) return true;
  
  const decoded = parseToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}; 