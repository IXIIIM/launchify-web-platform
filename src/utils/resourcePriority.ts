/**
 * Resource Prioritization Utilities
 * 
 * This module provides utilities for optimizing resource loading through
 * preloading, prefetching, and preconnecting to improve application performance.
 */

/**
 * Resource types for preloading
 */
export type ResourceType = 'script' | 'style' | 'image' | 'font' | 'document' | 'fetch';

/**
 * Options for preloading a resource
 */
export interface PreloadOptions {
  as: ResourceType;
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  media?: string;
  importance?: 'auto' | 'high' | 'low';
}

/**
 * Preloads a resource to improve loading performance
 * @param url URL of the resource to preload
 * @param options Options for the preload
 * @returns The created link element
 */
export function preloadResource(url: string, options: PreloadOptions): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = options.as;
  
  if (options.type) {
    link.type = options.type;
  }
  
  if (options.crossOrigin) {
    link.crossOrigin = options.crossOrigin;
  }
  
  if (options.media) {
    link.media = options.media;
  }
  
  if (options.importance) {
    link.setAttribute('importance', options.importance);
  }
  
  document.head.appendChild(link);
  return link;
}

/**
 * Prefetches a resource that might be needed in the future
 * @param url URL of the resource to prefetch
 * @returns The created link element
 */
export function prefetchResource(url: string): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
  return link;
}

/**
 * Preconnects to a domain to reduce connection time
 * @param url Domain URL to preconnect to
 * @param crossOrigin Whether to include credentials
 * @returns The created link element
 */
export function preconnectToDomain(url: string, crossOrigin?: boolean): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  
  if (crossOrigin) {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
  return link;
}

/**
 * Preloads critical CSS
 * @param url URL of the CSS file
 * @returns The created link element
 */
export function preloadCriticalCSS(url: string): HTMLLinkElement {
  return preloadResource(url, {
    as: 'style',
    importance: 'high'
  });
}

/**
 * Preloads critical JavaScript
 * @param url URL of the JavaScript file
 * @returns The created link element
 */
export function preloadCriticalScript(url: string): HTMLLinkElement {
  return preloadResource(url, {
    as: 'script',
    importance: 'high'
  });
}

/**
 * Preloads critical fonts
 * @param url URL of the font file
 * @param fontType Font MIME type (e.g., 'font/woff2')
 * @returns The created link element
 */
export function preloadFont(url: string, fontType: string): HTMLLinkElement {
  return preloadResource(url, {
    as: 'font',
    type: fontType,
    crossOrigin: 'anonymous',
    importance: 'high'
  });
}

/**
 * Preloads critical images
 * @param url URL of the image
 * @param imageType Image MIME type (e.g., 'image/webp')
 * @returns The created link element
 */
export function preloadImage(url: string, imageType?: string): HTMLLinkElement {
  const options: PreloadOptions = {
    as: 'image',
    importance: 'high'
  };
  
  if (imageType) {
    options.type = imageType;
  }
  
  return preloadResource(url, options);
}

/**
 * Removes a preloaded resource
 * @param element The link element to remove
 */
export function removePreloadedResource(element: HTMLLinkElement): void {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Dynamically prioritizes resources based on the current route
 * @param route The current route
 */
export function prioritizeResourcesForRoute(route: string): void {
  // Clear any existing route-specific preloads
  clearRouteSpecificPreloads();
  
  // Common resources for all routes
  preconnectToDomain('https://fonts.googleapis.com', true);
  preconnectToDomain('https://fonts.gstatic.com', true);
  
  // Route-specific resource prioritization
  if (route.startsWith('/dashboard')) {
    // Dashboard-specific resources
    preloadCriticalScript('/static/js/dashboard.chunk.js');
    preloadCriticalCSS('/static/css/dashboard.chunk.css');
    prefetchResource('/static/js/analytics.chunk.js');
  } else if (route.startsWith('/profile')) {
    // Profile-specific resources
    preloadCriticalScript('/static/js/profile.chunk.js');
    preloadCriticalCSS('/static/css/profile.chunk.css');
  } else if (route.startsWith('/admin')) {
    // Admin-specific resources
    preloadCriticalScript('/static/js/admin.chunk.js');
    preloadCriticalCSS('/static/css/admin.chunk.css');
    prefetchResource('/static/js/analytics.chunk.js');
  }
}

// Store references to route-specific preloads for cleanup
const routeSpecificPreloads: HTMLLinkElement[] = [];

/**
 * Clears route-specific preloaded resources
 */
function clearRouteSpecificPreloads(): void {
  routeSpecificPreloads.forEach(element => {
    removePreloadedResource(element);
  });
  routeSpecificPreloads.length = 0;
}

/**
 * Adds resource hints to the document head
 */
export function addResourceHints(): void {
  // Add DNS prefetch for external domains
  const dnsPrefetchDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://cdn.jsdelivr.net',
    'https://api.launchify.com'
  ];
  
  dnsPrefetchDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
  
  // Preconnect to critical domains
  preconnectToDomain('https://fonts.googleapis.com', true);
  preconnectToDomain('https://fonts.gstatic.com', true);
  preconnectToDomain('https://api.launchify.com', true);
  
  // Preload critical assets
  preloadCriticalCSS('/static/css/main.chunk.css');
  preloadCriticalScript('/static/js/main.chunk.js');
  preloadFont('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap', 'text/css');
} 