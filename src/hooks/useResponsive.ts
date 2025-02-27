// src/hooks/useResponsive.ts
import { useState, useEffect } from 'react';

export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

type Breakpoint = keyof typeof breakpoints;

export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${breakpoints[breakpoint]}px)`);
    setMatches(query.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, [breakpoint]);

  return matches;
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