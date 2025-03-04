/**
 * ErrorTrackingService.ts
 * 
 * This service provides integration with external error tracking services
 * like Sentry, LogRocket, or other monitoring tools.
 */

import { AppError } from './ErrorHandlingService';

// Define the interface for error tracking configuration
interface ErrorTrackingConfig {
  dsn?: string;
  environment?: 'development' | 'staging' | 'production';
  release?: string;
  debug?: boolean;
  sampleRate?: number;
  maxBreadcrumbs?: number;
}

// Define the interface for user context that can be attached to errors
interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
}

/**
 * ErrorTrackingService class for handling error tracking and reporting
 */
class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private initialized: boolean = false;
  private config: ErrorTrackingConfig = {};
  private userContext: UserContext | null = null;
  
  // Private constructor to enforce singleton pattern
  private constructor() {}
  
  /**
   * Get the singleton instance of ErrorTrackingService
   */
  public static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }
  
  /**
   * Initialize the error tracking service with configuration
   * @param config Configuration options for the error tracking service
   */
  public initialize(config: ErrorTrackingConfig): void {
    if (this.initialized) {
      console.warn('ErrorTrackingService already initialized');
      return;
    }
    
    this.config = config;
    
    try {
      // Initialize Sentry or other error tracking service here
      // This is a placeholder for actual implementation
      console.log('Initializing error tracking service with config:', config);
      
      // Example Sentry initialization (commented out)
      /*
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        release: config.release,
        debug: config.debug || false,
        sampleRate: config.sampleRate || 1.0,
        maxBreadcrumbs: config.maxBreadcrumbs || 100,
      });
      */
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize error tracking service:', error);
    }
  }
  
  /**
   * Set user context for error tracking
   * @param user User information to attach to error reports
   */
  public setUser(user: UserContext | null): void {
    this.userContext = user;
    
    // Example Sentry user context (commented out)
    /*
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    } else {
      Sentry.setUser(null);
    }
    */
  }
  
  /**
   * Capture and report an error to the tracking service
   * @param error Error object to report
   * @param context Additional context information
   */
  public captureError(error: Error | AppError, context: Record<string, any> = {}): void {
    if (!this.initialized) {
      console.warn('ErrorTrackingService not initialized');
      return;
    }
    
    try {
      // Add user context to the error context if available
      const errorContext = {
        ...context,
        user: this.userContext || undefined,
      };
      
      // Log the error to console in development
      if (this.config.environment === 'development') {
        console.error('Error captured:', error, errorContext);
      }
      
      // Example Sentry error capture (commented out)
      /*
      Sentry.withScope((scope) => {
        // Add extra context to the error
        Object.entries(errorContext).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
        
        // Set error level based on AppError type if available
        if (error instanceof AppError) {
          scope.setLevel(error.level || 'error');
          scope.setTag('error.type', error.type);
          scope.setTag('error.code', error.code.toString());
        }
        
        Sentry.captureException(error);
      });
      */
    } catch (captureError) {
      console.error('Failed to capture error:', captureError);
    }
  }
  
  /**
   * Add breadcrumb for tracking user actions leading up to an error
   * @param category Breadcrumb category
   * @param message Breadcrumb message
   * @param data Additional data for the breadcrumb
   */
  public addBreadcrumb(category: string, message: string, data: Record<string, any> = {}): void {
    if (!this.initialized) {
      return;
    }
    
    // Example Sentry breadcrumb (commented out)
    /*
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
    });
    */
  }
  
  /**
   * Flush any pending error reports
   * Useful before the application closes
   */
  public async flush(): Promise<boolean> {
    if (!this.initialized) {
      return true;
    }
    
    try {
      // Example Sentry flush (commented out)
      // await Sentry.flush(2000);
      return true;
    } catch (error) {
      console.error('Failed to flush error reports:', error);
      return false;
    }
  }
}

// Export the singleton instance
export const errorTrackingService = ErrorTrackingService.getInstance();

// Export types
export type { ErrorTrackingConfig, UserContext }; 