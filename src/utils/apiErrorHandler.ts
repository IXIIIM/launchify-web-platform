import { ErrorHandlingService, AppError, ErrorType } from '@/services/ErrorHandlingService';
import { errorTrackingService } from '@/services/ErrorTrackingService';
import { withRetry } from './networkRetry';

/**
 * Handles API errors and returns a standardized AppError
 * @param error The error from an API call
 * @returns A standardized AppError
 */
export function handleApiError(error: any): AppError {
  // Log the error to the error tracking service
  errorTrackingService.captureError(error);

  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }

  // Handle Axios errors
  if (error.isAxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Authentication errors
    if (status === 401) {
      return new AppError({
        message: 'Authentication required',
        type: ErrorType.AUTH,
        code: 401,
        originalError: error,
      });
    }

    // Authorization errors
    if (status === 403) {
      return new AppError({
        message: 'You do not have permission to perform this action',
        type: ErrorType.AUTH,
        code: 403,
        originalError: error,
      });
    }

    // Validation errors
    if (status === 400 && data?.errors) {
      return new AppError({
        message: 'Validation error',
        type: ErrorType.VALIDATION,
        code: 400,
        originalError: error,
        metadata: { validationErrors: data.errors },
      });
    }

    // Server errors
    if (status >= 500) {
      return new AppError({
        message: 'Server error',
        type: ErrorType.SERVER,
        code: status,
        originalError: error,
      });
    }

    // Network errors
    if (error.code === 'ECONNABORTED' || !error.response) {
      return new AppError({
        message: 'Network error',
        type: ErrorType.NETWORK,
        code: 0,
        originalError: error,
      });
    }

    // Generic API error
    return new AppError({
      message: data?.message || 'API error',
      type: ErrorType.API,
      code: status || 0,
      originalError: error,
    });
  }

  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError({
      message: 'Network error',
      type: ErrorType.NETWORK,
      code: 0,
      originalError: error,
    });
  }

  // Handle other errors
  return new AppError({
    message: error.message || 'Unknown error',
    type: ErrorType.UNKNOWN,
    code: 0,
    originalError: error,
  });
}

/**
 * Higher-order function that wraps an API call with error handling
 * @param apiCall The API call function to wrap
 * @returns A function that returns a promise that resolves with the API call result or throws a standardized AppError
 */
export function withApiErrorHandling<T extends (...args: any[]) => Promise<any>>(
  apiCall: T,
  options: {
    retry?: boolean;
    maxRetries?: number;
    onError?: (error: AppError) => void;
  } = {}
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  // Create a function that handles errors
  const handleErrorFn = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await apiCall(...args);
    } catch (error) {
      const appError = handleApiError(error);
      
      // Call the onError callback if provided
      if (options.onError) {
        options.onError(appError);
      }
      
      throw appError;
    }
  };
  
  // If retry is enabled, wrap with retry functionality
  if (options.retry) {
    return withRetry(handleErrorFn, {
      maxRetries: options.maxRetries || 3,
      shouldRetry: (error) => isNetworkError(error) || isServerError(error),
      onRetry: (error, attempt, delay) => {
        console.log(`Retrying API call (attempt ${attempt}) after ${delay}ms due to:`, error.message);
      }
    });
  }
  
  return handleErrorFn;
}

/**
 * Checks if the provided error is an authentication error
 * @param error The error to check
 * @returns True if the error is an authentication error
 */
export function isAuthError(error: any): boolean {
  if (error instanceof AppError) {
    return error.type === ErrorType.AUTH;
  }
  
  if (error.isAxiosError) {
    return error.response?.status === 401 || error.response?.status === 403;
  }
  
  return false;
}

/**
 * Checks if the provided error is a network error
 * @param error The error to check
 * @returns True if the error is a network error
 */
export function isNetworkError(error: any): boolean {
  if (error instanceof AppError) {
    return error.type === ErrorType.NETWORK;
  }
  
  if (error.isAxiosError) {
    return error.code === 'ECONNABORTED' || !error.response;
  }
  
  if (error instanceof TypeError) {
    return error.message.includes('fetch');
  }
  
  return false;
}

/**
 * Checks if the provided error is a server error
 * @param error The error to check
 * @returns True if the error is a server error
 */
export function isServerError(error: any): boolean {
  if (error instanceof AppError) {
    return error.type === ErrorType.SERVER;
  }
  
  if (error.isAxiosError) {
    return error.response?.status >= 500;
  }
  
  return false;
}

/**
 * Extracts validation errors from an API error
 * @param error The error to extract validation errors from
 * @returns An object with field names as keys and error messages as values
 */
export function extractValidationErrors(error: any): Record<string, string> {
  if (error instanceof AppError && error.type === ErrorType.VALIDATION) {
    return error.metadata?.validationErrors || {};
  }
  
  if (error.isAxiosError && error.response?.status === 400) {
    return error.response.data?.errors || {};
  }
  
  return {};
}

/**
 * Gets a user-friendly error message based on the provided error
 * @param error The error to get a message for
 * @returns A user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (isAuthError(error)) {
    return 'Please sign in to continue';
  }
  
  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (isServerError(error)) {
    return 'Server error. Our team has been notified.';
  }
  
  return error.message || 'An unexpected error occurred';
}

// Export a default object with all functions
const apiErrorHandler = {
  handleApiError,
  withApiErrorHandling,
  isAuthError,
  isNetworkError,
  isServerError,
  extractValidationErrors,
  getUserFriendlyErrorMessage,
};

export default apiErrorHandler; 