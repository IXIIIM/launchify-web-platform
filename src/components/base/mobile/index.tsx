// src/components/base/mobile/index.tsx

import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTouchFeedback, useSwipe, touchTargetSize, spacing } from '@/utils/responsive';

// TouchButton Component
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}, ref) => {
  const { isPressed, handlers } = useTouchFeedback();

  const getSize = () => {
    switch (size) {
      case 'small':
        return touchTargetSize.min;
      case 'large':
        return touchTargetSize.large;
      default:
        return touchTargetSize.comfortable;
    }
  };

  const getVariantClasses = () => {
    const baseClasses = 'rounded-lg font-medium transition-all active:scale-95';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800`;
      case 'secondary':
        return `${baseClasses} bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300`;
      case 'ghost':
        return `${baseClasses} text-gray-600 hover:bg-gray-100 active:bg-gray-200`;
      default:
        return baseClasses;
    }
  };

  return (
    <button
      ref={ref}
      className={`
        flex items-center justify-center
        px-4
        ${fullWidth ? 'w-full' : ''}
        ${getVariantClasses()}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      style={{ minHeight: getSize() }}
      disabled={disabled || loading}
      {...handlers}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
});

// SwipeableCard Component
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  threshold?: number;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 50
}) => {
  const { isSwiping, handlers } = useSwipe({
    threshold,
    onSwipeLeft,
    onSwipeRight
  });

  return (
    <motion.div
      className={`relative bg-white rounded-lg shadow-sm overflow-hidden
        ${isSwiping ? 'cursor-grabbing' : 'cursor-grab'}`}
      whileTap={{ scale: 0.98 }}
      {...handlers}
    >
      {/* Action Indicators */}
      <div className="absolute inset-y-0 left-0 right-0 flex justify-between items-center px-4 pointer-events-none">
        {leftAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isSwiping ? 1 : 0 }}
          >
            {leftAction}
          </motion.div>
        )}
        {rightAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isSwiping ? 1 : 0 }}
          >
            {rightAction}
          </motion.div>
        )}
      </div>

      {children}
    </motion.div>
  );
};

// TouchList Component
interface TouchListProps {
  children: React.ReactNode;
  spacing?: 'none' | 'small' | 'medium' | 'large';
  divider?: boolean;
}

export const TouchList: React.FC<TouchListProps> = ({
  children,
  spacing = 'medium',
  divider = false
}) => {
  const getSpacing = () => {
    switch (spacing) {
      case 'none':
        return '0';
      case 'small':
        return spacing.touch.stack;
      case 'large':
        return '16px';
      default:
        return '12px';
    }
  };

  return (
    <div
      className={`space-y-${getSpacing()} ${
        divider ? 'divide-y divide-gray-200' : ''
      }`}
    >
      {React.Children.map(children, (child) => (
        <div className="min-h-[44px]">{child}</div>
      ))}
    </div>
  );
};

// TouchableOverlay Component
interface TouchableOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'center' | 'bottom';
}

export const TouchableOverlay: React.FC<TouchableOverlayProps> = ({
  isOpen,
  onClose,
  children,
  position = 'center'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 touch-none"
          />
          
          <motion.div
            initial={position === 'bottom' 
              ? { opacity: 0, y: '100%' }
              : { opacity: 0, scale: 0.9 }
            }
            animate={position === 'bottom'
              ? { opacity: 1, y: 0 }
              : { opacity: 1, scale: 1 }
            }
            exit={position === 'bottom'
              ? { opacity: 0, y: '100%' }
              : { opacity: 0, scale: 0.9 }
            }
            className={`fixed z-50 bg-white rounded-t-xl shadow-xl
              ${position === 'bottom'
                ? 'bottom-0 left-0 right-0'
                : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
              }`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// PullToRefresh Component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const pullStartY = React.useRef(0);
  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current === 0) return;

    const pullDistance = e.touches[0].clientY - pullStartY.current;
    if (pullDistance > 0 && e.currentTarget.scrollTop === 0) {
      e.preventDefault();
      const progress = Math.min((pullDistance / PULL_THRESHOLD) * 100, 100);
      setPullProgress(progress);
    }
  };

  const handleTouchEnd = async () => {
    if (pullProgress >= 100 && !refreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    pullStartY.current = 0;
    setPullProgress(0);
  };

  return (
    <div
      className="overflow-auto overscroll-y-contain"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: Math.min(pullProgress * 0.8, PULL_THRESHOLD) }}
        className="flex items-center justify-center overflow-hidden"
      >
        <motion.div
          animate={{
            rotate: refreshing ? 360 : pullProgress * 2.7
          }}
          transition={refreshing ? { 
            repeat: Infinity,
            duration: 1
          } : undefined}
          className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"
        />
      </motion.div>

      {children}
    </div>
  );
};

// Export all components
export { TouchButton, SwipeableCard, TouchList, TouchableOverlay, PullToRefresh };