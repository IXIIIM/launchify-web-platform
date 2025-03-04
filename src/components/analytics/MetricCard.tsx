import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for the MetricCard component
 */
export interface MetricCardProps {
  /**
   * Title of the metric
   */
  title: string;
  
  /**
   * Value to display
   */
  value: string;
  
  /**
   * Icon to display
   */
  icon?: ReactNode;
  
  /**
   * Optional trend information
   */
  trend?: {
    value: number;
    label?: string;
  };
  
  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * A card component for displaying a metric with an icon and optional trend
 */
export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend,
  className 
}) => {
  const renderTrend = () => {
    if (!trend) return null;
    
    const isPositive = trend.value > 0;
    const isNeutral = trend.value === 0;
    
    return (
      <div className="flex items-center mt-1">
        {!isNeutral && (
          <>
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span 
              className={cn(
                "text-xs font-medium",
                isPositive ? "text-green-500" : "text-red-500"
              )}
            >
              {Math.abs(trend.value).toFixed(1)}%
            </span>
          </>
        )}
        {trend.label && (
          <span className="text-xs text-gray-500 ml-1">
            {trend.label}
          </span>
        )}
      </div>
    );
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {renderTrend()}
          </div>
          {icon && (
            <div className="p-2 bg-gray-100 rounded-full">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 