// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

/**
 * A hook that returns true if the current viewport matches the provided media query
 * @param query The media query to check against (e.g. '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export const useMediaQuery = (query: string): boolean => {
  // Initialize with the current match state
  const [matches, setMatches] = useState<boolean>(() => {
    // Check for window to support SSR
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Update the state initially
    setMatches(mediaQuery.matches);

    // Create event listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Fallback for older browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]); // Re-run effect if query changes

  return matches;
};

// Example queries for common breakpoints
export const breakpoints = {
  xs: '(max-width: 480px)',
  sm: '(max-width: 640px)',
  md: '(max-width: 768px)',
  lg: '(max-width: 1024px)',
  xl: '(max-width: 1280px)',
  '2xl': '(max-width: 1536px)',
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  dark: '(prefers-color-scheme: dark)',
  light: '(prefers-color-scheme: light)',
  motion: '(prefers-reduced-motion: no-preference)',
  hover: '(hover: hover)',
  touch: '(hover: none) and (pointer: coarse)',
} as const;