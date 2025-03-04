import { useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface DeviceDetectReturn {
  // Current breakpoint
  breakpoint: Breakpoint;
  
  // Boolean checks for screen sizes
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Specific breakpoint checks
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  
  // Utility functions
  up: (breakpoint: Breakpoint) => boolean;
  down: (breakpoint: Breakpoint) => boolean;
  between: (start: Breakpoint, end: Breakpoint) => boolean;
  only: (breakpoint: Breakpoint) => boolean;
  
  // Window dimensions
  width: number;
  height: number;
}

/**
 * Custom hook for responsive design
 * Provides utilities to check current screen size and adapt UI accordingly
 */
export function useDeviceDetect(): DeviceDetectReturn {
  const theme = useTheme();
  
  // Media query matches
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));
  
  // Determine current breakpoint
  let breakpoint: Breakpoint = 'xs';
  if (isXl) breakpoint = 'xl';
  else if (isLg) breakpoint = 'lg';
  else if (isMd) breakpoint = 'md';
  else if (isSm) breakpoint = 'sm';
  
  // Simplified device categories
  const isMobile = isXs;
  const isTablet = isSm || isMd;
  const isDesktop = isLg || isXl;
  
  // Window dimensions state
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  
  // Update dimensions on resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Utility functions
  const up = (bp: Breakpoint) => useMediaQuery(theme.breakpoints.up(bp));
  const down = (bp: Breakpoint) => useMediaQuery(theme.breakpoints.down(bp));
  const between = (start: Breakpoint, end: Breakpoint) => 
    useMediaQuery(theme.breakpoints.between(start, end));
  const only = (bp: Breakpoint) => useMediaQuery(theme.breakpoints.only(bp));
  
  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    up,
    down,
    between,
    only,
    width: dimensions.width,
    height: dimensions.height
  };
} 