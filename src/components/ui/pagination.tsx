import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

/**
 * A reusable pagination component with customizable appearance and behavior
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  size = 'default',
  variant = 'outline',
  className,
  ...props
}: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers: (number | 'ellipsis')[] = [];
    
    // Always show first page
    pageNumbers.push(1);
    
    // Calculate range of pages to show around current page
    const leftSiblingIndex = Math.max(2, currentPage - siblingCount);
    const rightSiblingIndex = Math.min(totalPages - 1, currentPage + siblingCount);
    
    // Add ellipsis if there's a gap between first page and left sibling
    if (leftSiblingIndex > 2) {
      pageNumbers.push('ellipsis');
    }
    
    // Add pages around current page
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) {
        pageNumbers.push(i);
      }
    }
    
    // Add ellipsis if there's a gap between right sibling and last page
    if (rightSiblingIndex < totalPages - 1) {
      pageNumbers.push('ellipsis');
    }
    
    // Always show last page if there are multiple pages
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  // Get button size based on the size prop
  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8 text-xs';
      case 'lg':
        return 'h-12 w-12 text-lg';
      default:
        return 'h-10 w-10';
    }
  };
  
  const buttonSize = getButtonSize();
  const pageNumbers = getPageNumbers();
  
  return (
    <div
      className={cn('flex items-center justify-center gap-1', className)}
      {...props}
    >
      {/* Previous page button */}
      <Button
        variant={variant}
        size="icon"
        className={buttonSize}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* First page button (optional) */}
      {showFirstLast && currentPage > 3 + siblingCount && (
        <>
          <Button
            variant={variant}
            size="icon"
            className={buttonSize}
            onClick={() => onPageChange(1)}
            aria-label="Go to first page"
          >
            1
          </Button>
          {currentPage > 4 + siblingCount && (
            <div className="flex items-center justify-center">
              <MoreHorizontal className="h-4 w-4" />
            </div>
          )}
        </>
      )}
      
      {/* Page number buttons */}
      {pageNumbers.map((pageNumber, index) => {
        if (pageNumber === 'ellipsis') {
          return (
            <div key={`ellipsis-${index}`} className="flex items-center justify-center">
              <MoreHorizontal className="h-4 w-4" />
            </div>
          );
        }
        
        return (
          <Button
            key={pageNumber}
            variant={currentPage === pageNumber ? 'default' : variant}
            size="icon"
            className={buttonSize}
            onClick={() => onPageChange(pageNumber)}
            aria-label={`Go to page ${pageNumber}`}
            aria-current={currentPage === pageNumber ? 'page' : undefined}
          >
            {pageNumber}
          </Button>
        );
      })}
      
      {/* Last page button (optional) */}
      {showFirstLast && currentPage < totalPages - 2 - siblingCount && (
        <>
          {currentPage < totalPages - 3 - siblingCount && (
            <div className="flex items-center justify-center">
              <MoreHorizontal className="h-4 w-4" />
            </div>
          )}
          <Button
            variant={variant}
            size="icon"
            className={buttonSize}
            onClick={() => onPageChange(totalPages)}
            aria-label="Go to last page"
          >
            {totalPages}
          </Button>
        </>
      )}
      
      {/* Next page button */}
      <Button
        variant={variant}
        size="icon"
        className={buttonSize}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  className?: string;
}

/**
 * A component that combines pagination with page size controls
 */
export function PaginationControls({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  className,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 py-2', className)}>
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> items
      </div>
      
      <div className="flex items-center gap-4">
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Items per page</span>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Select number of items per page"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          size="sm"
        />
      </div>
    </div>
  );
} 