import { useState, useEffect, useRef, RefObject } from 'react';

interface UseLazyImageOptions {
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

interface UseLazyImageResult {
  isInView: boolean;
  ref: RefObject<HTMLElement>;
  hasBeenInView: boolean;
}

/**
 * Hook for lazy loading images using IntersectionObserver
 * 
 * @param options Configuration options for the IntersectionObserver
 * @returns Object with isInView state and ref to attach to the element
 */
export const useLazyImage = ({
  rootMargin = '200px',
  threshold = 0.01,
  triggerOnce = true,
}: UseLazyImageOptions = {}): UseLazyImageResult => {
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const isVisible = entry.isIntersecting;
          
          setIsInView(isVisible);
          
          if (isVisible && !hasBeenInView) {
            setHasBeenInView(true);
          }
          
          if (isVisible && triggerOnce) {
            observer.unobserve(element);
          }
        });
      },
      { rootMargin, threshold }
    );
    
    observer.observe(element);
    
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [rootMargin, threshold, triggerOnce, hasBeenInView]);
  
  return { isInView, ref, hasBeenInView };
};

/**
 * Hook for preloading an image
 * 
 * @param src Image source URL
 * @returns Object with loaded state and error state
 */
export const useImagePreloader = (src: string) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    if (!src) {
      setLoaded(false);
      setError(false);
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      setLoaded(true);
      setError(false);
    };
    
    img.onerror = () => {
      setLoaded(false);
      setError(true);
    };
    
    img.src = src;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);
  
  return { loaded, error };
};

/**
 * Hook for progressive image loading (blur-up effect)
 * 
 * @param lowQualitySrc Low quality image source for initial load
 * @param highQualitySrc High quality image source for final display
 * @returns Object with current source and loading states
 */
export const useProgressiveImage = (lowQualitySrc: string, highQualitySrc: string) => {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!highQualitySrc) {
      setLoading(false);
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(highQualitySrc);
      setLoading(false);
    };
    
    img.src = highQualitySrc;
    
    return () => {
      img.onload = null;
    };
  }, [highQualitySrc, lowQualitySrc]);
  
  return { currentSrc, loading, isHighQuality: currentSrc === highQualitySrc };
}; 