// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.launchify.com/v1';

// Authentication
export const TOKEN_STORAGE_KEY = 'token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
export const AUTH_EXPIRY_KEY = 'authExpiry';

// Document Types
export const DOCUMENT_TYPES = {
  INVESTMENT_AGREEMENT: 'investment_agreement',
  NDA: 'nda',
  TERM_SHEET: 'term_sheet',
  SAFE: 'safe',
  CONVERTIBLE_NOTE: 'convertible_note',
  PARTNERSHIP_AGREEMENT: 'partnership_agreement',
  CUSTOM: 'custom'
};

// Document Statuses
export const DOCUMENT_STATUSES = {
  DRAFT: 'draft',
  PENDING: 'pending',
  SIGNED: 'signed',
  EXPIRED: 'expired',
  CANCELED: 'canceled'
};

// Signature Types
export const SIGNATURE_TYPES = {
  DRAWN: 'drawn',
  TYPED: 'typed',
  UPLOADED: 'uploaded'
};

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

// Date Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy HH:mm';

// File Size Limits (in bytes)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Verification Methods
export const VERIFICATION_METHODS = {
  EMAIL: 'email',
  SMS: 'sms'
};

// Timeout Durations (in milliseconds)
export const API_TIMEOUT = 30000; // 30 seconds
export const VERIFICATION_CODE_EXPIRY = 15 * 60 * 1000; // 15 minutes 