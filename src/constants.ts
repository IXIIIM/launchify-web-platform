/**
 * Application-wide constants
 */

// API base URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.launchify.com/v1';

// Authentication
export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_REFRESH_TOKEN_KEY = 'refresh_token';
export const AUTH_TOKEN_EXPIRY_KEY = 'token_expiry';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
];

// Document types
export const DOCUMENT_TYPES = [
  'NDA',
  'Investment Agreement',
  'Term Sheet',
  'SAFE Agreement',
  'Convertible Note',
  'Equity Agreement',
  'Partnership Agreement',
  'Employment Agreement',
  'Contractor Agreement',
  'Other'
];

// Notification settings
export const NOTIFICATION_REFRESH_INTERVAL = 60000; // 1 minute

// Date formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy HH:mm';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  DOCUMENTS: '/documents',
  DOCUMENT_TEMPLATES: '/documents/templates',
  DOCUMENT_CREATE: '/documents/create',
  DOCUMENT_DETAIL: '/documents/:id',
  DOCUMENT_EDIT: '/documents/edit/:id',
  SIGNATURES: '/documents/signatures',
  NOTIFICATIONS: '/notifications',
  PAYMENTS: '/payments',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  VERIFICATION: '/verification',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_CONTENT: '/admin/content',
  ADMIN_REPORTS: '/admin/reports',
  CHAT: '/chat',
  CHAT_CONVERSATION: '/chat/:chatId'
}; 