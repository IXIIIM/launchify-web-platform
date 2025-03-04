// src/hooks/useResponsive.ts
import { useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ResponsiveReturn {
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
export function useResponsive(): ResponsiveReturn {
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

// src/hooks/useSwipe.ts
import { useRef, useState } from 'react';

interface SwipeConfig {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
}

export function useSwipe(config: SwipeConfig = {}) {
  const {
    threshold = 50,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = config;

  const swipeState = useRef<SwipeState | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeState.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.current.startX;
    const deltaY = touch.clientY - swipeState.current.startY;

    // Prevent vertical scrolling if horizontal swipe is detected
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!swipeState.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeState.current.startX;
    const deltaY = touch.clientY - swipeState.current.startY;
    const deltaTime = Date.now() - swipeState.current.startTime;

    // Only trigger if swipe was fast enough
    if (deltaTime < 250) {
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }

      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    swipeState.current = null;
    setIsSwiping(false);
  };

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isSwiping,
  };
}

// src/hooks/useTouchFeedback.ts
export function useTouchFeedback() {
  const [isPressed, setIsPressed] = useState(false);

  const handlers = {
    onTouchStart: () => setIsPressed(true),
    onTouchEnd: () => setIsPressed(false),
    onTouchCancel: () => setIsPressed(false),
  };

  return { isPressed, handlers };
}

// src/styles/responsive.ts
export const touchTargetSize = {
  min: '44px', // Minimum size for touch targets
  comfortable: '48px', // Comfortable size for primary actions
  large: '56px', // Large size for important actions
};

export const spacing = {
  touch: {
    inline: '16px', // Minimum spacing between touch targets
    stack: '12px', // Vertical spacing between elements
  },
  safeArea: {
    top: 'env(safe-area-inset-top)',
    right: 'env(safe-area-inset-right)',
    bottom: 'env(safe-area-inset-bottom)',
    left: 'env(safe-area-inset-left)',
  },
};

// Usage example for a touch-friendly button component
export const touchStyles = {
  button: `
    min-height: ${touchTargetSize.comfortable};
    min-width: ${touchTargetSize.comfortable};
    padding: 12px 16px;
    margin: ${spacing.touch.stack} ${spacing.touch.inline};
    touch-action: manipulation;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  `,
};

// src/hooks/useScrollLock.ts
export function useScrollLock() {
  const lockScroll = () => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${window.scrollY}px`;
  };

  const unlockScroll = () => {
    const scrollY = document.body.style.top;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
  };

  return { lockScroll, unlockScroll };
}

// src/hooks/useViewportHeight.ts
export function useViewportHeight() {
  const [vh, setVh] = useState(window.innerHeight * 0.01);

  useEffect(() => {
    const updateVh = () => {
      setVh(window.innerHeight * 0.01);
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateVh();
    window.addEventListener('resize', updateVh);
    return () => window.removeEventListener('resize', updateVh);
  }, [vh]);

  return vh;
}

// src/hooks/useKeyboard.ts
interface KeyboardState {
  isVisible: boolean;
  height: number;
}

export function useKeyboard(): KeyboardState {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const isKeyboardVisible = window.visualViewport!.height < window.innerHeight;
      if (isKeyboardVisible) {
        const keyboardHeight = window.innerHeight - window.visualViewport!.height;
        setKeyboardState({ isVisible: true, height: keyboardHeight });
      } else {
        setKeyboardState({ isVisible: false, height: 0 });
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  return keyboardState;
}