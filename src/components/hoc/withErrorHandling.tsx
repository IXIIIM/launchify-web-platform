import React, { ComponentType, useState, useCallback } from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { AppError, ErrorType, createError } from '@/services/ErrorHandlingService';

interface WithErrorHandlingProps {
  onError?: (error: AppError) => void;
}

/**
 * Higher-order component that wraps a component with error handling functionality
 * Provides error boundary and error state management
 */
export const withErrorHandling = <P extends object>(
  Component: ComponentType<P & WithErrorHandlingState>
) => {
  // Return a new component with error handling
  const WithErrorHandling: React.FC<P & WithErrorHandlingProps> = (props) => {
    const [error, setErrorState] = useState<AppError | null>(null);

    // Set an error
    const setError = useCallback((errorOrMessage: AppError | string, details?: unknown) => {
      // If the error is a string, create an AppError object
      const appError = typeof errorOrMessage === 'string'
        ? createError(ErrorType.CLIENT, errorOrMessage, details)
        : errorOrMessage;
      
      // Set the error state
      setErrorState(appError);
      
      // Call the onError prop if provided
      if (props.onError) {
        props.onError(appError);
      }
    }, [props.onError]);

    // Clear the error
    const clearError = useCallback(() => {
      setErrorState(null);
    }, []);

    // Handle an error
    const handleError = useCallback((error: unknown) => {
      let appError: AppError;
      
      if (error instanceof Error) {
        appError = createError(
          ErrorType.CLIENT,
          error.message,
          error.stack
        );
      } else if (typeof error === 'string') {
        appError = createError(
          ErrorType.CLIENT,
          error
        );
      } else {
        appError = createError(
          ErrorType.UNKNOWN,
          'An unknown error occurred',
          error
        );
      }
      
      setError(appError);
    }, [setError]);

    // Reset the error boundary
    const resetErrorBoundary = useCallback(() => {
      clearError();
    }, [clearError]);

    // Handle error boundary errors
    const onErrorBoundaryError = useCallback((error: Error) => {
      handleError(error);
    }, [handleError]);

    return (
      <ErrorBoundary
        onReset={resetErrorBoundary}
        onError={onErrorBoundaryError}
      >
        <Component
          {...props as P}
          error={error}
          setError={setError}
          clearError={clearError}
          handleError={handleError}
        />
      </ErrorBoundary>
    );
  };

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithErrorHandling.displayName = `withErrorHandling(${displayName})`;

  return WithErrorHandling;
};

// State interface for components wrapped with withErrorHandling
export interface WithErrorHandlingState {
  error: AppError | null;
  setError: (errorOrMessage: AppError | string, details?: unknown) => void;
  clearError: () => void;
  handleError: (error: unknown) => void;
}

export default withErrorHandling; 