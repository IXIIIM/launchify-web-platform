import React from 'react';
import { Spinner } from './Spinner';

interface LazyLoadingFallbackProps {
  message?: string;
  spinnerSize?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Fallback component to display while lazy-loaded components are loading
 */
const LazyLoadingFallback: React.FC<LazyLoadingFallbackProps> = ({
  message = 'Loading...',
  spinnerSize = 'md',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 min-h-[200px] ${className}`}>
      <Spinner size={spinnerSize} className="mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

export default LazyLoadingFallback; 