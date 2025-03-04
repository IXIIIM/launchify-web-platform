/**
 * networkRetry.ts
 * 
 * Utility functions for handling network requests with automatic retry capabilities
 */

import { isNetworkError } from './apiErrorHandler';

/**
 * Configuration options for retry behavior
 */
interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  
  /** Base delay in milliseconds between retries (will be exponentially increased) */
  baseDelay?: number;
  
  /** Maximum delay in milliseconds between retries */
  maxDelay?: number;
  
  /** Jitter factor to add randomness to retry delays (0-1) */
  jitter?: number;
  
  /** Function to determine if a specific error should trigger a retry */
  shouldRetry?: (error: any, attemptNumber: number) => boolean;
  
  /** Callback function that will be called before each retry attempt */
  onRetry?: (error: any, attemptNumber: number, delay: number) => void;
}

/**
 * Default retry options
 */
const defaultRetryOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  jitter: 0.3, // 30% randomness
  shouldRetry: (error) => isNetworkError(error),
  onRetry: () => {},
};

/**
 * Calculate the delay before the next retry attempt using exponential backoff with jitter
 * 
 * @param attempt Current attempt number (starting from 1)
 * @param options Retry options
 * @returns Delay in milliseconds
 */
function calculateRetryDelay(attempt: number, options: Required<RetryOptions>): number {
  // Calculate exponential backoff: baseDelay * 2^(attempt-1)
  const exponentialDelay = options.baseDelay * Math.pow(2, attempt - 1);
  
  // Apply maximum delay cap
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);
  
  // Apply jitter to prevent thundering herd problem
  // Formula: delay = random_between(delay * (1 - jitter), delay * (1 + jitter))
  const min = cappedDelay * (1 - options.jitter);
  const max = cappedDelay * (1 + options.jitter);
  const jitteredDelay = min + Math.random() * (max - min);
  
  return Math.floor(jitteredDelay);
}

/**
 * Wait for the specified amount of time
 * 
 * @param ms Time to wait in milliseconds
 * @returns Promise that resolves after the specified time
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps an async function with retry logic
 * 
 * @param fn The async function to retry
 * @param options Retry options
 * @returns A new function that will retry the original function on failure
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  // Merge provided options with defaults
  const retryOptions: Required<RetryOptions> = {
    ...defaultRetryOptions,
    ...options,
  };
  
  // Return a new function with retry logic
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let lastError: any;
    
    // Try the initial request plus retries
    for (let attempt = 1; attempt <= retryOptions.maxRetries + 1; attempt++) {
      try {
        // Attempt to execute the function
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        // Check if we've used all retry attempts
        if (attempt > retryOptions.maxRetries) {
          throw error; // No more retries, propagate the error
        }
        
        // Check if this error should trigger a retry
        if (!retryOptions.shouldRetry(error, attempt)) {
          throw error; // Don't retry this type of error
        }
        
        // Calculate delay for this retry attempt
        const delay = calculateRetryDelay(attempt, retryOptions);
        
        // Call the onRetry callback
        retryOptions.onRetry(error, attempt, delay);
        
        // Wait before the next retry
        await wait(delay);
      }
    }
    
    // This should never be reached due to the throw in the loop,
    // but TypeScript needs it for type safety
    throw lastError;
  };
}

/**
 * Wraps a fetch request with retry logic
 * 
 * @param input Request input (URL or Request object)
 * @param init Request init options
 * @param options Retry options
 * @returns Promise that resolves to the fetch Response
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  const fetchFn = () => fetch(input, init);
  const retryFetch = withRetry(fetchFn, options);
  return retryFetch();
}

/**
 * Creates an Axios request interceptor that adds retry capability
 * This is a placeholder for actual Axios implementation
 * 
 * @param options Retry options
 * @returns Object with setup and cleanup methods
 */
export function setupAxiosRetryInterceptor(options?: RetryOptions) {
  // This is a placeholder for actual Axios implementation
  // In a real implementation, this would add interceptors to Axios
  
  return {
    setup: () => {
      console.log('Setting up Axios retry interceptor with options:', options);
      // Return an interceptor ID that would be used for cleanup
      return 1;
    },
    cleanup: (interceptorId: number) => {
      console.log('Cleaning up Axios retry interceptor:', interceptorId);
    }
  };
} 