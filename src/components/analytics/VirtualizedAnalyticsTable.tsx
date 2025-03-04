import React, { useState, useEffect } from 'react';
import VirtualizedList from '../ui/VirtualizedList';
import { Spinner } from '../ui/Spinner';

interface AnalyticsItem {
  id: string;
  userId: string;
  userName: string;
  userType: string;
  subscriptionPlan: string;
  lastActive: string;
  metrics: {
    logins: number;
    sessionDuration: number;
    featuresUsed: number;
  };
}

interface VirtualizedAnalyticsTableProps {
  fetchData: (page: number, limit: number) => Promise<{
    items: AnalyticsItem[];
    hasMore: boolean;
  }>;
  initialPageSize?: number;
  className?: string;
}

/**
 * VirtualizedAnalyticsTable - A performance-optimized table for displaying large analytics datasets
 * 
 * This component uses virtualization to efficiently render only the visible rows,
 * significantly improving performance for large datasets.
 */
const VirtualizedAnalyticsTable: React.FC<VirtualizedAnalyticsTableProps> = ({
  fetchData,
  initialPageSize = 50,
  className = '',
}) => {
  const [items, setItems] = useState<AnalyticsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const result = await fetchData(1, initialPageSize);
        setItems(result.items);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [fetchData, initialPageSize]);
  
  // Handle loading more data when scrolling to the end
  const handleLoadMore = async () => {
    if (!hasMore || isLoading) return;
    
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const result = await fetchData(nextPage, initialPageSize);
      
      setItems(prevItems => [...prevItems, ...result.items]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading more analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render a table row for each item
  const renderItem = (item: AnalyticsItem, index: number) => (
    <div className="analytics-row flex border-b border-gray-200 hover:bg-gray-50">
      <div className="w-1/6 p-4">{item.userName}</div>
      <div className="w-1/6 p-4">{item.userType}</div>
      <div className="w-1/6 p-4">{item.subscriptionPlan}</div>
      <div className="w-1/6 p-4">{new Date(item.lastActive).toLocaleDateString()}</div>
      <div className="w-1/6 p-4">{item.metrics.logins}</div>
      <div className="w-1/6 p-4">{Math.round(item.metrics.sessionDuration / 60)} min</div>
    </div>
  );
  
  // Empty state component
  const EmptyState = (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <p className="text-gray-500 text-lg">No analytics data available</p>
      <p className="text-gray-400 mt-2">Try adjusting your filters or time range</p>
    </div>
  );
  
  // Loading component
  const LoadingComponent = (
    <div className="flex justify-center items-center p-4">
      <Spinner size="md" />
      <span className="ml-2">Loading more data...</span>
    </div>
  );
  
  return (
    <div className={`analytics-table-container ${className}`}>
      {/* Table header */}
      <div className="analytics-header flex font-semibold bg-gray-100 border-b border-gray-300">
        <div className="w-1/6 p-4">User Name</div>
        <div className="w-1/6 p-4">User Type</div>
        <div className="w-1/6 p-4">Subscription</div>
        <div className="w-1/6 p-4">Last Active</div>
        <div className="w-1/6 p-4">Logins</div>
        <div className="w-1/6 p-4">Avg. Session</div>
      </div>
      
      {/* Virtualized table body */}
      <VirtualizedList
        items={items}
        height={600} // Adjust based on your UI requirements
        itemHeight={56} // Height of each row
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        endReachedThreshold={0.8}
        keyExtractor={(item) => item.id}
        emptyComponent={EmptyState}
        loadingComponent={LoadingComponent}
        isLoading={isLoading}
        className="analytics-table-body"
      />
    </div>
  );
};

export default VirtualizedAnalyticsTable; 