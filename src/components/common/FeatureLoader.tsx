import React, { Suspense, lazy, ComponentType, LazyExoticComponent } from 'react';
import LazyLoadingFallback from '../ui/LazyLoadingFallback';

interface FeatureLoaderProps {
  featureName: string;
  loadingMessage?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * A component that wraps feature-specific components with Suspense for code splitting
 * 
 * This component helps organize code splitting by feature, making it easier to
 * load only the code needed for specific features when they are used.
 */
const FeatureLoader: React.FC<FeatureLoaderProps> = ({
  featureName,
  loadingMessage = 'Loading feature...',
  fallback = <LazyLoadingFallback message={loadingMessage} />,
  children,
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

/**
 * A higher-order component that wraps a component with FeatureLoader
 * 
 * @param Component - The component to wrap
 * @param featureName - The name of the feature
 * @param loadingMessage - Optional loading message
 * @returns A wrapped component with FeatureLoader
 */
export function withFeatureLoader<P extends object>(
  Component: ComponentType<P>,
  featureName: string,
  loadingMessage?: string
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <FeatureLoader featureName={featureName} loadingMessage={loadingMessage}>
      <Component {...props} />
    </FeatureLoader>
  );
  
  // Copy display name for better debugging
  WrappedComponent.displayName = `WithFeatureLoader(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
}

/**
 * A utility function to lazy load a component by feature
 * 
 * @param importFn - The import function for the component
 * @param featureName - The name of the feature
 * @param loadingMessage - Optional loading message
 * @returns A lazy loaded component
 */
export function lazyLoadFeature<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  featureName: string,
  loadingMessage?: string
): LazyExoticComponent<T> & { preload: () => void } {
  const LazyComponent = lazy(importFn);
  
  // Add preload method to allow preloading the component before it's rendered
  const PreloadableLazyComponent = LazyComponent as LazyExoticComponent<T> & { preload: () => void };
  
  // Add preload method to the lazy component
  PreloadableLazyComponent.preload = () => {
    // Start loading the component in the background
    importFn().catch(error => {
      console.error(`Error preloading ${featureName} feature:`, error);
    });
  };
  
  return PreloadableLazyComponent;
}

export default FeatureLoader; 