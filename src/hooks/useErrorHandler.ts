import { useState, useCallback } from 'react';

interface ErrorState {
  hasError: boolean;
  message: string;
  details?: unknown;
}

interface ErrorHandlerReturn {
  error: ErrorState;
  setError: (message: string, details?: unknown) => void;
  clearError: () => void;
  handleError: (error: unknown) => void;
  withErrorHandling: <T extends (...args: any[]) => Promise<any>>(fn: T) => (...args: Parameters<T>) => Promise<ReturnType<T>>;
}

/**
 * Custom hook for handling errors in React components
 * Provides functions for setting, clearing, and handling errors
 * Also provides a higher-order function for wrapping async functions with error handling
 */
export const useErrorHandler = (): ErrorHandlerReturn => {
  const [error, setErrorState] = useState<ErrorState>({
    hasError: false,
    message: '',
  });

  // Set an error with a message and optional details
  const setError = useCallback((message: string, details?: unknown) => {
    setErrorState({
      hasError: true,
      message,
      details,
    });
    
    // Log the error to the console for debugging
    console.error('Error:', message, details);
  }, []);

  // Clear the current error
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      message: '',
    });
  }, []);

  // Handle an unknown error, extracting a message if possible
  const handleError = useCallback((error: unknown) => {
    let message = 'An unknown error occurred';
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String((error as { message: unknown }).message);
    }
    
    setError(message, error);
  }, [setError]);

  // Higher-order function to wrap async functions with error handling
  const withErrorHandling = useCallback(<T extends (...args: any[]) => Promise<any>>(fn: T) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error);
        throw error; // Re-throw the error for the caller to handle if needed
      }
    };
  }, [handleError]);

  return {
    error,
    setError,
    clearError,
    handleError,
    withErrorHandling,
  };
};

export default useErrorHandler; 