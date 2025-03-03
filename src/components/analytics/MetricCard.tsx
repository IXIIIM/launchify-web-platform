import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
  icon: React.ReactNode;
  
  /**
   * Optional trend information
   */
  trend?: {
    value: number;
    label: string;
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
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h4 className="text-2xl font-bold mt-1">{value}</h4>
            {trend && (
              <p className={`text-xs mt-1 ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 