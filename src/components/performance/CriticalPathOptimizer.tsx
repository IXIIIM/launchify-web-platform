import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useResourcePriority from '../../hooks/useResourcePriority';
import { ResourceType, PreloadOptions } from '../../utils/resourcePriority';

interface CriticalPathOptimizerProps {
  /**
   * Critical CSS URLs to preload
   */
  criticalCssUrls?: string[];
  
  /**
   * Critical script URLs to preload
   */
  criticalScriptUrls?: string[];
  
  /**
   * Critical image URLs to preload
   */
  criticalImageUrls?: string[];
  
  /**
   * Domains to preconnect to
   */
  preconnectDomains?: string[];
  
  /**
   * Whether to enable route-based resource prioritization
   */
  enableRoutePrioritization?: boolean;
  
  /**
   * Whether to add global resource hints
   */
  addGlobalHints?: boolean;
  
  /**
   * Children components
   */
  children?: React.ReactNode;
}

/**
 * Component that optimizes the critical rendering path by managing resource loading priorities
 */
const CriticalPathOptimizer: React.FC<CriticalPathOptimizerProps> = ({
  criticalCssUrls = [],
  criticalScriptUrls = [],
  criticalImageUrls = [],
  preconnectDomains = [],
  enableRoutePrioritization = true,
  addGlobalHints = true,
  children
}) => {
  const location = useLocation();
  
  // Use the resource priority hook to optimize resource loading
  useResourcePriority({
    addGlobalHints,
    routeBasedPrioritization: enableRoutePrioritization,
    preload: [
      ...criticalCssUrls.map(url => ({
        url,
        options: { 
          as: 'style' as ResourceType, 
          importance: 'high' as 'high' | 'auto' | 'low' 
        }
      })),
      ...criticalScriptUrls.map(url => ({
        url,
        options: { 
          as: 'script' as ResourceType, 
          importance: 'high' as 'high' | 'auto' | 'low' 
        }
      })),
      ...criticalImageUrls.map(url => {
        const imageType = url.endsWith('.webp') 
          ? 'image/webp' 
          : url.endsWith('.png') 
            ? 'image/png' 
            : url.endsWith('.jpg') || url.endsWith('.jpeg') 
              ? 'image/jpeg' 
              : undefined;
              
        return {
          url,
          options: { 
            as: 'image' as ResourceType, 
            importance: 'high' as 'high' | 'auto' | 'low',
            ...(imageType ? { type: imageType } : {})
          }
        };
      })
    ],
    preconnect: preconnectDomains.map(url => ({
      url,
      crossOrigin: true
    }))
  });
  
  // Log resource optimization for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('CriticalPathOptimizer: Optimizing resources for route', location.pathname);
    }
  }, [location.pathname]);
  
  // This component doesn't render anything, it just optimizes resource loading
  return <>{children}</>;
};

export default CriticalPathOptimizer; 