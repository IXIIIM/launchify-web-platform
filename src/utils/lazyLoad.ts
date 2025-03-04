import React, { lazy, ComponentType, LazyExoticComponent } from 'react';
import { dynamicImport, DynamicImportOptions } from './dynamicImport';

/**
 * Utility function for lazy loading components with improved error handling and retry functionality
 * 
 * @param importFn - Dynamic import function for the component
 * @param options - Options for dynamic import (retries, delay, etc.)
 * @returns LazyExoticComponent - Lazy loaded component with preload method
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: DynamicImportOptions
): LazyExoticComponent<T> & { preload: () => void } {
  // Create a wrapped import function with retry functionality
  const importWithRetry = () => dynamicImport(importFn, options);
  
  // Create the lazy component
  const LazyComponent = lazy(importWithRetry);
  
  // Add preload method to allow preloading the component before it's rendered
  const PreloadableLazyComponent = LazyComponent as LazyExoticComponent<T> & { preload: () => void };
  
  // Add preload method to the lazy component
  PreloadableLazyComponent.preload = () => {
    // Start loading the component in the background
    importWithRetry().catch(error => {
      console.error('Error preloading component:', error);
    });
  };
  
  return PreloadableLazyComponent;
}

/**
 * Utility function to preload multiple components at once
 * 
 * @param components - Array of lazy loaded components with preload method
 */
export function preloadComponents(components: Array<LazyExoticComponent<any> & { preload: () => void }>): void {
  components.forEach(component => {
    if (typeof component.preload === 'function') {
      component.preload();
    }
  });
}

/**
 * Utility function to preload components based on user role or permissions
 * 
 * @param role - User role
 * @param roleComponentMap - Map of roles to components that should be preloaded
 */
export function preloadByRole(
  role: string,
  roleComponentMap: Record<string, Array<LazyExoticComponent<any> & { preload: () => void }>>
): void {
  const componentsToPreload = roleComponentMap[role];
  if (componentsToPreload) {
    preloadComponents(componentsToPreload);
  }
}

/**
 * Utility function to preload components based on route patterns
 * 
 * @param currentPath - Current path
 * @param routePatterns - Array of route patterns to match
 * @param components - Components to preload if any pattern matches
 */
export function preloadByRoute(
  currentPath: string,
  routePatterns: string[],
  components: Array<LazyExoticComponent<any> & { preload: () => void }>
): void {
  const shouldPreload = routePatterns.some(pattern => {
    if (pattern.includes('*')) {
      // Handle wildcard patterns
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(currentPath);
    }
    return currentPath.startsWith(pattern);
  });
  
  if (shouldPreload) {
    preloadComponents(components);
  }
} 