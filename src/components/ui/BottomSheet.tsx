<<<<<<< HEAD
// src/components/ui/BottomSheet.tsx

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  defaultSnap?: number;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.9, 0.5, 0.1],
  defaultSnap = 1
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Handle clicks outside the bottom sheet
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current === event.target) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isMobile]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!sheetRef.current) return;

    const sheetHeight = sheetRef.current.getBoundingClientRect().height;
    const draggedDistance = info.offset.y;
    const draggedPercentage = draggedDistance / sheetHeight;

    if (draggedPercentage > 0.5) {
      onClose();
    }
  };

  if (!isMobile) {
    return (
      <div className="hidden md:block">
        {children}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 touch-none"
          />

          {/* Bottom Sheet */}
          <motion.div 
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-xl shadow-xl touch-pan-y"
          >
            {/* Handle */}
            <div className="w-full h-1.5 flex items-center justify-center py-4">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="max-h-[80vh] overflow-y-auto overscroll-contain pb-safe">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Hook for media queries
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = React.useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

export default BottomSheet;
=======
// Content of BottomSheet.tsx as shown above
>>>>>>> feature/security-implementation
