import React, { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  scrollToIndex?: number;
  keyExtractor?: (item: T, index: number) => string;
  emptyComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  isLoading?: boolean;
}

/**
 * VirtualizedList component for efficiently rendering large lists
 * 
 * Features:
 * - Only renders items that are visible in the viewport
 * - Supports dynamic scrolling with overscan
 * - Provides infinite scrolling capabilities
 * - Optimized for performance with large datasets
 */
function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className = '',
  onEndReached,
  endReachedThreshold = 0.8,
  scrollToIndex,
  keyExtractor,
  emptyComponent,
  loadingComponent,
  isLoading = false,
}: VirtualizedListProps<T>): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [hasCalledEndReached, setHasCalledEndReached] = useState(false);
  
  // Calculate the range of visible items
  const visibleItemCount = Math.ceil(height / itemHeight);
  const totalHeight = items.length * itemHeight;
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + height) / itemHeight) + overscan
  );
  
  // Handle scroll event
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setScrollTop(scrollTop);
    
    // Check if we've reached the end for infinite scrolling
    if (
      onEndReached &&
      !hasCalledEndReached &&
      !isLoading &&
      scrollTop + clientHeight >= scrollHeight * endReachedThreshold
    ) {
      setHasCalledEndReached(true);
      onEndReached();
    }
  }, [onEndReached, hasCalledEndReached, isLoading, endReachedThreshold]);
  
  // Reset the end reached flag when items change
  useEffect(() => {
    setHasCalledEndReached(false);
  }, [items.length]);
  
  // Scroll to a specific index if requested
  useEffect(() => {
    if (scrollToIndex !== undefined && containerRef.current) {
      containerRef.current.scrollTop = scrollToIndex * itemHeight;
    }
  }, [scrollToIndex, itemHeight]);
  
  // Render only the visible items
  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => {
    const actualIndex = startIndex + index;
    const key = keyExtractor ? keyExtractor(item, actualIndex) : actualIndex;
    
    return (
      <div
        key={key}
        style={{
          position: 'absolute',
          top: actualIndex * itemHeight,
          height: itemHeight,
          left: 0,
          right: 0,
        }}
        data-index={actualIndex}
      >
        {renderItem(item, actualIndex)}
      </div>
    );
  });
  
  // Render empty state if no items
  if (items.length === 0 && !isLoading && emptyComponent) {
    return (
      <div className={className} style={{ height }}>
        {emptyComponent}
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className={`virtualized-list-container ${className}`}
      style={{
        height,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div
        className="virtualized-list-content"
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
      
      {isLoading && loadingComponent && (
        <div className="virtualized-list-loading">
          {loadingComponent}
        </div>
      )}
    </div>
  );
}

export default VirtualizedList; 