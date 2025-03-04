import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  prioritizeResourcesForRoute,
  preloadResource,
  prefetchResource,
  preconnectToDomain,
  preloadCriticalCSS,
  preloadCriticalScript,
  preloadFont,
  preloadImage,
  removePreloadedResource,
  addResourceHints,
  PreloadOptions
} from '../utils/resourcePriority';

/**
 * Options for the useResourcePriority hook
 */
interface UseResourcePriorityOptions {
  /**
   * Whether to add global resource hints on mount
   */
  addGlobalHints?: boolean;
  
  /**
   * Whether to prioritize resources based on the current route
   */
  routeBasedPrioritization?: boolean;
  
  /**
   * Custom resources to preload
   */
  preload?: Array<{
    url: string;
    options: PreloadOptions;
  }>;
  
  /**
   * Custom resources to prefetch
   */
  prefetch?: Array<string>;
  
  /**
   * Custom domains to preconnect to
   */
  preconnect?: Array<{
    url: string;
    crossOrigin?: boolean;
  }>;
}

/**
 * Hook for optimizing resource loading through preloading, prefetching, and preconnecting
 * @param options Options for resource prioritization
 */
export function useResourcePriority(options: UseResourcePriorityOptions = {}): void {
  const location = useLocation();
  const preloadedResources = useRef<HTMLLinkElement[]>([]);
  
  // Add global resource hints on mount
  useEffect(() => {
    if (options.addGlobalHints) {
      addResourceHints();
    }
    
    return () => {
      // Clean up any resources that were preloaded
      preloadedResources.current.forEach(element => {
        removePreloadedResource(element);
      });
      preloadedResources.current = [];
    };
  }, [options.addGlobalHints]);
  
  // Prioritize resources based on the current route
  useEffect(() => {
    if (options.routeBasedPrioritization) {
      prioritizeResourcesForRoute(location.pathname);
    }
  }, [location.pathname, options.routeBasedPrioritization]);
  
  // Preload custom resources
  useEffect(() => {
    if (options.preload && options.preload.length > 0) {
      const resources = options.preload.map(({ url, options }) => {
        return preloadResource(url, options);
      });
      
      preloadedResources.current.push(...resources);
    }
    
    if (options.prefetch && options.prefetch.length > 0) {
      const resources = options.prefetch.map(url => {
        return prefetchResource(url);
      });
      
      preloadedResources.current.push(...resources);
    }
    
    if (options.preconnect && options.preconnect.length > 0) {
      const resources = options.preconnect.map(({ url, crossOrigin }) => {
        return preconnectToDomain(url, crossOrigin);
      });
      
      preloadedResources.current.push(...resources);
    }
    
    return () => {
      // Clean up any resources that were preloaded
      preloadedResources.current.forEach(element => {
        removePreloadedResource(element);
      });
      preloadedResources.current = [];
    };
  }, [options.preload, options.prefetch, options.preconnect]);
}

/**
 * Hook for preloading resources for a specific route before navigation
 * @param route The route to preload resources for
 * @param condition Condition to determine whether to preload (e.g., user role)
 */
export function useRoutePreload(route: string, condition: boolean = true): void {
  useEffect(() => {
    if (!condition) {
      return;
    }
    
    const preloadedResources: HTMLLinkElement[] = [];
    
    // Preload route-specific resources based on the route
    if (route.startsWith('/dashboard')) {
      preloadedResources.push(preloadCriticalScript('/static/js/dashboard.chunk.js'));
      preloadedResources.push(preloadCriticalCSS('/static/css/dashboard.chunk.css'));
    } else if (route.startsWith('/profile')) {
      preloadedResources.push(preloadCriticalScript('/static/js/profile.chunk.js'));
      preloadedResources.push(preloadCriticalCSS('/static/css/profile.chunk.css'));
    } else if (route.startsWith('/admin')) {
      preloadedResources.push(preloadCriticalScript('/static/js/admin.chunk.js'));
      preloadedResources.push(preloadCriticalCSS('/static/css/admin.chunk.css'));
    }
    
    return () => {
      // Clean up any resources that were preloaded
      preloadedResources.forEach(element => {
        removePreloadedResource(element);
      });
    };
  }, [route, condition]);
}

/**
 * Hook for preloading critical images
 * @param imageUrls Array of image URLs to preload
 * @param condition Condition to determine whether to preload
 */
export function useImagePreload(imageUrls: string[], condition: boolean = true): void {
  useEffect(() => {
    if (!condition || !imageUrls.length) {
      return;
    }
    
    const preloadedImages = imageUrls.map(url => {
      // Determine image type from URL extension
      const imageType = url.endsWith('.webp') 
        ? 'image/webp' 
        : url.endsWith('.png') 
          ? 'image/png' 
          : url.endsWith('.jpg') || url.endsWith('.jpeg') 
            ? 'image/jpeg' 
            : undefined;
            
      return preloadImage(url, imageType);
    });
    
    return () => {
      // Clean up any images that were preloaded
      preloadedImages.forEach(element => {
        removePreloadedResource(element);
      });
    };
  }, [imageUrls, condition]);
}

export default useResourcePriority; 