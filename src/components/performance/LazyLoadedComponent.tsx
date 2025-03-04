import React, { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyLoadedComponentProps {
  /**
   * Function that returns a promise which resolves to a React component
   */
  importComponent: () => Promise<{ default: ComponentType<any> }>;
  
  /**
   * Props to pass to the lazy-loaded component
   */
  componentProps?: Record<string, any>;
  
  /**
   * Custom loading component to show while the component is loading
   */
  fallback?: React.ReactNode;
  
  /**
   * Whether to prefetch the component
   */
  prefetch?: boolean;
  
  /**
   * Delay in milliseconds before showing the loading state
   */
  loadingDelay?: number;
}

/**
 * A component that lazily loads another component when it's needed
 * This helps with code splitting and improves initial load performance
 */
export function LazyLoadedComponent({
  importComponent,
  componentProps = {},
  fallback,
  prefetch = false,
  loadingDelay = 200,
}: LazyLoadedComponentProps) {
  // Create the lazy component
  const LazyComponent = lazy(importComponent);
  
  // Prefetch the component if needed
  React.useEffect(() => {
    if (prefetch) {
      // Start loading the component immediately
      importComponent();
    }
  }, [prefetch, importComponent]);
  
  // Use a delayed fallback to prevent flashing for fast loads
  const [showLoading, setShowLoading] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(true);
    }, loadingDelay);
    
    return () => clearTimeout(timer);
  }, [loadingDelay]);
  
  // Default fallback is a skeleton loader
  const defaultFallback = (
    <div className="w-full space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-8 w-3/4" />
    </div>
  );
  
  // Only show the fallback if loading takes longer than the delay
  const delayedFallback = showLoading ? (fallback || defaultFallback) : null;
  
  return (
    <Suspense fallback={delayedFallback}>
      <LazyComponent {...componentProps} />
    </Suspense>
  );
}

/**
 * Higher-order component that wraps a component with lazy loading
 */
export function withLazyLoading<P extends object>(
  importComponent: () => Promise<{ default: ComponentType<P> }>,
  options: Omit<LazyLoadedComponentProps, 'importComponent' | 'componentProps'> = {}
) {
  return function LazyLoadedWrapper(props: P) {
    return (
      <LazyLoadedComponent
        importComponent={importComponent}
        componentProps={props}
        {...options}
      />
    );
  };
}

/**
 * A component that only renders its children when they are visible in the viewport
 * This is useful for deferring the rendering of components until they are needed
 */
export function IntersectionObserverComponent({
  children,
  rootMargin = '200px',
  threshold = 0,
  onIntersect,
  once = true,
}: {
  children: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  onIntersect?: () => void;
  once?: boolean;
}) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (onIntersect) onIntersect();
          if (once && ref.current) observer.unobserve(ref.current);
        } else if (!once) {
          setIsIntersecting(false);
        }
      },
      { rootMargin, threshold }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [rootMargin, threshold, once, onIntersect]);
  
  return (
    <div ref={ref} className="w-full">
      {isIntersecting ? children : null}
    </div>
  );
} 