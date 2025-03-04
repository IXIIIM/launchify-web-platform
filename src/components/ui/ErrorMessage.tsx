import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  details?: string;
  onDismiss?: () => void;
  variant?: 'default' | 'destructive' | 'outline';
  showIcon?: boolean;
  className?: string;
}

/**
 * A reusable component for displaying error messages
 * Can be used to display errors from API calls, form validation, etc.
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  details,
  onDismiss,
  variant = 'destructive',
  showIcon = true,
  className = '',
}) => {
  if (!message) return null;

  return (
    <Alert variant={variant} className={`relative ${className}`}>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 p-0"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      {showIcon && <AlertCircle className="h-4 w-4" />}
      
      <AlertTitle className="font-medium">{title}</AlertTitle>
      <AlertDescription className="mt-1">
        {message}
        {details && (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer font-medium">Show details</summary>
            <pre className="mt-2 whitespace-pre-wrap rounded bg-slate-100 p-2 text-xs">
              {details}
            </pre>
          </details>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ErrorMessage; 