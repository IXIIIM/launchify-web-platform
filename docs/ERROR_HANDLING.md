# Error Handling System

This document outlines the standardized error handling system implemented in the Launchify Web Platform. It provides a consistent approach to handling, displaying, and reporting errors across the application.

## Table of Contents

1. [Components](#components)
2. [Hooks](#hooks)
3. [Services](#services)
4. [Utilities](#utilities)
5. [Error Tracking](#error-tracking)
6. [Automatic Retry](#automatic-retry)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)

## Components

### ErrorBoundary

The `ErrorBoundary` component catches JavaScript errors in its child component tree and displays a fallback UI.

```tsx
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// Basic usage
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary 
  fallback={<CustomErrorComponent />}
  onError={(error, errorInfo) => logError(error, errorInfo)}
  onReset={() => resetState()}
>
  <YourComponent />
</ErrorBoundary>
```

### ErrorMessage

The `ErrorMessage` component displays error messages in a standardized format.

```tsx
import ErrorMessage from '@/components/ui/ErrorMessage';

// Basic usage
<ErrorMessage 
  title="Error Title"
  message="Error message details"
/>

// With additional details
<ErrorMessage 
  title="API Error"
  message="Failed to fetch data"
  details={JSON.stringify(error, null, 2)}
  variant="destructive"
  onDismiss={() => setError(null)}
/>
```

## Hooks

### useErrorHandler

A custom hook for managing errors in React components.

```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler';

function YourComponent() {
  const { error, setError, clearError, handleError } = useErrorHandler();
  
  const fetchData = async () => {
    try {
      const data = await api.getData();
      // Process data
    } catch (err) {
      handleError(err, 'Failed to fetch data');
    }
  };
  
  return (
    <div>
      {error && <ErrorMessage message={error.message} onDismiss={clearError} />}
      <button onClick={fetchData}>Fetch Data</button>
    </div>
  );
}
```

## Services

### ErrorHandlingService

The `ErrorHandlingService` provides standardized error handling across the application.

```tsx
import ErrorHandlingService, { AppError, ErrorType } from '@/services/ErrorHandlingService';

// Create a standardized error
const error = ErrorHandlingService.createError(
  ErrorType.VALIDATION,
  'Invalid input',
  { field: 'email', message: 'Invalid email format' },
  'VALIDATION_ERROR'
);

// Format error message for display
const message = ErrorHandlingService.formatErrorMessage(error);

// Report error to monitoring service
ErrorHandlingService.reportError(error);
```

### ErrorTrackingService

The `ErrorTrackingService` integrates with external error tracking providers like Sentry or LogRocket.

```tsx
import { errorTrackingService } from '@/services/ErrorTrackingService';

// Initialize the service
errorTrackingService.initialize({
  dsn: 'your-sentry-dsn',
  environment: 'production',
  release: 'v1.0.0',
});

// Set user context
errorTrackingService.setUser({
  id: 'user-123',
  email: 'user@example.com',
  role: 'admin',
});

// Capture an error
try {
  // Some code that might throw
} catch (error) {
  errorTrackingService.captureError(error, {
    component: 'UserProfile',
    action: 'updateProfile',
  });
}

// Add breadcrumb for tracking user actions
errorTrackingService.addBreadcrumb(
  'user_action',
  'User clicked save button',
  { buttonId: 'save-profile' }
);
```

## Utilities

### apiErrorHandler

The `apiErrorHandler` utility provides functions for handling API errors.

```tsx
import { 
  handleApiError, 
  withApiErrorHandling,
  isAuthError,
  isNetworkError,
  extractValidationErrors,
  getUserFriendlyErrorMessage
} from '@/utils/apiErrorHandler';

// Handle an API error
try {
  await api.updateUser(userData);
} catch (error) {
  const appError = handleApiError(error);
  console.log(appError.message);
}

// Wrap an API call with error handling
const fetchData = withApiErrorHandling(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  {
    retry: true,
    maxRetries: 3,
    onError: (error) => console.error('API error:', error),
  }
);

// Check error types
if (isAuthError(error)) {
  // Redirect to login
}

if (isNetworkError(error)) {
  // Show offline message
}

// Extract validation errors
const validationErrors = extractValidationErrors(error);
// { email: 'Invalid email format', password: 'Password too short' }

// Get user-friendly message
const message = getUserFriendlyErrorMessage(error);
```

## Error Tracking

The Launchify Web Platform includes integration with error tracking services to monitor and report errors in production.

### Features

- **Automatic Error Capture**: Uncaught exceptions and promise rejections are automatically captured
- **User Context**: Errors are associated with user information for better debugging
- **Environment Awareness**: Different handling based on development or production environment
- **Error Grouping**: Similar errors are grouped together to reduce noise
- **Custom Context**: Additional metadata can be attached to errors

### Configuration

The error tracking system can be configured in `src/config/errorTracking.ts`:

```tsx
// src/config/errorTracking.ts
export const errorTrackingConfig = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: 'v1.0.0',
  sampleRate: 0.8,
  maxBreadcrumbs: 50,
};
```

### Integration Points

Error tracking is integrated at multiple levels:

1. **Application Level**: Captures uncaught errors
2. **Component Level**: Through ErrorBoundary components
3. **API Level**: Through the apiErrorHandler utility
4. **Manual Tracking**: Using the errorTrackingService directly

## Automatic Retry

The platform includes automatic retry functionality for network requests that fail due to transient issues.

### Features

- **Exponential Backoff**: Increasing delay between retry attempts
- **Jitter**: Random delay variation to prevent thundering herd problems
- **Configurable Retries**: Customizable number of retries and conditions
- **Selective Retry**: Only retry specific types of errors (network, server)

### Usage

```tsx
import { fetchWithRetry, withRetry } from '@/utils/networkRetry';

// Retry a fetch request
const response = await fetchWithRetry('/api/data', {
  method: 'POST',
  body: JSON.stringify(data),
}, {
  maxRetries: 3,
  baseDelay: 1000,
  jitter: 0.3,
});

// Wrap any async function with retry logic
const uploadFile = withRetry(
  async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },
  {
    maxRetries: 5,
    onRetry: (error, attempt, delay) => {
      console.log(`Retrying upload (${attempt}/5) after ${delay}ms`);
    },
  }
);

// Use with API error handling
const fetchData = withApiErrorHandling(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  {
    retry: true,
    maxRetries: 3,
  }
);
```

## Usage Examples

### Basic Error Handling in Components

```tsx
import React, { useState } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { withApiErrorHandling } from '@/utils/apiErrorHandler';

function UserProfile() {
  const [user, setUser] = useState(null);
  const { error, setError, clearError, handleError } = useErrorHandler();
  
  const fetchUser = withApiErrorHandling(
    async (userId) => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      setUser(data);
    },
    {
      retry: true,
      maxRetries: 3,
      onError: setError,
    }
  );
  
  return (
    <div>
      {error && (
        <ErrorMessage 
          message={error.message} 
          onDismiss={clearError} 
        />
      )}
      <button onClick={() => fetchUser('123')}>Load Profile</button>
      {user && <UserDetails user={user} />}
    </div>
  );
}
```

### Using Higher-Order Components

```tsx
import { withErrorHandling } from '@/components/hoc/withErrorHandling';

function UserSettings({ onError }) {
  const saveSettings = async (settings) => {
    try {
      await api.updateSettings(settings);
    } catch (error) {
      onError(error);
      return false;
    }
    return true;
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Save Settings</button>
    </form>
  );
}

// Wrap component with error handling
export default withErrorHandling(UserSettings);
```

### Implementing Error Boundaries

```tsx
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { errorTrackingService } from '@/services/ErrorTrackingService';

function App() {
  const handleError = (error, errorInfo) => {
    errorTrackingService.captureError(error, { errorInfo });
  };
  
  return (
    <ErrorBoundary onError={handleError}>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          {/* Other routes */}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

## Best Practices

1. **Use Error Boundaries**: Wrap key sections of your application with ErrorBoundary components to prevent the entire app from crashing.

2. **Standardize Error Objects**: Always use the AppError class for consistent error handling.

3. **Provide User-Friendly Messages**: Use getUserFriendlyErrorMessage to display appropriate messages to users.

4. **Implement Retry Logic**: Use automatic retry for network requests that might fail due to transient issues.

5. **Track Errors in Production**: Configure error tracking to monitor issues in production environments.

6. **Add Context to Errors**: Include relevant context information when reporting errors.

7. **Handle Different Error Types**: Implement specific handling for different types of errors (auth, network, validation).

8. **Graceful Degradation**: Design components to degrade gracefully when errors occur.

9. **Log Errors Appropriately**: Log errors with appropriate severity levels.

10. **Test Error Scenarios**: Include tests for error scenarios to ensure proper handling. 