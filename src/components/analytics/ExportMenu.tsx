import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportMenuProps {
  data: any;
  filename: string;
  buttonProps?: ButtonProps;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ 
  data, 
  filename, 
  buttonProps 
}) => {
  const exportAsJSON = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadBlob(blob, `${filename}.json`);
  };

  const exportAsCSV = () => {
    // Convert data to CSV format
    const csvData = convertToCSV(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);
  };

  const exportAsPDF = () => {
    // In a real implementation, you would use a library like jsPDF
    // This is a placeholder for demonstration
    alert('PDF export would be implemented with a library like jsPDF');
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any): string => {
    // This is a simplified implementation
    // In a real app, you would need more robust CSV conversion
    if (!data) return '';
    
    // For subscription metrics, we'll create a flattened structure
    let csvContent = '';
    
    // Handle different data structures
    if (data.subscriptionGrowth) {
      // Subscription metrics
      csvContent += 'Metric,Value\n';
      csvContent += `New Subscriptions,${data.subscriptionGrowth.newSubscriptions}\n`;
      csvContent += `Canceled Subscriptions,${data.subscriptionGrowth.canceledSubscriptions}\n`;
      csvContent += `Net Growth,${data.subscriptionGrowth.netGrowth}\n`;
      csvContent += `Growth Rate,${data.subscriptionGrowth.growthRate}%\n`;
      csvContent += `MRR,${data.revenueMetrics.mrr}\n`;
      csvContent += `ARR,${data.revenueMetrics.arr}\n`;
      csvContent += `Churn Rate,${data.retentionMetrics.churnRate}%\n`;
      csvContent += `Average Lifetime,${data.retentionMetrics.averageLifetime} months\n\n`;
      
      // Add tier distribution
      csvContent += 'Tier,Subscribers,Percentage\n';
      data.tierDistribution.distribution.forEach((tier: any) => {
        csvContent += `${tier.tier},${tier.count},${tier.percentage}%\n`;
      });
      
      // Add daily trends
      csvContent += '\nDaily Trends\n';
      csvContent += 'Date,New Subscriptions,Cancellations,Net Growth\n';
      data.subscriptionGrowth.dailyTrends.forEach((day: any) => {
        csvContent += `${day.date},${day.new},${day.canceled},${day.net}\n`;
      });
    } else {
      // Generic object to CSV conversion
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map((row: any) => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        ).join(',')
      ).join('\n');
      
      csvContent = headers + '\n' + rows;
    }
    
    return csvContent;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" {...buttonProps}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportAsJSON}>
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsCSV}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsPDF}>
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 