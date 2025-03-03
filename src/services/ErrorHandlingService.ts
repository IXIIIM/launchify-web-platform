/**
 * ErrorHandlingService.ts
 * A service for standardized error handling across the application
 */

// Error types for categorizing errors
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
  API = 'API',
  AUTH = 'AUTH',
}

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Interface for AppError constructor options
export interface AppErrorOptions {
  message: string;
  type: ErrorType;
  code: number | string;
  originalError?: unknown;
  metadata?: Record<string, any>;
  severity?: ErrorSeverity;
}

/**
 * AppError class for standardized error handling
 */
export class AppError extends Error {
  type: ErrorType;
  code: number | string;
  originalError?: unknown;
  metadata?: Record<string, any>;
  severity: ErrorSeverity;
  timestamp: Date;
  
  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.type = options.type;
    this.code = options.code;
    this.originalError = options.originalError;
    this.metadata = options.metadata;
    this.severity = options.severity || ErrorSeverity.ERROR;
    this.timestamp = new Date();
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  /**
   * Get a user-friendly error message
   */
  getUserFriendlyMessage(): string {
    return formatErrorMessage(this);
  }
  
  /**
   * Convert the error to a plain object for logging or serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}

/**
 * Creates a standardized error object
 */
export const createError = (
  type: ErrorType,
  message: string,
  details?: unknown,
  code?: string | number,
  originalError?: unknown
): AppError => {
  return new AppError({
    type,
    message,
    code: code || 0,
    originalError,
    metadata: { details },
  });
};

/**
 * Handles API errors and converts them to standardized AppError objects
 */
export const handleApiError = (error: unknown): AppError => {
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }

  // Default error
  let appError: AppError = createError(
    ErrorType.UNKNOWN,
    'An unexpected error occurred',
    undefined,
    'UNKNOWN_ERROR',
    error
  );

  // Handle Axios/Fetch errors
  if (error && typeof error === 'object') {
    const apiError = error as any;
    
    // Extract error message
    const errorMessage = 
      apiError.data?.message || 
      apiError.data?.error || 
      apiError.statusText || 
      apiError.message ||
      'An error occurred while communicating with the server';
    
    // Determine error type based on status code
    if (apiError.status || apiError.response?.status) {
      const status = apiError.status || apiError.response?.status;
      
      switch (true) {
        case status === 401:
          appError = createError(
            ErrorType.AUTH,
            'Authentication failed. Please log in again.',
            apiError.data?.details,
            status,
            error
          );
          break;
        
        case status === 403:
          appError = createError(
            ErrorType.AUTH,
            'You do not have permission to perform this action.',
            apiError.data?.details,
            status,
            error
          );
          break;
        
        case status === 404:
          appError = createError(
            ErrorType.NOT_FOUND,
            'The requested resource was not found.',
            apiError.data?.details,
            status,
            error
          );
          break;
        
        case status >= 400 && status < 500:
          appError = createError(
            ErrorType.VALIDATION,
            errorMessage,
            apiError.data?.details,
            status,
            error
          );
          break;
        
        case status >= 500:
          appError = createError(
            ErrorType.SERVER,
            'A server error occurred. Please try again later.',
            apiError.data?.details,
            status,
            error
          );
          break;
        
        default:
          appError = createError(
            ErrorType.UNKNOWN,
            errorMessage,
            apiError.data?.details,
            status,
            error
          );
      }
    } else if (apiError.code === 'ECONNABORTED' || apiError.message?.includes('network')) {
      appError = createError(
        ErrorType.NETWORK,
        'Network error. Please check your connection and try again.',
        undefined,
        'NETWORK_ERROR',
        error
      );
    } else if (error instanceof Error) {
      // Handle standard JS errors
      appError = createError(
        ErrorType.CLIENT,
        error.message,
        error.stack,
        'CLIENT_ERROR',
        error
      );
    }
  }

  // Log the error for debugging
  console.error('API Error:', appError);
  
  return appError;
};

/**
 * Formats an error message for display
 */
export const formatErrorMessage = (error: AppError): string => {
  switch (error.type) {
    case ErrorType.AUTH:
    case ErrorType.AUTHENTICATION:
      return 'Authentication error: Please log in again.';
    
    case ErrorType.AUTHORIZATION:
      return 'Authorization error: You do not have permission to perform this action.';
    
    case ErrorType.VALIDATION:
      return `Validation error: ${error.message}`;
    
    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found.';
    
    case ErrorType.NETWORK:
      return 'Network error: Please check your connection and try again.';
    
    case ErrorType.SERVER:
      return 'Server error: Please try again later.';
    
    case ErrorType.CLIENT:
      return `Client error: ${error.message}`;
    
    default:
      return error.message || 'An unexpected error occurred.';
  }
};

/**
 * Determines if an error should be reported to error tracking services
 */
export const shouldReportError = (error: AppError): boolean => {
  // Don't report validation errors or authentication errors
  return ![ErrorType.VALIDATION, ErrorType.AUTHENTICATION, ErrorType.AUTH].includes(error.type);
};

/**
 * Reports an error to error tracking services (e.g., Sentry)
 */
export const reportError = (error: AppError): void => {
  if (shouldReportError(error)) {
    // In a real app, this would send the error to Sentry or another error tracking service
    console.error('Reporting error to tracking service:', error);
    
    // Example Sentry integration:
    // Sentry.captureException(error.originalError || error, {
    //   extra: {
    //     type: error.type,
    //     code: error.code,
    //     details: error.details,
    //   },
    // });
  }
};

// Export a default object with all functions
const ErrorHandlingService = {
  createError,
  handleApiError,
  formatErrorMessage,
  shouldReportError,
  reportError,
};

export { ErrorHandlingService };
export default ErrorHandlingService; 